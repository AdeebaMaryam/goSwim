import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFavoritePoolsStore } from '../store/useStore';

const FavoritesPage = () => {
  const { favorites } = useFavoritePoolsStore();

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="flex items-center gap-3 text-3xl font-bold text-white">
            <Heart className="h-7 w-7 text-cyan-400" />
            Favorite Pools
          </h1>
          <p className="mt-2 text-gray-300">Pools you have saved for quick access.</p>
        </div>

        {favorites.length === 0 ? (
          <div className="rounded-xl border border-purple-500/20 bg-slate-900/50 p-8 text-gray-400">
            No favorite pools yet.
          </div>
        ) : (
          <div className="space-y-4">
            {favorites.map((pool) => (
              <Link
                key={pool.id}
                to={`/pool/${pool.id}`}
                className="block rounded-xl border border-purple-500/20 bg-slate-900/50 p-6 transition hover:border-cyan-400/40"
              >
                <div className="text-xl font-semibold text-white">{pool.name}</div>
                <div className="mt-2 text-sm text-gray-400">{pool.city || pool.address || 'Saved pool'}</div>
                <div className="mt-3 text-cyan-300">Rs {Number(pool.entry_fee || 0).toFixed(2)}/hour</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;
