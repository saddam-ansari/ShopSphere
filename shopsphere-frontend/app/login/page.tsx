
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginUser } from "@/lib/auth-api";

export default function LoginPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ): Promise<void> {
        event.preventDefault();

        setError("");
        setLoading(true);

        try {
            const result = await loginUser({
                email: email.trim(),
                password,
            });

            if (!result.success || !result.data?.token) {
                throw new Error(
                    "The server did not return a valid login token."
                );
            }

            localStorage.setItem(
                "shopsphere-token",
                result.data.token
            );

            localStorage.setItem(
                "shopsphere-user",
                JSON.stringify(result.data.user)
            );

            window.dispatchEvent(
                new Event("shopsphere-auth-change")
            );

            router.push("/profile");
        } catch (err: unknown) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to log in. Please try again."
            );
        } finally {
            setLoading(false);
            setPassword("");
        }
    }

    return (
        <main className="min-h-screen bg-gray-50 px-4 py-12 text-gray-900">
            <div className="mx-auto max-w-7xl">
                <p className="text-center font-semibold uppercase tracking-widest text-blue-700">
                    Welcome Back
                </p>

                <h1 className="mt-3 text-center text-3xl font-bold text-gray-900">
                    Login to ShopSphere
                </h1>

                <p className="mt-3 text-center text-gray-600">
                    Enter your account details to continue shopping.
                </p>

                <div className="mx-auto mt-8 w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label
                                htmlFor="email"
                                className="mb-1 block text-sm font-medium text-gray-700"
                            >
                                Email Address
                            </label>

                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={email}
                                onChange={(event) =>
                                    setEmail(event.target.value)
                                }
                                autoComplete="email"
                                required
                                placeholder="you@example.com"
                                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="mb-1 block text-sm font-medium text-gray-700"
                            >
                                Password
                            </label>

                            <input
                                id="password"
                                name="password"
                                type="password"
                                value={password}
                                onChange={(event) =>
                                    setPassword(event.target.value)
                                }
                                autoComplete="current-password"
                                required
                                placeholder="Enter your password"
                                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        {error && (
                            <p
                                role="alert"
                                className="rounded-md bg-red-50 p-3 text-sm text-red-700"
                            >
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-md bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? "Logging in..." : "Login"}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-gray-600">
                        Don&apos;t have an account?{" "}
                        <Link
                            href="/register"
                            className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
                        >
                            Register
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    );
}
