/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // react-konva pulls in `canvas` for node-side rendering; we only ever render
  // the planner in the browser, so stub it out of the server bundle.
  webpack: (config) => {
    config.externals = [...(config.externals ?? []), { canvas: "canvas" }];
    return config;
  },
};

export default nextConfig;
