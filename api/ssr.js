import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import { fileURLToPath } from "node:url";
import { composeSsrHtml } from "../ssr-template.js";

const templatePath = fileURLToPath(
  new URL("../dist/server/ssr-template.html", import.meta.url)
);
const serverEntryUrl = new URL("../dist/server/entry-server.js", import.meta.url);

let templatePromise;
let rendererPromise;

function getTemplate() {
  templatePromise ||= readFile(templatePath, "utf8");
  return templatePromise;
}

function getRenderer() {
  rendererPromise ||= import(serverEntryUrl.href);
  return rendererPromise;
}

function getRequestUrl(request) {
  const incomingUrl = new URL(request.url);
  const rewrittenPath = incomingUrl.searchParams.get("__ssr_path");

  incomingUrl.searchParams.delete("__ssr_path");

  if (rewrittenPath !== null) {
    incomingUrl.pathname = `/${rewrittenPath.replace(/^\/+/, "")}`;
  }

  return incomingUrl;
}

function getOrigin(request, url) {
  const proto = request.headers.get("x-forwarded-proto") || url.protocol.slice(0, -1);
  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    url.host;

  return `${proto}://${host}`;
}

function respond(request, body, init) {
  return new Response(request.method === "HEAD" ? null : body, init);
}

async function handleRequest(request) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { Allow: "GET, HEAD" },
    });
  }

  const url = getRequestUrl(request);
  const pathname = url.pathname;
  const origin = getOrigin(request, url);
  const renderer = await getRenderer();

  if (pathname === "/sitemap.xml") {
    const xml = await renderer.buildSitemapXml(origin);
    return respond(request, xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=0, s-maxage=900, stale-while-revalidate=3600",
      },
    });
  }

  if (pathname === "/robots.txt") {
    return respond(request, renderer.buildRobotsTxt(origin), {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=0, s-maxage=900, stale-while-revalidate=3600",
      },
    });
  }

  if (extname(pathname)) {
    return respond(request, "Not found", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const template = await getTemplate();
  const rendered = await renderer.render(`${pathname}${url.search}`);
  const html = composeSsrHtml(template, rendered);

  return respond(request, html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": pathname.startsWith("/admin")
        ? "no-store"
        : "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
    },
  });
}

export default {
  async fetch(request) {
    try {
      return await handleRequest(request);
    } catch (error) {
      console.error("SSR request failed", error);
      const debug = new URL(request.url).searchParams.get("__ssr_debug") === "1";
      const message = error instanceof Error ? error.message : String(error);
      return new Response(debug ? `SSR Internal Server Error\n${message}` : "Internal Server Error", {
        status: 500,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }
  },
};
