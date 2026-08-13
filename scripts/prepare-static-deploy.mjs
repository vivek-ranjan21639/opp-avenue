import { copyFile, stat } from "node:fs/promises";
import { join, resolve } from "node:path";

const outputDir = resolve("dist");
const indexPath = join(outputDir, "index.html");
const notFoundPath = join(outputDir, "404.html");

await stat(indexPath);
await copyFile(indexPath, notFoundPath);
