import { copyFile, rm } from "node:fs/promises";
import { resolve } from "node:path";

const clientTemplate = resolve("dist/client/index.html");
const serverTemplate = resolve("dist/server/ssr-template.html");

// Keep the Vite template inside the function bundle. Removing the public copy
// prevents Vercel's filesystem routing from serving an unrendered app shell.
await copyFile(clientTemplate, serverTemplate);

// These endpoints are generated at request time so newly published content
// appears without waiting for another deployment.
await Promise.all([
  rm(clientTemplate, { force: true }),
  rm(resolve("dist/client/robots.txt"), { force: true }),
  rm(resolve("dist/client/sitemap.xml"), { force: true }),
]);

console.log("Vercel SSR output prepared");
