// Reusable logger "package". Works in Node and the browser.
async function Log(stack, level, pkg, message) {
  try {
    const payload = {
      stack,
      level,
      package: pkg,
      message,
      ts: new Date().toISOString(),
    };

    // Prefer environment variable (Node) or global (browser)
    const url =
      (typeof process !== "undefined" &&
        process.env &&
        process.env.LOG_TEST_SERVER_URL) ||
      (typeof window !== "undefined" && window.LOG_TEST_SERVER_URL) ||
      null;

    if (!url) return; // no-op if not configured—spec forbids console logging

    // In Node we avoid fetch polyfills; use dynamic import if needed
    if (typeof fetch === "function") {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
  } catch (_) {
    // Intentionally silent (no console). We never throw from logger.
  }
}

module.exports = { Log };
