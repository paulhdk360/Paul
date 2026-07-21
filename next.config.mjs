/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**.supabase.co" }],
  },
  experimental: {
    // Revisiting a tab you were on in the last 30s reuses the client-side
    // Router Cache instead of re-fetching from Supabase — server actions
    // still call revalidatePath() on mutations, which bypasses this cache
    // for the affected route regardless of how fresh it looks.
    staleTimes: {
      dynamic: 30,
    },
  },
};

export default nextConfig;
