import asyncio
import json
import os
import re
from typing import Any, Dict, List, Optional, Tuple

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

load_dotenv()

SYSTEM_VERSION = "AlphaDog v0.0.1"
PRIMARY_MODEL_ALIASES = ["gemini-3.1-pro", "gemini-3.1-pro-preview"]
FALLBACK_MODEL_ALIASES = ["gemini-3.1-flash-lite", "gemini-3.1-flash-lite-preview"]
TIMEOUT_SECONDS = 180.0
RETRYABLE_STATUS_CODES = {500, 503, 504}
SYSTEM_BUSY_MARKERS = ["system busy", "resource exhausted", "overloaded", "temporarily unavailable"]
MAX_OUTPUT_TOKENS = 65536
TEMPERATURE = 0.1
SAFETY_SETTINGS = [
    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
]
DEFAULT_SYSTEM_INSTRUCTION = (
    "You are AlphaDog v0.0.1, a Hostile Auditor. Use 2026 data. Normalize name fragments. "
    "Process 24 legs across 3 XML batches.\n"
    "RETURN FORMAT FOR EACH LEG:\n"
    "MLB - [Full Player Name] ([Full Team Name])\n"
    "@ [Opponent Full Name] - [Date/Time]\n"
    "[Prop] [Metric] [Direction]\n"
    "Identity & Context Integrity: [x]/100\n"
    "Performance & Trend Variance: [x]/100\n"
    "Situational Stress-Testing: [x]/100\n"
    "Risk & Volatility Buffers: [x]/100\n"
    "Final Score: [x]/100\n"
    "[Footer]: Provide an Auditor Score for the whole batch."
)

app = FastAPI(title=SYSTEM_VERSION)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RowPayload(BaseModel):
    LEG_ID: str
    index: int
    sport: Optional[str] = "MLB"
    rawText: str
    parsedPlayer: Optional[str] = "Unknown Player"
    prop: Optional[str] = "Unknown Prop"
    line: Optional[str] = ""
    direction: Optional[str] = "Undecided"
    matchup: Optional[str] = "Unknown matchup"


class AuditRequest(BaseModel):
    system_instruction: str = Field(default=DEFAULT_SYSTEM_INSTRUCTION)
    rows: List[RowPayload] = Field(default_factory=list)


class AuditLeg(BaseModel):
    leg_id: str
    player: str
    text: str


class AuditResponse(BaseModel):
    version: str
    model_used: str
    legs: List[AuditLeg]
    overall_auditor_score_text: str
    logs: List[Dict[str, str]]


def get_api_key() -> str:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise HTTPException(status_code=500, detail="Missing GEMINI_API_KEY in .env")
    return api_key


def build_prompt(rows: List[RowPayload]) -> str:
    capsules = []
    for row in rows:
        capsules.append(
            "\n".join(
                [
                    f"LEG_ID: {row.LEG_ID}",
                    f"PLAYER_FRAGMENT: {row.parsedPlayer or 'Unknown Player'}",
                    f"PROP: {row.prop or 'Unknown Prop'}",
                    f"LINE: {row.line or 'Unknown'}",
                    f"DIRECTION: {row.direction or 'Undecided'}",
                    f"MATCHUP: {row.matchup or 'Unknown matchup'}",
                    "RAW_TEXT:",
                    row.rawText.strip(),
                ]
            )
        )

    return (
        "Audit every leg below. Normalize incomplete names directly from the supplied fragments and context. "
        "Return JSON only with this exact shape: "
        '{"legs":[{"leg_id":"LEG_01","player":"Full Player Name","text":"full hostile auditor card text"}],'
        '"overall_auditor_score_text":"Footer text here"}. '
        "Do not wrap in markdown.\n\n"
        + "\n\n---\n\n".join(capsules)
    )


def parse_response_text(payload: Dict[str, Any]) -> str:
    candidates = payload.get("candidates") or []
    if not candidates:
        return ""
    content = candidates[0].get("content") or {}
    parts = content.get("parts") or []
    output = []
    for part in parts:
        text = part.get("text")
        if text:
            output.append(text)
    return "".join(output).strip()


def extract_json_block(text: str) -> Dict[str, Any]:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?", "", cleaned).strip()
        cleaned = re.sub(r"```$", "", cleaned).strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{[\s\S]*\}", cleaned)
        if not match:
            raise
        return json.loads(match.group(0))


async def call_gemini_model(
    client: httpx.AsyncClient,
    api_key: str,
    model_name: str,
    system_instruction: str,
    prompt: str,
) -> Tuple[Dict[str, Any], str]:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
    payload = {
        "system_instruction": {
            "parts": [{"text": system_instruction}]
        },
        "contents": [
            {
                "role": "user",
                "parts": [{"text": prompt}],
            }
        ],
        "generationConfig": {
            "temperature": TEMPERATURE,
            "maxOutputTokens": MAX_OUTPUT_TOKENS,
            "responseMimeType": "application/json",
        },
        "safetySettings": SAFETY_SETTINGS,
    }
    response = await client.post(url, json=payload)
    if response.is_success:
        return response.json(), response.text
    raise httpx.HTTPStatusError(
        message=f"Gemini request failed with {response.status_code}",
        request=response.request,
        response=response,
    )


def is_retryable_error(status_code: Optional[int], response_text: str) -> bool:
    text = (response_text or "").lower()
    if status_code in RETRYABLE_STATUS_CODES:
        return True
    return any(marker in text for marker in SYSTEM_BUSY_MARKERS)


async def run_with_fallback(system_instruction: str, prompt: str) -> Tuple[str, Dict[str, Any], List[Dict[str, str]]]:
    api_key = get_api_key()
    logs: List[Dict[str, str]] = []
    timeout = httpx.Timeout(TIMEOUT_SECONDS)

    async with httpx.AsyncClient(timeout=timeout) as client:
        primary_model = PRIMARY_MODEL_ALIASES[0]
        fallback_model = FALLBACK_MODEL_ALIASES[0]
        attempts = [
            {"model": primary_model, "wait": 0, "label": "PRIMARY_ATTEMPT_1"},
            {"model": primary_model, "wait": 3, "label": "PRIMARY_RETRY_1"},
            {"model": primary_model, "wait": 6, "label": "PRIMARY_RETRY_2"},
            {"model": fallback_model, "wait": 0, "label": "FALLBACK_PIVOT"},
        ]

        last_status: Optional[int] = None
        last_text = ""
        for attempt in attempts:
            if attempt["wait"]:
                logs.append({"level": "warning", "text": f"[ALPHADOG] Waiting {attempt['wait']}s before {attempt['label']}"})
                await asyncio.sleep(attempt["wait"])
            model = attempt["model"]
            logs.append({"level": "info", "text": f"[ALPHADOG] {attempt['label']} -> {model}"})
            try:
                payload, raw_text = await call_gemini_model(client, api_key, model, system_instruction, prompt)
                logs.append({"level": "info", "text": f"[ALPHADOG] Success via {model}"})
                return model, payload, logs
            except httpx.HTTPStatusError as exc:
                last_status = exc.response.status_code if exc.response else None
                last_text = exc.response.text if exc.response else str(exc)
                logs.append({"level": "warning", "text": f"[ALPHADOG] {model} failed with {last_status}: {last_text[:240]}"})
                if not is_retryable_error(last_status, last_text):
                    break
            except Exception as exc:
                last_status = None
                last_text = str(exc)
                logs.append({"level": "warning", "text": f"[ALPHADOG] {model} exception: {last_text[:240]}"})
                if not is_retryable_error(last_status, last_text):
                    break

    detail = f"Gemini request failed after fallback chain. status={last_status or 'n/a'} message={last_text[:400]}"
    raise HTTPException(status_code=502, detail=detail)


@app.get("/health")
async def health() -> Dict[str, Any]:
    return {
        "service": SYSTEM_VERSION,
        "primary_model": PRIMARY_MODEL_ALIASES[0],
        "fallback_model": FALLBACK_MODEL_ALIASES[0],
        "timeout_seconds": TIMEOUT_SECONDS,
        "env_key_present": bool(os.getenv("GEMINI_API_KEY", "").strip()),
    }


@app.post("/audit", response_model=AuditResponse)
async def audit(request: AuditRequest) -> AuditResponse:
    if not request.rows:
        raise HTTPException(status_code=400, detail="No rows supplied.")
    if len(request.rows) > 24:
        raise HTTPException(status_code=400, detail="AlphaDog only accepts up to 24 rows per batch.")

    prompt = build_prompt(request.rows)
    model_used, payload, logs = await run_with_fallback(request.system_instruction or DEFAULT_SYSTEM_INSTRUCTION, prompt)
    raw_text = parse_response_text(payload)
    if not raw_text:
        raise HTTPException(status_code=502, detail="Gemini returned an empty response body.")

    try:
        parsed = extract_json_block(raw_text)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Failed to parse Gemini JSON envelope: {exc}") from exc

    legs = []
    for item in parsed.get("legs", []):
        legs.append(
            AuditLeg(
                leg_id=str(item.get("leg_id", "")).strip() or "UNKNOWN_LEG",
                player=str(item.get("player", "")).strip() or "Unknown Player",
                text=str(item.get("text", "")).strip(),
            )
        )

    overall_text = str(parsed.get("overall_auditor_score_text", "")).strip()
    if not legs:
        raise HTTPException(status_code=502, detail="Gemini JSON parsed but contained no legs.")

    return AuditResponse(
        version=SYSTEM_VERSION,
        model_used=model_used,
        legs=legs,
        overall_auditor_score_text=overall_text,
        logs=logs,
    )
