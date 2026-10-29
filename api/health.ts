import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const apiKey = process.env.GEMINI_API_KEY;
  const keyConfigured = Boolean(apiKey && apiKey.trim() && apiKey !== 'MY_GEMINI_API_KEY');

  res.status(200).json({
    status: 'healthy',
    service: 'TruthTrace Vercel Serverless Gateway',
    version: '1.0.0',
    geminiKeyConfigured: keyConfigured,
    primaryModel: 'gemini-3.8-flash'
  });
}
