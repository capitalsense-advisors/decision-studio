import { execFileSync } from "node:child_process";
import { cloudflare } from "@cloudflare/vite-plugin";
import vinext from "vinext";
import { defineConfig } from "vite";

const release = process.env.DEPLOYMENT_VERSION || process.env.WORKERS_CI_COMMIT_SHA || process.env.CF_PAGES_COMMIT_SHA || execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();

export default defineConfig({
  define: { "process.env.DEPLOYMENT_VERSION": JSON.stringify(release) },
  plugins: [
    vinext(),
    cloudflare({
      configPath: "./wrangler.jsonc",
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
  ],
});
