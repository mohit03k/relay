const apiOrigin = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

export function apiUrl(path: string) {
  return `${apiOrigin}/api${path.startsWith("/") ? path : `/${path}`}`;
}
