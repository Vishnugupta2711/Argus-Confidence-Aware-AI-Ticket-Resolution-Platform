import base64
import httpx
from typing import Optional

from services.vision import extract_text_from_image
from services.jina import generate_embedding

async def embed_ticket(description: str, attachment_url: Optional[str] = None) -> list[float]:
    """
    Layer 1a: Contextual Embedding.
    Constructs the final text from the description and any visual attachments,
    then generates a 1024-dimensional semantic embedding via Jina.
    """
    context_text = description
    
    if attachment_url:
        # Note: If attachment_url is a Supabase public URL, we download it first
        # to get the base64, as OpenRouter requires b64 or accessible URLs.
        # We will download it as bytes, then b64 encode it.
        try:
            async with httpx.AsyncClient() as client:
                res = await client.get(attachment_url, timeout=15.0)
                res.raise_for_status()
                b64_img = base64.b64encode(res.content).decode("utf-8")
                
            # Determine mime type naively from URL extension
            mime_type = "image/jpeg"
            if attachment_url.lower().endswith(".png"):
                mime_type = "image/png"
            elif attachment_url.lower().endswith(".gif"):
                mime_type = "image/gif"
            elif attachment_url.lower().endswith(".webp"):
                mime_type = "image/webp"

            # Extract text using Vision API
            vision_text = await extract_text_from_image(b64_img, mime_type)
            
            # Append visual context to description
            context_text += f"\n\n[Visual Attachment Context]\n{vision_text}"
            
        except Exception as e:
            # If vision fails, we log it but do not crash the pipeline. 
            # We embed what we have.
            print(f"Warning: Vision extraction failed for {attachment_url}. Error: {e}")

    # Generate the vector
    vector = await generate_embedding(context_text, task="text-matching")
    return vector
