import { useState, useEffect, useRef, useCallback } from 'react';
import { barcodeLookup, createAdjustment, createIssuance } from '../api/stock';

const PRODUCTION_LINES = ['Cutting Line', 'Sewing Line 1', 'Sewing Line 2', 'Washing', 'Finishing', 'QC', 'Packing'];

export default function BarcodeScanner() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [searching, setSearching] = useState(false);
  const [action, setAction] = useState(null); // { type: 'adjust'|'issue', material }
  const [actionForm, setActionForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef(null);
  const inputRef = useRef(null);
  const scanTimerRef = useRef(null);
  const streamRef = useRef(null);

  // Auto-focus input on mount
  useEffect(() => { inputRef.current?.focus(); }, []);

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) return;
    setSearching(true);
    try {
      const res = await barcodeLookup(q.trim());
      setResults(res);
      if (res.length === 1) setSelected(res[0]);
      else setSelected(null);
      // Log to session history
      setScanHistory(h => [{ query: q.trim(), time: new Date(), count: res.length }, ...h.slice(0, 19)]);
    } catch { } finally { setSearching(false); }
  }, []);

  // Handle barcode scanner keypress (scanners send Enter after code)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      doSearch(query);
    }
  };

  // Camera-based BarcodeDetector scanning
  const startCamera = async () => {
    setCameraError('');
    if (!('BarcodeDetector' in window)) {
      setCameraError('BarcodeDetector API not supported in this browser. Use Chrome/Edge or a USB scanner instead.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraActive(true);
      const detector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'qr_code', 'code_128', 'code_39'] });
      const scan = async () => {
        if (!videoRef.current || !streamRef.current) return;
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes.length > 0) {
            const code = barcodes[0].rawValue;
            setQuery(code);
            await doSearch(code);
          }
        } catch { }
        scanTimerRef.current = setTimeout(scan, 500);
      };
      scanTimerRef.current = setTimeout(scan, 500);
    } catch (e) {
      setCameraError('Camera access denied or no camera found.');
    }
  };

  const stopCamera = () => {
    clearTimeout(scanTimerRef.current);
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setCameraActive(false);
  };

  useEffect(() => () => { clearTimeout(scanTimerRef.current); stopCamera(); }, []);

  const openAction = (material, type) => {
    setAction({ type, material });
    setActionForm(type === 'adjust'
      ? { adjustmentType: 'subtract', quantity: '', reason: 'damaged', adjustedBy: '', note: '' }
      : { issuedTo: '', issuedBy: '', quantity: '', jobReference: '', note: '' });
    setActionMsg('');
  };

  const handleAction = async () => {
    if (!action) return;
    setSaving(true);
    try {
      if (action.type === 'adjust') {
        await createAdjustment({ material: action.material._id, ...actionForm, quantity: Number(actionForm.quantity) });
        setActionMsg(`✓ Stock adjusted for ${action.material.name}`);
      } else {
        await createIssuance({ material: action.material._id, ...actionForm, quantity: Number(actionForm.quantity) });
        setActionMsg(`✓ ${actionForm.quantity} ${action.material.uom} issued to ${actionForm.issuedTo}`);
      }
      // Refresh selected material
      const fresh = await barcodeLookup(action.material.name);
      if (fresh.length) setSelected(fresh[0]);
      setTimeout(() => setAction(null), 1500);
    } catch (e) { setActionMsg('✗ ' + (e?.response?.data?.error || 'Failed')); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Barcode Scanner</h1>
        <p className="text-slate-500 text-sm">Scan barcodes with a USB/wireless scanner or camera for rapid stock lookup</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Scanner Panel */}
        <div className="xl:col-span-2 space-y-4">
          {/* Input */}
          <div className="bg-white rounded-xl border-2 border-indigo-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <i className="bi bi-upc-scan text-indigo-600 text-xl" />
              <span className="font-semibold text-slate-700">Scan or Type Barcode / Material Name</span>
            </div>
            <div className="flex gap-3">
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                className="flex-1 border-2 border-indigo-300 rounded-xl px-4 py-3 text-lg font-mono focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                placeholder="Scan barcode here or type material name…"
              />
              <button onClick={() => doSearch(query)} disabled={searching}
                className="px-5 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2 font-medium">
                {searching ? <i className="bi bi-arrow-repeat animate-spin" /> : <i className="bi bi-search" />}
                Search
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              <i className="bi bi-info-circle mr-1" />USB/wireless barcode scanners auto-submit on scan (sends Enter key). Place cursor in the box above.
            </p>
          </div>

          {/* Camera */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <i className="bi bi-camera-video text-slate-600 text-lg" />
                <span className="font-semibold text-slate-700 text-sm">Camera Scanner</span>
                <span className="text-xs text-slate-400">(Chrome/Edge only)</span>
              </div>
              <button onClick={cameraActive ? stopCamera : startCamera}
                className={`px-3 py-1.5 text-sm rounded-lg font-medium flex items-center gap-1.5 transition-colors ${cameraActive ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}>
                {cameraActive ? <><i className="bi bi-stop-circle-fill" />Stop Camera</> : <><i className="bi bi-camera-video-fill" />Start Camera</>}
              </button>
            </div>
            {cameraError && <p className="text-amber-600 text-sm bg-amber-50 rounded-lg p-3 mb-3">{cameraError}</p>}
            {cameraActive && (
              <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-32 border-2 border-indigo-400 rounded-lg opacity-70" />
                </div>
                <div className="absolute top-2 right-2 px-2 py-1 bg-red-500 rounded-full text-white text-xs font-bold flex items-center gap-1 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-white inline-block" />LIVE
                </div>
              </div>
            )}
            {!cameraActive && !cameraError && (
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400">
                <i className="bi bi-camera-video text-3xl block mb-2 opacity-30" />
                <p className="text-sm">Click "Start Camera" to use your device camera for barcode scanning</p>
              </div>
            )}
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <span className="font-semibold text-slate-700 text-sm">{results.length} result{results.length > 1 ? 's' : ''} found</span>
                <button onClick={() => { setResults([]); setSelected(null); setQuery(''); inputRef.current?.focus(); }}
                  className="text-xs text-slate-400 hover:text-slate-600">Clear</button>
              </div>
              {results.map(mat => (
                <div key={mat._id}
                  onClick={() => setSelected(mat)}
                  className={`flex items-center justify-between p-4 border-b border-slate-100 cursor-pointer transition-colors ${selected?._id === mat._id ? 'bg-indigo-50 border-l-4 border-l-indigo-500' : 'hover:bg-slate-50'}`}>
                  <div>
                    <p className="font-semibold text-slate-800">{mat.name}</p>
                    <p className="text-xs text-slate-500 capitalize">{mat.category} · {mat.uom}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${mat.currentStock === 0 ? 'text-red-600' : mat.currentStock <= mat.reorderLevel ? 'text-amber-600' : 'text-emerald-700'}`}>
                      {mat.currentStock}
                    </p>
                    <p className="text-xs text-slate-400">{mat.uom} in stock</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Selected Material Quick Actions */}
          {selected && (
            <div className="bg-gradient-to-br from-indigo-50 to-slate-50 rounded-xl border border-indigo-200 p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{selected.name}</h3>
                  <p className="text-sm text-slate-500 capitalize">{selected.category} · {selected.uom}</p>
                  {selected.preferredSupplier && <p className="text-xs text-slate-400 mt-0.5">Supplier: {selected.preferredSupplier.name}</p>}
                </div>
                <div className="text-right">
                  <p className={`text-3xl font-bold ${selected.currentStock === 0 ? 'text-red-600' : selected.currentStock <= selected.reorderLevel ? 'text-amber-600' : 'text-emerald-700'}`}>
                    {selected.currentStock}
                  </p>
                  <p className="text-xs text-slate-400">{selected.uom} in stock</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => openAction(selected, 'adjust')}
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 flex items-center justify-center gap-2">
                  <i className="bi bi-sliders" />Adjust Stock
                </button>
                <button onClick={() => openAction(selected, 'issue')}
                  className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 flex items-center justify-center gap-2">
                  <i className="bi bi-box-arrow-right" />Issue to Line
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Scan History */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <h3 className="font-semibold text-slate-700 text-sm mb-3 flex items-center gap-2">
            <i className="bi bi-clock-history text-indigo-500" />Session Scan History
          </h3>
          {scanHistory.length === 0 ? (
            <div className="text-center text-slate-400 py-8">
              <i className="bi bi-upc-scan text-3xl block mb-2 opacity-20" />
              <p className="text-xs">No scans yet this session</p>
            </div>
          ) : (
            <div className="space-y-2">
              {scanHistory.map((s, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-700 truncate max-w-[140px]">{s.query}</p>
                    <p className="text-xs text-slate-400">{s.time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.count === 0 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'}`}>
                    {s.count} found
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Action Modal */}
      {action && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className={`px-6 py-4 rounded-t-2xl text-white ${action.type === 'adjust' ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
              <h3 className="font-semibold">
                {action.type === 'adjust' ? '⚙ Adjust Stock' : '→ Issue to Line'} — {action.material.name}
              </h3>
              <p className="text-xs opacity-80 mt-0.5">Current: {action.material.currentStock} {action.material.uom}</p>
            </div>
            <div className="px-6 py-5 space-y-3">
              {actionMsg && <p className={`text-sm rounded-lg px-3 py-2 ${actionMsg.startsWith('✓') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>{actionMsg}</p>}

              {action.type === 'adjust' && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    {[['subtract', '− Remove'], ['add', '+ Add']].map(([v, l]) => (
                      <button key={v} type="button" onClick={() => setActionForm(f => ({ ...f, adjustmentType: v }))}
                        className={`py-2 rounded-lg text-sm font-semibold border-2 ${actionForm.adjustmentType === v ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500'}`}>{l}</button>
                    ))}
                  </div>
                  <input type="number" min="0.01" placeholder="Quantity" value={actionForm.quantity}
                    onChange={e => setActionForm(f => ({ ...f, quantity: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <select value={actionForm.reason} onChange={e => setActionForm(f => ({ ...f, reason: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {['damaged', 'audit_correction', 'expired', 'returned', 'found', 'other'].map(r => (
                      <option key={r} value={r}>{r.replace('_', ' ')}</option>
                    ))}
                  </select>
                  <input placeholder="Adjusted by *" value={actionForm.adjustedBy}
                    onChange={e => setActionForm(f => ({ ...f, adjustedBy: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </>
              )}

              {action.type === 'issue' && (
                <>
                  <select value={actionForm.issuedTo} onChange={e => setActionForm(f => ({ ...f, issuedTo: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">Issue to…</option>
                    {PRODUCTION_LINES.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <input type="number" min="0.01" placeholder="Quantity" value={actionForm.quantity}
                    onChange={e => setActionForm(f => ({ ...f, quantity: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <input placeholder="Issued by *" value={actionForm.issuedBy}
                    onChange={e => setActionForm(f => ({ ...f, issuedBy: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <input placeholder="Job Reference (optional)" value={actionForm.jobReference}
                    onChange={e => setActionForm(f => ({ ...f, jobReference: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setAction(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={handleAction} disabled={saving}
                className={`px-4 py-2 text-sm text-white rounded-lg disabled:opacity-60 flex items-center gap-2 ${action.type === 'adjust' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                {saving && <i className="bi bi-arrow-repeat animate-spin" />}Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
