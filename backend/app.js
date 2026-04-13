const cors = require("cors");
const express = require("express");

const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const app = express();
let authRoutesLoaded = false;
let authRoutesError = null;

const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(",").map((origin) => origin.trim())
  : ["*"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));

app.use((req, res, next) => {
  const header = String(req.headers.cookie || "");
  const cookies = {};
  for (const chunk of header.split(";")) {
    const [rawKey, ...rest] = chunk.split("=");
    const key = String(rawKey || "").trim();
    if (!key) continue;
    cookies[key] = decodeURIComponent(rest.join("=") || "");
  }
  req.cookies = cookies;
  next();
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    authRoutesLoaded,
    authRoutesError,
  });
});

// Load auth routes from the newer backend modules.
import("./src/routes/authRoutes.js")
  .then(({ default: authRoutes }) => {
    app.use("/api/auth", authRoutes);
    authRoutesLoaded = true;
    authRoutesError = null;
  })
  .catch((error) => {
    authRoutesLoaded = false;
    authRoutesError = error?.message || String(error);
    console.error("Failed to load auth routes:", error);
  });

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
