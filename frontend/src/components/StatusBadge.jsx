const statusColors = {
  FABRIC_ISSUED: 'bg-amber-100 text-amber-800',
  SENT_TO_CUTTING: 'bg-blue-100 text-blue-800',
  CUTTING_COMPLETED: 'bg-cyan-100 text-cyan-800',
  LINE_ASSIGNED: 'bg-indigo-100 text-indigo-800',
  LINE_IN_PROGRESS: 'bg-violet-100 text-violet-800',
  LINE_COMPLETED: 'bg-purple-100 text-purple-800',
  WASHING_OUT: 'bg-sky-100 text-sky-800',
  AFTER_WASH_RECEIVED: 'bg-teal-100 text-teal-800',
  PACKING_COMPLETED: 'bg-emerald-100 text-emerald-800',
  WAREHOUSE_RECEIVED: 'bg-green-100 text-green-800',
  pending: 'bg-slate-100 text-slate-800',
  received: 'bg-blue-100 text-blue-800',
  washing_completed: 'bg-teal-100 text-teal-800',
  returned: 'bg-green-100 text-green-800',
  packing: 'bg-amber-100 text-amber-800',
  sent_to_final_check: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
};

export default function StatusBadge({ status }) {
  const cls = statusColors[status] || 'bg-gray-100 text-gray-800';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {status?.replace(/_/g, ' ') || status}
    </span>
  );
}
