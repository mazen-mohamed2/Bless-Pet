import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import type { Pet, PetStatus } from '../types/pet';
import StatusBadge from '../components/StatusBadge';
import { Api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { firstPhotoOrFallback } from '../lib/images';
import { useToast } from '../lib/toast';
interface ApiError {
  message: string;
}
const STATUS: PetStatus[] = ['available', 'pending', 'sold'];

type FormState = {
  name: string;
  status: PetStatus | '';
  category: string;
  photoUrls: string; 
  tags: string;      
};

type FormErrors = Partial<Record<keyof FormState, string>>;

export default function PetDetails() {
  const { id } = useParams();
  const petId = useMemo(() => Number(id), [id]);
  const { token } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    name: '',
    status: '',
    category: '',
    photoUrls: '',
    tags: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const ac = new AbortController();

    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const data = await Api.getPet(petId, token);
        if (ac.signal.aborted) return;

        setPet(data);
        setForm({
          name: data.name || '',
          status: (data.status as PetStatus) || '',
          category: data.category?.name || '',
          photoUrls: (data.photoUrls || []).join('\n'),
          tags: (data.tags || []).map((t) => t.name).join(', '),
        });
      } catch (err) {
        if (ac.signal.aborted) return;
                const error = err as ApiError;

        setLoadError(error?.message || 'Failed to load pet');
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => ac.abort();
  }, [petId, token]);

  // -------- Validation --------
  function validate(current: FormState): boolean {
    const nextErrors: FormErrors = {};

    if (!current.name.trim()) nextErrors.name = 'Name is required.';
    if (!current.status) nextErrors.status = 'Status is required.';
    if (!current.category.trim()) nextErrors.category = 'Category is required.';

    const photos = current.photoUrls
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    if (photos.length === 0) {
      nextErrors.photoUrls = 'At least one photo URL is required.';
    } else {
      const invalid = photos.find((u) => {
        const low = u.toLowerCase();
        return !(low.startsWith('http://') || low.startsWith('https://'));
      });
      if (invalid) {
        nextErrors.photoUrls = 'Photo URLs must start with http:// or https://';
      }
    }

    const tagList = current.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    if (tagList.length === 0) nextErrors.tags = 'At least one tag is required.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function onField<K extends keyof FormState>(key: K) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
      setErrors((prev) => {
        if (!prev[key]) return prev;
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    };
  }

  // -------- Save --------
  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!pet) return;
    const valid = validate(form);
    if (!valid) return;

    setSaving(true);
    try {
      const updated: Pet = {
        id: pet.id,
        name: form.name.trim(),
        status: form.status as PetStatus,
        category: { id: pet.category?.id, name: form.category.trim() },
        photoUrls: form.photoUrls
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        tags: form.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
          .map((name, idx) => ({ id: pet.tags?.[idx]?.id ?? idx + 1, name })),
      };

      const res = await Api.updatePet(updated, token);
      setPet(res);

      toast.success('Saved successfully');
      setTimeout(() => navigate(-1), 800);
    } catch (err) {
                const error = err as ApiError;

      toast.error(error?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div>
        <Navbar />
        <main className="mx-auto max-w-4xl px-4 py-6">
          <p>Loading…</p>
        </main>
      </div>
    );
  }

  if (loadError) {
    return (
      <div>
        <Navbar />
        <main className="mx-auto max-w-4xl px-4 py-6">
          <div>
            <p className="text-rose-600">{loadError}</p>
            <button
              onClick={() => navigate(-1)}
              className="mt-3 rounded-xl border px-3 py-1.5 text-sm"
            >
              Go back
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!pet) {
    return (
      <div>
        <Navbar />
        <main className="mx-auto max-w-4xl px-4 py-6">
          <p>No pet found.</p>
        </main>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-4 flex items-center gap-3 text-sm text-gray-600">
          <Link to="/" className="hover:underline">
            Pets
          </Link>
          <span>/</span>
          <span>#{id}</span>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border bg-white">
            <img
              src={firstPhotoOrFallback(pet.photoUrls)}
              alt={pet.name || 'Pet'}
              className="h-72 w-full object-cover"
            />
            <div className="p-4">
              <h1 className="text-xl font-semibold">{pet.name}</h1>
              <div className="mt-2 flex items-center gap-2">
                <StatusBadge status={pet.status as PetStatus} />
                {pet.category?.name && (
                  <span className="text-sm text-gray-600">{pet.category?.name}</span>
                )}
              </div>
              {pet.tags && pet.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {pet.tags.map((t) => (
                    <span
                      key={t.id}
                      className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700"
                    >
                      {t.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <form onSubmit={onSave} className="rounded-2xl border bg-white p-4">
            <h2 className="text-lg font-semibold">Edit Pet</h2>

            <div className="mt-4 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium">Name</label>
                <input
                  value={form.name}
                  onChange={onField('name')}
                  className={`mt-1 w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring ${
                    errors.name ? 'border-rose-500' : 'border-gray-300'
                  }`}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'err-name' : undefined}
                />
                {errors.name && (
                  <p id="err-name" className="mt-1 text-sm text-rose-600">
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium">Status</label>
                <select
                  value={form.status}
                  onChange={onField('status')}
                  className={`mt-1 w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring ${
                    errors.status ? 'border-rose-500' : 'border-gray-300'
                  }`}
                  aria-invalid={!!errors.status}
                  aria-describedby={errors.status ? 'err-status' : undefined}
                >
                  <option value="">-- Select status --</option>
                  {STATUS.map((s) => (
                    <option key={s} value={s} className="capitalize">
                      {s}
                    </option>
                  ))}
                </select>
                {errors.status && (
                  <p id="err-status" className="mt-1 text-sm text-rose-600">
                    {errors.status}
                  </p>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium">Category</label>
                <input
                  value={form.category}
                  onChange={onField('category')}
                  className={`mt-1 w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring ${
                    errors.category ? 'border-rose-500' : 'border-gray-300'
                  }`}
                  aria-invalid={!!errors.category}
                  aria-describedby={errors.category ? 'err-category' : undefined}
                />
                {errors.category && (
                  <p id="err-category" className="mt-1 text-sm text-rose-600">
                    {errors.category}
                  </p>
                )}
              </div>

              {/* Photo URLs */}
              <div>
                <label className="block text-sm font-medium">Photo URLs (one per line)</label>
                <textarea
                  value={form.photoUrls}
                  onChange={onField('photoUrls')}
                  rows={4}
                  className={`mt-1 w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring ${
                    errors.photoUrls ? 'border-rose-500' : 'border-gray-300'
                  }`}
                  aria-invalid={!!errors.photoUrls}
                  aria-describedby={errors.photoUrls ? 'err-photoUrls' : undefined}
                />
                {errors.photoUrls && (
                  <p id="err-photoUrls" className="mt-1 text-sm text-rose-600">
                    {errors.photoUrls}
                  </p>
                )}
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium">Tags (comma-separated)</label>
                <input
                  value={form.tags}
                  onChange={onField('tags')}
                  className={`mt-1 w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring ${
                    errors.tags ? 'border-rose-500' : 'border-gray-300'
                  }`}
                  aria-invalid={!!errors.tags}
                  aria-describedby={errors.tags ? 'err-tags' : undefined}
                />
                {errors.tags && (
                  <p id="err-tags" className="mt-1 text-sm text-rose-600">
                    {errors.tags}
                  </p>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  disabled={saving}
                  className="rounded-xl bg-black px-4 py-2 text-white disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
