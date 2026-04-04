import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { predictWastage } from '../../api/ai';

const FABRIC_TYPES = ['cotton', 'polyester', 'denim', 'silk', 'blended'];
const COMPLEXITIES = ['low', 'medium', 'high'];

function RiskBadge({ level }) {
  if (!level) return null;
  const map = {
    low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    high: 'bg-red-100 text-red-700 border-red-200',
  };
  const icon = { low: 'bi-check-circle', medium: 'bi-exclamation-circle', high: 'bi-x-circle' };
  const label = { low: 'LOW RISK', medium: 'MEDIUM RISK', high: 'HIGH RISK' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border ${map[level] || map.medium}`}>
      <i className={`bi ${icon[level] || 'bi-dash'}`} />
      {label[level] || level.toUpperCase() + ' RISK'}
    </span>
  );
}

export default function WastagePrediction() {
  const [form, setForm] = useState({
    fabric_type: 'cotton',
    gsm: 180,
    design_complexity: 'medium',
    issued_fabric_qty: '',
  });

  const { mutate, data: _raw, isPending, isError, error } = useMutation({
    mutationFn: predictWastage,
  });
  const result = _raw?.data ?? _raw;

  const handleSubmit = (e) => {
    e.preventDefault();
    mutate({
      ...form,
      gsm: Number(form.gsm),
      issued_fabric_qty: form.issued_fabric_qty ? Number(form.issued_fabric_qty) : null,
    });
  };

  const wastageColor = result
    ? result.risk_level === 'low' ? '#10b981'
    : result.risk_level === 'high' ? '#ef4444'
    : '#f59e0b'
    : '#6366f1';

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <i className="bi bi-recycle text-amber-600" />
          Wastage Prediction
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Predict fabric wastage using our Linear Regression AI model trained on historical cutting data.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <i className="bi bi-input-cursor text-slate-500" /> Input Parameters
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fabric Type</label>
              <select
                id="wastage-fabric-type"
                value={form.fabric_type}
                onChange={e => setForm(f => ({ ...f, fabric_type: e.target.value }))}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              >
                {FABRIC_TYPES.map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                GSM (Grams per Square Meter)
              </label>
              <input
                id="wastage-gsm"
                type="number"
                min="80"
                max="500"
                value={form.gsm}
                onChange={e => setForm(f => ({ ...f, gsm: e.target.value }))}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="e.g. 180"
              />
              <p className="text-xs text-slate-400 mt-1">Typical range: 80–500 GSM</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Design Complexity</label>
              <div className="grid grid-cols-3 gap-2">
                {COMPLEXITIES.map(c => (
                  <button
                    key={c}
                    type="button"
                    id={`complexity-${c}`}
                    onClick={() => setForm(f => ({ ...f, design_complexity: c }))}
                    className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
                      form.design_complexity === c
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                        : 'border-slate-300 text-slate-600 hover:border-indigo-300'
                    }`}
                  >
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Issued Fabric Quantity <span className="text-slate-400 font-normal">(optional, yards/kg)</span>
              </label>
              <input
                id="wastage-issued-qty"
                type="number"
                min="0"
                max="99999"
                step="0.01"
                value={form.issued_fabric_qty}
                onChange={e => {
                  const v = e.target.value;
                  if (v === '' || (Number(v) >= 0 && Number(v) <= 99999)) {
                    setForm(f => ({ ...f, issued_fabric_qty: v }));
                  }
                }}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="e.g. 500"
              />
              <p className="text-xs text-slate-400 mt-1">Enter to calculate estimated fabric loss</p>
            </div>

            {isError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-sm text-red-700">
                <i className="bi bi-exclamation-circle mr-1" />
                {error?.response?.data?.error || 'AI service unavailable. Please try again.'}
              </div>
            )}

            <button
              id="wastage-predict-btn"
              type="submit"
              disabled={isPending}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-semibold rounded-xl shadow-md transition-all hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isPending ? (
                <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Predicting...</>
              ) : (
                <><i className="bi bi-cpu" /> Predict Wastage</>
              )}
            </button>
          </form>
        </div>

        {/* Result Card */}
        <div className="space-y-4">
          {result ? (
            <>
              {/* Main result */}
              <div
                className="bg-white rounded-2xl border-2 shadow-sm p-6 transition-all"
                style={{ borderColor: wastageColor + '40' }}
              >
                <div className="flex items-start justify-between mb-4">
                  <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                    <i className="bi bi-clipboard-data text-indigo-500" />
                    AI Prediction Result
                  </h2>
                  <RiskBadge level={result.risk_level} />
                </div>

                <div className="text-center my-6">
                  {result.wastage_percent != null ? (
                    <div
                      className="text-6xl font-black mb-1"
                      style={{ color: wastageColor }}
                    >
                      {result.wastage_percent}
                      <span className="text-3xl">%</span>
                    </div>
                  ) : (
                    <div className="text-2xl font-semibold text-slate-400 mb-1">Calculating…</div>
                  )}
                  <p className="text-slate-600 font-medium">Predicted Fabric Wastage</p>
                </div>

                {result.fabric_loss_estimate != null && result.fabric_loss_estimate > 0 && result.fabric_loss_estimate < 100000 && (
                  <div className="bg-slate-50 rounded-xl px-4 py-3 text-center">
                    <p className="text-sm text-slate-500">Estimated Fabric Loss</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">
                      {Number(result.fabric_loss_estimate).toLocaleString('en-US', { maximumFractionDigits: 2 })}{' '}
                      <span className="text-base font-normal">yards/kg</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Confidence + Explanation */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-slate-700">Model Confidence</span>
                  <span className="text-sm font-bold text-indigo-700">{result.confidence}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 mb-4">
                  <div
                    className="h-2 rounded-full bg-indigo-500 transition-all duration-700"
                    style={{ width: `${result.confidence}%` }}
                  />
                </div>
                <div className="bg-indigo-50 rounded-xl p-3">
                  <i className="bi bi-robot text-indigo-500 mr-2" />
                  <span className="text-sm text-indigo-800">{result.explanation}</span>
                </div>
                <div className={`flex items-center gap-2 mt-2 text-xs rounded-lg px-3 py-2 border ${
                  result._source === 'real_production_data'
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    : 'text-slate-500 bg-slate-50 border-slate-200'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${result._source === 'real_production_data' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                  {result._source === 'real_production_data'
                    ? 'Calibrated from real cutting records in the system'
                    : 'Rule-based model (add cutting records for higher accuracy)'}
                </div>
              </div>

              {/* Tips */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <h3 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                  <i className="bi bi-lightbulb" /> Reduction Tips
                </h3>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• Use marker efficiency analysis before cutting</li>
                  <li>• Review nesting patterns for complex designs</li>
                  <li>• Perform trial cut for new fabric types</li>
                </ul>
              </div>
            </>
          ) : (
            <div className="h-full min-h-[300px] bg-gradient-to-br from-indigo-50 to-slate-50 rounded-2xl border border-dashed border-indigo-200 flex flex-col items-center justify-center gap-3 text-center p-8">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                <i className="bi bi-cpu text-3xl text-indigo-500" />
              </div>
              <h3 className="font-semibold text-slate-700">Fill in parameters</h3>
              <p className="text-sm text-slate-500">
                Enter fabric details and click<br />Predict Wastage to run the AI model
              </p>
            </div>
          )}
        </div>
      </div>

      {/* How it works */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <i className="bi bi-info-circle text-slate-500" /> How This Model Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          {[
            { step: '1', title: 'Input Fabric Data', desc: 'You provide fabric type, GSM, and design complexity', icon: 'bi-123' },
            { step: '2', title: 'Linear Regression', desc: 'AI model calculates wastage % based on trained patterns', icon: 'bi-graph-up' },
            { step: '3', title: 'Prediction Output', desc: 'Get wastage %, fabric loss estimate, and risk level', icon: 'bi-clipboard-check' },
          ].map(item => (
            <div key={item.step} className="flex gap-3">
              <div className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                {item.step}
              </div>
              <div>
                <p className="font-medium text-slate-700">{item.title}</p>
                <p className="text-slate-500 text-xs mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
