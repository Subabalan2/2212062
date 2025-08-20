const express = require("express");
const router = express.Router();
const { Log } = require("./logger");
const { save, find, exists } = require("./store");
const {
  gen,
  isValidUrl,
  isValidShortcode,
  minutesFromNow,
  coarseGeoFromIp,
} = require("./utils");

const BASE_URL = process.env.BASE_URL || "http://localhost:4000";

/**
 * Create Short URL
 * POST /shorturls
 * body: { url: string, validity?: number (mins), shortcode?: string }
 */
router.post("/shorturls", async (req, res) => {
  try {
    const { url, validity, shortcode } = req.body || {};
    await Log("backend", "info", "create", "Incoming create request");

    if (!isValidUrl(url)) {
      await Log("backend", "error", "validation", "Invalid URL format");
      return res.status(400).json({ error: "Invalid URL" });
    }

    let minutes = 30;
    if (validity !== undefined) {
      if (!Number.isInteger(validity) || validity <= 0) {
        await Log(
          "backend",
          "error",
          "validation",
          "Validity must be a positive integer (minutes)"
        );
        return res
          .status(400)
          .json({ error: "Validity must be a positive integer (minutes)" });
      }
      minutes = validity;
    }

    let code = shortcode;
    if (code !== undefined) {
      if (!isValidShortcode(code)) {
        await Log(
          "backend",
          "error",
          "validation",
          "Invalid shortcode (alphanumeric, 4-20)"
        );
        return res
          .status(400)
          .json({ error: "Invalid shortcode (alphanumeric, 4-20)" });
      }
      if (exists(code)) {
        await Log("backend", "error", "collision", "Shortcode already exists");
        return res.status(409).json({ error: "Shortcode already in use" });
      }
    } else {
      // auto-generate unique
      do {
        code = gen();
      } while (exists(code));
    }

    const now = new Date();
    const expiresAt = minutesFromNow(minutes);

    const entry = {
      url,
      code,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      totalClicks: 0,
      clicks: [],
    };
    save(entry);

    await Log("backend", "info", "create", `Short URL created: ${code}`);

    return res.status(201).json({
      shortLink: `${BASE_URL}/${code}`,
      expiry: entry.expiresAt,
    });
  } catch (err) {
    await Log("backend", "fatal", "create", `Unhandled: ${err.message}`);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * Retrieve stats
 * GET /shorturls/:code
 */
router.get("/shorturls/:code", async (req, res) => {
  try {
    const code = req.params.code;
    const entry = find(code);
    if (!entry) {
      await Log("backend", "error", "stats", "Shortcode not found");
      return res.status(404).json({ error: "Shortcode not found" });
    }
    return res.json({
      code,
      originalUrl: entry.url,
      createdAt: entry.createdAt,
      expiry: entry.expiresAt,
      totalClicks: entry.totalClicks,
      clicks: entry.clicks.map((c) => ({
        timestamp: c.timestamp,
        referrer: c.referrer,
        geo: c.geo,
      })),
    });
  } catch (err) {
    await Log("backend", "fatal", "stats", `Unhandled: ${err.message}`);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * Redirection
 * GET /:code
 */
router.get("/:code", async (req, res) => {
  try {
    const code = req.params.code;
    const entry = find(code);
    if (!entry) {
      await Log("backend", "error", "redirect", "Shortcode not found");
      return res.status(404).json({ error: "Shortcode not found" });
    }
    if (new Date(entry.expiresAt) <= new Date()) {
      await Log("backend", "warn", "redirect", "Link expired");
      return res.status(410).json({ error: "Link expired" }); // 410 Gone
    }

    // Record click
    entry.totalClicks += 1;
    entry.clicks.push({
      timestamp: new Date().toISOString(),
      referrer: req.get("referer") || null,
      geo: coarseGeoFromIp(req.ip),
    });

    await Log("backend", "info", "redirect", `Redirecting ${code}`);

    return res.redirect(302, entry.url);
  } catch (err) {
    await Log("backend", "fatal", "redirect", `Unhandled: ${err.message}`);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
