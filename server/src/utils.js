const { customAlphabet } = require("nanoid");

// base62
const gen = customAlphabet(
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
  6
);

function isValidUrl(u) {
  try {
    const x = new URL(u);
    return ["http:", "https:"].includes(x.protocol);
  } catch {
    return false;
  }
}

function isValidShortcode(code) {
  return typeof code === "string" && /^[a-zA-Z0-9]{4,20}$/.test(code);
}

function minutesFromNow(mins) {
  const d = new Date();
  d.setMinutes(d.getMinutes() + mins);
  return d;
}

function coarseGeoFromIp(ip) {
  // Very coarse: take IPv4 first two octets or 'local'
  const m = (ip || "").match(/(\d+)\.(\d+)\./);
  return m ? `${m[1]}.${m[2]}.x.x` : "local";
}

module.exports = {
  gen,
  isValidUrl,
  isValidShortcode,
  minutesFromNow,
  coarseGeoFromIp,
};
