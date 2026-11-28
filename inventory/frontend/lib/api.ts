
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://computer-erp-inventory-backend.vercel.app";

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  let token =
    typeof window !== "undefined"
      ? sessionStorage.getItem("erp_token")
      : null;

  // Recover the token from the URL fragment if it
  // has not yet been saved in sessionStorage.
  if (!token && typeof window !== "undefined") {
    const params = new URLSearchParams(
      window.location.hash.slice(1)
    );

    token = params.get("token");

    if (token) {
      sessionStorage.setItem("erp_token", token);

      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search
      );
    }
  }

  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  return fetch(url, {
    ...options,
    headers,
  });
}
