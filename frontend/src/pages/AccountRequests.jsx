import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  approveRegistrationRequest,
  getRegistrationRequestDetail,
  getNextEmployeeId,
  getSections,
  listRegistrationRequests,
  rejectRegistrationRequest,
} from '../api/client';
import { useAuth } from '../context/AuthContext';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'operator', label: 'Operator' },
  { value: 'employee', label: 'Employee' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending Approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const statusBadgeClass = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  rejected: 'bg-rose-100 text-rose-800 border-rose-200',
};

const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
};

export default function AccountRequests() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedId, setSelectedId] = useState('');
  const [approveForm, setApproveForm] = useState({ employeeId: '', role: 'operator', productionSectionId: '' });
  const [rejectReason, setRejectReason] = useState('');
  const [actionError, setActionError] = useState('');

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['registration-requests', statusFilter],
    queryFn: () => listRegistrationRequests(statusFilter).then((res) => res.data),
  });

  const { data: sections = [] } = useQuery({
    queryKey: ['sections'],
    queryFn: () => getSections().then((res) => res.data),
  });

  const selectedRequest = useMemo(
    () => requests.find((item) => item._id === selectedId) || null,
    [requests, selectedId]
  );

  const detailQuery = useQuery({
    queryKey: ['registration-request-detail', selectedId],
    queryFn: () => getRegistrationRequestDetail(selectedId).then((res) => res.data),
    enabled: Boolean(selectedId),
  });

  const requestStatus = detailQuery.data?.status || selectedRequest?.status;
  const nextEmployeeIdQuery = useQuery({
    queryKey: ['next-employee-id', selectedId],
    queryFn: () => getNextEmployeeId().then((res) => res.data),
    enabled: Boolean(selectedId) && requestStatus === 'pending',
  });

  useEffect(() => {
    if (!selectedId) {
      setApproveForm({ employeeId: '', role: 'operator', productionSectionId: '' });
      setRejectReason('');
      return;
    }

    setApproveForm({ employeeId: '', role: 'operator', productionSectionId: '' });
    setRejectReason('');
  }, [selectedId]);

  useEffect(() => {
    const suggested = String(nextEmployeeIdQuery.data?.employeeId || '').trim();
    if (!suggested) return;

    setApproveForm((prev) => {
      if (String(prev.employeeId || '').trim()) return prev;
      return { ...prev, employeeId: suggested };
    });
  }, [nextEmployeeIdQuery.data?.employeeId]);

  const approveMutation = useMutation({
    mutationFn: ({ id, body }) => approveRegistrationRequest(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['registration-requests'] });
      qc.invalidateQueries({ queryKey: ['registration-request-detail'] });
      setActionError('');
      setSelectedId('');
      setApproveForm({ employeeId: '', role: 'operator', productionSectionId: '' });
      setRejectReason('');
    },
    onError: (err) => setActionError(err.response?.data?.error || err.message),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, body }) => rejectRegistrationRequest(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['registration-requests'] });
      qc.invalidateQueries({ queryKey: ['registration-request-detail'] });
      setActionError('');
      setSelectedId('');
      setApproveForm({ employeeId: '', role: 'operator', productionSectionId: '' });
      setRejectReason('');
    },
    onError: (err) => setActionError(err.response?.data?.error || err.message),
  });

  if (!user || user.role !== 'admin') {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
        Only administrators can access account requests.
      </div>
    );
  }

  const onApprove = () => {
    if (!selectedId) return;
    setActionError('');
    approveMutation.mutate({
      id: selectedId,
      body: {
        employeeId: approveForm.employeeId,
        role: approveForm.role,
        productionSectionId: approveForm.productionSectionId || null,
      },
    });
  };

  const onReject = () => {
    if (!selectedId) return;
    setActionError('');
    rejectMutation.mutate({ id: selectedId, body: { rejectionReason: rejectReason } });
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Pending User Requests</h1>
        <p className="text-sm text-slate-500">Review public registration requests and approve or decline access.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between gap-3">
        <div className="text-sm text-slate-600">Filter by status</div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg"
        >
          {STATUS_OPTIONS.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-slate-500">Loading account requests...</div>
        ) : requests.length === 0 ? (
          <div className="p-6 text-slate-500">No registration requests found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="text-left px-4 py-3">Request ID</th>
                  <th className="text-left px-4 py-3">Full Name</th>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Phone Number</th>
                  <th className="text-left px-4 py-3">Requested Date</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((item) => (
                  <tr key={item._id} className="border-b border-slate-100 hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{item._id.slice(-8).toUpperCase()}</td>
                    <td className="px-4 py-3 text-slate-800">{item.fullName}</td>
                    <td className="px-4 py-3 text-slate-700">{item.email}</td>
                    <td className="px-4 py-3 text-slate-700">{item.phoneNumber}</td>
                    <td className="px-4 py-3 text-slate-700">{formatDate(item.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs border ${statusBadgeClass[item.status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                        {item.status === 'pending' ? 'Pending Approval' : item.status === 'approved' ? 'Approved' : 'Rejected'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedId(item._id);
                          setActionError('');
                        }}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedId && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">Request Details</h2>
            <button onClick={() => setSelectedId('')} className="text-slate-500 hover:text-slate-700">Close</button>
          </div>

          {detailQuery.isLoading ? (
            <div className="text-slate-500">Loading details...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Full Name</p>
                <p className="text-slate-800 font-medium">{detailQuery.data?.fullName || selectedRequest?.fullName}</p>
              </div>
              <div>
                <p className="text-slate-500">Email</p>
                <p className="text-slate-800 font-medium">{detailQuery.data?.email || selectedRequest?.email}</p>
              </div>
              <div>
                <p className="text-slate-500">Phone</p>
                <p className="text-slate-800 font-medium">{detailQuery.data?.phoneNumber || selectedRequest?.phoneNumber}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-slate-500">Reason for Access</p>
                <p className="text-slate-800 font-medium">{detailQuery.data?.reasonForAccess || '—'}</p>
              </div>
              {detailQuery.data?.status === 'rejected' && (
                <div className="md:col-span-2">
                  <p className="text-slate-500">Rejection Reason</p>
                  <p className="text-rose-700 font-medium">{detailQuery.data?.rejectionReason || '—'}</p>
                </div>
              )}
            </div>
          )}

          {actionError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{actionError}</div>
          )}

          {(detailQuery.data?.status || selectedRequest?.status) === 'pending' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-800">Approve Request</h3>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Employee ID</label>
                  <input
                    value={approveForm.employeeId}
                    onChange={(e) => setApproveForm((prev) => ({ ...prev, employeeId: e.target.value }))}
                    placeholder="EMP-001"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                  {nextEmployeeIdQuery.isLoading && (
                    <p className="mt-1 text-xs text-slate-500">Generating next employee ID...</p>
                  )}
                  {nextEmployeeIdQuery.data?.employeeId && (
                    <p className="mt-1 text-xs text-slate-500">Suggested: {nextEmployeeIdQuery.data.employeeId}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Role</label>
                  <select
                    value={approveForm.role}
                    onChange={(e) => setApproveForm((prev) => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    {ROLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Department / Section</label>
                  <select
                    value={approveForm.productionSectionId}
                    onChange={(e) => setApproveForm((prev) => ({ ...prev, productionSectionId: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="">Unassigned</option>
                    {sections.map((section) => (
                      <option key={section._id} value={section._id}>{section.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={onApprove}
                  disabled={approveMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {approveMutation.isPending ? 'Approving...' : 'Approve'}
                </button>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-slate-800">Decline Request</h3>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Rejection Reason (optional)</label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={5}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="Explain why this request is declined..."
                  />
                </div>
                <button
                  type="button"
                  onClick={onReject}
                  disabled={rejectMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
                >
                  {rejectMutation.isPending ? 'Declining...' : 'Decline'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
