import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import JsBarcode from 'jsbarcode';
import { listManufacturedProducts } from '../../api/client';

/** Code 128–safe value: prefer barcode, then SKU, then fallback */
function getBarcodeValue(product) {
  if (!product) return '';
  const raw = String(product.barcode || product.sku || '').trim();
  if (raw) return raw;
  return `PID-${String(product._id).slice(-8).toUpperCase()}`;
}

function formatPrice(n) {
  const v = Number(n);
  if (Number.isNaN(v)) return '—';
  return `Rs. ${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function BarcodePrint() {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [qty, setQty] = useState(1);
  const previewSvgRef = useRef(null);

  const { data, isLoading } = useQuery({
    queryKey: ['manufactured-products', 'barcode-print'],
    queryFn: () => listManufacturedProducts({ limit: 500, page: 1, classification: 'normal' }).then((r) => r.data),
  });

  const products = data?.products || [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      const name = (p.name || '').toLowerCase();
      const sku = (p.sku || '').toLowerCase();
      const bc = (p.barcode || '').toLowerCase();
      return name.includes(q) || sku.includes(q) || bc.includes(q);
    });
  }, [products, search]);

  const selected = useMemo(
    () => products.find((p) => String(p._id) === String(selectedId)) || null,
    [products, selectedId]
  );

  const barcodeValue = selected ? getBarcodeValue(selected) : '';

  const renderBarcodeOnSvg = useCallback((svgEl, value) => {
    if (!svgEl || !value) return;
    try {
      while (svgEl.firstChild) svgEl.removeChild(svgEl.firstChild);
      JsBarcode(svgEl, value, {
        format: 'CODE128',
        lineColor: '#000000',
        width: 1.6,
        height: 36,
        displayValue: false,
        margin: 2,
        background: '#ffffff',
      });
    } catch {
      /* invalid chars for C128 */
    }
  }, []);

  useEffect(() => {
    if (previewSvgRef.current && barcodeValue) {
      renderBarcodeOnSvg(previewSvgRef.current, barcodeValue);
    }
  }, [selectedId, barcodeValue, renderBarcodeOnSvg]);

  const qtySafe = Math.min(999, Math.max(1, parseInt(String(qty), 10) || 1));

  const openPrintWindow = () => {
    if (!selected || !barcodeValue) return;

    const esc = (s) =>
      String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const name = esc(selected.name);
    const sku = esc(selected.sku || '—');
    const price = esc(formatPrice(selected.sellingPrice));
    const cat = esc(selected.categoryId?.name || '');
    const code = esc(barcodeValue);

    const rows = [];
    for (let i = 0; i < qtySafe; i += 1) {
      rows.push(`<div class="sticker"><div class="st-inner">
        <div class="pname">${name}</div>
        ${cat ? `<div class="pcat">${cat}</div>` : ''}
        <div class="bar-wrap"><svg id="b${i}" class="barsvg"></svg></div>
        <div class="code">${code}</div>
        <div class="sku">SKU: ${sku}</div>
        <div class="price">${price}</div>
      </div></div>`);
    }

    const w = window.open('', '_blank', 'width=900,height=800');
    if (!w) return;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Barcode labels — ${name}</title>
  <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; background: #f1f5f9; padding: 12px; }
    .toolbar { text-align: center; margin-bottom: 16px; }
    .toolbar button { padding: 10px 24px; font-size: 14px; font-weight: 600; background: #4f46e5; color: #fff; border: none; border-radius: 8px; cursor: pointer; }
    .toolbar button:hover { background: #4338ca; }
    .sheet {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6mm;
      max-width: 210mm;
      margin: 0 auto;
      background: #fff;
      padding: 8mm;
      border: 1px solid #e2e8f0;
    }
    .sticker {
      border: 1px solid #1e293b;
      border-radius: 4px;
      background: #fff;
      min-height: 32mm;
      display: flex;
      align-items: stretch;
    }
    .st-inner {
      width: 100%;
      padding: 2mm 2.5mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    .pname {
      font-size: 8px;
      font-weight: 700;
      line-height: 1.15;
      max-height: 2.4em;
      overflow: hidden;
      color: #0f172a;
      width: 100%;
    }
    .pcat { font-size: 6px; color: #64748b; margin-top: 1px; }
    .bar-wrap { width: 100%; display: flex; justify-content: center; margin: 2px 0; }
    .barsvg { max-width: 100%; height: auto; }
    .code { font-family: ui-monospace, monospace; font-size: 8px; letter-spacing: 0.02em; color: #334155; margin-top: 1px; }
    .sku { font-size: 6px; color: #64748b; margin-top: 1px; }
    .price { font-size: 9px; font-weight: 700; color: #059669; margin-top: 2px; }
    @media print {
      body { background: #fff; padding: 0; }
      .toolbar { display: none !important; }
      .sheet { border: none; padding: 6mm; gap: 5mm; max-width: none; }
      .sticker { break-inside: avoid; page-break-inside: avoid; }
      @page { size: A4; margin: 8mm; }
    }
  </style>
</head>
<body>
  <div class="toolbar"><button type="button" onclick="window.print()">Print ${qtySafe} label(s)</button></div>
  <div class="sheet">${rows.join('')}</div>
  <script>
    var v = ${JSON.stringify(barcodeValue)};
    for (var i = 0; i < ${qtySafe}; i++) {
      try {
        JsBarcode('#b' + i, v, {
          format: 'CODE128',
          lineColor: '#000000',
          width: 1.4,
          height: 32,
          displayValue: false,
          margin: 1,
          background: '#ffffff'
        });
      } catch (e) { console.error(e); }
    }
  <\/script>
</body>
</html>`;

    w.document.write(html);
    w.document.close();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      <div className="flex items-center gap-4">
        <Link to="/products" className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
          <i className="bi bi-arrow-left text-lg" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Barcode sticker printing</h1>
          <p className="text-slate-500 text-sm">Code 128 (C128) labels — select product, set quantity, preview and print</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: selection */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wide">
            <i className="bi bi-upc-scan text-indigo-600" /> Product selection
          </h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Search product</label>
            <div className="relative">
              <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, SKU, or barcode…"
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Select product</label>
            {isLoading ? (
              <p className="text-slate-400 text-sm py-4">Loading products…</p>
            ) : (
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                size={Math.min(12, Math.max(6, filtered.length + 1))}
              >
                <option value="">— Choose a product —</option>
                {filtered.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} {p.sku ? `(${p.sku})` : ''}
                  </option>
                ))}
              </select>
            )}
            <p className="text-xs text-slate-400 mt-1">{filtered.length} match(es)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Number of stickers</label>
            <input
              type="number"
              min={1}
              max={999}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="w-full max-w-xs px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-slate-400 mt-1">Between 1 and 999 labels per print job</p>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              disabled={!selected || !barcodeValue}
              onClick={openPrintWindow}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <i className="bi bi-printer" /> Open print view
            </button>
          </div>
        </div>

        {/* Right: preview */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wide">
            <i className="bi bi-eye text-indigo-600" /> Preview (single label)
          </h2>

          {!selected ? (
            <div className="rounded-xl border-2 border-dashed border-slate-200 py-16 text-center text-slate-400 text-sm">
              Select a product to preview the barcode
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Product</span>
                  <span className="font-semibold text-slate-800 text-right">{selected.name}</span>
                </div>
                {selected.categoryId?.name && (
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500">Category</span>
                    <span className="text-slate-700">{selected.categoryId.name}</span>
                  </div>
                )}
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">SKU</span>
                  <span className="font-mono text-slate-700">{selected.sku || '—'}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Barcode value (C128)</span>
                  <span className="font-mono text-xs text-indigo-700 break-all text-right">{barcodeValue}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Selling price</span>
                  <span className="font-semibold text-emerald-700">{formatPrice(selected.sellingPrice)}</span>
                </div>
                <div className="flex justify-between gap-2 pt-1 border-t border-slate-200">
                  <span className="text-slate-500">Labels to print</span>
                  <span className="font-bold text-slate-900">{qtySafe}</span>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="inline-block border-2 border-slate-800 rounded-lg bg-white px-4 py-3 shadow-sm max-w-[220px]">
                  <p className="text-center text-[10px] font-bold text-slate-900 leading-tight line-clamp-2 mb-1">{selected.name}</p>
                  <div className="flex justify-center">
                    <svg ref={previewSvgRef} className="max-w-full h-auto" />
                  </div>
                  <p className="text-center font-mono text-[9px] text-slate-600 mt-0.5 tracking-wide">{barcodeValue}</p>
                  <p className="text-center text-[8px] text-slate-500">SKU: {selected.sku || '—'}</p>
                  <p className="text-center text-xs font-bold text-emerald-700 mt-1">{formatPrice(selected.sellingPrice)}</p>
                </div>
              </div>

              <p className="text-xs text-slate-500 text-center">
                Format: <strong>Code 128</strong> only. Print layout: 3 columns × A4, repeated {qtySafe} time(s).
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
