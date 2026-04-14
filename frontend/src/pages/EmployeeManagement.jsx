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
  'admin',
  'manager',
  'supervisor',
  'accountant',
  'operator',
  'employee',
];

const SUPERVISOR_ROLES = ['supervisor', 'line_supervisor', 'washing_supervisor', 'cutting_supervisor'];
const PAGE_SIZE = 8;

const emptyForm = {
  name: '',
  email: '',
  role: 'operator',
  phone: '',
  salary: '0',
  productionSectionId: '',
  isActive: true,
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+]?[(]?[0-9]{1,4}[)]?[-\s0-9]{6,18}$/;

const formatRoleLabel = (role) =>
  String(role || '')
    .split('_')
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');

const getEmployeeDisplayId = (employee) => {
  if (!employee?._id) return 'Auto-generated';
  return `EMP-${String(employee._id).slice(-6).toUpperCase()}`;
};

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString();
};

export default function EmployeeManagement() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [creationSuccess, setCreationSuccess] = useState(null);

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
    return employees.filter((e) => {
      const name = (e.name || '').toLowerCase();
      const email = (e.userId?.email || '').toLowerCase();
      const role = (e.role || '').toLowerCase();
      const sectionId = e.productionSectionId?._id || '';
      const isActive = !!e.userId?.isActive;

      const matchesSearch =
        !q || name.includes(q) || email.includes(q) || role.includes(q);
      const matchesRole = !roleFilter || e.role === roleFilter;
      const matchesSection = !sectionFilter || sectionId === sectionFilter;
      const matchesStatus =
        !statusFilter ||
        (statusFilter === 'active' && isActive) ||
        (statusFilter === 'inactive' && !isActive);

      return matchesSearch && matchesRole && matchesSection && matchesStatus;
    });
  }, [employees, roleFilter, search, sectionFilter, statusFilter]);

  const totalRecords = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [currentPage, filtered]);

  const rangeStart = totalRecords === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, totalRecords);

  const createMutation = useMutation({
    mutationFn: (body) => createEmployee(body),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['employees'] });
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
      setError('');
      setCreationSuccess({
        fullName: res?.data?.employee?.name || '',
        email: res?.data?.employee?.userId?.email || res?.data?.employee?.email || '',
        temporaryPassword: res?.data?.temporaryPassword || '',
      });
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
    setFieldErrors({});
    setError('');
    setOpen(true);
  };

  const onEdit = (emp) => {
    setEditing(emp);
    setForm({
      name: emp.name || emp.userId?.name || '',
      email: emp.userId?.email || '',
      role: emp.role || 'operator',
      phone: emp.phone || '',
      salary: String(emp.salary ?? '0'),
      productionSectionId: emp.productionSectionId?._id || '',
      isActive: !!emp.userId?.isActive,
    });
    setFieldErrors({});
    setError('');
    setOpen(true);
  };

  const onView = (emp) => {
    setViewing(emp);
  };

  const resetFilters = () => {
    setSearch('');
    setRoleFilter('');
    setSectionFilter('');
    setStatusFilter('');
    setPage(1);
  };

  const exportFilteredEmployees = () => {
    if (!filtered.length) return;

    const headers = [
      'Employee ID',
      'Name',
      'Email',
      'Phone',
      'Salary',
      'Role',
      'Section',
      'Status',
      'Joining Date',
    ];

    const rows = filtered.map((emp) => [
      getEmployeeDisplayId(emp),
      emp.name || emp.userId?.name || '',
      emp.userId?.email || '',
      emp.phone || '',
      Number(emp.salary || 0).toFixed(2),
      formatRoleLabel(emp.role),
      emp.productionSectionId?.name || '',
      emp.userId?.isActive ? 'Active' : 'Inactive',
      formatDate(emp.createdAt),
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `employees-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const validateForm = () => {
    const nextErrors = {};
    const trimmedName = form.name.trim();
    const trimmedEmail = form.email.trim();
    const trimmedPhone = form.phone.trim();
    const parsedSalary = Number(form.salary);

    if (!trimmedName) nextErrors.name = 'Name is required';
    if (!trimmedEmail) {
      nextErrors.email = 'Email is required';
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      nextErrors.email = 'Enter a valid email address';
    }

    if (trimmedPhone && !PHONE_REGEX.test(trimmedPhone)) {
      nextErrors.phone = 'Enter a valid phone number';
    }

    if (!form.role) nextErrors.role = 'Role is required';

    if (!Number.isFinite(parsedSalary) || parsedSalary < 0) {
      nextErrors.salary = 'Salary must be a positive number or zero';
    }

    const requiresSection = SUPERVISOR_ROLES.includes(form.role);
    if (requiresSection && !form.productionSectionId) {
      nextErrors.productionSectionId = 'Section is required for supervisor roles';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!validateForm()) return;

    const body = {
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      phone: form.phone.trim(),
      salary: Number(form.salary),
      productionSectionId: form.productionSectionId || null,
      isActive: form.isActive,
    };

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

  const closeModal = () => {
    setOpen(false);
    setFieldErrors({});
    setError('');
  };

  const onFormFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const sectionHint = SUPERVISOR_ROLES.includes(form.role)
    ? 'Section is required for supervisor roles'
    : 'Section assignment is optional for this role';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Employee Management</h1>
          <p className="text-slate-500 text-sm">Manage employee records, roles, and section assignments.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportFilteredEmployees}
            disabled={!filtered.length}
            className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="bi bi-download mr-2" />
            Export
          </button>
          <button onClick={onNew} className="px-4 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700">
            + Add Employee
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 items-end">
          <div className="xl:col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">Search</label>
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name, email, role..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Role</label>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            >
              <option value="">All roles</option>
              {EMPLOYEE_ROLES.map((role) => (
                <option key={role} value={role}>{formatRoleLabel(role)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Section</label>
            <select
              value={sectionFilter}
              onChange={(e) => {
                setSectionFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            >
              <option value="">All sections</option>
              {sections.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={resetFilters}
            className="text-sm px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100"
          >
            Reset filters
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <p className="p-8 text-slate-500">Loading employees...</p>
        ) : totalRecords === 0 ? (
          <p className="p-8 text-slate-500 text-center">No employees found.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 text-left">
                    <th className="px-4 py-3">Employee ID</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Salary</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Section</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Joining Date</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedEmployees.map((emp) => (
                    <tr key={emp._id} className="border-t border-slate-100 hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-medium text-slate-700">{getEmployeeDisplayId(emp)}</td>
                      <td className="px-4 py-3 font-medium">{emp.name || emp.userId?.name || '—'}</td>
                      <td className="px-4 py-3">{emp.userId?.email || '—'}</td>
                      <td className="px-4 py-3">{emp.phone || '—'}</td>
                      <td className="px-4 py-3">Rs. {Number(emp.salary || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3">{formatRoleLabel(emp.role)}</td>
                      <td className="px-4 py-3">{emp.productionSectionId?.name || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${emp.userId?.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                          {emp.userId?.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">{formatDate(emp.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onView(emp)}
                            className="inline-flex items-center justify-center h-8 w-8 rounded-md text-slate-600 hover:bg-slate-100"
                            title="View"
                            aria-label="View employee"
                          >
                            <i className="bi bi-eye" />
                          </button>
                          <button
                            onClick={() => onEdit(emp)}
                            className="inline-flex items-center justify-center h-8 w-8 rounded-md text-blue-600 hover:bg-blue-50"
                            title="Edit"
                            aria-label="Edit employee"
                          >
                            <i className="bi bi-pencil" />
                          </button>
                          <button
                            onClick={() => onDelete(emp)}
                            className="inline-flex items-center justify-center h-8 w-8 rounded-md text-red-600 hover:bg-red-50"
                            title="Delete"
                            aria-label="Delete employee"
                          >
                            <i className="bi bi-trash" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm text-slate-600">
                Showing {rangeStart}–{rangeEnd} of {totalRecords} employees
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-slate-600">Page {currentPage} of {totalPages}</span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/35 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl">
            <div className="p-4 border-b border-slate-200">
              <h2 className="font-semibold text-slate-800">{editing ? 'Edit Employee' : 'Add Employee'}</h2>
            </div>
            <form onSubmit={onSubmit} className="p-5 space-y-4">
              {error && <p className="text-red-600 text-sm">{error}</p>}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Employee ID</label>
                <input
                  value={editing ? getEmployeeDisplayId(editing) : 'Auto-generated on save'}
                  readOnly
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-600 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => onFormFieldChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                  {fieldErrors.name && <p className="text-xs text-red-600 mt-1">{fieldErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => onFormFieldChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                  {fieldErrors.email && <p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                  <input
                    value={form.phone}
                    onChange={(e) => onFormFieldChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="e.g. +94 77 123 4567"
                  />
                  {fieldErrors.phone && <p className="text-xs text-red-600 mt-1">{fieldErrors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={form.isActive ? 'active' : 'inactive'}
                    onChange={(e) => onFormFieldChange('isActive', e.target.value === 'active')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                  <select
                    value={form.role}
                    onChange={(e) => onFormFieldChange('role', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    {EMPLOYEE_ROLES.map((r) => (
                      <option key={r} value={r}>{formatRoleLabel(r)}</option>
                    ))}
                  </select>
                  {fieldErrors.role && <p className="text-xs text-red-600 mt-1">{fieldErrors.role}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Salary</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.salary}
                    onChange={(e) => onFormFieldChange('salary', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="0.00"
                  />
                  {fieldErrors.salary && <p className="text-xs text-red-600 mt-1">{fieldErrors.salary}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Section</label>
                  <select
                    value={form.productionSectionId}
                    onChange={(e) => onFormFieldChange('productionSectionId', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="">No section</option>
                    {sections.map((s) => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">{sectionHint}</p>
                  {fieldErrors.productionSectionId && <p className="text-xs text-red-600 mt-1">{fieldErrors.productionSectionId}</p>}
                </div>
              </div>

              <div className="pt-1 flex justify-end gap-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100">Cancel</button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-60"
                >
                  {editing ? 'Save Changes' : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewing && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-semibold text-slate-800">Employee Details</h2>
              <button
                type="button"
                onClick={() => setViewing(null)}
                className="h-8 w-8 inline-flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
                aria-label="Close details"
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-500 mb-1">Employee ID</p>
                <p className="font-medium text-slate-700">{getEmployeeDisplayId(viewing)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Joining Date</p>
                <p className="font-medium text-slate-700">{formatDate(viewing.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Name</p>
                <p className="font-medium text-slate-700">{viewing.name || viewing.userId?.name || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Email</p>
                <p className="font-medium text-slate-700">{viewing.userId?.email || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Phone</p>
                <p className="font-medium text-slate-700">{viewing.phone || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Salary</p>
                <p className="font-medium text-slate-700">Rs. {Number(viewing.salary || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Role</p>
                <p className="font-medium text-slate-700">{formatRoleLabel(viewing.role)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Section</p>
                <p className="font-medium text-slate-700">{viewing.productionSectionId?.name || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Status</p>
                <p className="font-medium text-slate-700">{viewing.userId?.isActive ? 'Active' : 'Inactive'}</p>
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setViewing(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const selected = viewing;
                  setViewing(null);
                  onEdit(selected);
                }}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
              >
                Edit Employee
              </button>
            </div>
          </div>
        </div>
      )}

      {creationSuccess && (
        <div className="fixed inset-0 z-50 bg-black/35 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
            <div className="p-4 border-b border-slate-200">
              <h2 className="font-semibold text-slate-800">Employee Created Successfully</h2>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-600">
                Temporary login password for <span className="font-semibold text-slate-800">{creationSuccess.fullName || 'new employee'}</span>:
              </p>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs text-amber-700 mb-1">Temporary Password (showing only once)</p>
                <p className="text-lg font-semibold tracking-wide text-amber-900 break-all">{creationSuccess.temporaryPassword || 'Not available'}</p>
              </div>
              <p className="text-sm text-slate-600">
                This employee must change this password on first login before accessing the dashboard.
              </p>
            </div>
            <div className="p-4 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setCreationSuccess(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
