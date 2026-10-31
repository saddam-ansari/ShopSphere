
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type OrderItem = {
    id?: number;
    product_id: number;
    quantity: number;
    unit_price: number | string;
    subtotal: number | string;
};


type Order = {
    id: number;
    total_price: number | string;
    status: string;
    created_at: string;
    updated_at?: string;
    shipping_name: string;
    shipping_email: string;
    shipping_phone: string;
    shipping_address: string;
    shipping_city: string;
    shipping_postal_code: string;
    items: OrderItem[];
};


type ProductDetails = {
    id: number;
    name: string;
};

const steps = [
    "PENDING",
    "CONFIRMED",
    "SHIPPED",
    "DELIVERED",
];

export default function TrackOrderPage() {
    const params = useParams<{ id: string }>();
    const orderId = params.id;

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [productNames, setProductNames] = useState<Record<number, string>>({});

    useEffect(() => {
        let cancelled = false;

        async function fetchOrder() {
            const token = localStorage.getItem("shopsphere-token");

            if (!token) {
                setError("Please log in to track your order.");
                setLoading(false);
                return;
            }

            try {
                const apiUrl =
                    process.env.NEXT_PUBLIC_API_GATEWAY_URL ??
                    "http://localhost:4000";

                const response = await fetch(
                    `${apiUrl}/api/orders/${encodeURIComponent(orderId)}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        cache: "no-store",
                    }
                );

                const result: unknown = await response.json();

                if (!response.ok) {
                    throw new Error(
                        response.status === 404
                            ? "Order not found."
                            : "Unable to load this order."
                    );
                }

                if (
                    typeof result !== "object" ||
                    result === null ||
                    !("data" in result) ||
                    typeof result.data !== "object" ||
                    result.data === null
                ) {
                    throw new Error("Unexpected server response.");
                }

                if (!cancelled) {
                    setOrder(result.data as Order);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Something went wrong."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void fetchOrder();

        return () => {
            cancelled = true;
        };
    }, [orderId]);

    useEffect(() => {
        if (!order?.items?.length) return;

        let cancelled = false;

        async function fetchProductNames() {
            const apiUrl =
                process.env.NEXT_PUBLIC_API_GATEWAY_URL ??
                "http://localhost:4000";

            const productIds = [
                ...new Set(order!.items.map((item) => item.product_id)),
            ];

            const results = await Promise.allSettled(
                productIds.map(async (productId) => {
                    const response = await fetch(
                        `${apiUrl}/api/products/${encodeURIComponent(String(productId))}`,
                        { cache: "no-store" }
                    );

                    if (!response.ok) {
                        throw new Error(`Failed to fetch product ${productId}`);
                    }

                    const result = await response.json();

                    const product = result.data as ProductDetails;

                    return {
                        id: productId,
                        name: product.name,
                    };
                })
            );

            if (cancelled) return;

            const names: Record<number, string> = {};

            results.forEach((result) => {
                if (result.status === "fulfilled") {
                    names[result.value.id] = result.value.name;
                }
            });

            setProductNames(names);
        }

        void fetchProductNames();

        return () => {
            cancelled = true;
        };
    }, [order]);

    if (loading) {
        return (
            <main className="mx-auto max-w-3xl p-6">
                Loading order tracking...
            </main>
        );
    }

    if (error || !order) {
        return (
            <main className="mx-auto max-w-3xl p-6">
                <h1 className="text-2xl font-bold">Track Order</h1>
                <p className="mt-4 text-red-600" role="alert">
                    {error || "Order not found."}
                </p>
                <Link
                    href="/orders"
                    className="mt-5 inline-block text-blue-600 hover:underline"
                >
                    Back to My Orders
                </Link>
            </main>
        );
    }

    const isCancelled = order.status === "CANCELLED";
    const currentStep = steps.indexOf(order.status);

    return (
        <main className="mx-auto max-w-3xl px-6 py-12">
            <Link
                href="/orders"
                className="text-sm text-blue-600 hover:underline"
            >
                ← Back to My Orders
            </Link>

            <div className="mt-6 rounded-2xl border bg-white p-6 sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">
                            Track Order #{order.id}
                        </h1>
                        <p className="mt-2 text-sm text-gray-500">
                            Placed on{" "}
                            {new Date(order.created_at).toLocaleString("en-IN")}
                        </p>
                    </div>

                    <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold">
                        {order.status}
                    </span>
                </div>

                {isCancelled ? (
                    <div
                        className="mt-8 rounded-xl border border-red-200 bg-red-50 p-5"
                        role="status"
                    >
                        <h2 className="font-semibold text-red-800">
                            Order cancelled
                        </h2>
                        <p className="mt-2 text-sm text-red-700">
                            This order has been cancelled and is no longer
                            progressing through delivery.
                        </p>
                    </div>
                ) : (
                    <section className="mt-10">
                        <h2 className="text-lg font-semibold">
                            Order progress
                        </h2>

                        <ol className="mt-6 space-y-6">
                            {steps.map((step, index) => {
                                const completed = currentStep >= index;
                                const active = currentStep === index;

                                return (
                                    <li
                                        key={step}
                                        className="flex items-start gap-4"
                                    >
                                        <span
                                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${completed
                                                ? "bg-blue-600 text-white"
                                                : "bg-gray-100 text-gray-500"
                                                }`}
                                        >
                                            {completed ? "✓" : index + 1}
                                        </span>

                                        <div className="pt-1">
                                            <p
                                                className={`font-semibold ${active
                                                    ? "text-blue-700"
                                                    : completed
                                                        ? "text-gray-900"
                                                        : "text-gray-500"
                                                    }`}
                                            >
                                                {step === "PENDING"
                                                    ? "Order placed"
                                                    : step === "CONFIRMED"
                                                        ? "Order confirmed"
                                                        : step === "SHIPPED"
                                                            ? "Order shipped"
                                                            : "Order delivered"}
                                            </p>

                                            {active && (
                                                <p className="mt-1 text-sm text-gray-600">
                                                    Current order status
                                                </p>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ol>
                    </section>
                )}

                <section className="mt-10 border-t pt-6">
                    <h2 className="text-lg font-semibold">Items ordered</h2>

                    <section className="mt-10 border-t pt-6">
                        <h2 className="text-lg font-semibold">
                            Shipping Details
                        </h2>

                        <div className="mt-4 rounded-xl bg-gray-50 p-5">
                            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <dt className="text-sm text-gray-500">
                                        Customer Name
                                    </dt>
                                    <dd className="mt-1 font-medium text-gray-900">
                                        {order.shipping_name || "Not provided"}
                                    </dd>
                                </div>

                                <div>
                                    <dt className="text-sm text-gray-500">
                                        Contact Number
                                    </dt>
                                    <dd className="mt-1 font-medium text-gray-900">
                                        {order.shipping_phone || "Not provided"}
                                    </dd>
                                </div>

                                <div>
                                    <dt className="text-sm text-gray-500">
                                        Email Address
                                    </dt>
                                    <dd className="mt-1 break-words font-medium text-gray-900">
                                        {order.shipping_email || "Not provided"}
                                    </dd>
                                </div>

                                <div>
                                    <dt className="text-sm text-gray-500">
                                        Postal Code
                                    </dt>
                                    <dd className="mt-1 font-medium text-gray-900">
                                        {order.shipping_postal_code || "Not provided"}
                                    </dd>
                                </div>

                                <div className="sm:col-span-2">
                                    <dt className="text-sm text-gray-500">
                                        Delivery Address
                                    </dt>
                                    <dd className="mt-1 font-medium text-gray-900">
                                        {[
                                            order.shipping_address,
                                            order.shipping_city,
                                            order.shipping_postal_code,
                                        ]
                                            .filter(Boolean)
                                            .join(", ") || "Not provided"}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </section>

                    <div className="mt-4 space-y-3">
                        {order.items?.map((item, index) => (
                            <div
                                key={item.id ?? `${item.product_id}-${index}`}
                                className="flex justify-between gap-4 text-sm"
                            >
                                <span className="text-gray-700">
                                    {productNames[item.product_id] ??
                                        `Product #${item.product_id}`}{" "}
                                    × {item.quantity}
                                </span>

                                <span className="whitespace-nowrap font-medium">
                                    ₹
                                    {Number(item.subtotal).toLocaleString(
                                        "en-IN",
                                        {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        }
                                    )}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-5 flex justify-between border-t pt-4">
                        <span className="font-semibold">Order total</span>
                        <span className="text-lg font-bold">
                            ₹
                            {Number(order.total_price).toLocaleString(
                                "en-IN",
                                {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                }
                            )}
                        </span>
                    </div>
                </section>
            </div>
        </main>
    );
}
