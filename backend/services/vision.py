import os
import httpx
from typing import Optional

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "google/gemma-3-27b-it:free")

async def extract_text_from_image(base64_image: str, mime_type: str = "image/jpeg") -> str:
    """
    Uses OpenRouter's vision capabilities to extract text and analyze error messages from images.
    Returns the extracted text / analysis.
    """
    if not OPENROUTER_API_KEY:
        raise ValueError("Missing OPENROUTER_API_KEY for vision extraction.")

    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    
    messages = [
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Please extract all text and error codes from this image. Explain briefly what the error is if one is visible."
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:{mime_type};base64,{base64_image}"
                    }
                }
            ]
        }
    ]
    
    payload = {
        "model": OPENROUTER_MODEL, # Note: Ensure model supports vision, default might need to be overridden if gemma-3 doesn't
        "messages": messages,
        "temperature": 0.1
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(url, headers=headers, json=payload, timeout=60.0)
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"].strip()
