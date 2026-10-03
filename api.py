from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import time
from lru_cache import ThreadSafeLRUCache
from fastapi.responses import RedirectResponse


app = FastAPI(title="Thread-Safe LRU Cache API")

@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/docs")
# Enable CORS so the React visualizer can fetch data
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize your cache with a capacity of 6 items for clean visualization
cache = ThreadSafeLRUCache(capacity=6)

class PutRequest(BaseModel):
    key: str
    value: str
    ttl: Optional[int] = 20

@app.post("/api/put")
def put_item(req: PutRequest):
    cache.put(req.key, req.value, ttl=req.ttl)
    return {"status": "success", "key": req.key, "value": req.value, "ttl": req.ttl}

@app.get("/api/get/{key}")
def get_item(key: str):
    val = cache.get(key)
    if val is None or val == -1:
        return {"found": False, "key": key, "value": None}
    return {"found": True, "key": key, "value": val}

@app.get("/api/state")
def get_cache_state():
    """
    Inspects active nodes and calculates remaining TTL for the UI.
    Works whether your internal storage is an OrderedDict, dict, or node map.
    """
    items = []
    current_time = time.time()
    
    # Check common internal dictionary attribute names
    store = getattr(cache, "cache", getattr(cache, "map", getattr(cache, "store", {})))
    
    for k, node in list(store.items()):
        # Handle if node is an object with attributes or a primitive/dict
        val = getattr(node, "val", getattr(node, "value", node))
        expiry = getattr(node, "expiry", None)
        
        remaining_ttl = None
        if expiry:
            remaining_ttl = max(0, int(expiry - current_time))
            if remaining_ttl == 0:
                continue  # expired
        
        items.append({
            "key": str(k),
            "value": str(val),
            "ttl": remaining_ttl
        })
    return items