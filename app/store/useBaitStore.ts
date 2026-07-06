import { create } from 'zustand';
import { Movie } from '@/app/types/movie';

interface BaitStore {
  baitMovie: Partial<Movie> | null;
  isInstantLoading: boolean;
  setBaitMovie: (movie: Partial<Movie> | null) => void;
  startInstantLoading: () => void;
  stopInstantLoading: () => void;
}

export const useBaitStore = create<BaitStore>((set) => ({
  baitMovie: null,
  isInstantLoading: false,
  setBaitMovie: (movie) => set({ baitMovie: movie }),
  startInstantLoading: () => set({ isInstantLoading: true }),
  stopInstantLoading: () => set({ isInstantLoading: false, baitMovie: null }),
}));
