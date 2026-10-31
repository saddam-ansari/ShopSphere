
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getProducts } from "@/app/products/products-api";
import type { Product } from "@/types/product";

export default function AdminProductsPage() {
    const router = useRouter();

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [deleteError, setDeleteError] = useState("");
    const [deleteSuccess, setDeleteSuccess] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("shopsphere-token");
        const storedUser = localStorage.getItem("shopsphere-user");

        if (!token || !storedUser) {
            router.replace("/login");
            return;
        }

        try {
            const user = JSON.parse(storedUser);

            if (user.role !== "ADMIN") {
                router.replace("/profile");
                return;
            }
        } catch {
            router.replace("/login");
            return;
        }

        let active = true;

        async function loadProducts() {
            try {
                const result = await getProducts();
                if (active) {
                    setProducts(result);
                }

            } catch (err: unknown) {
                if (active) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Something went wrong."
                    );
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        void loadProducts();

        return () => {
            active = false;
        };
    }, [router]);


    async function handleDelete(productId: number, productName: string) {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${productName}"? This action cannot be undone.`
        );

        if (!confirmed) return;

        const token = localStorage.getItem("shopsphere-token");

        if (!token) {
            setDeleteError("Please log in again to delete products.");
            return;
        }

        setDeletingId(productId);
        setDeleteError("");
        setDeleteSuccess("");

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? "http://localhost:4000"}/api/products/${productId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const result: unknown = await response.json().catch(() => null);

            if (!response.ok) {
                const message =
                    typeof result === "object" &&
                        result !== null &&
                        "message" in result &&
                        typeof result.message === "string"
                        ? result.message
                        : "Failed to delete product.";

                throw new Error(message);
            }

            setProducts((previous) =>
                previous.filter((product) => product.id !== productId)
            );

            setDeleteSuccess(`"${productName}" was deleted successfully.`);
        } catch (error) {
            setDeleteError(
                error instanceof Error
                    ? error.message
                    : "Something went wrong while deleting the product."
            );
        } finally {
            setDeletingId(null);
        }
    }


    return (
        <main className="min-h-screen bg-gray-50 px-6 py-12 text-gray-900">
            <div className="mx-auto max-w-7xl">
                <Link
                    href="/admin"
                    className="text-sm font-medium text-blue-600 hover:underline"
                >
                    ← Back to Dashboard
                </Link>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="font-semibold uppercase tracking-widest text-blue-700">
                            ShopSphere Management
                        </p>

                        <h1 className="mt-2 text-3xl font-bold">
                            Product Management
                        </h1>

                        <p className="mt-2 text-gray-600">
                            View the products in your store catalog.
                        </p>
                    </div>

                    <Link
                        href="/admin/products/new"
                        className="rounded-md bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700"
                    >
                        + Add Product
                    </Link>
                </div>

                {loading && (
                    <p className="mt-8 text-gray-600">
                        Loading products...
                    </p>
                )}

                {error && (
                    <p
                        role="alert"
                        className="mt-8 rounded-md bg-red-50 p-4 text-red-700"
                    >
                        {error}
                    </p>
                )}

                {deleteError && (
                    <p role="alert" className="mb-4 text-sm text-red-600">
                        {deleteError}
                    </p>
                )}

                {deleteSuccess && (
                    <p role="status" className="mb-4 text-sm text-green-700">
                        {deleteSuccess}
                    </p>
                )}

                {!loading && !error && (
                    <div className="mt-8 overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-100 text-gray-700">
                                <tr>
                                    <th className="px-5 py-4">ID</th>
                                    <th className="px-5 py-4">Product</th>
                                    <th className="px-5 py-4">Price</th>
                                    <th className="px-5 py-4">Stock</th>
                                    <th className="px-5 py-4">Category</th>
                                    <th className="px-4 py-3 text-left">Actions</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100">
                                {products.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50">
                                        <td className="px-5 py-4">
                                            {product.id}
                                        </td>

                                        <td className="px-5 py-4 font-medium">
                                            {product.name}
                                        </td>

                                        <td className="px-5 py-4">
                                            ₹{Number(product.price).toLocaleString("en-IN")}
                                        </td>

                                        <td className="px-5 py-4">
                                            {product.stock}
                                        </td>

                                        <td className="px-5 py-4">
                                            {product.category || "—"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Link
                                                href={`/admin/products/${product.id}/edit`}
                                                className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                            >
                                                Edit
                                            </Link>

                                            <button
                                                type="button"
                                                onClick={() => handleDelete(product.id, product.name)}
                                                disabled={deletingId === product.id}
                                                className="ml-3 font-medium text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {deletingId === product.id ? "Deleting..." : "Delete"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}

                                {products.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-5 py-10 text-center text-gray-500"
                                        >
                                            No products found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </main>
    );
}
