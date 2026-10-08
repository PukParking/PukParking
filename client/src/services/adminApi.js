const API_BASE_URL = "http://localhost:3000/api";
export const ADMIN_TOKEN_KEY = "pukparking-admin-token";

async function request(path, { token, ...options } = {}) {
  const headers = new Headers(options.headers);
  if (options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });
  const result = await response.json();
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
    }
    throw new Error(result.error || `Admin API returned HTTP ${response.status}.`);
  }
  return result;
}

export function loginAdmin(username, password) {
  return request("/admin/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function fetchAdminParkingAreas(token, { signal } = {}) {
  return request("/admin/parking-areas", { token, signal });
}

export function updateAdminParkingArea(id, changes, token) {
  return request(`/admin/parking-areas/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(changes),
    token,
  });
}

export function fetchAdminReports(token, { signal } = {}) {
  return request("/admin/reports", { token, signal });
}
