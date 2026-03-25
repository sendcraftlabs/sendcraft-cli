/**
 * Thin HTTP client wrapping Node's built-in https/http.
 * No extra dependencies needed.
 */
const https = require('https');
const http = require('http');
const { URL } = require('url');
const { getApiKey, getBaseUrl } = require('./config');

/** Make a request with an explicit bearer token instead of stored API key */
function requestWithToken(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const fullUrl = new URL(getBaseUrl() + path);
    const isHttps = fullUrl.protocol === 'https:';
    const mod = isHttps ? require('https') : require('http');
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: fullUrl.hostname,
      port: fullUrl.port || (isHttps ? 443 : 80),
      path: fullUrl.pathname + fullUrl.search,
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    };
    const req = mod.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 400) {
            const err = new Error(json.error || json.message || `HTTP ${res.statusCode}`);
            err.status = res.statusCode;
            err.body = json;
            return reject(err);
          }
          resolve(json);
        } catch {
          reject(new Error(`Invalid JSON response (status ${res.statusCode})`));
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

/** Make a request with no auth header (for public endpoints like /auth/login) */
function requestNoAuth(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const fullUrl = new URL(getBaseUrl() + path);
    const isHttps = fullUrl.protocol === 'https:';
    const mod = isHttps ? require('https') : require('http');
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: fullUrl.hostname,
      port: fullUrl.port || (isHttps ? 443 : 80),
      path: fullUrl.pathname + fullUrl.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    };
    const req = mod.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 400) {
            const err = new Error(json.error || json.message || `HTTP ${res.statusCode}`);
            err.status = res.statusCode;
            err.body = json;
            return reject(err);
          }
          resolve(json);
        } catch {
          reject(new Error(`Invalid JSON response (status ${res.statusCode})`));
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const apiKey = getApiKey();
    if (!apiKey) {
      return reject(new Error('No API key configured. Run: sendcraft login'));
    }

    const fullUrl = new URL(getBaseUrl() + path);
    const isHttps = fullUrl.protocol === 'https:';
    const mod = isHttps ? https : http;

    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: fullUrl.hostname,
      port: fullUrl.port || (isHttps ? 443 : 80),
      path: fullUrl.pathname + fullUrl.search,
      method,
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    };

    const req = mod.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 400) {
            const err = new Error(json.error || json.message || `HTTP ${res.statusCode}`);
            err.status = res.statusCode;
            err.body = json;
            return reject(err);
          }
          resolve(json);
        } catch {
          reject(new Error(`Invalid JSON response (status ${res.statusCode})`));
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

module.exports = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  delete: (path) => request('DELETE', path),
  postNoAuth: (path, body) => requestNoAuth('POST', path, body),
  postWithToken: (path, body, token) => requestWithToken('POST', path, body, token),
  getWithToken: (path, token) => requestWithToken('GET', path, null, token),
};
