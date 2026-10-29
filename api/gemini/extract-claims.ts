import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(45) ? res.status(405).json({ error: 'Method not allowed' }) : res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Try forwarding request to Python FastAPI backend if FASTAPI_BACKEND_URL is set
  const fastApiUrl = process.env.FASTAPI_BACKEND_URL;
  if (fastApiUrl && fastApiUrl.trim()) {
    try {
      const fastApiResponse = await fetch(`${fastApiUrl.replace(/\/$/, '')}/api/gemini/extract-claims`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
        signal: AbortSignal.timeout(4000),
      });

      if (fastApiResponse.ok) {
        const fastApiData = await fastApiResponse.json();
        return res.status(200).json(fastApiData);
      } else if (fastApiResponse.status === 400 || fastApiResponse.status === 422) {
        const errorData = await fastApiResponse.json();
        return res.status(fastApiResponse.status).json(errorData);
      }
    } catch (err) {
      // Fall through to Vercel Node handler below
    }
  }

  // 2. Node serverless handler using GEMINI_API_KEY
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || !apiKey.trim()) {
    return res.status(400).json({
      error: 'GEMINI_API_KEY is missing or unconfigured in environment variables. Please add GEMINI_API_KEY in Vercel project settings.'
    });
  }

  const { documentId, investigationId, documentTitle, content, pages } = req.body || {};

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

    return res.status(200).json({ documentId, claims });
  } catch (err: any) {
    console.error('Vercel Gemini Claim Extraction Error:', err);
    return res.status(500).json({
      error: err.message || 'Failed to extract claims using Gemini API on Vercel.'
    });
  }
}
