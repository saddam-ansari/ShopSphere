
import type { ApiResponse, AuthUser, RegisterRequest, LoginRequest, LoginResponseData, ProfileResponseData, } from "@/types/auth";

const API_GATEWAY_URL = process.env.API_GATEWAY_URL ?? "http://localhost:4000";

export async function registerUser(request: RegisterRequest): Promise<ApiResponse<AuthUser>> {
    const response = await fetch(`${API_GATEWAY_URL}/api/users/register`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json", },
            body: JSON.stringify(request),
            cache: "no-store",
        }
    );

    const result: unknown = await response.json();

    if (!response.ok) {
        let message = "Registration failed.";

        if (typeof result === "object" && result !== null && "message" in result && typeof result.message === "string") {
            message = result.message;
        }

        throw new Error(message);
    }

    return result as ApiResponse<AuthUser>;
}



export async function loginUser(request: LoginRequest): Promise<ApiResponse<LoginResponseData>> {
    const response = await fetch(`${API_GATEWAY_URL}/api/users/login`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json", },
            body: JSON.stringify(request),
            cache: "no-store",
        }
    );

    const result: unknown = await response.json();

    if (!response.ok) {
        let message = "Login failed.";

        if (typeof result === "object" && result !== null && "message" in result && typeof result.message === "string") {
            message = result.message;
        }

        throw new Error(message);
    }

    return result as ApiResponse<LoginResponseData>;
}



export async function getUserProfile(token: string): Promise<ApiResponse<ProfileResponseData>> {
    const response = await fetch(`${API_GATEWAY_URL}/api/users/profile`,
        {
            method: "GET",
            headers: { Authorization: `Bearer ${token}`, },
            cache: "no-store",
        }
    );

    const result: unknown = await response.json();

    if (!response.ok) {
        let message = "Unable to load your profile.";

        if (typeof result === "object" && result !== null && "message" in result && typeof result.message === "string") {
            message = result.message;
        }

        throw new Error(message);
    }

    return result as ApiResponse<ProfileResponseData>;
}
