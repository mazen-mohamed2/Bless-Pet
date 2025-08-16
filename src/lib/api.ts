import type { Pet, PetStatus } from '../types/pet';

const RAW_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined;

if (!RAW_BASE_URL) {
  throw new Error(
    'VITE_API_BASE_URL is not defined. Please set it in your .env.local file.\n' +
    'Example: VITE_API_BASE_URL=https://petstore.swagger.io/v2'
  );
}

const BASE_URL = RAW_BASE_URL.trim().replace(/\/?$/, '/');

type CacheEntry<T> = { data: T; expiry: number };
const inflight = new Map<string, Promise<unknown>>();
const cache = new Map<string, CacheEntry<unknown>>();

function absoluteUrl(path: string) {
  return `${BASE_URL}${path.replace(/^\//, '')}`;
}

function cacheKey(method: string, path: string) {
  return `${method.toUpperCase()} ${absoluteUrl(path)}`;
}

function authHeaders(token?: string | null) {
  const h: Record<string, string> = { Accept: 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

function toMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

async function http<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const url = absoluteUrl(path);
  const headersFromOptions = (options.headers ?? {}) as Record<string, string>;
  
  const res = await fetch(url, {
    ...options,
    headers: {
      ...authHeaders(token),
      'Content-Type': options.body ? 'application/json' : headersFromOptions['Content-Type'] ?? 'application/json',
      ...headersFromOptions,
    },
  });

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data: unknown = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const message =
      typeof data === 'string'
        ? data
        : (data as { message?: string } | null)?.message ?? JSON.stringify(data);
    throw new Error(message);
  }
  return data as T;
}

async function httpGetCached<T>(path: string, token?: string | null, ttlMs = 15000): Promise<T> {
  const key = cacheKey('GET', path);
  const now = Date.now();

  const hit = cache.get(key) as CacheEntry<T> | undefined;
  if (hit && hit.expiry > now) return hit.data;

  const running = inflight.get(key);
  if (running) return (running as Promise<T>);

  const p: Promise<T> = http<T>(path, { method: 'GET' }, token)
    .then((data) => {
      cache.set(key, { data, expiry: now + ttlMs });
      inflight.delete(key);
      return data;
    })
    .catch((err: unknown) => {
      inflight.delete(key);
      throw err;
    });

  inflight.set(key, p);
  return p;
}

function invalidatePetCaches(petId?: number) {
  if (petId != null) {
    const target = absoluteUrl(`pet/${petId}`);
    for (const k of Array.from(cache.keys())) {
      if (k.includes(target)) cache.delete(k);
    }
  }
  const listPrefix = absoluteUrl('pet/findByStatus');
  for (const k of Array.from(cache.keys())) {
    if (k.includes(listPrefix)) cache.delete(k);
  }
}

export const Api = {
  async loginPetstore(username: string, password: string) {
    const q = new URLSearchParams({ username, password });
    const url = `user/login?${q.toString()}`;
    const res = await fetch(absoluteUrl(url), { method: 'GET', headers: authHeaders() });
    const text = await res.text();
    if (!res.ok) throw new Error(text || 'Login failed');
    return {
      token: text,
      rateLimit: res.headers.get('X-Rate-Limit'),
      expires: res.headers.get('X-Expires-After'),
    };
  },

  async createUser(
    username: string,
    password: string,
    email: string,
    firstName: string,
    lastName: string,
    phone: string
  ) {
    const body = {
      id: Date.now(),
      username,
      firstName,
      lastName,
      email,
      password,
      phone,
      userStatus: 1,
    };
    return http<unknown>('user', { method: 'POST', body: JSON.stringify(body) }, null);
  },

  async findPetsByStatus(statuses: PetStatus[], token?: string | null): Promise<Pet[]> {
    const params = new URLSearchParams();
    statuses.forEach((s) => params.append('status', s));
    return httpGetCached<Pet[]>(`pet/findByStatus?${params.toString()}`, token);
  },

  async getPet(id: number, token?: string | null): Promise<Pet> {
    return httpGetCached<Pet>(`pet/${id}`, token);
  },

  async updatePet(pet: Pet, token?: string | null): Promise<Pet> {
    try {
      const res = await http<Pet>('pet', { method: 'PUT', body: JSON.stringify(pet) }, token);
      invalidatePetCaches(pet.id);
      return res;
    } catch (err: unknown) {
      throw new Error(toMessage(err));
    }
  },
};