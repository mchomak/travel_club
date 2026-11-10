import type { ApiErrorBody, UserInfo } from "./contracts";

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      ...options, credentials: "same-origin", cache: "no-store",
      headers: { "Content-Type": "application/json", "X-Requested-With": "TravelClub", ...options.headers },
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "Нет связи с сервером. Проверьте подключение и повторите.");
  }
  if (!response.ok) {
    const body: Partial<ApiErrorBody> = await response.json().catch(() => ({}));
    throw new ApiError(response.status, body.code ?? "REQUEST_FAILED",
      body.message ?? "Не удалось выполнить действие. Попробуйте ещё раз.", body.details);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const authApi = {
  login: (login: string, password: string) => apiRequest<UserInfo>("/auth/login", { method: "POST", body: JSON.stringify({ login, password }) }),
  logout: () => apiRequest<void>("/auth/logout", { method: "POST" }),
  changePassword: (currentPassword: string, newPassword: string) => apiRequest<void>("/auth/password", {
    method: "POST",
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  }),
  me: () => apiRequest<UserInfo>("/auth/me"),
};
