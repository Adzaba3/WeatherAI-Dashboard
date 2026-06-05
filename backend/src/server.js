import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import multer from 'multer';

const app = express();
const upload = multer();

const PORT = process.env.PORT || 3001;
const WEATHER_AI_BASE_URL = process.env.WEATHER_AI_BASE_URL || 'https://api.weather-ai.co';
const WEATHER_AI_API_KEY = process.env.WEATHER_AI_API_KEY;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || '*';

app.use(
  cors({
    origin: FRONTEND_ORIGIN === '*' ? true : FRONTEND_ORIGIN.split(',').map((origin) => origin.trim()),
  })
);
app.use(express.json());

function requireApiKey(_req, res, next) {
  if (!WEATHER_AI_API_KEY) {
    return res.status(500).json({
      error: 'WEATHER_AI_API_KEY is not configured on the backend',
    });
  }
  next();
}

function copyWeatherAiHeaders(sourceHeaders, targetResponse) {
  ['x-ratelimit-limit', 'x-ratelimit-remaining', 'x-ratelimit-reset'].forEach((header) => {
    const value = sourceHeaders.get(header);
    if (value) targetResponse.setHeader(header, value);
  });
}

async function proxyJson(req, res, endpoint) {
  const url = new URL(`${WEATHER_AI_BASE_URL}${endpoint}`);
  Object.entries(req.query).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => url.searchParams.append(key, item));
    } else if (value !== undefined) {
      url.searchParams.set(key, value);
    }
  });

  const upstream = await fetch(url, {
    method: req.method,
    headers: {
      Authorization: `Bearer ${WEATHER_AI_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  copyWeatherAiHeaders(upstream.headers, res);
  const contentType = upstream.headers.get('content-type');
  if (contentType) res.setHeader('content-type', contentType);

  const body = await upstream.text();
  return res.status(upstream.status).send(body);
}

async function proxyMultipart(req, res, endpoint) {
  const formData = new FormData();

  Object.entries(req.body ?? {}).forEach(([key, value]) => {
    formData.append(key, value);
  });

  for (const file of req.files ?? []) {
    formData.append(file.fieldname, new Blob([file.buffer], { type: file.mimetype }), file.originalname);
  }

  const upstream = await fetch(`${WEATHER_AI_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${WEATHER_AI_API_KEY}`,
    },
    body: formData,
  });

  copyWeatherAiHeaders(upstream.headers, res);
  const contentType = upstream.headers.get('content-type');
  if (contentType) res.setHeader('content-type', contentType);

  const body = await upstream.text();
  return res.status(upstream.status).send(body);
}

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/v1/weather', requireApiKey, (req, res, next) => {
  proxyJson(req, res, '/v1/weather').catch(next);
});

app.get('/v1/current', requireApiKey, (req, res, next) => {
  proxyJson(req, res, '/v1/current').catch(next);
});

app.get('/v1/weather-geo', requireApiKey, (req, res, next) => {
  proxyJson(req, res, '/v1/weather-geo').catch(next);
});

app.get('/v1/usage', requireApiKey, (req, res, next) => {
  proxyJson(req, res, '/v1/usage').catch(next);
});

app.get('/v1/trees/quota', requireApiKey, (req, res, next) => {
  proxyJson(req, res, '/v1/trees/quota').catch(next);
});

app.post('/v1/trees/analyze', requireApiKey, upload.any(), (req, res, next) => {
  proxyMultipart(req, res, '/v1/trees/analyze').catch(next);
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Backend proxy error' });
});

app.listen(PORT, () => {
  console.log(`WeatherAI backend listening on port ${PORT}`);
});
