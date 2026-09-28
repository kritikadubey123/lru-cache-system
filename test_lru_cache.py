import unittest
import time
from lru_cache import ThreadSafeLRUCache

class LRUCacheTestCase(unittest.TestCase):
    
    def test_basic_get_and_put(self):
        cache = ThreadSafeLRUCache(2)
        cache.put("k1", "v1")
        cache.put("k2", "v2")
        self.assertEqual(cache.get("k1"), "v1")
        self.assertEqual(cache.get("k2"), "v2")

    def test_lru_eviction(self):
        cache = ThreadSafeLRUCache(2)
        cache.put("k1", "v1")
        cache.put("k2", "v2")
        self.assertEqual(cache.get("k1"), "v1")
        cache.put("k3", "v3")
        self.assertEqual(cache.get("k1"), "v1")
        self.assertEqual(cache.get("k2"), -1)
        self.assertEqual(cache.get("k3"), "v3")

    def test_ttl_expiration(self):
        cache = ThreadSafeLRUCache(2)
        cache.put("temp", "val", ttl=1)
        self.assertEqual(cache.get("temp"), "val")
        time.sleep(1.2)
        self.assertEqual(cache.get("temp"), -1)

if __name__ == "__main__":
    unittest.main()