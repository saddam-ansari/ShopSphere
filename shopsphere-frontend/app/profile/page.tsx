
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getUserProfile } from "@/lib/auth-api";
import type { ProfileResponseData } from "@/types/auth";

export default function ProfilePage() {
    const router = useRouter();

    const [user, setUser] = useState<ProfileResponseData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        async function loadProfile(): Promise<void> {
            const token = localStorage.getItem("shopsphere-token");

            if (!token) {
                router.replace("/login");
                return;
            }

            try {
                const result = await getUserProfile(token);

                if (!result.success || !result.data) {
                    throw new Error("Invalid profile response.");
                }

                if (active) {
                    setUser(result.data);
                }
            } catch (err: unknown) {
                if (!active) return;

                const message =
                    err instanceof Error
                        ? err.message
                        : "Unable to load your profile.";

                setError(message);

                localStorage.removeItem("shopsphere-token");
                localStorage.removeItem("shopsphere-user");

                window.dispatchEvent(new Event("shopsphere-auth-change"));
                router.replace("/login");
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        void loadProfile();

        return () => {
            active = false;
        };
    }, [router]);

    if (loading) {
        return (
            <main className="min-h-screen bg-gray-50 px-4 py-12 text-gray-900">
                <div className="mx-auto max-w-7xl">
                    <p className="text-gray-600">
                        Loading your profile...
                    </p>
                </div>
            </main>
        );
    }

    if (!user) {
        return (
            <main className="min-h-screen bg-gray-50 px-4 py-12 text-gray-900">
                <div className="mx-auto max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Unable to load profile
                    </h1>

                    <p role="alert" className="mt-3 text-sm text-red-600">
                        {error || "Please log in again."}
                    </p>

                    <Link
                        href="/login"
                        className="mt-6 inline-block rounded-md bg-blue-600 px-5 py-3 font-medium text-white transition-colors hover:bg-blue-700"
                    >
                        Go to Login
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 px-4 py-12 text-gray-900">
            <div className="mx-auto max-w-7xl">
                <p className="font-semibold uppercase tracking-widest text-blue-700">
                    Your Account
                </p>

                <h1 className="mt-3 text-3xl font-bold text-gray-900">
                    My Profile
                </h1>

                <p className="mt-3 text-gray-600">
                    View your ShopSphere account information.
                </p>

                <section className="mt-8 max-w-2xl rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
                    <div className="space-y-6">
                        <div>
                            <p className="text-sm font-medium text-gray-500">
                                Full Name
                            </p>
                            <p className="mt-1 text-lg font-semibold text-gray-900">
                                {user.name}
                            </p>
                        </div>

                        <div className="border-t border-gray-100 pt-5">
                            <p className="text-sm font-medium text-gray-500">
                                Email Address
                            </p>
                            <p className="mt-1 text-lg font-semibold text-gray-900">
                                {user.email}
                            </p>
                        </div>

                        <div className="border-t border-gray-100 pt-5">
                            <p className="text-sm font-medium text-gray-500">
                                User ID
                            </p>
                            <p className="mt-1 text-lg font-semibold text-gray-900">
                                {user.id}
                            </p>
                        </div>

                        <div className="border-t border-gray-100 pt-5">
                            <p className="text-sm font-medium text-gray-500">
                                Account Role
                            </p>
                            <span className="mt-2 inline-block rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                                {user.role}
                            </span>
                        </div>
                    </div>

                    <Link
                        href="/products"
                        className="mt-8 inline-block rounded-md bg-blue-600 px-5 py-3 font-medium text-white transition-colors hover:bg-blue-700"
                    >
                        Continue Shopping
                    </Link>
                </section>
            </div>
        </main>
    );
}
