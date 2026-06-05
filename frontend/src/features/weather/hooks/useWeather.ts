import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/store/app.store';

export const weatherKeys = {
  all: ['weather'] as const,
  current: (lat: number, lon: number, units: string) =>
    [...weatherKeys.all, 'current', lat, lon, units] as const,
  forecast: (lat: number, lon: number, days: number, units: string) =>
    [...weatherKeys.all, 'forecast', lat, lon, days, units] as const,
  usage: () => [...weatherKeys.all, 'usage'] as const,
};

export function useWeather() {
  const { apiClient, activeLocation, units } = useAppStore();

  return useQuery({
    queryKey: activeLocation
      ? weatherKeys.forecast(activeLocation.lat, activeLocation.lon, 7, units)
      : ['weather', 'disabled'],
    queryFn: async () => {
      if (!apiClient || !activeLocation) throw new Error('No client or location');
      return apiClient.getWeather({
        lat: activeLocation.lat,
        lon: activeLocation.lon,
        days: 7,
        units,
        ai: true,
      });
    },
    enabled: !!apiClient && !!activeLocation,
    staleTime: 1000 * 60 * 10, // 10 min
    gcTime: 1000 * 60 * 30,    // 30 min
    retry: (failureCount, error: unknown) => {
      // Don't retry auth or quota errors
      if (error && typeof error === 'object' && 'status' in error) {
        const apiError = error as { status: number };
        if (apiError.status === 401 || apiError.status === 403 || apiError.status === 429) {
          return false;
        }
      }
      return failureCount < 2;
    },
  });
}

export function useWeatherByIp() {
  const { apiClient, activeLocation } = useAppStore();
  const setActiveLocation = useAppStore((s) => s.setActiveLocation);

  return useQuery({
    queryKey: ['weather', 'geo', 'auto'],
    queryFn: async () => {
      if (!apiClient) throw new Error('No client');
      const data = await apiClient.getWeatherByIp();
      if (!activeLocation) {
        setActiveLocation({
          lat: data.lat,
          lon: data.lon,
          name: data.location || data.timezone || 'My Location',
        });
      }
      return data;
    },
    enabled: !!apiClient && !activeLocation,
    staleTime: 1000 * 60 * 15,
    retry: false,
  });
}

export function useUsage() {
  const { apiClient } = useAppStore();

  return useQuery({
    queryKey: weatherKeys.usage(),
    queryFn: async () => {
      if (!apiClient) throw new Error('No client');
      return apiClient.getUsage();
    },
    enabled: !!apiClient,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}
