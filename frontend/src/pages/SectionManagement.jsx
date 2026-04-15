import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getEmployees, getSections, updateEmployee, updateSection, createSection } from '../api/client';
import { useAuth } from '../context/AuthContext';

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
  const { user } = useAuth();
  const canManageSections = ['admin', 'manager'].includes(user?.role);
  const [newSection, setNewSection] = useState({ name: '', type: 'line', slug: '', isActive: true });

  const { data: sections = [], isLoading: loadingSec } = useQuery({
    queryKey: ['sections'],
    queryFn: () => getSections({ includeInactive: true }).then((r) => r.data),
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

  const createSectionMutation = useMutation({
    mutationFn: (payload) => createSection(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sections'] });
      setErr('');
      setMsg('Section created');
      setNewSection({ name: '', type: 'line', slug: '', isActive: true });
      setTimeout(() => setMsg(''), 2500);
    },
    onError: (e) => setErr(e.response?.data?.error || e.message),
  });

  const toggleSectionMutation = useMutation({
    mutationFn: ({ id, isActive }) => updateSection(id, { isActive }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sections'] });
      setErr('');
      setMsg('Section status updated');
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

      {canManageSections && (
        <div className="mb-6 bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <h2 className="font-semibold text-slate-800 mb-3">Create line section</h2>
          <form
            className="grid gap-3 md:grid-cols-4"
            onSubmit={(e) => {
              e.preventDefault();
              createSectionMutation.mutate({
                name: newSection.name,
                slug: newSection.slug || undefined,
                type: newSection.type,
                isActive: newSection.isActive,
              });
            }}
          >
            <input
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Section name"
              value={newSection.name}
              onChange={(e) => setNewSection((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
            <input
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Slug (optional)"
              value={newSection.slug}
              onChange={(e) => setNewSection((prev) => ({ ...prev, slug: e.target.value }))}
            />
            <select
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={newSection.type}
              onChange={(e) => setNewSection((prev) => ({ ...prev, type: e.target.value }))}
            >
              <option value="line">Line</option>
              <option value="department">Department</option>
            </select>
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={newSection.isActive}
                onChange={(e) => setNewSection((prev) => ({ ...prev, isActive: e.target.checked }))}
              />
              Active
            </label>
            <div className="md:col-span-4 flex gap-2">
              <button
                type="submit"
                disabled={createSectionMutation.isPending}
                className="px-4 py-2 rounded-lg bg-slate-800 text-white disabled:opacity-50"
              >
                {createSectionMutation.isPending ? 'Creating...' : 'Create section'}
              </button>
              <p className="text-xs text-slate-500 self-center">Use type = line for line dropdowns.</p>
            </div>
          </form>
        </div>
      )}

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
                <div className="mt-2 flex items-center gap-2">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full ${section.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                    {section.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {canManageSections && (
                    <button
                      type="button"
                      className="text-[11px] px-2 py-0.5 rounded-full border border-slate-300 text-slate-700 hover:bg-slate-100"
                      onClick={() => toggleSectionMutation.mutate({ id: section._id, isActive: !section.isActive })}
                      disabled={toggleSectionMutation.isPending}
                    >
                      {section.isActive ? 'Disable' : 'Enable'}
                    </button>
                  )}
                </div>
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
