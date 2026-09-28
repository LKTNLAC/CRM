import { api } from "./api";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface MeResponse {
  id: string;
  email: string;
  full_name: string;
  organization_id: string;
  branch_id: string | null;
  roles: string[];
}

export const authService = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>("/auth/login", payload);
    return data;
  },
  async me(): Promise<MeResponse> {
    const { data } = await api.get<MeResponse>("/users/me");
    return data;
  },
  async logout(refreshToken: string) {
    await api.post("/auth/logout", { refresh_token: refreshToken });
  },
};