import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WeatherApiClient } from '@/shared/lib/api-client';
import type { RateLimitInfo } from '@/shared/lib/api-client';

export type Units = 'metric' | 'imperial';
export type ActiveView = 'dashboard' | 'forecast' | 'trees';

interface Location {
  lat: number;
  lon: number;
  name: string;
}

interface AppState {
  // Persisted
  units: Units;
  savedLocations: Location[];
  activeLocation: Location | null;

  // Session only
  activeView: ActiveView;
  rateLimit: RateLimitInfo | null;
  apiClient: WeatherApiClient | null;

  // Actions
  setUnits: (units: Units) => void;
  setActiveLocation: (location: Location) => void;
  addSavedLocation: (location: Location) => void;
  removeSavedLocation: (lat: number, lon: number) => void;
  setActiveView: (view: ActiveView) => void;
  setRateLimit: (info: RateLimitInfo | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      units: 'metric',
      savedLocations: [],
      activeLocation: null,
      activeView: 'dashboard',
      rateLimit: null,
      apiClient: new WeatherApiClient(),

      setUnits: (units: Units) => set({ units }),

      setActiveLocation: (location: Location) => set({ activeLocation: location }),

      addSavedLocation: (location: Location) => {
        const { savedLocations } = get();
        const exists = savedLocations.some(
          (l) => l.lat === location.lat && l.lon === location.lon
        );
        if (!exists) {
          set({ savedLocations: [...savedLocations, location] });
        }
      },

      removeSavedLocation: (lat: number, lon: number) => {
        const { savedLocations } = get();
        set({ savedLocations: savedLocations.filter((l) => l.lat !== lat || l.lon !== lon) });
      },

      setActiveView: (view: ActiveView) => set({ activeView: view }),

      setRateLimit: (info: RateLimitInfo | null) => set({ rateLimit: info }),
    }),
    {
      name: 'weather-ai-store',
      partialize: (state) => ({
        units: state.units,
        savedLocations: state.savedLocations,
        activeLocation: state.activeLocation,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.apiClient = new WeatherApiClient();
        }
      },
    }
  )
);
