'use strict';
/**
 * Config — reads/writes ~/.sendcraft/config.json
 * Priority: SENDCRAFT_API_KEY env > config file > nothing
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_DIR  = path.join(os.homedir(), '.sendcraft');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

function load() {
  try { return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')); }
  catch { return {}; }
}

function save(data) {
  if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2), { encoding: 'utf8', mode: 0o600 });
}

function getApiKey() {
  return process.env.SENDCRAFT_API_KEY || load().api_key || null;
}

function getBaseUrl() {
  return (process.env.SENDCRAFT_BASE_URL || load().base_url || 'https://api.sendcraft.online/api').replace(/\/$/, '');
}

function getWebUrl() {
  const stored = load().web_url;
  if (stored) return stored;
  try {
    const { URL } = require('url');
    const parsed = new URL(getBaseUrl());
    const host = parsed.hostname.replace(/^api\./, '');
    return `${parsed.protocol}//${host}`;
  } catch {
    return 'https://sendcraft.online';
  }
}

module.exports = { load, save, getApiKey, getBaseUrl, getWebUrl, CONFIG_FILE };
