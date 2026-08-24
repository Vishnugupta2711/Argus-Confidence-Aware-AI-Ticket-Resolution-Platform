from .supabase import get_supabase

# Configuration
BUCKET_NAME = "ticket_attachments"

def get_bucket():
    client = get_supabase()
    return client.storage.from_(BUCKET_NAME)

async def upload_attachment(file_name: str, file_bytes: bytes, mime_type: str) -> str:
    """
    Uploads a file to Supabase Storage and returns the public URL.
    Ensures the bucket exists (implicitly or requires manual creation in Supabase UI).
    """
    bucket = get_bucket()
    
    # Upload the file
    response = bucket.upload(
        path=file_name,
        file=file_bytes,
        file_options={"content-type": mime_type, "upsert": "true"}
    )
    
    # Check for error in response (Supabase Python client v2 raises StorageException on error, earlier versions returned dict with 'error')
    # If the file uploaded successfully, return the public URL
    public_url_response = bucket.get_public_url(file_name)
    return public_url_response
