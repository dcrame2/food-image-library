import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow @imgly/background-removal-node to load its ONNX runtime on the server
  serverExternalPackages: ["@imgly/background-removal-node", "onnxruntime-node"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
