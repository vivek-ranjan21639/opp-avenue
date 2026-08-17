const defaultHeadPattern =
  /<!--app-default-head-start-->[\s\S]*?<!--app-default-head-end-->/g;

export function composeSsrHtml(template, rendered) {
  return template
    .replace(defaultHeadPattern, "")
    .replace("<!--app-head-->", rendered.head)
    .replace("<!--app-html-->", rendered.html)
    .replace("<!--app-state-->", rendered.stateScript);
}
