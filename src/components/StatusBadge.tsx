import type { PetStatus } from '../types/pet';

export default function StatusBadge({ status }: { status?: PetStatus }) {
  const map: Record<PetStatus, string> = {
    available: 'bg-emerald-100 text-emerald-700',
    pending: 'bg-amber-100 text-amber-700',
    sold: 'bg-rose-100 text-rose-700',
  } as const;
  const cls = status ? map[status] : 'bg-gray-100 text-gray-700';
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>{status || 'unknown'}</span>;
}