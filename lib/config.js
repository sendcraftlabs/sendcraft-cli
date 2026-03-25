/**
 * Reads/writes ~/.sendcraft/config.json
 * Stores: api_key, base_url
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_DIR = path.join(os.homedir(), '.sendcraft');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

function load() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function save(data) {
  if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function getApiKey() {
  return process.env.SENDCRAFT_API_KEY || load().api_key || null;
}

function getBaseUrl() {
  return process.env.SENDCRAFT_BASE_URL || load().base_url || 'https://api.sendcraft.online/api';
}

/**
 * Derives the web dashboard URL from the API base URL.
 * e.g. "https://api.sendcraft.online/api" → "https://sendcraft.online"
 *      "http://localhost:3000/api"         → "http://localhost:3000"
 *      "https://myinstance.com/api"        → "https://myinstance.com"
 */
function getWebUrl() {
  const stored = load().web_url;
  if (stored) return stored;
  try {
    const { URL } = require('url');
    const parsed = new URL(getBaseUrl());
    // Strip leading "api." subdomain if present
    const host = parsed.hostname.replace(/^api\./, '');
    return `${parsed.protocol}//${host}`;
  } catch {
    return 'https://sendcraft.online';
  }
}

module.exports = { load, save, getApiKey, getBaseUrl, getWebUrl, CONFIG_FILE };
