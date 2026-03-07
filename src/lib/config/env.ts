const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  auth0Domain: process.env.AUTH0_DOMAIN ?? "",
  auth0ClientId: process.env.AUTH0_CLIENT_ID ?? "",
  auth0ClientSecret: process.env.AUTH0_CLIENT_SECRET ?? "",
  auth0Secret: process.env.AUTH0_SECRET ?? "",
  auth0Audience: process.env.AUTH0_AUDIENCE ?? "",
};

export function getEnv() {
  return env;
}

export function hasSupabaseEnv() {
  return Boolean(env.supabaseUrl && env.supabaseServiceRoleKey);
}

export function hasAuth0Env() {
  return Boolean(
    env.auth0Domain &&
      env.auth0ClientId &&
      env.auth0ClientSecret &&
      env.auth0Secret,
  );
}
