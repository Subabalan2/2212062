import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

// optional: if you have a log endpoint, expose to logger
window.LOG_TEST_SERVER_URL = ""; // e.g., "https://example-log-endpoint.test/log"

createRoot(document.getElementById("root")).render(<App />);
