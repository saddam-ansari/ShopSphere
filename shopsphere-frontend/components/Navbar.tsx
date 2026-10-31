
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartContext";
import type { AuthUser, UserRole } from "@/types/auth";

export default function Navbar() {
    const { cartCount } = useCart();
    const router = useRouter();

    const [user, setUser] = useState<AuthUser | null>(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        function checkAuth() {
            const token = localStorage.getItem("shopsphere-token");
            const storedUser = localStorage.getItem("shopsphere-user");

            if (!token || !storedUser) {
                setUser(null);
                setIsReady(true);
                return;
            }

            try {
                const parsedUser = JSON.parse(storedUser) as AuthUser;

                const validRole: UserRole | null =
                    parsedUser.role === "ADMIN" || parsedUser.role === "USER"
                        ? parsedUser.role
                        : null;

                if (validRole) {
                    setUser({ ...parsedUser, role: validRole });
                } else {
                    setUser(null);
                }
            } catch {
                setUser(null);
            }

            setIsReady(true);
        }

        checkAuth();

        window.addEventListener("shopsphere-auth-change", checkAuth);
        window.addEventListener("storage", checkAuth);

        return () => {
            window.removeEventListener("shopsphere-auth-change", checkAuth);
            window.removeEventListener("storage", checkAuth);
        };
    }, []);

    function handleLogout() {
        localStorage.removeItem("shopsphere-token");
        localStorage.removeItem("shopsphere-user");

        setUser(null);

        window.dispatchEvent(new Event("shopsphere-auth-change"));
        router.push("/login");
    }

    return (
        <nav className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 text-gray-800">
            <Link href="/" className="text-xl font-bold text-blue-700">
                ShopSphere
            </Link>

            <div className="flex items-center gap-5">
                <Link href="/products"
                    className="text-sm font-medium text-gray-700 transition-colors hover:text-blue-600">
                    Products
                </Link>

                <Link href="/cart"
                    className="text-sm font-medium text-gray-700 transition-colors hover:text-blue-600">
                    Cart ({cartCount})
                </Link>

                <Link
                    href="/orders"
                    className="text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                    My Orders
                </Link>

                {isReady && (
                    <>
                        {user ? (
                            <>
                                <Link href="/profile"
                                    className="text-sm font-medium text-gray-700 transition-colors hover:text-blue-600">
                                    My Profile
                                </Link>

                                {user.role === "ADMIN" && (
                                    <Link href="/admin"
                                        className="text-sm font-medium text-gray-700 transition-colors hover:text-blue-600">
                                        Admin Dashboard
                                    </Link>
                                )}

                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="rounded border border-red-500 px-3 py-2 text-red-500 cursor-pointer"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link href="/login"
                                    className="text-gray-700 transition-colors hover:text-blue-600">
                                    Login
                                </Link>
                                <Link href="/register"
                                    className="text-gray-700 transition-colors hover:text-blue-600">
                                    Register
                                </Link>
                            </>
                        )}
                    </>
                )}
            </div>
        </nav>
    );
}
