import { Log } from "./logger";

const BASE = ""; // proxied by Vite to http://localhost:4000

export async function createShortUrl({ url, validity, shortcode }) {
  const body = { url };
  if (validity) body.validity = validity;
  if (shortcode) body.shortcode = shortcode;

  const r = await fetch(`${BASE}/shorturls`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await r.json();
  if (!r.ok) {
    await Log("frontend", "error", "create", JSON.stringify(data));
    throw Object.assign(new Error(data.error || "Create failed"), {
      status: r.status,
    });
  }
  await Log("frontend", "info", "create", "Created short URL");
  return data; // { shortLink, expiry }
}

export async function getStats(code) {
  const r = await fetch(`${BASE}/shorturls/${code}`);
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || "Stats failed");
  return data;
}
