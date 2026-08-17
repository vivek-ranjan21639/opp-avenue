import sanitize from "sanitize-html";

interface SanitizeConfig {
  ALLOWED_TAGS?: string[];
  ALLOWED_ATTR?: string[];
  ALLOW_DATA_ATTR?: boolean;
}

export function sanitizeHtml(dirty: string, config?: SanitizeConfig): string {
  if (!dirty) return "";

  const options: sanitize.IOptions = {
    parser: { lowerCaseAttributeNames: false },
  };

  if (config?.ALLOWED_TAGS) {
    options.allowedTags = config.ALLOWED_TAGS;
  }

  if (config?.ALLOWED_ATTR) {
    options.allowedAttributes = {
      "*": [
        ...config.ALLOWED_ATTR,
        ...(config.ALLOW_DATA_ATTR ? ["data-*"] : []),
      ],
    };
  }

  return sanitize(dirty, options);
}
