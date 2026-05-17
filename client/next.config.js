/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true, 
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://fugdhjpmseklwchecdkh.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'sb_publishable_xE7Sju-nsPMx0kdEnA7EfA_xbsF44Y7',
    NEXT_PUBLIC_SERVER_URL: 'https://checkers-great.onrender.com',
  },
};

module.exports = nextConfig;