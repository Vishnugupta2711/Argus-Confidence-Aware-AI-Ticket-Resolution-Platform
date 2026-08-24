#!/usr/bin/env python3
import httpx
import os
import asyncio
from dotenv import load_dotenv

load_dotenv()

async def test_apis():
    print("🔍 Testing LLM API Keys...\n")
    
    async with httpx.AsyncClient(timeout=10) as client:
        # Test OpenRouter
        print("1️⃣ Testing OpenRouter...")
        try:
            resp = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={"Authorization": f"Bearer {os.getenv('OPENROUTER_API_KEY')}"},
                json={
                    "model": os.getenv('OPENROUTER_MODEL'),
                    "messages": [{"role": "user", "content": "hello"}],
                    "max_tokens": 10
                }
            )
            status = "✅ 200 OK" if resp.status_code == 200 else f"❌ {resp.status_code}"
            print(f"   Status: {status}")
            if resp.status_code != 200:
                print(f"   Error: {resp.text[:150]}")
        except Exception as e:
            print(f"   ❌ Failed: {str(e)[:100]}")
        
        # Test Groq
        print("\n2️⃣ Testing Groq...")
        try:
            resp = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {os.getenv('GROQ_API_KEY')}"},
                json={
                    "model": os.getenv('GROQ_MODEL'),
                    "messages": [{"role": "user", "content": "hello"}],
                    "max_tokens": 10
                }
            )
            status = "✅ 200 OK" if resp.status_code == 200 else f"❌ {resp.status_code}"
            print(f"   Status: {status}")
            if resp.status_code != 200:
                print(f"   Error: {resp.text[:150]}")
        except Exception as e:
            print(f"   ❌ Failed: {str(e)[:100]}")
        
        # Test Gemini
        print("\n3️⃣ Testing Gemini...")
        try:
            resp = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{os.getenv('GEMINI_MODEL')}:generateContent?key={os.getenv('GOOGLE_GEMINI_API_KEY')}",
                json={
                    "contents": [{"parts": [{"text": "hello"}]}]
                }
            )
            status = "✅ 200 OK" if resp.status_code == 200 else f"❌ {resp.status_code}"
            print(f"   Status: {status}")
            if resp.status_code != 200:
                print(f"   Error: {resp.text[:150]}")
        except Exception as e:
            print(f"   ❌ Failed: {str(e)[:100]}")
    
    print("\n✓ API Tests Complete")

if __name__ == "__main__":
    asyncio.run(test_apis())
