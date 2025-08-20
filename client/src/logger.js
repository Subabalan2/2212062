export async function Log(stack, level, pkg, message) {
  try {
    const url = window.LOG_TEST_SERVER_URL || null;
    if (!url) return;
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stack,
        level,
        package: pkg,
        message,
        ts: new Date().toISOString(),
      }),
    });
  } catch{
    console("error");
  }
}
