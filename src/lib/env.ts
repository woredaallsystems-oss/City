const ensureEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is required but was not provided.`);
  }
  return value;
};

export const publicEnv = {
  // Default to the woreda ID used in Supabase news records so published news
  // appears on the public homepage even without explicit env configuration.
  NEXT_PUBLIC_WOREDA_ID: process.env.NEXT_PUBLIC_WOREDA_ID ?? "prosperity-party-commission",
  NEXT_PUBLIC_WOREDA_NAME: process.env.NEXT_PUBLIC_WOREDA_NAME ?? "አዲስ አበባ ብልጽግና የኢንስፔክሽንና የስነ ምግባር ኮሚሽን ፅ/ቤት",
  NEXT_PUBLIC_WOREDA_LOGO_PATH:
    process.env.NEXT_PUBLIC_WOREDA_LOGO_PATH ?? "/logo.jpg",
  NEXT_PUBLIC_WOREDA_IMAGES_PREFIX:
    process.env.NEXT_PUBLIC_WOREDA_IMAGES_PREFIX ?? "/assets",
  // Default Supabase URL to the known project so SUPABASE_URL is not required
  // for basic public news fetching. In production, override via env vars.
  NEXT_PUBLIC_SUPABASE_URL:
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://oblhonzlkflvoxqymmys.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
};

export const requiredEnv = {
  // Default to the same URL as NEXT_PUBLIC_SUPABASE_URL for consistency
  SUPABASE_URL: () => process.env.SUPABASE_URL ?? publicEnv.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: () => ensureEnv("SUPABASE_SERVICE_ROLE_KEY"),
  CLOUDFLARE_R2_UPLOAD_URL: () => ensureEnv("CLOUDFLARE_R2_UPLOAD_URL"),
  CLOUDFLARE_R2_PUBLIC_URL: () => ensureEnv("CLOUDFLARE_R2_PUBLIC_URL"),
};


