/// <reference types="vite/client" />
export const API_URL = import.meta.env.VITE_API_URL || "/api";

export const getAuthToken = () => localStorage.getItem("token");

export const setAuthToken = (token: string) => localStorage.setItem("token", token);

export const clearAuthToken = () => localStorage.removeItem("token");

export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
    credentials: "include",
  });

  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    const text = await response.text();
    console.error("Non-JSON response:", text);
    throw new Error(`Server error: ${response.status} ${response.statusText}`);
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "An error occurred");
  }

  return response.json();
};
