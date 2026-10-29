import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

// Load env from root .env and backend/.env
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '10mb' }));

  // API endpoint for claim extraction using Python FastAPI backend with Node proxy fallback
  app.post('/api/gemini/extract-claims', async (req, res) => {
    const fastApiUrl = process.env.FASTAPI_BACKEND_URL || 'http://127.0.0.1:8000';

    // 1. Try forwarding request to Python FastAPI backend with 1000ms connection timeout
    try {
      const fastApiResponse = await fetch(`${fastApiUrl}/api/gemini/extract-claims`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
        signal: AbortSignal.timeout(1000),
      });

      if (fastApiResponse.ok) {
        const fastApiData = await fastApiResponse.json();
        return res.json(fastApiData);
      } else if (fastApiResponse.status === 400 || fastApiResponse.status === 422) {
        const errorData = await fastApiResponse.json();
        return res.status(fastApiResponse.status).json(errorData);
      }
    } catch (fastApiErr) {
      // FastAPI backend is not running or unreachable; seamlessly fall back to Express Node handler
    }

    // 2. Node server fallback using @google/genai SDK with model fallback
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || !apiKey.trim()) {
      return res.status(400).json({
        error: 'GEMINI_API_KEY is missing or unconfigured. Please enter your new key in backend/.env.'
      });
    }

    const { documentId, investigationId, documentTitle, content, pages } = req.body;

    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ error: 'Document text content is empty or unreadable.' });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const prompt = `You are a forensic document analyzer extracting factual assertions from evidence documents.
Extract distinct, verifiable factual claims about events, dates, times, people, locations, quantities, causes, or key actions.

For each claim:
- "claimText": Original or concise summary of the claim.
- "subject": Normalized subject noun/phrase (e.g. "Primary Generator Status", "Incident Date", "Incident Time", "Incident Location").
- "predicate": Normalized verb or relationship (e.g. "failed_with_code", "occurred_on", "occurred_at", "located_at").
- "value": Exact asserted value or statement (e.g. "ERR-504", "2024-03-15", "14:15 UTC", "Building A").
- "sourceExcerpt": Direct exact verbatim text excerpt from the document supporting this claim.
- "pageNumber": Integer page number where this quote appears (default to 1 if unknown).
- "category": Must be one of: "Timestamp", "Identity", "Causality", "Location", "Quantity", "Action", "Other".

PREDICATE NORMALIZATION RULES:
- For claims regarding incident/event dates: use subject "Incident Date" and predicate "occurred_on".
- For claims regarding incident/event times: use subject "Incident Time" and predicate "occurred_at".
- For claims regarding incident/event locations: use subject "Incident Location" and predicate "located_at".

CRITICAL INSTRUCTIONS:
1. Do NOT invent claims or source excerpts not supported by the document.
2. Only output claims directly grounded in the text.
3. Keep sourceExcerpt verbatim from the provided document content.

Document Title: ${documentTitle || 'Evidence Document'}
Document Content:
${content.slice(0, 12000)}
`;

      const candidateModels = [
        'gemini-3.1-flash-lite',
        'gemini-3.5-flash-lite',
        'gemini-3.8-flash',
        'gemini-flash-latest'
      ];
      let response = null;
      let lastError: any = null;

      for (const modelName of candidateModels) {
        try {
          response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  claims: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        claimText: { type: Type.STRING },
                        subject: { type: Type.STRING },
                        predicate: { type: Type.STRING },
                        value: { type: Type.STRING },
                        sourceExcerpt: { type: Type.STRING },
                        pageNumber: { type: Type.NUMBER },
                        category: { type: Type.STRING }
                      },
                      required: ['claimText', 'subject', 'predicate', 'value', 'sourceExcerpt', 'category']
                    }
                  }
                },
                required: ['claims']
              }
            }
          });

          if (response && response.text) {
            break;
          }
        } catch (mErr) {
          lastError = mErr;
          continue;
        }
      }

      if (!response || !response.text) {
        return res.status(503).json({
          error: `Gemini API is temporarily experiencing high demand. Please try again in a few moments. (${lastError?.message || '503 Unavailable'})`
        });
      }

      const parsed = JSON.parse(response.text);
      const rawClaims = parsed.claims || [];

      // Normalize predicates in server response
      const claims = rawClaims.map((c: any) => {
        let sub = String(c.subject || 'Factual Assertion').trim();
        let pred = String(c.predicate || 'asserts').trim().toLowerCase().replace(/\s+/g, '_');
        const normSub = sub.toLowerCase();

        if (normSub === 'incident date' || normSub === 'date of incident' || normSub === 'date' || normSub.includes('incident date')) {
          sub = 'Incident Date';
          pred = 'occurred_on';
        } else if (normSub === 'incident time' || normSub === 'time of incident' || normSub === 'time' || normSub.includes('incident time')) {
          sub = 'Incident Time';
          pred = 'occurred_at';
        } else if (normSub === 'incident location' || normSub === 'location of incident' || normSub === 'location' || normSub.includes('incident location')) {
          sub = 'Incident Location';
          pred = 'located_at';
        }

        return {
          ...c,
          subject: sub,
          predicate: pred
        };
      });

      return res.json({ documentId, claims });
    } catch (err: any) {
      console.error('Gemini Claim Extraction Error:', err);
      return res.status(500).json({
        error: err.message || 'Failed to extract claims using Gemini API.'
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`TruthTrace server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
