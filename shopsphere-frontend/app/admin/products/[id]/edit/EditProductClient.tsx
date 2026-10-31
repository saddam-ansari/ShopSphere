
"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getProductById } from "@/app/products/products-api";
import type { Product } from "@/types/product";

type EditProductClientProps = {
    productId: string;
};

type ProductForm = {
    name: string;
    description: string;
    price: string;
    stock: string;
    category: string;
};

const API_URL =
    process.env.NEXT_PUBLIC_API_GATEWAY_URL ??
    "http://localhost:4000";

export default function EditProductClient({
    productId,
}: EditProductClientProps) {
    const router = useRouter();

    const [form, setForm] = useState<ProductForm>({
        name: "",
        description: "",
        price: "",
        stock: "",
        category: "",
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Check login and admin role.
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
            }
        } catch {
            router.replace("/login");
        }
    }, [router]);

    // Load the selected product.
    useEffect(() => {
        let active = true;

        async function loadProduct() {
            try {
                setLoading(true);
                setError("");

                const product: Product = await getProductById(productId);

                if (!active) return;

                setForm({
                    name: product.name ?? "",
                    description: product.description ?? "",
                    price: String(product.price ?? ""),
                    stock: String(product.stock ?? ""),
                    category: product.category ?? "",
                });
            } catch (err) {
                if (active) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Failed to load product."
                    );
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        loadProduct();

        return () => {
            active = false;
        };
    }, [productId]);

    // Update form state when an input changes.
    function handleChange(
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));

        setError("");
        setSuccess("");
    }

    // Send updated product details to the backend.
    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setError("");
        setSuccess("");

        const price = Number(form.price);
        const stock = Number(form.stock);

        if (!form.name.trim()) {
            setError("Product name is required.");
            return;
        }

        if (form.price.trim() === "" || !Number.isFinite(price) || price < 0) {
            setError("Enter a valid price greater than or equal to zero.");
            return;
        }

        if (form.stock.trim() === "" || !Number.isInteger(stock) || stock < 0) {
            setError("Stock must be a whole number greater than or equal to zero.");
            return;
        }

        const token = localStorage.getItem("shopsphere-token");

        if (!token) {
            router.replace("/login");
            return;
        }

        setSaving(true);

        try {
            const response = await fetch(
                `${API_URL}/api/products/${encodeURIComponent(productId)}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        name: form.name.trim(),
                        description: form.description.trim(),
                        price,
                        stock,
                        category: form.category.trim(),
                    }),
                }
            );

            const result: unknown = await response.json();

            let message = "Unable to update product.";

            if (typeof result === "object" && result !== null) {
                const body = result as Record<string, unknown>;

                if (typeof body.message === "string") {
                    message = body.message;
                }
            }

            if (!response.ok) {
                throw new Error(message);
            }

            setSuccess("Product updated successfully.");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong while updating the product."
            );
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <main className="min-h-screen bg-gray-50 px-6 py-12">
                <div className="mx-auto max-w-3xl">
                    <p className="text-gray-600">Loading product...</p>
                </div>
            </main>
        );
    }

    if (error && !form.name) {
        return (
            <main className="min-h-screen bg-gray-50 px-6 py-12">
                <div className="mx-auto max-w-3xl">
                    <p className="text-red-600">{error}</p>
                    <Link
                        href="/admin/products"
                        className="mt-4 inline-block text-blue-600 hover:underline"
                    >
                        Back to Products
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 px-6 py-12">
            <div className="mx-auto max-w-3xl">
                <Link
                    href="/admin/products"
                    className="text-sm font-medium text-blue-600 hover:underline"
                >
                    ← Back to Products
                </Link>

                <h1 className="mt-4 text-3xl font-bold text-gray-900">
                    Edit Product
                </h1>

                <p className="mt-2 text-gray-600">
                    Update the details for product #{productId}.
                </p>

                <form
                    onSubmit={handleSubmit}
                    className="mt-8 space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                    <div>
                        <label
                            htmlFor="name"
                            className="mb-1 block text-sm font-medium text-gray-700"
                        >
                            Product Name
                        </label>
                        <input
                            id="name"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            required
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-600"
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
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            rows={3}
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-600"
                        />
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                            <label
                                htmlFor="price"
                                className="mb-1 block text-sm font-medium text-gray-700"
                            >
                                Price
                            </label>
                            <input
                                id="price"
                                name="price"
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.price}
                                onChange={handleChange}
                                required
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-600"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="stock"
                                className="mb-1 block text-sm font-medium text-gray-700"
                            >
                                Stock
                            </label>
                            <input
                                id="stock"
                                name="stock"
                                type="number"
                                min="0"
                                step="1"
                                value={form.stock}
                                onChange={handleChange}
                                required
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-600"
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
                            name="category"
                            value={form.category}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-600"
                        />
                    </div>

                    {error && (
                        <p role="alert" className="text-sm text-red-600">
                            {error}
                        </p>
                    )}

                    {success && (
                        <p role="status" className="text-sm text-green-700">
                            {success}
                        </p>
                    )}

                    <div className="flex flex-wrap gap-3">
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saving ? "Saving..." : "Save Changes"}
                        </button>

                        <Link
                            href="/admin/products"
                            className="rounded-lg border border-gray-300 px-5 py-3 font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </main>
    );
}
