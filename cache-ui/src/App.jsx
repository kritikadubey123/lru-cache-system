import { useState, useEffect } from 'react';

export default function App() {
  const [nodes, setNodes] = useState([]);
  const [keyInput, setKeyInput] = useState('');
  const [valInput, setValInput] = useState('');
  const [ttlInput, setTtlInput] = useState(25);
  const [queryKey, setQueryKey] = useState('');
  const [queryResult, setQueryResult] = useState(null);
  const [logs, setLogs] = useState([]);

  const addLog = (msg) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 7)]);
  };

  const fetchState = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/state');
      const data = await res.json();
      setNodes(data);
    } catch {
      // API idle or compiling
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 1000);
    return () => clearInterval(interval);
  }, []);

  const handlePut = async (e) => {
    e.preventDefault();
    if (!keyInput.trim()) return;
    try {
      await fetch('http://localhost:8000/api/put', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: keyInput, value: valInput, ttl: parseInt(ttlInput) }),
      });
      addLog(`PUT: key='${keyInput}' val='${valInput}' (TTL: ${ttlInput}s)`);
      setKeyInput('');
      setValInput('');
      fetchState();
    } catch (err) {
      addLog(`Error executing PUT`);
    }
  };

  const handleGet = async (e) => {
    e.preventDefault();
    if (!queryKey.trim()) return;
    try {
      const res = await fetch(`http://localhost:8000/api/get/${encodeURIComponent(queryKey)}`);
      const data = await res.json();
      setQueryResult(data);
      addLog(data.found ? `HIT: key='${queryKey}' -> '${data.value}'` : `MISS: key='${queryKey}' not found`);
      fetchState();
    } catch (err) {
      addLog(`Error executing GET`);
    }
  };

  return (
    <div className="min-h-screen p-8 max-w-5xl mx-auto">
      <header className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-sky-400">Thread-Safe LRU Cache Monitor</h1>
          <p className="text-sm text-slate-400">Real-time dynamic eviction & TTL state tracker</p>
        </div>
        <div className="text-xs bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-full text-emerald-400">
          ● Engine Active
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Put Operation */}
        <form onSubmit={handlePut} className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <h2 className="text-sm uppercase tracking-wider text-slate-400 mb-3 font-semibold">Write Operation (PUT)</h2>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <input placeholder="Key" value={keyInput} onChange={(e) => setKeyInput(e.target.value)}
              className="bg-slate-950 border border-slate-700 px-3 py-2 rounded text-sm outline-none focus:border-sky-500" />
            <input placeholder="Value" value={valInput} onChange={(e) => setValInput(e.target.value)}
              className="bg-slate-950 border border-slate-700 px-3 py-2 rounded text-sm outline-none focus:border-sky-500" />
            <input type="number" placeholder="TTL (s)" value={ttlInput} onChange={(e) => setTtlInput(e.target.value)}
              className="bg-slate-950 border border-slate-700 px-3 py-2 rounded text-sm outline-none focus:border-sky-500" />
          </div>
          <button type="submit" className="w-full bg-sky-600 hover:bg-sky-500 text-white font-medium py-2 rounded text-sm transition">
            Execute PUT
          </button>
        </form>

        {/* Get Operation */}
        <form onSubmit={handleGet} className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <h2 className="text-sm uppercase tracking-wider text-slate-400 mb-3 font-semibold">Read Operation (GET)</h2>
          <div className="flex gap-3 mb-3">
            <input placeholder="Lookup Key" value={queryKey} onChange={(e) => setQueryKey(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-700 px-3 py-2 rounded text-sm outline-none focus:border-sky-500" />
            <button type="submit" className="bg-slate-800 hover:bg-slate-700 border border-slate-600 px-5 rounded text-sm font-medium transition">
              Query
            </button>
          </div>
          <div className="text-xs text-slate-400 h-9 flex items-center">
            {queryResult && (
              queryResult.found 
                ? <span className="text-emerald-400">Result: {queryResult.value} (Cache Hit)</span> 
                : <span className="text-rose-400">Result: Key not present or expired (Cache Miss)</span>
            )}
          </div>
        </form>
      </div>

      {/* Memory Blocks View */}
      <section className="mb-8">
        <h2 className="text-sm uppercase tracking-wider text-slate-400 mb-3 font-semibold">
          Active Memory Blocks ({nodes.length} / 6 slots filled)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {nodes.length === 0 ? (
            <div className="col-span-full border border-dashed border-slate-800 p-8 rounded-xl text-center text-slate-500 text-sm">
              Cache state empty. Submit a PUT operation to allocate nodes.
            </div>
          ) : (
            nodes.map((node, i) => (
              <div key={node.key} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
                    <span>Index #{i}</span>
                    {node.ttl !== null && (
                      <span className={node.ttl < 5 ? "text-rose-400 font-semibold" : "text-amber-400"}>
                        TTL: {node.ttl}s
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-base font-bold text-slate-200 truncate">{node.key}</div>
                  <div className="text-sm text-slate-400 font-mono truncate">{node.value}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Real-Time Event Log */}
      <section className="bg-slate-950 border border-slate-900 p-4 rounded-xl font-mono text-xs">
        <div className="text-slate-500 mb-2 font-bold uppercase">Operation Execution Log</div>
        {logs.length === 0 ? (
          <div className="text-slate-700">Awaiting operations...</div>
        ) : (
          logs.map((log, index) => <div key={index} className="text-slate-400 py-0.5">{log}</div>)
        )}
      </section>
    </div>
  );
}