import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listManufacturedProducts,
  listProductRecipes,
  deleteProductRecipe,
} from '../api/client';
import RecipeEditorModal from '../components/RecipeEditorModal';

function recipeProductName(recipe) {
  const p = recipe.productId;
  if (!p) return '—';
  if (typeof p === 'object' && p.name) return p.name;
  return '—';
}

function lineSummary(recipe) {
  const lines = recipe.lines || [];
  if (!lines.length) return 'No lines';
  return lines
    .map((l) => {
      const m = l.materialId;
      const name = typeof m === 'object' && m?.name ? m.name : 'Material';
      return `${name} ×${l.quantityPerUnit}`;
    })
    .join(', ');
}

export default function ProductRecipe() {
  const queryClient = useQueryClient();
  const [recipeModal, setRecipeModal] = useState({ open: false, lockProductId: null });

  const { data: productsData } = useQuery({
    queryKey: ['manufactured-products', 'recipe-editor'],
    queryFn: () => listManufacturedProducts({ limit: 300, page: 1, classification: 'normal' }).then((r) => r.data),
  });
  const { data: recipesList = [], isLoading: recipesListLoading } = useQuery({
    queryKey: ['recipes-list'],
    queryFn: () => listProductRecipes().then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (pid) => deleteProductRecipe(pid),
    onSuccess: (_, pid) => {
      queryClient.invalidateQueries({ queryKey: ['recipe', pid] });
      queryClient.invalidateQueries({ queryKey: ['recipes-list'] });
    },
  });

  const openNewRecipe = useCallback(() => {
    setRecipeModal({ open: true, lockProductId: null });
  }, []);

  const openEditRecipe = (recipeDoc) => {
    const pid = recipeDoc.productId?._id || recipeDoc.productId;
    if (pid) setRecipeModal({ open: true, lockProductId: String(pid) });
  };

  const closeRecipeModal = useCallback(() => {
    setRecipeModal({ open: false, lockProductId: null });
  }, []);

  const products = (productsData?.products || []).filter((p) => p.classification !== 'damage');

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      <div>
        <Link to="/jobs" className="text-sm text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 mb-2">
          <i className="bi bi-arrow-left" /> Manufacturing
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">Product recipe</h1>
        <p className="text-slate-500 text-sm mt-1">
          Define accessories (and other materials) per <strong>one finished piece</strong>. When you finalize a <strong>good</strong> batch in
          Final Checking, stock is deducted automatically and issues are logged on the job.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-800">Saved recipes</h2>
          <button
            type="button"
            onClick={openNewRecipe}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
          >
            <i className="bi bi-plus-lg" /> New recipe
          </button>
        </div>
        {recipesListLoading ? (
          <p className="text-sm text-slate-500">Loading recipes…</p>
        ) : recipesList.length === 0 ? (
          <div className="text-sm text-slate-500 border border-dashed border-slate-200 rounded-lg px-4 py-6 text-center space-y-3">
            <p>
              No recipes yet. Click <strong>New recipe</strong> to open the form, pick a <strong>finished product</strong>, add materials, and save.
            </p>
            <button
              type="button"
              onClick={openNewRecipe}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-800 text-sm font-medium rounded-lg border border-slate-200 hover:bg-slate-200"
            >
              <i className="bi bi-journal-plus" /> Open new recipe form
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Product</th>
                  <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Materials (per piece)</th>
                  <th className="text-left font-medium px-4 py-3 whitespace-nowrap">Updated</th>
                  <th className="text-right font-medium px-4 py-3 w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recipesList.map((r) => {
                  const pid = r.productId?._id || r.productId;
                  return (
                    <tr key={r._id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {recipeProductName(r)}
                        {r.productId?.sku ? (
                          <span className="block text-xs font-normal text-slate-500">{r.productId.sku}</span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-md hidden md:table-cell">
                        <span className="line-clamp-2" title={lineSummary(r)}>
                          {lineSummary(r)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {r.updatedAt ? new Date(r.updatedAt).toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => openEditRecipe(r)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg mr-1"
                          title="Edit"
                        >
                          <i className="bi bi-pencil" /> Edit
                        </button>
                        <button
                          type="button"
                          disabled={deleteMutation.isPending}
                          onClick={() => {
                            if (
                              window.confirm(
                                `Delete recipe for "${recipeProductName(r)}"? Final Checking will no longer auto-deduct these materials.`
                              )
                            ) {
                              deleteMutation.mutate(pid);
                            }
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-40"
                          title="Delete"
                        >
                          <i className="bi bi-trash" /> Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <p>
          <strong>Line assignment:</strong> when you assign lines on a job, you can add or edit the recipe for the selected product there as well
          (same form).
        </p>
        {products.length === 0 && (
          <p className="mt-2 text-amber-900">
            No finished products in the catalog. Add one in{' '}
            <Link to="/products" className="font-medium text-indigo-700 underline hover:no-underline">
              Products
            </Link>{' '}
            before creating recipes.
          </p>
        )}
      </div>

      <RecipeEditorModal
        open={recipeModal.open}
        onClose={closeRecipeModal}
        lockProductId={recipeModal.lockProductId}
      />
    </div>
  );
}
