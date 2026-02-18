import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',  // Habilita exportación estática
  images: {
    unoptimized: true, // Necesario para GitHub Pages
  },
  basePath: '/sistema-flota', // Reemplaza con el nombre de tu repo
  assetPrefix: '/sistema-flota/', // Reemplaza con el nombre de tu repo
};

export default nextConfig;
