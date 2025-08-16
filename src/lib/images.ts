
export const FALLBACK_IMAGE =
  'https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcQpflckqTzo_CVJxHUPahKCrnIL3d2DIJn1ThfaalZfK682pUAn3mFidzfZM_yuLhNwHlLHRd_UkAVb_KZQfj4pnA';


export function firstPhotoOrFallback(photoUrls?: string[] | null): string {
  const candidate = photoUrls?.find((url) => url && url.trim().length > 0);
  if (!candidate) return FALLBACK_IMAGE;

  const lower = candidate.trim().toLowerCase();
  if (lower.startsWith('http://') || lower.startsWith('https://')) {
    return candidate;
  }
  return FALLBACK_IMAGE;
}
