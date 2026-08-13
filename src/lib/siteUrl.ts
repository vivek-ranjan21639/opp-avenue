const DEFAULT_SITE_URL = "https://oppavenue.com";

export const SITE_URL = (import.meta.env.VITE_SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, "");
