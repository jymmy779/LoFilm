import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  autoPlay: boolean;
  autoNext: boolean;
  theaterMode: boolean;
  newMovieNotif: boolean;
  
  toggleAutoPlay: () => void;
  toggleAutoNext: () => void;
  toggleTheaterMode: () => void;
  toggleNewMovieNotif: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      autoPlay: true,
      autoNext: true,
      theaterMode: false,
      newMovieNotif: true,
      
      toggleAutoPlay: () => set((state) => ({ autoPlay: !state.autoPlay })),
      toggleAutoNext: () => set((state) => ({ autoNext: !state.autoNext })),
      toggleTheaterMode: () => set((state) => ({ theaterMode: !state.theaterMode })),
      toggleNewMovieNotif: () => set((state) => ({ newMovieNotif: !state.newMovieNotif })),
    }),
    {
      name: 'lofilm-utility-settings', // key trong localStorage
    }
  )
);
