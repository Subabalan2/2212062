require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const routes = require("./routes");
const { Log } = require("./logger");

const app = express();

app.use(helmet());
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json({ limit: "64kb" }));

// Attach routes under root:
app.use("/", routes);

// Centralized error handler (JSON only)
app.use(async (err, _req, res, _next) => {
  await Log(
    "backend",
    "fatal",
    "middleware",
    `Unhandled middleware error: ${err.message}`
  );
  res.status(500).json({ error: "Internal Server Error" });
});

const port = process.env.PORT || 4000;
app.listen(port, async () => {
  await Log("backend", "info", "boot", `Service started on ${port}`);
});
 