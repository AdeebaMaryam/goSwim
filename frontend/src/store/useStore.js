import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  login: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },
  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    set({ user: null });
  },
}));

export const usePoolStore = create((set) => ({
  pools: [],
  setPools: (pools) => set({ pools }),
  selectedPool: null,
  setSelectedPool: (pool) => set({ selectedPool: pool }),
}));

const getSavedFavorites = () => {
  try {
    return JSON.parse(localStorage.getItem('favoritePools') || '[]');
  } catch {
    return [];
  }
};

export const useFavoritePoolsStore = create((set, get) => ({
  favorites: getSavedFavorites(),
  toggleFavorite: (pool) => {
    const favorites = get().favorites;
    const exists = favorites.some((favorite) => favorite.id === pool.id);
    const nextFavorites = exists
      ? favorites.filter((favorite) => favorite.id !== pool.id)
      : [
          ...favorites,
          {
            id: pool.id,
            name: pool.name,
            city: pool.city,
            address: pool.address,
            entry_fee: pool.entry_fee,
          },
        ];
    localStorage.setItem('favoritePools', JSON.stringify(nextFavorites));
    set({ favorites: nextFavorites });
  },
  isFavorite: (poolId) => get().favorites.some((favorite) => favorite.id === poolId),
  clearFavorites: () => {
    localStorage.removeItem('favoritePools');
    set({ favorites: [] });
  },
}));
