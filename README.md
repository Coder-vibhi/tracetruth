# TruthTrace — Forensic Evidence & Contradiction Detection Platform

TruthTrace is a professional forensic document analysis application that analyzes complex, multi-source evidence documents (incident reports, shift logs, audit records, maintenance logs), extracts verifiable factual assertions using the Google Gemini API, normalizes claims across sources, automatically detects cross-document contradictions, and provides interactive visual graphs and chronological timelines for investigative teams.

---

## 📌 Problem Statement

During complex incident investigations (e.g., power grid shutdowns, industrial accidents, security breaches), investigators receive multiple reports from different departments, contractors, and safety boards. Identifying conflicting claims—such as mismatched event timestamps, conflicting reported root causes, or differing staffing numbers—is traditionally a manual, time-consuming, and error-prone process.

---

## 💡 Solution

TruthTrace automates evidence claim extraction and cross-document discrepancy analysis:

1. **Text Extraction**: Extracts selectable text and page numbers from PDF and TXT evidence files.
2. **AI Claim Extraction**: Uses Google Gemini AI (`gemini-3.8-flash` / `gemini-3.1-flash-lite`) to extract structured factual assertions (`subject`, `predicate`, `value`) with verbatim source excerpts, page numbers, and categories.
3. **Predicate Normalization**: Normalizes assertion forms (e.g. `Incident Date` → `occurred_on`, `Incident Location` → `located_at`, `Reported Cause` → `caused_by`) to ensure accurate cross-document comparison.
4. **Indexed Contradiction Detection**: Uses indexed Map grouping by `(subject, predicate)` and Sets to identify conflicting values across different documents while ignoring missing/uncertain values (`Unknown`, `TBD`).
5. **Interactive Analysis & Timeline**: Renders an evidence connection graph map, chronological event timeline with disputed timestamp indicators, and clickable source evidence links.
6. **Discrepancy Resolution**: Allows investigators to set resolution status (`Unresolved`, `Resolved`, `Needs Review`) and record resolution notes.

---

## ✨ Key Features

- **Document Evidence Ingestion**: Supports PDF and TXT files up to 20MB with client-side text parsing (`pdfjs-dist`).
- **Grounded AI Claim Extraction**: Extract factual claims directly grounded in document text with exact verbatim quotes and page numbers.
- **Cross-Document Contradiction Engine**: Automatically flags conflicting dates, times, locations, quantities, and causes across different evidence files.
- **Evidence Validation Checks**: Validates canonical date formats, location strings, cause descriptions, and verifies source quotes against original document text.
- **Contradiction Explorer Graph**: Canvas-based node-link graph connecting documents, extracted claims, events, and contradictions.
- **Investigation Timeline**: Chronological event sequence flagging disputed timestamps and displaying competing assertions side-by-side.
- **Source Evidence Preview**: Clickable evidence links that open the original document text modal and highlight the relevant quote.
- **Zero-Data Startup & Local Persistence**: Starts in a clean zero-data state without fake auto-seeded records. Manually created investigations and uploaded evidence are persisted in `localStorage`.

---

## 🛠 Tech Stack

### Frontend
- **Framework**: React 19 (TypeScript)
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Document Parsing**: PDF.js (`pdfjs-dist`)

### Backend / Server Gateway
- **Express Proxy**: Node.js Express server (`server.ts`) for development & static hosting.
- **Serverless API**: Vercel Serverless Functions (`api/gemini/extract-claims.ts`) using `@google/genai` SDK.
- **Python Service**: Python 3.11+, FastAPI, Uvicorn, Pydantic v2, `google-genai` SDK.

### AI Engine
- **Provider**: Google Gemini API (`@google/genai` Node SDK / `google-genai` Python SDK)
- **Models**: `gemini-3.8-flash`, `gemini-3.1-flash-lite`

---

## 📐 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React 19 / Vite SPA                      │
│      (Dashboard, Workspace, Graph Canvas, Timeline)         │
└──────────────────────────────┬──────────────────────────────┘
                               │ POST /api/gemini/extract-claims
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             Server-Side API Gateway / Proxy                 │
│      (Express server.ts OR Vercel Serverless Function)      │
└──────────────┬──────────────────────────────┬───────────────┘
               │ (Optional Forward)           │ Direct SDK
               ▼                              ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│  Python FastAPI Backend      │ │  Google Gemini API         │
│  (backend/main.py)           │ │  (gemini-3.8-flash)        │
└──────────────┬───────────────┘ └────────────────────────────┘
               │ Direct SDK
               ▼
┌──────────────────────────────┐
│  Google Gemini API           │
└──────────────────────────────┘
```

---

## 🚀 Local Setup Instructions

### Prerequisites
- **Node.js**: v18 or higher
- **npm**: v9 or higher
- **Python** *(Optional, if running Python FastAPI)*: Python 3.10+

### 1. Clone & Install Frontend Dependencies

```bash
git clone https://github.com/your-username/truthtrace.git
cd truthtrace
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and set your Gemini API key from [Google AI Studio](https://aistudio.google.com/):

```env
GEMINI_API_KEY="your_actual_gemini_api_key_here"
PORT=3000
```

### 3. (Optional) Python FastAPI Setup

If you wish to run the Python FastAPI backend locally:

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env     # Set GEMINI_API_KEY inside backend/.env
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Environment Variables Reference

| Variable | Required | Description |
| :--- | :---: | :--- |
| `GEMINI_API_KEY` | **Yes** | Server-side API key for Google Gemini API. |
| `VITE_API_BASE_URL` | No | Base URL if hosting backend on an external server (e.g. Render). |
| `FASTAPI_BACKEND_URL` | No | Internal proxy URL for Python FastAPI (`http://127.0.0.1:8000`). |
| `PORT` | No | Server port (defaults to `3000`). |

---

## ☁️ Vercel Deployment Instructions

TruthTrace includes a `vercel.json` configuration and Vercel serverless function (`api/gemini/extract-claims.ts`) for single-click Vercel deployment.

1. **Import Repository**: Connect your Git repository to Vercel.
2. **Framework Preset**: Select `Vite`.
3. **Build & Output Settings**:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. **Environment Variables**:
   - Add `GEMINI_API_KEY` with your key from Google AI Studio.
5. Click **Deploy**.

---

## ⚠️ Responsible-Use & Limitations

- **Forensic Decision Support**: TruthTrace is designed to assist human investigators by surfacing factual assertions and highlighting cross-document discrepancies. It does **not** make legal determinations or decide factual truth by majority vote.
- **Selectable Text Requirement**: Text extraction requires PDF files with selectable text or TXT files. Scanned PDF images require OCR processing.
- **Grounding & Verification**: Claims and quotes are extracted verbatim from provided documents. Investigators should always inspect original source documents using the integrated evidence preview.
- **Privacy & Secrets**: `GEMINI_API_KEY` is maintained strictly on the server or serverless gateway and is never exposed to client-side code.

---

## 📜 License

Apache-2.0
