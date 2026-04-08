import { useState, useEffect } from 'react';
import { getRecurringCategories, createExpense } from '../api/expenses';

function formatLKR(n) { return 'Rs. ' + Number(n).toLocaleString('en-LK', { maximumFractionDigits: 0 }); }

function getNextDueDate(recurringDay) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = parseInt(recurringDay);
  let next = new Date(year, month, day);
  if (next <= now) next = new Date(year, month + 1, day);
  return next.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function isDueSoon(recurringDay) {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), parseInt(recurringDay));
  if (next <= now) return false;
  return (next - now) / (1000 * 60 * 60 * 24) <= 5;
}

export default function RecurringExpenses() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState(null);
  const [amounts, setAmounts] = useState({});
  const [paid, setPaid] = useState({});
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const cats = await getRecurringCategories();
      setCategories(cats);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleMarkPaid = async (cat) => {
    const amount = parseFloat(amounts[cat._id]);
    if (!amount || amount <= 0) { setError('Enter a valid amount first'); return; }
    setMarkingId(cat._id);
    setError('');
    try {
      await createExpense({
        category: cat._id,
        amount,
        date: new Date().toISOString(),
        description: `Recurring payment – ${cat.name}`,
        paymentMethod: 'bank_transfer',
        isRecurring: true,
        recurringMonth: new Date().getMonth() + 1,
      });
      setPaid(p => ({ ...p, [cat._id]: true }));
    } catch { setError('Failed to record payment'); }
    finally { setMarkingId(null); }
  };

  const typeColors = {
    rent: 'bg-indigo-100 text-indigo-700',
    electricity: 'bg-amber-100 text-amber-700',
    salaries: 'bg-emerald-100 text-emerald-700',
    maintenance: 'bg-rose-100 text-rose-700',
    internet: 'bg-blue-100 text-blue-700',
    transport: 'bg-pink-100 text-pink-700',
    other: 'bg-slate-100 text-slate-700',
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Recurring Expenses</h1>
        <p className="text-slate-500 text-sm">Automated monthly fixed costs and alerts</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm flex items-center gap-2">
          <i className="bi bi-exclamation-triangle-fill" /> {error}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading recurring expenses…</div>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
          <i className="bi bi-arrow-repeat text-5xl block mb-3 opacity-20" />
          <p className="font-medium">No recurring expense categories set up yet.</p>
          <p className="text-sm mt-1">Go to <strong>Categories</strong> and toggle "Recurring" on a category.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((cat) => {
            const dueSoon = isDueSoon(cat.recurringDay);
            const isPaid = paid[cat._id];
            return (
              <div key={cat._id}
                className={`bg-white rounded-xl border ${dueSoon && !isPaid ? 'border-amber-300 shadow-amber-100' : 'border-slate-200'} p-5 shadow-sm flex flex-col gap-4`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800">{cat.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${typeColors[cat.type] || typeColors.other}`}>
                      {cat.type}
                    </span>
                  </div>
                  {dueSoon && !isPaid && (
                    <span className="flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
                      <i className="bi bi-bell-fill" /> Due Soon
                    </span>
                  )}
                  {isPaid && (
                    <span className="flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">
                      <i className="bi bi-check-circle-fill" /> Paid
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
                  <i className="bi bi-calendar3 text-indigo-400" />
                  <span>Due on <strong className="text-slate-700">day {cat.recurringDay}</strong> of every month</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <i className="bi bi-clock text-emerald-400" />
                  Next due: <span className="font-medium text-slate-700">{getNextDueDate(cat.recurringDay)}</span>
                </div>

                {!isPaid && (
                  <div className="mt-auto space-y-2">
                    <input
                      type="number" min="0" placeholder="Enter amount (Rs.)"
                      value={amounts[cat._id] || ''}
                      onChange={e => setAmounts(a => ({...a, [cat._id]: e.target.value}))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      onClick={() => handleMarkPaid(cat)}
                      disabled={markingId === cat._id}
                      className="w-full py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors">
                      {markingId === cat._id ? <i className="bi bi-arrow-repeat animate-spin" /> : <i className="bi bi-check-lg" />}
                      Mark as Paid This Month
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
