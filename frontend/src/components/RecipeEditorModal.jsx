import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  listManufacturedProducts,
  getMaterials,
  getRecipeForProduct,
  upsertProductRecipe,
  deleteProductRecipe,
} from '../api/client';

function lineKey(i) {
  return `modal-line-${i}`;
}

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {string | null} props.lockProductId — if set, recipe is for this product only (edit mode)
 * @param {string} [props.lockProductLabel] — display name when product is not in the catalog query (e.g. job meta)
 * @param {() => void} [props.onAfterSave] — e.g. invalidate job detail
 */
export default function RecipeEditorModal({ open, onClose, lockProductId, lockProductLabel, onAfterSave }) {
  const queryClient = useQueryClient();
  const [pickedProductId, setPickedProductId] = useState('');
  const [lines, setLines] = useState([{ materialId: '', quantityPerUnit: '' }]);
  const [note, setNote] = useState('');

  const productId = lockProductId || pickedProductId;

  const { data: productsData } = useQuery({
    queryKey: ['manufactured-products', 'recipe-modal'],
    queryFn: () => listManufacturedProducts({ limit: 300, page: 1, classification: 'normal' }).then((r) => r.data),
    enabled: open,
  });
  const { data: materials = [] } = useQuery({
    queryKey: ['materials'],
    queryFn: () => getMaterials().then((r) => r.data),
    enabled: open,
  });

  const { data: recipe, isFetching: recipeLoading } = useQuery({
    queryKey: ['recipe', productId],
    queryFn: () => getRecipeForProduct(productId).then((r) => r.data),
    enabled: open && !!productId,
  });

  useEffect(() => {
    if (!open) return;
    if (!lockProductId) {
      setPickedProductId('');
      setLines([{ materialId: '', quantityPerUnit: '' }]);
      setNote('');
    }
  }, [open, lockProductId]);

  useEffect(() => {
    if (!open || !recipe || !productId) return;
    const rLines = recipe.lines || [];
    if (rLines.length === 0) {
      setLines([{ materialId: '', quantityPerUnit: '' }]);
    } else {
      setLines(
        rLines.map((l) => ({
          materialId: l.materialId?._id || l.materialId || '',
          quantityPerUnit: l.quantityPerUnit ?? '',
        }))
      );
    }
    setNote(recipe.note || '');
  }, [open, recipe, productId]);

  const saveMutation = useMutation({
    mutationFn: () =>
      upsertProductRecipe(productId, {
        lines: lines
          .filter((l) => l.materialId && Number(l.quantityPerUnit) > 0)
          .map((l) => ({ materialId: l.materialId, quantityPerUnit: Number(l.quantityPerUnit) })),
        note,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipe', productId] });
      queryClient.invalidateQueries({ queryKey: ['recipes-list'] });
      queryClient.invalidateQueries({ queryKey: ['job'] });
      onAfterSave?.();
      onClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteProductRecipe(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipe', productId] });
      queryClient.invalidateQueries({ queryKey: ['recipes-list'] });
      queryClient.invalidateQueries({ queryKey: ['job'] });
      onAfterSave?.();
      setLines([{ materialId: '', quantityPerUnit: '' }]);
      setNote('');
      onClose();
    },
  });

  const products = (productsData?.products || []).filter((p) => p.classification !== 'damage');
  const lockedProduct = lockProductId ? products.find((p) => String(p._id) === String(lockProductId)) : null;
  const lockedTitle = lockProductLabel || lockedProduct?.name;

  const sortedMaterials = [...materials].sort((a, b) => {
    if (a.type === 'accessory' && b.type !== 'accessory') return -1;
    if (a.type !== 'accessory' && b.type === 'accessory') return 1;
    return (a.name || '').localeCompare(b.name || '');
  });

  const addRow = () => setLines((ls) => [...ls, { materialId: '', quantityPerUnit: '' }]);
  const removeRow = (idx) => setLines((ls) => ls.filter((_, i) => i !== idx));
  const setLine = (idx, field, val) =>
    setLines((ls) => ls.map((l, i) => (i === idx ? { ...l, [field]: val } : l)));

  if (!open) return null;

  const canSave = !!productId;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-slate-200 flex items-start justify-between gap-3 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              {lockProductId ? 'Edit product recipe' : 'New product recipe'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">Materials per one good finished piece. Used in Final Checking and on the job.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 shrink-0"
            aria-label="Close"
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {lockProductId ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              <span className="text-slate-500">Finished product</span>
              <p className="font-semibold text-slate-800">{lockedTitle || 'Loading…'}</p>
              {lockedProduct?.sku && <p className="text-xs text-slate-500">{lockedProduct.sku}</p>}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Finished product *</label>
              <select
                value={pickedProductId}
                onChange={(e) => setPickedProductId(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">— Select product —</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} {p.sku ? `(${p.sku})` : ''}
                  </option>
                ))}
              </select>
              {products.length === 0 && (
                <p className="mt-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  Add a normal product in{' '}
                  <Link to="/products" className="font-medium text-indigo-700 underline">
                    Products
                  </Link>{' '}
                  first.
                </p>
              )}
            </div>
          )}

          {!productId ? (
            <p className="text-sm text-slate-500">Select a product to add materials and save.</p>
          ) : (
            <>
              {recipeLoading && <p className="text-sm text-slate-500">Loading recipe…</p>}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700">Recipe lines (qty / 1 piece)</label>
                  <button type="button" onClick={addRow} className="text-sm text-indigo-600 hover:underline font-medium">
                    + Add line
                  </button>
                </div>
                <div className="space-y-2">
                  {lines.map((line, idx) => (
                    <div key={lineKey(idx)} className="flex flex-wrap gap-2 items-end">
                      <div className="flex-1 min-w-[160px]">
                        <select
                          value={line.materialId}
                          onChange={(e) => setLine(idx, 'materialId', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        >
                          <option value="">— Material —</option>
                          {sortedMaterials.map((m) => (
                            <option key={m._id} value={m._id}>
                              {m.name} · {m.type}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-24">
                        <input
                          type="number"
                          min="0"
                          step="0.0001"
                          placeholder="Qty"
                          value={line.quantityPerUnit}
                          onChange={(e) => setLine(idx, 'quantityPerUnit', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeRow(idx)}
                        disabled={lines.length <= 1}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30"
                      >
                        <i className="bi bi-trash" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Note</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="Optional…"
                />
              </div>

              {saveMutation.isError && (
                <p className="text-red-600 text-sm">{saveMutation.error?.response?.data?.error}</p>
              )}
            </>
          )}
        </div>

        <div className="px-5 py-4 border-t border-slate-200 flex flex-wrap gap-2 justify-end shrink-0 bg-slate-50">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-white">
            Cancel
          </button>
          {productId && (
            <button
              type="button"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (window.confirm('Remove this recipe? Final Checking will not auto-deduct these materials.')) {
                  deleteMutation.mutate();
                }
              }}
              className="px-4 py-2 border border-red-200 text-red-700 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-40"
            >
              Delete recipe
            </button>
          )}
          <button
            type="button"
            disabled={!canSave || saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
            className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {saveMutation.isPending ? 'Saving…' : 'Save recipe'}
          </button>
        </div>
      </div>
    </div>
  );
}
