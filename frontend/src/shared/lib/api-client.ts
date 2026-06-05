import type { WeatherParams, WeatherResponse, UsageResponse, TreeAnalysisResult } from '@/shared/types/weather';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

interface WeatherAiLocation {
  lat: number;
  lon: number;
  timezone: string;
  requested_lat?: number;
  requested_lon?: number;
  country?: string;
}

interface WeatherAiCurrent {
  time: string;
  temperature: number;
  wind_speed: number;
  wind_direction: number;
  condition_code: string | number;
  icon: string;
  humidity?: number;
  feels_like?: number;
  uv_index?: number;
  wind_gust?: number;
}

interface WeatherAiHourly {
  time: string;
  temperature: number;
  precipitation_probability?: number;
  wind_speed?: number;
  wind_direction?: number;
  condition_code: string | number;
  icon: string;
  humidity?: number;
  feels_like?: number;
}

interface WeatherAiDaily {
  date: string;
  temp_min: number;
  temp_max: number;
  precipitation_sum?: number;
  sunrise?: string;
  sunset?: string;
  condition_code: string | number;
  icon: string;
  precipitation_probability?: number;
  wind_max?: number;
}

interface WeatherAiResponse {
  location: WeatherAiLocation;
  current: WeatherAiCurrent;
  hourly?: WeatherAiHourly[];
  daily?: WeatherAiDaily[];
  ai_summary?: string;
  summary?: string;
  client_geo?: { country?: string };
  ip_geo?: { city?: string; country?: string };
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}

export class WeatherApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'WeatherApiError';
  }
}

function parseRateLimitHeaders(headers: Headers): RateLimitInfo | null {
  const limit = headers.get('X-RateLimit-Limit');
  const remaining = headers.get('X-RateLimit-Remaining');
  const reset = headers.get('X-RateLimit-Reset');

  if (!limit || !remaining || !reset) return null;

  return {
    limit: parseInt(limit, 10),
    remaining: parseInt(remaining, 10),
    reset: parseInt(reset, 10),
  };
}

async function handleResponse<T>(response: Response): Promise<{ data: T; rateLimit: RateLimitInfo | null }> {
  const rateLimit = parseRateLimitHeaders(response.headers);

  if (!response.ok) {
    let message = `HTTP error ${response.status}`;
    try {
      const body = await response.json();
      message = body.message || body.error || message;
    } catch {
      // ignore parse error
    }

    switch (response.status) {
      case 401:
        throw new WeatherApiError(401, 'Invalid or missing API key', 'UNAUTHORIZED');
      case 403:
        throw new WeatherApiError(403, 'Your plan does not include this feature', 'FORBIDDEN');
      case 429:
        throw new WeatherApiError(429, 'Monthly quota exceeded', 'RATE_LIMITED');
      case 400:
        throw new WeatherApiError(400, message, 'BAD_REQUEST');
      default:
        throw new WeatherApiError(response.status, message, 'SERVER_ERROR');
    }
  }

  const data: T = await response.json();
  return { data, rateLimit };
}

function buildUrl(endpoint: string, params: Record<string, string | number | boolean | undefined>): string {
  const url = new URL(`${BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
}

function toUnixSeconds(value?: string): number {
  if (!value) return Math.floor(Date.now() / 1000);
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? Math.floor(Date.now() / 1000) : Math.floor(timestamp / 1000);
}

function normalizePrecipitationProbability(value?: number): number {
  if (!value) return 0;
  return value > 1 ? value / 100 : value;
}

function describeCondition(code: string | number): { main: string; description: string } {
  const numericCode = Number(code);

  if (numericCode === 0) return { main: 'Clear', description: 'clear sky' };
  if (numericCode <= 2) return { main: 'Clouds', description: numericCode === 1 ? 'mainly clear' : 'partly cloudy' };
  if (numericCode === 3) return { main: 'Clouds', description: 'overcast' };
  if ([45, 48].includes(numericCode)) return { main: 'Fog', description: 'fog' };
  if (numericCode >= 51 && numericCode <= 57) return { main: 'Drizzle', description: 'drizzle' };
  if ((numericCode >= 61 && numericCode <= 67) || (numericCode >= 80 && numericCode <= 82)) {
    return { main: 'Rain', description: 'rain' };
  }
  if ((numericCode >= 71 && numericCode <= 77) || numericCode === 85 || numericCode === 86) {
    return { main: 'Snow', description: 'snow' };
  }
  if (numericCode >= 95) return { main: 'Thunderstorm', description: 'thunderstorm' };

  return { main: 'Clouds', description: 'weather conditions' };
}

function normalizeWeatherCondition(code: string | number, icon: string) {
  const condition = describeCondition(code);
  return {
    id: Number(code),
    main: condition.main,
    description: condition.description,
    icon,
  };
}

function normalizeWeatherResponse(data: WeatherAiResponse | WeatherResponse): WeatherResponse {
  if ('lat' in data && 'timezone_offset' in data) return data;

  const daily = data.daily ?? [];
  const firstDay = daily[0];
  const currentTime = data.current.time;
  const locationName =
    data.ip_geo?.city && data.ip_geo?.country
      ? `${data.ip_geo.city}, ${data.ip_geo.country}`
      : data.location.timezone?.replace('_', ' ').split('/').pop();

  return {
    lat: data.location.lat,
    lon: data.location.lon,
    timezone: data.location.timezone,
    timezone_offset: 0,
    location: locationName,
    ai_summary: data.ai_summary ?? data.summary,
    current: {
      temp: data.current.temperature,
      feels_like: data.current.feels_like ?? data.current.temperature,
      temp_min: firstDay?.temp_min ?? data.current.temperature,
      temp_max: firstDay?.temp_max ?? data.current.temperature,
      pressure: 0,
      humidity: data.current.humidity ?? 0,
      visibility: 0,
      uvi: data.current.uv_index,
      wind_speed: data.current.wind_speed,
      wind_deg: data.current.wind_direction,
      clouds: 0,
      weather: [normalizeWeatherCondition(data.current.condition_code, data.current.icon)],
      dt: toUnixSeconds(currentTime),
      sunrise: toUnixSeconds(firstDay?.sunrise),
      sunset: toUnixSeconds(firstDay?.sunset),
    },
    hourly: data.hourly?.map((hour) => ({
      dt: toUnixSeconds(hour.time),
      temp: hour.temperature,
      feels_like: hour.feels_like ?? hour.temperature,
      pressure: 0,
      humidity: hour.humidity ?? 0,
      wind_speed: hour.wind_speed ?? 0,
      wind_deg: hour.wind_direction ?? 0,
      weather: [normalizeWeatherCondition(hour.condition_code, hour.icon)],
      clouds: 0,
      pop: normalizePrecipitationProbability(hour.precipitation_probability),
    })),
    daily: daily.map((day) => ({
      dt: toUnixSeconds(day.date),
      temp: {
        day: (day.temp_min + day.temp_max) / 2,
        min: day.temp_min,
        max: day.temp_max,
        night: day.temp_min,
        eve: day.temp_max,
        morn: day.temp_min,
      },
      feels_like: {
        day: (day.temp_min + day.temp_max) / 2,
        night: day.temp_min,
        eve: day.temp_max,
        morn: day.temp_min,
      },
      pressure: 0,
      humidity: 0,
      wind_speed: day.wind_max ?? 0,
      wind_deg: 0,
      weather: [normalizeWeatherCondition(day.condition_code, day.icon)],
      clouds: 0,
      pop: normalizePrecipitationProbability(day.precipitation_probability),
      rain: day.precipitation_sum,
      uvi: 0,
      sunrise: toUnixSeconds(day.sunrise),
      sunset: toUnixSeconds(day.sunset),
    })),
  };
}

function normalizeUsageResponse(data: UsageResponse): UsageResponse {
  const requestCount = data.period?.requestCount;
  const aiRequestCount = data.period?.aiRequestCount;
  const requestLimit = data.limits?.requests;
  const aiRequestLimit = data.limits?.aiRequests;

  return {
    ...data,
    requests_used: data.requests_used ?? data.requestsUsed ?? requestCount,
    requests_limit: data.requests_limit ?? data.requestsLimit ?? requestLimit,
    ai_requests_used: data.ai_requests_used ?? data.aiRequestsUsed ?? aiRequestCount,
    ai_requests_limit: data.ai_requests_limit ?? data.aiRequestsLimit ?? aiRequestLimit,
    period_start: data.period_start ?? data.periodStart ?? data.period?.start,
    period_end: data.period_end ?? data.periodEnd ?? data.period?.end,
    quota: data.quota ?? {
      used: requestCount,
      limit: requestLimit,
      remaining: data.remaining?.requests,
    },
    ai: data.ai ?? {
      used: aiRequestCount,
      limit: aiRequestLimit,
    },
  };
}

export class WeatherApiClient {
  public lastRateLimit: RateLimitInfo | null = null;

  private get headers(): HeadersInit {
    return {
      'Content-Type': 'application/json',
    };
  }

  async getWeather(params: WeatherParams): Promise<WeatherResponse> {
    const url = buildUrl('/v1/weather', {
      lat: params.lat,
      lon: params.lon,
      days: params.days ?? 7,
      ai: params.ai ?? true,
      units: params.units ?? 'metric',
      lang: params.lang ?? 'en',
    });

    const response = await fetch(url, { headers: this.headers });
    const { data, rateLimit } = await handleResponse<WeatherAiResponse | WeatherResponse>(response);
    this.lastRateLimit = rateLimit;
    return normalizeWeatherResponse(data);
  }

  async getCurrentWeather(params: Omit<WeatherParams, 'days'>): Promise<WeatherResponse> {
    const url = buildUrl('/v1/current', {
      lat: params.lat,
      lon: params.lon,
      ai: params.ai ?? true,
      units: params.units ?? 'metric',
    });

    const response = await fetch(url, { headers: this.headers });
    const { data, rateLimit } = await handleResponse<WeatherAiResponse | WeatherResponse>(response);
    this.lastRateLimit = rateLimit;
    return normalizeWeatherResponse(data);
  }

  async getWeatherByIp(): Promise<WeatherResponse> {
    const url = buildUrl('/v1/weather-geo', { ip: 'auto', ai: true });
    const response = await fetch(url, { headers: this.headers });
    const { data, rateLimit } = await handleResponse<WeatherAiResponse | WeatherResponse>(response);
    this.lastRateLimit = rateLimit;
    return normalizeWeatherResponse(data);
  }

  async getUsage(): Promise<UsageResponse> {
    const response = await fetch(`${BASE_URL}/v1/usage`, { headers: this.headers });
    const { data, rateLimit } = await handleResponse<UsageResponse>(response);
    this.lastRateLimit = rateLimit;
    return normalizeUsageResponse(data);
  }

  async analyzeTrees(formData: FormData): Promise<TreeAnalysisResult> {
    const response = await fetch(`${BASE_URL}/v1/trees/analyze`, {
      method: 'POST',
      body: formData,
    });
    const { data, rateLimit } = await handleResponse<TreeAnalysisResult>(response);
    this.lastRateLimit = rateLimit;
    return data;
  }

  async getTreeQuota(): Promise<{
    plan: string;
    used: number;
    limit: number;
    remaining: number;
    unlimited: boolean;
    resets_at: string;
  }> {
    const response = await fetch(`${BASE_URL}/v1/trees/quota`, { headers: this.headers });
    const { data, rateLimit } = await handleResponse<{
      plan: string;
      used: number;
      limit: number;
      remaining: number;
      unlimited: boolean;
      resets_at: string;
    }>(response);
    this.lastRateLimit = rateLimit;
    return data;
  }
}
