// In-memory store. Swap with DB easily.
const urls = new Map(); // code -> { url, code, createdAt, expiresAt, totalClicks, clicks[] }

function save(entry) {
  urls.set(entry.code, entry);
}

function find(code) {
  return urls.get(code);
}

function exists(code) {
  return urls.has(code);
}

module.exports = { save, find, exists };
