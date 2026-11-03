import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3001",
        pathname: "/**",
      },
      {
        protocol: "http", // ou "https" se for produção
        hostname: "localhost", // ou o IP/domínio do seu backend
        port: "3001", // A porta do seu backend
        pathname: "/media/**", // O caminho das suas imagens
      },
    ],
  },
};

export default nextConfig;
