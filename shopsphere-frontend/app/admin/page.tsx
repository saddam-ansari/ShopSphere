
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { AuthUser } from "@/types/auth";

export default function AdminPage() {
    const router = useRouter();

    const [user, setUser] = useState<AuthUser | null>(null);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("shopsphere-token");
        const storedUser = localStorage.getItem("shopsphere-user");

        if (!token || !storedUser) {
            router.replace("/login");
            return;
        }

        try {
            const parsedUser = JSON.parse(storedUser) as AuthUser;

            if (parsedUser.role !== "ADMIN") {
                router.replace("/profile");
                return;
            }

            setUser(parsedUser);
        } catch {
            router.replace("/login");
            return;
        } finally {
            setChecking(false);
        }
    }, [router]);

    if (checking || !user) {
        return (
            <main className="min-h-screen bg-gray-50 px-6 py-12 text-gray-900">
                <div className="mx-auto max-w-7xl">
                    <p className="text-gray-600">
                        Checking admin access...
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 px-6 py-12 text-gray-900">
            <div className="mx-auto max-w-7xl">
                <p className="font-semibold uppercase tracking-widest text-blue-700">
                    ShopSphere Management
                </p>

                <h1 className="mt-3 text-4xl font-bold text-gray-900">
                    Admin Dashboard
                </h1>

                <p className="mt-3 text-gray-600">
                    Welcome, {user.name}. Manage your store products here.
                </p>

                <section className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h2 className="text-xl font-semibold">
                            Product Management
                        </h2>

                        <p className="mt-2 text-gray-600">
                            View and manage the products in your store.
                        </p>

                        <Link
                            href="/admin/products"
                            className="mt-5 inline-block rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
                        >
                            Manage Products
                        </Link>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h2 className="text-xl font-semibold">
                            Create Product
                        </h2>

                        <p className="mt-2 text-gray-600">
                            Add a new product to your catalog.
                        </p>

                        <Link
                            href="/admin/products/new"
                            className="mt-5 inline-block rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
                        >
                            Add Product
                        </Link>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h2 className="text-xl font-semibold">
                            Order Management
                        </h2>

                        <p className="mt-2 text-gray-600">
                            View customer orders, track order statuses, and manage deliveries.
                        </p>

                        <Link
                            href="/admin/orders"
                            className="mt-5 inline-block rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
                        >
                            Manage Orders
                        </Link>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h2 className="text-xl font-semibold">
                            Storefront
                        </h2>

                        <p className="mt-2 text-gray-600">
                            View the products customers can browse.
                        </p>

                        <Link
                            href="/products"
                            className="mt-5 inline-block rounded-md border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
                        >
                            View Products
                        </Link>
                    </div>
                </section>
            </div>
        </main>
    );
}
