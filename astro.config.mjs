import { defineConfig } from "astro/config";
import react from "@astrojs/react";

export default defineConfig({
  site: "https://i11umination.github.io",
  output: "static",
  integrations: [react()],
});
