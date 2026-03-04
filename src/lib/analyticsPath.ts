export function normalizeAnalyticsPath(rawPath?: string | null): string {
  const input = (rawPath || "/").trim();
  if (!input) return "/";

  if (input.startsWith("http://") || input.startsWith("https://")) {
    try {
      const parsed = new URL(input);
      return parsed.pathname || "/";
    } catch {
      return input;
    }
  }

  return input;
}

export function isAdminPath(rawPath?: string | null): boolean {
  const path = normalizeAnalyticsPath(rawPath).toLowerCase();
  return path === "/admin" || path.startsWith("/admin/");
}

export function isPublicPagePath(rawPath?: string | null): boolean {
  return !isAdminPath(rawPath);
}
