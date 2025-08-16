import { Link } from 'react-router-dom';
import type { Pet } from '../types/pet';
import StatusBadge from './StatusBadge';
import { firstPhotoOrFallback } from '../lib/images';

export default function PetCard({ pet }: { pet: Pet }) {
  const img = firstPhotoOrFallback(pet.photoUrls);

  return (
    <Link to={`/pets/${pet.id}`} className="group overflow-hidden rounded-2xl border bg-white hover:shadow-md transition-shadow">
      <div className="aspect-[4/3] overflow-hidden">
        <img src={img} alt={pet.name || 'Pet'} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">{pet.name || 'Unnamed Pet'}</h3>
          <StatusBadge status={pet.status} />
        </div>
        {pet.category?.name && <p className="mt-1 text-sm text-gray-600">{pet.category?.name}</p>}
      </div>
    </Link>
  );
}
