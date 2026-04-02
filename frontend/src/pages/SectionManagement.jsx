import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getEmployees, getSections, updateEmployee, updateSection } from '../api/client';

function sectionMemberIds(section, supervisorId) {
  const sid = supervisorId ? String(supervisorId) : null;
  return (emp) => {
    const sec = emp.productionSectionId;
    const secId = sec && typeof sec === 'object' ? sec._id : sec;
    if (!secId || String(secId) !== String(section._id)) return false;
    if (sid && String(emp._id) === sid) return false;
    return true;
  };
}

export default function SectionManagement() {
  const qc = useQueryClient();
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const { data: sections = [], isLoading: loadingSec } = useQuery({
    queryKey: ['sections'],
    queryFn: () => getSections().then((r) => r.data),
  });
  const { data: employees = [], isLoading: loadingEmp } = useQuery({
    queryKey: ['employees'],
    queryFn: () => getEmployees().then((r) => r.data),
  });

  const sectionMutation = useMutation({
    mutationFn: ({ id, supervisorEmployeeId }) => updateSection(id, { supervisorEmployeeId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sections'] });
      qc.invalidateQueries({ queryKey: ['employees'] });
      setErr('');
      setMsg('Supervisor updated');
      setTimeout(() => setMsg(''), 2500);
    },
    onError: (e) => setErr(e.response?.data?.error || e.message),
  });

  const moveMutation = useMutation({
    mutationFn: ({ id, productionSectionId }) => updateEmployee(id, { productionSectionId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] });
      qc.invalidateQueries({ queryKey: ['sections'] });
      setErr('');
      setMsg('Employee assignment updated');
      setTimeout(() => setMsg(''), 2500);
    },
    onError: (e) => setErr(e.response?.data?.error || e.message),
  });

  if (loadingSec || loadingEmp) {
    return <div className="text-slate-500">Loading sections…</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Manufacturing sections</h1>
      <p className="text-slate-500 text-sm mb-6">
        One supervisor per section. Assign operators to a section; supervisors log in at{' '}
        <code className="text-slate-700 bg-slate-100 px-1 rounded">/supervisor/login</code>.
      </p>

      {msg && <div className="mb-4 p-3 rounded-lg bg-emerald-50 text-emerald-800 text-sm border border-emerald-100">{msg}</div>}
      {err && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-100">{err}</div>}

      <div className="grid gap-6 md:grid-cols-2">
        {sections.map((section) => {
          const sup = section.supervisorEmployeeId;
          const supId = sup && typeof sup === 'object' ? sup._id : sup;
          const members = employees.filter(sectionMemberIds(section, supId));
          const addOptions = employees.filter((e) => {
            if (String(e._id) === String(supId)) return false;
            const sec = e.productionSectionId;
            const secId = sec && typeof sec === 'object' ? sec._id : sec;
            return String(secId || '') !== String(section._id);
          });

          return (
            <div key={section._id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/80">
                <h2 className="font-semibold text-slate-800">{section.name}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {section.type} · {section.slug}
                </p>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Supervisor (one per section)</label>
                  <select
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white"
                    value={supId || ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      sectionMutation.mutate({
                        id: section._id,
                        supervisorEmployeeId: v === '' ? null : v,
                      });
                    }}
                    disabled={sectionMutation.isPending}
                  >
                    <option value="">— No supervisor —</option>
                    {employees.map((e) => (
                      <option key={e._id} value={e._id}>
                        {e.name} ({e.userId?.email || e.role})
                      </option>
                    ))}
                  </select>
                  {sup && typeof sup === 'object' && (
                    <p className="text-xs text-slate-500 mt-1">
                      Current: {sup.name} · {sup.role}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-600">Operators in this section</span>
                    <select
                      className="text-xs rounded-lg border border-slate-200 px-2 py-1 max-w-[55%]"
                      defaultValue=""
                      onChange={(e) => {
                        const id = e.target.value;
                        if (!id) return;
                        moveMutation.mutate({ id, productionSectionId: section._id });
                        e.target.value = '';
                      }}
                      disabled={moveMutation.isPending}
                    >
                      <option value="">+ Assign employee…</option>
                      {addOptions.map((e) => (
                        <option key={e._id} value={e._id}>
                          {e.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {members.length === 0 ? (
                    <p className="text-sm text-slate-400">No operators assigned yet.</p>
                  ) : (
                    <ul className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
                      {members.map((e) => (
                        <li key={e._id} className="flex items-center justify-between px-3 py-2 text-sm bg-white">
                          <span>{e.name}</span>
                          <button
                            type="button"
                            className="text-xs text-amber-700 hover:underline"
                            onClick={() => moveMutation.mutate({ id: e._id, productionSectionId: null })}
                            disabled={moveMutation.isPending}
                          >
                            Remove from section
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
