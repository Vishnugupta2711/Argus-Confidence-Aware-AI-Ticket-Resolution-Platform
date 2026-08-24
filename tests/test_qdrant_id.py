from qdrant_client.models import PointStruct

try:
    p = PointStruct(id="INC-10000", vector=[0.1]*1024, payload={})
    print("Success")
except Exception as e:
    print(f"Error: {e}")
