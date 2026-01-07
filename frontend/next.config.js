/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloudflare Pages/Workers向けの設定
  images: {
    unoptimized: true, // Cloudflareではnext/imageの最適化が使えない
  },
}

module.exports = nextConfig
