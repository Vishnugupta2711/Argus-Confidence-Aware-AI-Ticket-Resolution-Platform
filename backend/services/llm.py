import os
import re
import httpx
import json
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

# Primary
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "google/gemma-3-27b-it:free")

# Fallback 1
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

# Fallback 2
GEMINI_API_KEY = os.getenv("GOOGLE_GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")


def _strip_thinking(text: str) -> str:
    """Remove <think>...</think> reasoning traces from LLM output."""
    # Remove <think> blocks (case-insensitive, handles multi-line)
    cleaned = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL | re.IGNORECASE)
    return cleaned.strip()


async def generate_text(prompt: str, system_prompt: Optional[str] = None) -> str:
    """
    Generate text using the configured LLM fallback chain.
    1. Groq (primary — OpenRouter free tier quota exhausted)
    2. Gemini
    3. OpenRouter
    """
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    # Try 1: Groq (Primary)
    if GROQ_API_KEY:
        try:
            raw = await _call_openai_compatible(
                "https://api.groq.com/openai/v1/chat/completions",
                GROQ_API_KEY,
                GROQ_MODEL,
                messages
            )
            return _strip_thinking(raw)
        except Exception as e:
            print(f"Groq failed: {e}. Falling back to Gemini...")

    # Try 2: Gemini (Fallback 1)
    if GEMINI_API_KEY:
        try:
            raw = await _call_gemini(GEMINI_API_KEY, GEMINI_MODEL, prompt, system_prompt)
            return _strip_thinking(raw)
        except Exception as e:
            print(f"Gemini failed: {e}. Falling back to OpenRouter...")

    # Try 3: OpenRouter (Fallback 2)
    if OPENROUTER_API_KEY:
        try:
            raw = await _call_openai_compatible(
                "https://openrouter.ai/api/v1/chat/completions",
                OPENROUTER_API_KEY,
                OPENROUTER_MODEL,
                messages
            )
            return _strip_thinking(raw)
        except Exception as e:
            print(f"OpenRouter failed: {e}.")

    raise Exception("All LLM providers in the fallback chain failed.")


async def _call_openai_compatible(url: str, api_key: str, model: str, messages: list) -> str:
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0.1
    }
    async with httpx.AsyncClient() as client:
        resp = await client.post(url, headers=headers, json=payload, timeout=60.0)
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"].strip()


async def _call_gemini(api_key: str, model: str, prompt: str, system_prompt: Optional[str] = None) -> str:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    
    contents = [{"parts": [{"text": prompt}]}]
    payload = {"contents": contents, "generationConfig": {"temperature": 0.1}}
    
    if system_prompt:
        payload["systemInstruction"] = {"parts": [{"text": system_prompt}]}

    async with httpx.AsyncClient() as client:
        resp = await client.post(url, headers=headers, json=payload, timeout=60.0)
        resp.raise_for_status()
        data = resp.json()
        return data["candidates"][0]["content"]["parts"][0]["text"].strip()


async def generate_evidence_card(ticket: dict, signals: dict, qdrant_results: list, escalation_reason: str) -> dict:
    """Generate a structured evidence card via LLM."""
    sys_prompt = "You are an AI generating an Evidence Card JSON for an IT team. Return ONLY valid JSON, no markdown, no explanation."
    
    # Serialize signals safely (handle Pydantic models)
    def serialize_signals(sigs):
        out = {}
        for k, v in sigs.items():
            if v is None:
                out[k] = None
            elif hasattr(v, "model_dump"):
                out[k] = v.model_dump()
            elif hasattr(v, "__dict__"):
                out[k] = v.__dict__
            else:
                out[k] = v
        return out

    safe_signals = serialize_signals(signals) if signals else {}

    prompt = f"""Create an Evidence Card JSON for this IT ticket escalation.
Ticket: {json.dumps(ticket, default=str)}
Signals: {json.dumps(safe_signals, default=str)}
Similar past tickets found: {len(qdrant_results)}
Escalation Reason: {escalation_reason}

Return a JSON object with keys: escalation_reason, why_not_automated, candidate_fixes (list of objects with resolution and similarity), signal_summary."""

    raw_response = await generate_text(prompt, sys_prompt)
    try:
        # Strip potential markdown blocks
        clean_resp = raw_response.strip()
        clean_resp = re.sub(r'^```(?:json)?\s*', '', clean_resp)
        clean_resp = re.sub(r'\s*```$', '', clean_resp)
        clean_resp = clean_resp.strip()
        return json.loads(clean_resp)
    except Exception:
        return {
            "escalation_reason": escalation_reason,
            "why_not_automated": raw_response[:500],
            "candidate_fixes": [],
            "signal_summary": safe_signals
        }


async def generate_resolution_message(resolution_text: str, ticket_description: str) -> str:
    """Refine a raw technical resolution into an employee-friendly message."""
    sys_prompt = (
        "You are an empathetic IT support agent. "
        "Write a concise, friendly 2-3 sentence reply telling the user their issue is resolved. "
        "Do NOT include a subject line, greeting header, or placeholder brackets like [User's Name]. "
        "Just write the message body directly."
    )
    prompt = (
        f"Ticket Issue: {ticket_description}\n"
        f"Technical Action Taken: {resolution_text}\n"
        f"Write the message:"
    )
    return await generate_text(prompt, sys_prompt)


async def generate_why_not_automated(signals: dict, qdrant_results: list) -> str:
    """Generate a human-readable explanation of why a ticket failed automation."""
    sys_prompt = "You are an internal IT analytics assistant. Briefly summarize why a ticket was escalated."
    prompt = (
        f"Signals: {json.dumps(signals, default=str)}\n"
        f"Similar historical matches: {len(qdrant_results)}\n"
        f"Explain in 1-2 short sentences why this ticket could not be safely auto-resolved."
    )
    return await generate_text(prompt, sys_prompt)
