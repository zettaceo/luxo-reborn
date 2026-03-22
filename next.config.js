/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Ignora erros de TypeScript e ESLint no build (Vercel)
  // Remove estas flags após corrigir todos os warnings
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  async rewrites() {
    return [
      // Descomente para apontar /api/* para uma VPS externa:
      // {
      //   source: '/api/:path*',
      //   destination: 'https://api.seudominio.com.br/:path*',
      // },
    ]
  },
}

module.exports = nextConfig
