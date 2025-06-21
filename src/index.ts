// src/index.js
import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
// import bodyParser from "body-parser";
import mongoose from "mongoose";
import morgan from "morgan";
// @ts-ignore
import UserAgent from "user-agents";

import logger from "./config/logger";
// use v1/ routes
import v1Routes from "./v1/routes/index.route";
import { ExtendedRequest } from "./v1/middlewares/token";
import { dynamicImport } from "./v1/utils/dynamicImport";
import { User } from "./v1/models/user.model";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

// Explicit CORS headers middleware - must be first
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  res.header("Access-Control-Allow-Headers", "*");
  res.header("Access-Control-Allow-Credentials", "true");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

// Then apply other middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug middleware
app.use((req, res, next) => {
  console.log("Request received:");
  console.log("Origin:", req.headers.origin);
  console.log("Method:", req.method);
  console.log("Path:", req.path);
  console.log("Headers:", JSON.stringify(req.headers, null, 2));
  next();
});

// Use logger
morgan.token("device", (req: Request) => {
  return req.headers["user-agent"];
});

morgan.token("req-body", (req: ExtendedRequest) => {
  const sanitizedBody = { ...req.body };
  // Exclude 'password' field from logging
  if (sanitizedBody.oldPassword) {
    delete sanitizedBody.oldPassword;
  }
  if (sanitizedBody.newPassword) {
    delete sanitizedBody.newPassword;
  }
  if (sanitizedBody.password) {
    delete sanitizedBody.password;
  }
  return JSON.stringify(sanitizedBody);
});

// add headers to morgan
morgan.token("headers", (req: ExtendedRequest) => {
  const sanitizedHeaders = { ...req.headers };
  // Exclude 'token' header from logging
  if (sanitizedHeaders.token) {
    delete sanitizedHeaders.token;
  }
  return JSON.stringify(sanitizedHeaders);
});

app.use(
  morgan(
    ":method :url :status :response-time ms - :res[content-length] - Device: :device - Request Headers :headers - Request Data: :req-body",
    {
      stream: {
        write: (message) => logger.info(message.trim()),
      },
    }
  )
);

// app.use((req, res, next) => {
//   console.log('Request Headers:', req.headers);
//   console.log('Request Body:', req.body);
//   next();
// });

// Set timezone to UTC+1
process.env.TZ = "Europe/Paris";
// Set default language to English
process.env.LANG = "en";

// MongoDB connection
let mongoDb: string;
if (process.env.ENV === "dev") {
  mongoDb = process.env.MONGODB_DEV_URL as string;
} else if (process.env.ENV === "test") {
  mongoDb = process.env.MONGODB_TEST_URL as string;
} else {
  mongoDb = process.env.MONGODB_PROD_URL as string;
}

let mongodbConn = mongoose
  .connect(mongoDb, {})
  .then(() => {
    console.log("[mongodb]: Connected to MongoDB");
  })
  .catch((error) => {
    console.log(`[mongodb]: ${error}`);
  });

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});

app.use("/v1", v1Routes);

// import all models from v1

async function initializeAdminJS() {
  try {
    const AdminJS = (await dynamicImport("adminjs")).default;
    const AdminJSExpress = await dynamicImport("@adminjs/express");
    const AdminJSMongoose = await dynamicImport("@adminjs/mongoose");

    // Register the Mongoose adapter
    AdminJS.registerAdapter(AdminJSMongoose);

    const admin = new AdminJS({
      resources: [User],
      rootPath: "/admin",
    });

    const adminRouter = AdminJSExpress.default.buildRouter(admin);
    return { admin, adminRouter, rootPath: admin.options.rootPath };
  } catch (error) {
    console.error("AdminJS initialization failed:", error);
    return null;
  }
}

// Make AdminJS optional
initializeAdminJS()
  .then((result) => {
    if (result) {
      app.use(result.rootPath, result.adminRouter);
      console.log(
        `[admin]: AdminJS is running at http://localhost:${port}${result.rootPath}`
      );
    } else {
      console.log("[admin]: AdminJS initialization skipped due to errors");
    }
  })
  .catch((err) => {
    console.error("Failed to initialize AdminJS:", err);
  });

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
