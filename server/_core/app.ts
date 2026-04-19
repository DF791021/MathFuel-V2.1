import express, { type NextFunction, type Request, type Response } from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { handleStripeWebhook } from "./stripeWebhook";

export function createApp() {
  const app = express();
  app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerOAuthRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  app.use("/api", (_req: Request, res: Response) => {
    res.status(404).json({ error: "Not Found" });
  });

  app.use("/api", (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    console.error("[API] Unhandled error:", err);
    res.status(500).json({ error: message });
  });

  return app;
}
