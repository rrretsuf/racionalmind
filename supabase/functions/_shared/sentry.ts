import * as Sentry from "https://deno.land/x/sentry/index.mjs";

const environment = Deno.env.get("APP_ENV") || "development";

Sentry.init({
  dsn: Deno.env.get("SENTRY_DSN_SUPABASE"),
  tracesSampleRate: 1.0,
  environment: environment,
  debug: environment === "development" || environment === "debug",
});

export { Sentry }; 