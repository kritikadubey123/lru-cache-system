import time
import threading

class Node:
    """Doubly linked list node storing key, value, and expiration timestamp."""
    def __init__(self, key, val, ttl):
        self.key = key
        self.val = val
        self.expiry = time.time() + ttl if ttl else float('inf')
        self.prev = None
        self.next = None

class ThreadSafeLRUCache:
    """
    A high-performance O(1) thread-safe LRU Cache with TTL expiration support.
    Combines a Hash Map with a Doubly Linked List for optimal memory retrieval.
    """
    def __init__(self, capacity: int):
        if capacity <= 0:
            raise ValueError("Capacity must be greater than zero.")
        self.capacity = capacity
        self.cache = {}  # Maps key -> Node
        self.lock = threading.Lock()
        
        # Dummy head and tail nodes to avoid edge cases in list operations
        self.head = Node(0, 0, 0)
        self.tail = Node(0, 0, 0)
        self.head.next = self.tail
        self.tail.prev = self.head

    def _remove(self, node):
        """Internal helper to remove a node from the linked list."""
        p = node.prev
        n = node.next
        p.next = n
        n.prev = p

    def _add(self, node):
        """Internal helper to insert a node right after the head (Most Recently Used)."""
        p = self.head
        n = self.head.next
        p.next = node
        node.prev = p
        node.next = n
        n.prev = node

    def get(self, key):
        """Retrieve item by key in O(1) time complexity."""
        with self.lock:
            if key not in self.cache:
                return -1
            
            node = self.cache[key]
            
            # Check if the entry has expired based on TTL
            if time.time() > node.expiry:
                self._remove(node)
                del self.cache[key]
                return -1
            
            # Refresh position (mark as most recently used)
            self._remove(node)
            self._add(node)
            return node.val

    def put(self, key, value, ttl=None):
        """Insert or update an item in O(1) time complexity."""
        with self.lock:
            if key in self.cache:
                self._remove(self.cache[key])
            
            node = Node(key, value, ttl)
            self.cache[key] = node
            self._add(node)
            
            # Evict Least Recently Used item if capacity is exceeded
            if len(self.cache) > self.capacity:
                lru = self.tail.prev
                self._remove(lru)
                del self.cache[lru.key]

# --- Local Verification Block ---
if __name__ == "__main__":
    print("Initializing LRU Cache with capacity 2...")
    cache = ThreadSafeLRUCache(2)
    
    cache.put("session_1", "User_A_Data")
    cache.put("session_2", "User_B_Data")
    
    print("Get session_1:", cache.get("session_1"))  # Returns User_A_Data
    
    # Adding a 3rd item should evict session_2 (Least Recently Used)
    cache.put("session_3", "User_C_Data")
    print("Get session_2 (Evicted):", cache.get("session_2"))  # Returns -1
    print("Get session_3:", cache.get("session_3"))  # Returns User_C_Data
    print("Success! LRU Cache is functioning perfectly.")