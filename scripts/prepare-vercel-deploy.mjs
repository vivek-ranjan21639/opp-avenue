import { rm } from "node:fs/promises";
import { resolve } from "node:path";

// These endpoints are generated at request time so newly published content
// appears without waiting for another deployment.
await Promise.all([
  rm(resolve("dist/client/robots.txt"), { force: true }),
  rm(resolve("dist/client/sitemap.xml"), { force: true }),
]);

console.log("Vercel SSR output prepared");
