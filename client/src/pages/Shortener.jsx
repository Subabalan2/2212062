import React, { useState } from "react";
import { createShortUrl } from "../api";

const emptyRow = () => ({
  url: "",
  validity: "",
  shortcode: "",
  result: null,
  error: null,
});

export default function Shortener() {
  const [rows, setRows] = useState([emptyRow()]);
  const [busy, setBusy] = useState(false);

  const addRow = () => {
    if (rows.length >= 5) return;
    setRows((r) => [...r, emptyRow()]);
  };
  const removeRow = (i) => {
    setRows((r) => r.filter((_, idx) => idx !== i));
  };
  const setField = (i, k, v) => {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [k]: v } : row)));
  };

  const validate = (row) => {
    try {
      new URL(row.url);
    } catch {
      return "Invalid URL";
    }
    if (
      row.validity &&
      (!/^\d+$/.test(row.validity) || parseInt(row.validity) <= 0)
    )
      return "Validity must be positive integer";
    if (row.shortcode && !/^[a-zA-Z0-9]{4,20}$/.test(row.shortcode))
      return "Shortcode must be alphanumeric 4–20 chars";
    return null;
  };

  const submit = async () => {
    setBusy(true);
    const results = await Promise.all(
      rows.map(async (row) => {
        const err = validate(row);
        if (err) return { ...row, error: err, result: null };
        try {
          const data = await createShortUrl({
            url: row.url,
            validity: row.validity ? parseInt(row.validity, 10) : undefined,
            shortcode: row.shortcode || undefined,
          });
          return { ...row, error: null, result: data };
        } catch (e) {
          return { ...row, error: e.message || "Failed", result: null };
        }
      })
    );
    setRows(results);
    setBusy(false);
    // store successful codes for Stats page
    const stored = JSON.parse(localStorage.getItem("shorts") || "[]");
    const newOnes = results
      .filter((r) => r.result)
      .map((r) => r.result.shortLink);
    localStorage.setItem("shorts", JSON.stringify([...stored, ...newOnes]));
  };

  return (
    <div className="card grid">
      <h1>URL Shortener</h1>
      <div className="small">
        Add up to 5 URLs. Validity defaults to 30 minutes. Shortcode is
        optional.
      </div>

      {rows.map((row, i) => (
        <div className="row" key={i}>
          <input
            placeholder="https://example.com/very/long/url"
            value={row.url}
            onChange={(e) => setField(i, "url", e.target.value)}
          />
          <input
            placeholder="validity (mins)"
            value={row.validity}
            onChange={(e) => setField(i, "validity", e.target.value)}
          />
          <input
            placeholder="shortcode (optional)"
            value={row.shortcode}
            onChange={(e) => setField(i, "shortcode", e.target.value)}
          />
          <button
            className="btn ghost"
            onClick={() => removeRow(i)}
            title="Remove"
          >
            ✕
          </button>

          {row.error && (
            <div className="small err" style={{ gridColumn: "1 / -1" }}>
              {row.error}
            </div>
          )}
          {row.result && (
            <div className="small" style={{ gridColumn: "1 / -1" }}>
              <span className="badge">Short Link</span>&nbsp;
              <a
                className="link"
                href={row.result.shortLink}
                target="_blank"
                rel="noreferrer"
              >
                {row.result.shortLink}
              </a>
              &nbsp; • Expires:{" "}
              <span className="ok">
                {new Date(row.result.expiry).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      ))}

      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn" onClick={addRow} disabled={rows.length >= 5}>
          + Add Row
        </button>
        <button className="btn primary" onClick={submit} disabled={busy}>
          {busy ? "Working..." : "Shorten"}
        </button>
      </div>
    </div>
  );
}
