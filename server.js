import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { composeSsrHtml } from "./ssr-template.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const clientRoot = resolve(__dirname, "dist/client");
const serverEntry = pathToFileURL(resolve(__dirname, "dist/server/entry-server.js")).href;
const port = Number(process.env.PORT || 3000);

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

let templatePromise;
let rendererPromise;

function getTemplate() {
  templatePromise ||= readFile(join(clientRoot, "index.html"), "utf8");
  return templatePromise;
}

function getRenderer() {
  rendererPromise ||= import(serverEntry);
  return rendererPromise;
}

function getOrigin(req) {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return host ? `${proto}://${host}` : undefined;
}

function safeStaticPath(pathname) {
  let decoded = pathname;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  const candidate = normalize(join(clientRoot, decoded));
  if (!candidate.startsWith(clientRoot)) return null;
  return candidate;
}

function serveStatic(req, res, pathname) {
  const filePath = safeStaticPath(pathname);
  if (!filePath || !existsSync(filePath) || !statSync(filePath).isFile()) {
    return false;
  }

  const ext = extname(filePath).toLowerCase();
  res.writeHead(200, {
    "Content-Type": contentTypes[ext] || "application/octet-stream",
    "Cache-Control": pathname.startsWith("/assets/")
      ? "public, max-age=31536000, immutable"
      : "public, max-age=300",
  });
  createReadStream(filePath).pipe(res);
  return true;
}

async function handleRequest(req, res) {
  const url = new URL(req.url || "/", "http://localhost");
  const pathname = url.pathname;

  try {
    const renderer = await getRenderer();
    const origin = getOrigin(req);

    if (pathname === "/sitemap.xml") {
      const xml = await renderer.buildSitemapXml(origin);
      res.writeHead(200, {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=900",
      });
      res.end(xml);
      return;
    }

    if (pathname === "/robots.txt") {
      res.writeHead(200, {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=900",
      });
      res.end(renderer.buildRobotsTxt(origin));
      return;
    }

    if (extname(pathname) && serveStatic(req, res, pathname)) return;
    if (extname(pathname)) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    const template = await getTemplate();
    const rendered = await renderer.render(`${pathname}${url.search}`);
    const html = composeSsrHtml(template, rendered);

    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": pathname.startsWith("/admin")
        ? "no-store"
        : "public, max-age=60, stale-while-revalidate=300",
    });
    res.end(html);
  } catch (error) {
    console.error(error);
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Internal Server Error");
  }
}

createServer(handleRequest).listen(port, () => {
  console.log(`Opp Avenue SSR server listening on http://localhost:${port}`);
});
