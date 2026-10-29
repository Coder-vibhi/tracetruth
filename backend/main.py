import os
import json
from typing import List, Optional, Literal
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ConfigDict
from dotenv import load_dotenv

# Explicitly load .env file from current backend directory
backend_dir = os.path.dirname(os.path.abspath(__file__))
dotenv_path = os.path.join(backend_dir, ".env")
load_dotenv(dotenv_path=dotenv_path)

app = FastAPI(
    title="TruthTrace FastAPI Backend",
    description="Python FastAPI backend service for TruthTrace evidence claim extraction powered by Gemini API.",
    version="1.0.0",
)

# Configure CORS middleware to support frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ClaimCategory = Literal[
    "Timestamp", "Identity", "Causality", "Location", "Quantity", "Action", "Other"
]


# --- Pydantic Data Models ---

class PageInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    page_number: int = Field(alias="pageNumber", default=1, description="1-indexed page number")
    text: str = Field(..., description="Extracted page text")


class ClaimExtractionRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    document_id: str = Field(alias="documentId", description="Unique evidence document ID")
    investigation_id: str = Field(
        alias="investigationId", default="", description="Associated investigation ID"
    )
    document_title: str = Field(
        alias="documentTitle", default="Evidence Document", description="File name of the document"
    )
    content: str = Field(..., description="Full extracted text content of the document")
    pages: Optional[List[PageInput]] = Field(
        default=[], description="Structured array of page texts"
    )


class ExtractedClaimItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    claim_text: str = Field(alias="claimText", description="Concise statement of the factual claim")
    subject: str = Field(..., description="Normalized subject noun or concept")
    predicate: str = Field(..., description="Normalized verb or relationship")
    value: str = Field(..., description="Asserted value or factual details")
    source_excerpt: str = Field(
        alias="sourceExcerpt", description="Direct verbatim text quote from the document"
    )
    page_number: int = Field(
        alias="pageNumber", default=1, description="Page number of the source quote"
    )
    category: ClaimCategory = Field(
        default="Other", description="Claim category classification"
    )


class ClaimExtractionResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    document_id: str = Field(alias="documentId")
    claims: List[ExtractedClaimItem]


# --- Health Check Endpoints ---

@app.get("/health", summary="Backend Health Check")
@app.get("/api/health", summary="API Health Check")
def health_check():
    api_key = os.getenv("GEMINI_API_KEY")
    key_configured = bool(api_key and api_key.strip() and api_key != "MY_GEMINI_API_KEY")
    return {
        "status": "healthy",
        "service": "TruthTrace Python FastAPI Backend",
        "version": "1.0.0",
        "geminiKeyConfigured": key_configured,
        "primaryModel": "gemini-3.8-flash",
    }


# --- Claim Extraction Endpoint ---

@app.post(
    "/api/gemini/extract-claims",
    response_model=ClaimExtractionResponse,
    summary="Extract structured factual claims from document text using Gemini API",
)
async def extract_claims(payload: ClaimExtractionRequest):
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key or not api_key.strip() or api_key == "MY_GEMINI_API_KEY":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GEMINI_API_KEY is missing or unconfigured. Please enter your API key in backend/.env.",
        )

    if not payload.content or not payload.content.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Document text content is empty or unreadable.",
        )

    try:
        from google import genai
        from google.genai import types

        # Initialize official google-genai Client with User-Agent header for telemetry
        client = genai.Client(
            api_key=api_key,
            http_options={"headers": {"User-Agent": "aistudio-build"}},
        )

        prompt = f"""You are a forensic document analyzer extracting factual assertions from evidence documents.
Extract distinct, verifiable factual claims about events, dates, times, people, locations, quantities, causes, or key actions.

For each claim:
- "claimText": Concise statement of the factual claim.
- "subject": Normalized subject noun/phrase (e.g. "Primary Generator 2", "Incident Date", "Incident Time", "Incident Location").
- "predicate": Normalized verb or relationship (e.g. "failed_with_code", "occurred_on", "occurred_at", "located_at").
- "value": Exact asserted value or statement (e.g. "ERR-504", "2024-03-15", "14:15 UTC", "Building A").
- "sourceExcerpt": Direct verbatim text quote from the document supporting this claim.
- "pageNumber": Integer page number where this quote appears (default to 1 if unknown).
- "category": Must be one of: "Timestamp", "Identity", "Causality", "Location", "Quantity", "Action", "Other".

PREDICATE NORMALIZATION RULES:
- For claims regarding incident/event dates: use subject "Incident Date" and predicate "occurred_on".
- For claims regarding incident/event times: use subject "Incident Time" and predicate "occurred_at".
- For claims regarding incident/event locations: use subject "Incident Location" and predicate "located_at".

CRITICAL INSTRUCTIONS:
1. ONLY extract claims actually present in the text.
2. Do NOT invent claims, dates, or source excerpts.
3. Keep sourceExcerpt verbatim from the provided document content.

Document Title: {payload.document_title}
Document Content:
{payload.content[:12000]}
"""

        schema_config = types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema={
                "type": "OBJECT",
                "properties": {
                    "claims": {
                        "type": "ARRAY",
                        "items": {
                            "type": "OBJECT",
                            "properties": {
                                "claimText": {"type": "STRING"},
                                "subject": {"type": "STRING"},
                                "predicate": {"type": "STRING"},
                                "value": {"type": "STRING"},
                                "sourceExcerpt": {"type": "STRING"},
                                "pageNumber": {"type": "INTEGER"},
                                "category": {"type": "STRING"},
                            },
                            "required": [
                                "claimText",
                                "subject",
                                "predicate",
                                "value",
                                "sourceExcerpt",
                                "category",
                            ],
                        },
                    }
                },
                "required": ["claims"],
            },
        )

        # Resilient model fallback list for temporary 503 capacity spikes
        candidate_models = [
            "gemini-3.1-flash-lite",
            "gemini-3.5-flash-lite",
            "gemini-3.8-flash",
            "gemini-flash-latest",
        ]
        response = None
        last_exception = None

        for model_name in candidate_models:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=schema_config,
                )
                if response and response.text:
                    break
            except Exception as e:
                last_exception = e
                # Retry next model on transient capacity error (e.g., 503)
                continue

        if not response or not response.text:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Gemini API is temporarily experiencing high demand. Please try again in a few moments. ({str(last_exception)})",
            )

        parsed = json.loads(response.text)
        claims_data = parsed.get("claims", [])

        valid_categories = {
            "Timestamp", "Identity", "Causality", "Location", "Quantity", "Action", "Other"
        }

        # Deduplicate using normalized set
        seen_claims = set()
        validated_claims: List[ExtractedClaimItem] = []

        for raw in claims_data:
            claim_text = str(raw.get("claimText") or raw.get("value") or "").strip()
            subject = str(raw.get("subject") or "Factual Assertion").strip()
            predicate = str(raw.get("predicate") or "asserts").strip()
            value = str(raw.get("value") or claim_text).strip()
            source_excerpt = str(raw.get("sourceExcerpt") or claim_text).strip()

            norm_sub = subject.lower()
            if norm_sub in ["incident date", "date of incident", "date"] or "incident date" in norm_sub:
                subject = "Incident Date"
                predicate = "occurred_on"
            elif norm_sub in ["incident time", "time of incident", "time"] or "incident time" in norm_sub:
                subject = "Incident Time"
                predicate = "occurred_at"
            elif norm_sub in ["incident location", "location of incident", "location"] or "incident location" in norm_sub:
                subject = "Incident Location"
                predicate = "located_at"
            else:
                pred_lower = predicate.lower().replace(" ", "_")
                if pred_lower in ["occurred_date", "happened_on", "occurred_on"]:
                    predicate = "occurred_on"
                elif pred_lower in ["occurred_time", "happened_at", "occurred_at"]:
                    predicate = "occurred_at"
                elif pred_lower in ["located_in", "occurred_in", "located_at"]:
                    predicate = "located_at"

            try:
                page_num = int(raw.get("pageNumber") or 1)
            except (ValueError, TypeError):
                page_num = 1

            cat_str = str(raw.get("category") or "Other").capitalize()
            category: ClaimCategory = cat_str if cat_str in valid_categories else "Other"

            dedup_key = f"{subject.lower()}|{predicate.lower()}|{value.lower()}|{source_excerpt.lower()}"

            if dedup_key not in seen_claims and (claim_text or source_excerpt):
                seen_claims.add(dedup_key)
                validated_claims.append(
                    ExtractedClaimItem(
                        claim_text=claim_text or source_excerpt,
                        subject=subject,
                        predicate=predicate,
                        value=value,
                        source_excerpt=source_excerpt,
                        page_number=page_num,
                        category=category,
                    )
                )

        return ClaimExtractionResponse(
            document_id=payload.document_id,
            claims=validated_claims,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process claim extraction with Gemini API: {str(e)}",
        )


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
