export type UserRole = "USER" | "ADMIN";

export type RegisterRequest = {
    name: string;
    email: string;
    password: string;
};

export type AuthUser = {
    id: number;
    name: string;
    email: string;
    role: UserRole;
};

export type ApiResponse<T> = {
    success: boolean;
    message: string;
    data?: T;
};

export type LoginRequest = {
    email: string;
    password: string;
};

export type LoginResponseData = {
    user: AuthUser;
    token: string;
};

export type ProfileResponseData = {
    id: number;
    name: string;
    email: string;
    role: UserRole;
};
