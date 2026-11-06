
import type {
  Customer,
  CustomerCreate,
  CustomerUpdate,
} from "../types/customer";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not configured.");
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(
      error?.detail || `Request failed: ${response.status}`
    );
  }

  return response.json() as Promise<T>;
}

export const customerAPI = {
  getAll: (search = "") => {
    const params = new URLSearchParams({
      active_only: "false",
      page: "1",
      page_size: "100",
    });

    if (search.trim()) {
      params.set("search", search.trim());
    }

    return request<Customer[]>(`/api/customers?${params}`);
  },

  create: (data: CustomerCreate) =>
    request<Customer>("/api/customers", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: number, data: CustomerUpdate) =>
    request<Customer>(`/api/customers/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  updateStatus: (id: number, status: boolean) =>
    request<Customer>(`/api/customers/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  deactivate: (id: number) =>
    request<Customer>(`/api/customers/${id}`, {
      method: "DELETE",
    }),
};
