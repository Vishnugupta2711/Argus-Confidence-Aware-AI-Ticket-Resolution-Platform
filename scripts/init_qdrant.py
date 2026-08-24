import asyncio
import sys
import os

# Add the backend directory to sys.path so we can import modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))

from services.qdrant import init_collection, client

async def main():
    try:
        await init_collection()
    finally:
        await client.close()

if __name__ == "__main__":
    asyncio.run(main())
