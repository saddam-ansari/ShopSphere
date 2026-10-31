
"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_URL =
    process.env.NEXT_PUBLIC_API_GATEWAY_URL ??
    process.env.API_GATEWAY_URL ??
    "http://localhost:4000";

export default function NewProductPage() {
    const router = useRouter();

    const [authorized, setAuthorized] = useState(false);
    const [checking, setChecking] = useState(true);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [stock, setStock] = useState("0");
    const [category, setCategory] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("shopsphere-token");
        const storedUser = localStorage.getItem("shopsphere-user");

        if (!token || !storedUser) {
            router.replace("/login");
            return;
        }

        try {
            const user: unknown = JSON.parse(storedUser);

            if (typeof user !== "object" || user === null || !("role" in user) || user.role !== "ADMIN") {
                router.replace("/profile");
                return;
            }

            setAuthorized(true);
        } catch {
            router.replace("/login");
        } finally {
            setChecking(false);
        }
    }, [router]);

    async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();

        setError("");
        setMessage("");

        const numericPrice = Number(price);
        const numericStock = Number(stock);

        if (!name.trim() || price.trim() === "") {
            setError("Product name and price are required.");
            return;
        }

        if (!Number.isFinite(numericPrice) || numericPrice < 0) {
            setError("Enter a valid, non-negative price.");
            return;
        }

        if (!Number.isSafeInteger(numericStock) || numericStock < 0) {
            setError("Stock must be a non-negative whole number.");
            return;
        }

        const token = localStorage.getItem("shopsphere-token");

        if (!token) {
            router.replace("/login");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/products`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: name.trim(),
                    description: description.trim() || null,
                    price: numericPrice,
                    stock: numericStock,
                    category: category.trim() || null,
                }),
            });

            const result: unknown = await response.json();

            if (!response.ok) {
                const serverMessage =
                    typeof result === "object" &&
                        result !== null &&
                        "message" in result &&
                        typeof result.message === "string"
                        ? result.message
                        : `Failed to create product (${response.status}).`;

                throw new Error(serverMessage);
            }

            const successMessage =
                typeof result === "object" &&
                    result !== null &&
                    "message" in result &&
                    typeof result.message === "string"
                    ? result.message
                    : "Product created successfully.";

            setMessage(successMessage);

            setName("");
            setDescription("");
            setPrice("");
            setStock("0");
            setCategory("");
        } catch (err: unknown) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to create product. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }

    if (checking || !authorized) {
        return (
            <main className="min-h-screen bg-gray-50 px-6 py-12 text-gray-900">
                <p className="text-gray-600">
                    Checking admin access...
                </p>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 px-4 py-12 text-gray-900">
            <div className="mx-auto max-w-7xl">
                <Link
                    href="/admin/products"
                    className="text-sm font-medium text-blue-600 hover:underline"
                >
                    ← Back to Products
                </Link>

                <p className="mt-6 font-semibold uppercase tracking-widest text-blue-700">
                    ShopSphere Management
                </p>

                <h1 className="mt-3 text-3xl font-bold text-gray-900">
                    Create Product
                </h1>

                <p className="mt-3 text-gray-600">
                    Add a new product to your store catalog.
                </p>

                <form
                    onSubmit={handleSubmit}
                    className="mt-8 max-w-2xl space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8"
                >
                    <div>
                        <label
                            htmlFor="name"
                            className="mb-1 block text-sm font-medium text-gray-700"
                        >
                            Product Name *
                        </label>

                        <input
                            id="name"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            required
                            maxLength={150}
                            placeholder="Enter product name"
                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="description"
                            className="mb-1 block text-sm font-medium text-gray-700"
                        >
                            Description
                        </label>

                        <textarea
                            id="description"
                            value={description}
                            onChange={(event) =>
                                setDescription(event.target.value)
                            }
                            rows={4}
                            placeholder="Describe the product"
                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                            <label
                                htmlFor="price"
                                className="mb-1 block text-sm font-medium text-gray-700"
                            >
                                Price (₹) *
                            </label>

                            <input
                                id="price"
                                type="number"
                                value={price}
                                onChange={(event) => setPrice(event.target.value)}
                                required
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="stock"
                                className="mb-1 block text-sm font-medium text-gray-700"
                            >
                                Stock Quantity
                            </label>

                            <input
                                id="stock"
                                type="number"
                                value={stock}
                                onChange={(event) => setStock(event.target.value)}
                                min="0"
                                step="1"
                                required
                                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="category"
                            className="mb-1 block text-sm font-medium text-gray-700"
                        >
                            Category
                        </label>

                        <input
                            id="category"
                            value={category}
                            onChange={(event) =>
                                setCategory(event.target.value)
                            }
                            placeholder="e.g. Electronics"
                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
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

                    {message && (
                        <div
                            role="status"
                            className="rounded-md bg-green-50 p-3 text-sm text-green-700"
                        >
                            <p>{message}</p>
                            <Link
                                href="/admin/products"
                                className="mt-2 inline-block font-medium underline"
                            >
                                View Product List
                            </Link>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-md bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    >
                        {loading ? "Creating Product..." : "Create Product"}
                    </button>
                </form>
            </div>
        </main>
    );
}
