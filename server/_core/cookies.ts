import type { CookieOptions, Request } from "express";
import { ENV } from "./env";

function isSecureRequest(req: Request) {
  if (req.protocol === "https") return true;

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");

  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  // In production we require HTTPS and use SameSite=Lax, which defends against
  // CSRF while still allowing top-level navigations. Cross-site embedding is
  // not a current requirement; if it ever becomes one, switch to "none" only
  // for those specific routes and keep secure: true.
  if (ENV.isProduction) {
    return {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: true,
    };
  }

  return {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: isSecureRequest(req),
  };
}
