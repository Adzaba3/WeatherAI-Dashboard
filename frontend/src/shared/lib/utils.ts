import type { Units } from '@/store/app.store';

export function formatTemp(value: number, units: Units): string {
  return `${Math.round(value)}°${units === 'metric' ? 'C' : 'F'}`;
}

export function formatWind(speed: number, units: Units): string {
  if (units === 'metric') return `${Math.round(speed)} m/s`;
  return `${Math.round(speed)} mph`;
}

export function getWindDirection(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}

export function formatDay(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', { weekday: 'short' });
}

export function formatHour(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
    hour: '2-digit',
    hour12: false,
  });
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function getWeatherEmoji(main: string): string {
  const map: Record<string, string> = {
    Clear: '☀️',
    Clouds: '☁️',
    Rain: '🌧️',
    Drizzle: '🌦️',
    Thunderstorm: '⛈️',
    Snow: '❄️',
    Mist: '🌫️',
    Fog: '🌫️',
    Haze: '🌫️',
    Dust: '🌪️',
    Sand: '🌪️',
    Ash: '🌋',
    Squall: '💨',
    Tornado: '🌪️',
  };
  return map[main] ?? '🌡️';
}

export function getWeatherGradient(main: string): string {
  const map: Record<string, string> = {
    Clear: 'from-amber-500/20 to-orange-500/10',
    Clouds: 'from-slate-500/20 to-blue-500/10',
    Rain: 'from-blue-600/20 to-cyan-500/10',
    Drizzle: 'from-blue-400/20 to-teal-500/10',
    Thunderstorm: 'from-purple-600/20 to-blue-900/20',
    Snow: 'from-blue-200/20 to-white/10',
    Mist: 'from-gray-400/20 to-blue-300/10',
  };
  return map[main] ?? 'from-blue-500/20 to-cyan-500/10';
}

export function getUvLabel(uvi: number): { label: string; color: string } {
  if (uvi <= 2) return { label: 'Low', color: 'text-green-400' };
  if (uvi <= 5) return { label: 'Moderate', color: 'text-yellow-400' };
  if (uvi <= 7) return { label: 'High', color: 'text-orange-400' };
  if (uvi <= 10) return { label: 'Very High', color: 'text-red-400' };
  return { label: 'Extreme', color: 'text-purple-400' };
}

export function getPrecipitationProbabilityColor(pop: number): string {
  if (pop < 0.2) return '#00e5ff';
  if (pop < 0.5) return '#1a6dff';
  if (pop < 0.8) return '#7c3aed';
  return '#06b6d4';
}

// Geocoding via Open-Meteo (no key required)
export async function geocodeCity(city: string): Promise<Array<{ lat: number; lon: number; name: string; country: string }>> {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=5&language=en&format=json`
  );
  if (!res.ok) return [];
  const data = await res.json();
  if (!data.results) return [];
  return data.results.map((r: { latitude: number; longitude: number; name: string; country: string }) => ({
    lat: r.latitude,
    lon: r.longitude,
    name: `${r.name}, ${r.country}`,
    country: r.country,
  }));
}
