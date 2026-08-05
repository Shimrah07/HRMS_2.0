const fs = require('fs');
const path = require('path');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5110/api/v1';

const tokenCache = {};

async function getAuthToken(request, username = 'superadmin@company.com', password = 'Password123!') {
  const cacheKey = `${username}:${password}`;
  if (tokenCache[cacheKey]) {
    return tokenCache[cacheKey];
  }

  const res = await request.post(`${API_BASE_URL}/auth/login`, {
    data: { username, password },
  });

  if (!res.ok()) {
    const text = await res.text();
    console.error(`Auth failed for ${username}: ${res.status()} ${text}`);
    throw new Error(`Auth failed for ${username}: ${res.status()} ${text}`);
  }

  const json = await res.json();
  if (json.success === false) {
    console.error(`Auth failed for ${username}:`, JSON.stringify(json));
    throw new Error(`Auth failed for ${username}: ${JSON.stringify(json.errors || json.message)}`);
  }
  const token = json.data?.token || json.data?.accessToken || json.token || json.accessToken;
  if (!token) {
    throw new Error(`No token returned in auth login response for ${username}`);
  }
  tokenCache[cacheKey] = token;
  return token;
}

function getSeedIds() {
  const seedPath = path.join(__dirname, 'seedIds.json');
  if (!fs.existsSync(seedPath)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(seedPath, 'utf8'));
}

module.exports = {
  API_BASE_URL,
  getAuthToken,
  getSeedIds,
};
