import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getEmployees,
  getSections,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from '../api/client';

const EMPLOYEE_ROLES = [
  'operator',
  'line_supervisor',
  'washing_supervisor',
  'cutting_supervisor',
  'admin',
];

const emptyForm = {
  name: '',
  email: '',
  password: '',
  role: 'operator',
  phone: '',
  productionSectionId: '',
  isActive: true,
};

export default function EmployeeManagement() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => getEmployees().then((r) => r.data),
  });
  const { data: sections = [] } = useQuery({
    queryKey: ['sections'],
    queryFn: () => getSections().then((r) => r.data),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) => {
      const name = (e.name || '').toLowerCase();
      const email = (e.userId?.email || '').toLowerCase();
      const role = (e.role || '').toLowerCase();
      return name.includes(q) || email.includes(q) || role.includes(q);
    });
  }, [employees, search]);

  const createMutation = useMutation({
    mutationFn: (body) => createEmployee(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] });
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
      setError('');
    },
    onError: (err) => setError(err.response?.data?.error || err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }) => updateEmployee(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] });
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
      setError('');
    },
    onError: (err) => setError(err.response?.data?.error || err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteEmployee(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  });

  const onNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setOpen(true);
  };

  const onEdit = (emp) => {
    setEditing(emp);
    setForm({
      name: emp.name || emp.userId?.name || '',
      email: emp.userId?.email || '',
      password: '',
      role: emp.role || 'operator',
      phone: emp.phone || '',
      productionSectionId: emp.productionSectionId?._id || '',
      isActive: !!emp.userId?.isActive,
    });
    setError('');
    setOpen(true);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    setError('');
    const body = {
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      phone: form.phone.trim(),
      productionSectionId: form.productionSectionId || null,
      isActive: form.isActive,
    };
    if (form.password.trim()) body.password = form.password.trim();

    if (!editing && !body.password) {
      setError('Password is required for new employee');
      return;
    }

    if (editing) {
      updateMutation.mutate({ id: editing._id, body });
    } else {
      createMutation.mutate(body);
    }
  };

  const onDelete = (emp) => {
    if (!window.confirm(`Delete employee "${emp.name || emp.userId?.email}"?`)) return;
    deleteMutation.mutate(emp._id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Employee Management</h1>
          <p className="text-slate-500 text-sm">Manage employee profiles, roles, and section assignments.</p>
        </div>
        <button onClick={onNew} className="px-4 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700">
          + Add Employee
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, role..."
          className="w-full md:w-96 px-3 py-2 border rounded-lg"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <p className="p-8 text-slate-500">Loading employees...</p>
        ) : filtered.length === 0 ? (
          <p className="p-8 text-slate-500 text-center">No employees found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-left">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Section</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp) => (
                <tr key={emp._id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium">{emp.name || emp.userId?.name || '—'}</td>
                  <td className="px-4 py-3">{emp.userId?.email || '—'}</td>
                  <td className="px-4 py-3">{emp.role}</td>
                  <td className="px-4 py-3">{emp.productionSectionId?.name || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${emp.userId?.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                      {emp.userId?.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 space-x-3">
                    <button onClick={() => onEdit(emp)} className="text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => onDelete(emp)} className="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-xl shadow-xl">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-slate-800">{editing ? 'Edit Employee' : 'Add Employee'}</h2>
            </div>
            <form onSubmit={onSubmit} className="p-4 space-y-3">
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Full name"
                  className="px-3 py-2 border rounded-lg"
                  required
                />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="Email"
                  className="px-3 py-2 border rounded-lg"
                  required
                />
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder={editing ? 'New password (optional)' : 'Password'}
                  className="px-3 py-2 border rounded-lg"
                />
                <input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="Phone"
                  className="px-3 py-2 border rounded-lg"
                />
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  className="px-3 py-2 border rounded-lg"
                >
                  {EMPLOYEE_ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <select
                  value={form.productionSectionId}
                  onChange={(e) => setForm((f) => ({ ...f, productionSectionId: e.target.value }))}
                  className="px-3 py-2 border rounded-lg"
                >
                  <option value="">No section</option>
                  {sections.map((s) => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                />
                Active user
              </label>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 bg-slate-800 text-white rounded-lg"
                >
                  {editing ? 'Save Changes' : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
