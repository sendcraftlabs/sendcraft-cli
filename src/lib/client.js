'use strict';
/**
 * HTTP client — zero external dependencies, uses Node built-ins.
 */
const https = require('https');
const http  = require('http');
const { URL } = require('url');
const { getApiKey, getBaseUrl } = require('./config');

function makeRequest(method, path, body, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const apiKey = getApiKey();
    if (!apiKey) return reject(new Error('No API key. Run: sendcraft login'));

    const fullUrl = new URL(getBaseUrl() + path);
    const isHttps = fullUrl.protocol === 'https:';
    if (!isHttps) process.stderr.write('Warning: sending credentials over unencrypted HTTP. Use HTTPS for production.\n');
    const mod     = isHttps ? https : http;
    const payload = body ? JSON.stringify(body) : null;

    const req = mod.request({
      hostname: fullUrl.hostname,
      port: fullUrl.port || (isHttps ? 443 : 80),
      path: fullUrl.pathname + fullUrl.search,
      method,
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'User-Agent': `sendcraft-cli/${require('../../package.json').version}`,
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        ...extraHeaders,
      },
    }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 400) {
            const err = new Error(json.error || json.message || `HTTP ${res.statusCode}`);
            err.status = res.statusCode;
            return reject(err);
          }
          resolve(json);
        } catch {
          reject(new Error(`Invalid response (HTTP ${res.statusCode})`));
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function makeRequestWithToken(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const fullUrl = new URL(getBaseUrl() + path);
    const isHttps = fullUrl.protocol === 'https:';
    const payload = body ? JSON.stringify(body) : null;
    const req = (isHttps ? https : http).request({
      hostname: fullUrl.hostname,
      port: fullUrl.port || (isHttps ? 443 : 80),
      path: fullUrl.pathname + fullUrl.search,
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 400) {
            const err = new Error(json.error || json.message || `HTTP ${res.statusCode}`);
            err.status = res.statusCode; return reject(err);
          }
          resolve(json);
        } catch { reject(new Error(`Invalid response (HTTP ${res.statusCode})`)); }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function makeRequestNoAuth(method, path, body) {
  return new Promise((resolve, reject) => {
    const fullUrl = new URL(getBaseUrl() + path);
    const isHttps = fullUrl.protocol === 'https:';
    const payload = body ? JSON.stringify(body) : null;
    const req = (isHttps ? https : http).request({
      hostname: fullUrl.hostname,
      port: fullUrl.port || (isHttps ? 443 : 80),
      path: fullUrl.pathname + fullUrl.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 400) {
            const err = new Error(json.error || json.message || `HTTP ${res.statusCode}`);
            err.status = res.statusCode; return reject(err);
          }
          resolve(json);
        } catch { reject(new Error(`Invalid response (HTTP ${res.statusCode})`)); }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

module.exports = {
  get:           (path, headers)        => makeRequest('GET',    path, null, headers),
  post:          (path, body, headers)  => makeRequest('POST',   path, body, headers),
  put:           (path, body, headers)  => makeRequest('PUT',    path, body, headers),
  patch:         (path, body, headers)  => makeRequest('PATCH',  path, body, headers),
  delete:        (path)                 => makeRequest('DELETE', path),
  postNoAuth:    (path, body)           => makeRequestNoAuth('POST', path, body),
  postWithToken: (path, body, token)    => makeRequestWithToken('POST', path, body, token),
  getWithToken:  (path, token)          => makeRequestWithToken('GET',  path, null, token),
};
