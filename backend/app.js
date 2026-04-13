const cors = require("cors");
const express = require("express");

const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const app = express();
const authRouter = express.Router();
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

// TEMPORARY: Bootstrap admin endpoint - DELETE after deployment
app.post("/api/bootstrap-admin", async (req, res) => {
  try {
    const { Employee } = await import("./src/models/index.js");
    const bcryptjs = (await import("bcryptjs")).default;
    
    const email = 'admin@dermas.local';
    const password = 'Admin@2026';
    const pwd = await bcryptjs.hash(password, 10);
    
    const user = await Employee.findOneAndUpdate(
      { email },
      { 
        email,
        firstName: 'Admin',
        lastName: 'User',
        password: pwd,
        isActive: true,
        employeeId: 'ADM-' + Date.now(),
        department: 'Administration',
        role: 'admin'
      },
      { upsert: true, new: true }
    );
    
    return res.json({ 
      success: true,
      email: 'admin@dermas.local',
      password: 'Admin@2026'
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Pre-mount auth router so late-loaded routes are still matched before 404 handling.
app.use("/api/auth", authRouter);

// Load auth routes from the newer backend modules.
import("./src/routes/authRoutes.js")
  .then(({ default: authRoutes }) => {
    authRouter.use(authRoutes);
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
