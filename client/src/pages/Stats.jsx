import React, { useEffect, useState } from "react";
import { getStats } from "../api";

function codeFromShortLink(shortLink) {
  try {
    const u = new URL(shortLink);
    return u.pathname.replace("/", "");
  } catch {
    return null;
  }
}

export default function Stats() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const links = JSON.parse(localStorage.getItem("shorts") || "[]");
    const unique = Array.from(new Set(links));
    const arr = [];
    for (const link of unique) {
      const code = codeFromShortLink(link);
      if (!code) continue;
      try {
        const s = await getStats(code);
        arr.push({ link, stats: s, error: null });
      } catch (e) {
        arr.push({ link, stats: null, error: e.message });
      }
    }
    setItems(arr);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="card grid">
      <h1>Statistics</h1>
      {loading && <div className="small">Loading…</div>}
      {!loading && items.length === 0 && (
        <div className="small">
          No links yet. Create some on the Shortener page.
        </div>
      )}

      {items.map(({ link, stats, error }, idx) => (
        <div key={idx} className="grid" style={{ gap: 6 }}>
          <div>
            <span className="badge">Short</span>&nbsp;
            <a className="link" href={link} target="_blank" rel="noreferrer">
              {link}
            </a>
          </div>
          {error && <div className="err small">{error}</div>}
          {stats && (
            <>
              <div className="small">Original: {stats.originalUrl}</div>
              <div className="small">
                Created: {new Date(stats.createdAt).toLocaleString()}{" "}
                &nbsp;|&nbsp; Expires: {new Date(stats.expiry).toLocaleString()}
              </div>
              <div>
                Total Clicks: <b>{stats.totalClicks}</b>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Referrer</th>
                    <th>Geo (coarse)</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.clicks.length === 0 && (
                    <tr>
                      <td colSpan="3" className="small">
                        No clicks yet.
                      </td>
                    </tr>
                  )}
                  {stats.clicks.map((c, i) => (
                    <tr key={i}>
                      <td>{new Date(c.timestamp).toLocaleString()}</td>
                      <td>{c.referrer || "—"}</td>
                      <td>{c.geo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
          <hr style={{ borderColor: "var(--border)", width: "100%" }} />
        </div>
      ))}
    </div>
  );
}
