export interface WeatherCondition {
  id: number;
  main: string;
  description: string;
  icon: string;
}

export interface CurrentWeather {
  temp: number;
  feels_like: number;
  temp_min: number;
  temp_max: number;
  pressure: number;
  humidity: number;
  visibility: number;
  uvi?: number;
  wind_speed: number;
  wind_deg: number;
  clouds: number;
  weather: WeatherCondition[];
  dt: number;
  sunrise?: number;
  sunset?: number;
}

export interface DailyForecast {
  dt: number;
  temp: {
    day: number;
    min: number;
    max: number;
    night: number;
    eve: number;
    morn: number;
  };
  feels_like: {
    day: number;
    night: number;
    eve: number;
    morn: number;
  };
  pressure: number;
  humidity: number;
  wind_speed: number;
  wind_deg: number;
  weather: WeatherCondition[];
  clouds: number;
  pop: number;
  rain?: number;
  uvi: number;
  summary?: string;
}

export interface HourlyForecast {
  dt: number;
  temp: number;
  feels_like: number;
  pressure: number;
  humidity: number;
  wind_speed: number;
  wind_deg: number;
  weather: WeatherCondition[];
  clouds: number;
  pop: number;
  rain?: { '1h': number };
}

export interface WeatherResponse {
  lat: number;
  lon: number;
  timezone: string;
  timezone_offset: number;
  current: CurrentWeather;
  hourly?: HourlyForecast[];
  daily?: DailyForecast[];
  ai_summary?: string;
  location?: string;
}

export interface WeatherParams {
  lat: number;
  lon: number;
  days?: number;
  ai?: boolean;
  units?: 'metric' | 'imperial';
  lang?: string;
}

export interface UsageResponse {
  plan: string;
  period?: {
    start?: string;
    end?: string;
    requestCount?: number;
    aiRequestCount?: number;
  };
  limits?: {
    requests?: number;
    aiRequests?: number;
    maxDays?: number;
    webhooks?: boolean;
    teamSeats?: number;
    sms?: boolean;
  };
  remaining?: {
    requests?: number;
    aiRequests?: number;
  };
  // API may return snake_case or camelCase
  requests_used?: number;
  requests_limit?: number;
  requestsUsed?: number;
  requestsLimit?: number;
  ai_requests_used?: number;
  ai_requests_limit?: number;
  aiRequestsUsed?: number;
  aiRequestsLimit?: number;
  period_start?: string;
  period_end?: string;
  periodStart?: string;
  periodEnd?: string;
  // Some APIs nest under quota
  quota?: {
    used?: number;
    limit?: number;
    remaining?: number;
  };
  ai?: {
    used?: number;
    limit?: number;
  };
  [key: string]: unknown;
}

export interface ApiError {
  status: number;
  message: string;
  code?: string;
}

export interface TreeAnalysisResult {
  analysis_id: string;
  timestamp: string;
  farmer_id?: string;
  county?: string;
  location?: string;
  land_acres?: number;
  total_tree_count: number;
  tree_density_per_acre?: number;
  confidence_score: number;
  canopy_coverage_pct: number;
  tree_health: {
    healthy: number;
    needs_care: number;
    needs_replacement: number;
  };
  low_confidence: boolean;
  tree_species_guess?: string;
  observations: string[];
  recommendations: string[];
  original_image_url: string;
  overlay_image_url: string;
}
