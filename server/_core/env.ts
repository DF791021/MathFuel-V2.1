const isProduction = process.env.NODE_ENV === "production";

function resolveCookieSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.length >= 32) return secret;

  if (isProduction) {
    throw new Error(
      "JWT_SECRET environment variable is required in production and must be at least 32 characters."
    );
  }

  // Development-only fallback. Never used in production because of the guard above.
  return "mathfuel-dev-secret-key-change-in-production";
}

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: resolveCookieSecret(),
  databaseUrl: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction,
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  supabaseUrl: process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
};
