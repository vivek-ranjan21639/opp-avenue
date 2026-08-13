// Generates public/sitemap.xml and public/robots.txt for static hosts.
// The SSR server also renders /sitemap.xml dynamically so newly published
// Supabase content is discoverable without changing code.
import { writeFileSync } from "fs";
import { resolve } from "path";
import { buildRobotsTxt, buildSitemapXml } from "../src/ssr/sitemap";

(async () => {
  const sitemap = await buildSitemapXml();
  writeFileSync(resolve("public/sitemap.xml"), sitemap);
  writeFileSync(resolve("public/robots.txt"), buildRobotsTxt());
  const count = (sitemap.match(/<url>/g) || []).length;
  console.log(`sitemap.xml written (${count} entries)`);
})();
