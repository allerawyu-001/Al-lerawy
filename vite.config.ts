import { defineConfig } from "vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    TanStackRouterVite(),
    tanstackStart({
      server: {
        preset: "vercel"
      }
    }),
    react(),
    tailwindcss(),
    tsconfigPaths()
  ],
  server: {
    historyApiFallback: true,
  },
});
