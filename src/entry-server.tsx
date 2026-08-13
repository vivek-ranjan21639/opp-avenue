import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { dehydrate } from "@tanstack/react-query";
import {
  AppProviders,
  AppRoutes,
  createAppQueryClient,
} from "./App";
import { preloadSsrData } from "./ssr/preload";
import { buildRobotsTxt, buildSitemapXml } from "./ssr/sitemap";

type HelmetTagGroup = {
  toString: () => string;
};

type HelmetContext = {
  helmet?: Partial<Record<"title" | "priority" | "meta" | "link" | "script" | "style" | "noscript", HelmetTagGroup>>;
};

function serializeForHtml(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function helmetToHead(helmetContext: HelmetContext): string {
  const helmet = helmetContext.helmet;
  if (!helmet) return "";

  return [
    helmet.title?.toString(),
    helmet.priority?.toString(),
    helmet.meta?.toString(),
    helmet.link?.toString(),
    helmet.script?.toString(),
    helmet.style?.toString(),
    helmet.noscript?.toString(),
  ]
    .filter(Boolean)
    .join("\n");
}

export async function render(url: string) {
  const queryClient = createAppQueryClient();
  await preloadSsrData(queryClient, url);

  const helmetContext: HelmetContext = {};
  const html = renderToString(
    <AppProviders queryClient={queryClient} helmetContext={helmetContext}>
      <StaticRouter location={url}>
        <AppRoutes />
      </StaticRouter>
    </AppProviders>
  );

  const dehydratedState = dehydrate(queryClient);
  const stateScript = `<script>window.__REACT_QUERY_STATE__=${serializeForHtml(dehydratedState)}</script>`;

  return {
    html,
    head: helmetToHead(helmetContext),
    stateScript,
  };
}

export { buildRobotsTxt, buildSitemapXml };
