/** @type {import('next').NextConfig} */

// GitHub Pages serves under /<repo-name>/. The deploy workflow sets
// NEXT_PUBLIC_BASE_PATH=/atlas-sprint; local dev leaves it empty (served at root).
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig = {
  reactStrictMode: true,
  output: "export", // static HTML export for GitHub Pages
  trailingSlash: true, // each route → folder/index.html so Pages resolves deep links
  basePath: basePath || undefined,
  images: { unoptimized: true }, // no image optimization server on Pages
};

export default nextConfig;
