export type UserRole = "admin" | "designer" | "viewer";
export type AuthProvider = "google" | "local";

export interface User {
    name: string;
    email: string;
    picture?: string;
    role: UserRole;
}

export interface AuthConfig {
    auth_enabled: boolean;
    auth_provider: AuthProvider;
    dev_mode: boolean;
    google_client_id: string;
    workspace_name: string;
}
