import { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import PetCard from '../components/PetCard';
import type { Pet, PetStatus } from '../types/pet';
import { Api } from '../lib/api';
import { useAuth } from '../lib/auth';

interface ApiError { message?: string }

const ALL: PetStatus[] = ['available', 'pending', 'sold'];
const STATUS_KEY = 'pets_selected_status';

function readPersistedStatus(): PetStatus {
  const v = (localStorage.getItem(STATUS_KEY) || '').toLowerCase();
  return v === 'available' || v === 'pending' || v === 'sold' ? (v as PetStatus) : 'available';
}

function norm(v: unknown): string {
  if (v == null) return '';
  return String(v).trim().toLowerCase();
}

// Generate a unique key for each pet, handling potential duplicates
function generatePetKey(pet: Pet, index: number): string {
  // Use multiple fallbacks to ensure uniqueness
  const id = pet.id ?? index;
  const name = pet.name ?? 'unnamed';
  const status = pet.status ?? 'unknown';
  const category = pet.category?.name ?? 'uncategorized';
  
  // Include index as final fallback to guarantee uniqueness
  return `pet-${id}-${name}-${status}-${category}-${index}`;
}

export default function Pets() {
  const { token } = useAuth();

  const [status, setStatus] = useState<PetStatus>(() => readPersistedStatus());
  const [search, setSearch] = useState('');
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await Api.findPetsByStatus([status], token);
        if (ac.signal.aborted) return;
        
        // Deduplicate pets by ID to avoid duplicate keys
        const uniquePets = Array.isArray(res) ? res.filter((pet, index, arr) => 
          arr.findIndex(p => p.id === pet.id) === index
        ) : [];
        
        setPets(uniquePets);
      } catch (err) {
        if (ac.signal.aborted) return;
        const e = err as ApiError;
        setError(e?.message || 'Failed to load pets');
        setPets([]);
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [status, token]);

  const onPickStatus = (s: PetStatus) => {
    localStorage.setItem(STATUS_KEY, s);
    setStatus(s);
  };

  const filtered = useMemo(() => {
    const q = norm(search);
    if (!q) return pets;
    return pets.filter((p) => norm(p.name).includes(q));
  }, [pets, search]);

  return (
    <div>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Pets</h1>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2" role="tablist" aria-label="Filter by status">
              {ALL.map((s) => (
                <button
                  key={s}
                  onClick={() => onPickStatus(s)}
                  aria-pressed={status === s}
                  className={`rounded-full border px-3 py-1.5 text-sm capitalize ${
                    status === s ? 'bg-black text-white' : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <input
              type="search"
              placeholder="Search by pet name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-80 rounded-xl border px-3 py-2 focus:outline-none focus:ring"
            />
          </div>
        </div>

        {loading && <p className="mt-6 text-gray-600">Loading…</p>}
        {error && <p className="mt-6 text-rose-600">{error}</p>}

        {!loading && !error && (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((pet, index) => (
              <PetCard key={generatePetKey(pet, index)} pet={pet} />
            ))}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <p className="mt-6 text-gray-600">No pets found matching that name.</p>
        )}
      </main>
    </div>
  );
}