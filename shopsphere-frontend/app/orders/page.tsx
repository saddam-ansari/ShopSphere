
"use client";

import Link from "next/link";
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
    items: OrderItem[];

    shipping_full_name?: string | null;
    shipping_email?: string | null;
    shipping_phone?: string | null;
    shipping_address?: string | null;
    shipping_city?: string | null;
    shipping_postal_code?: string | null;
};

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [productNames, setProductNames] = useState<Record<number, string>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [cancellingId, setCancellingId] = useState<number | null>(null);
    const [cancelError, setCancelError] = useState("");
    const [cancelMessage, setCancelMessage] = useState("");


    async function handleCancelOrder(orderId: number) {
        const confirmed = window.confirm(
            `Are you sure you want to cancel order #${orderId}?`
        );

        if (!confirmed) return;

        const token = localStorage.getItem("shopsphere-token");

        if (!token) {
            setCancelError("Please log in again to cancel your order.");
            return;
        }

        setCancellingId(orderId);
        setCancelError("");
        setCancelMessage("");

        try {
            const apiUrl =
                process.env.NEXT_PUBLIC_API_GATEWAY_URL ??
                "http://localhost:4000";

            const response = await fetch(
                `${apiUrl}/api/orders/${orderId}/cancel`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const result: unknown = await response.json();

            if (!response.ok) {
                const message =
                    typeof result === "object" &&
                        result !== null &&
                        "message" in result &&
                        typeof result.message === "string"
                        ? result.message
                        : "Unable to cancel this order.";

                throw new Error(message);
            }

            if (
                typeof result !== "object" ||
                result === null ||
                !("data" in result)
            ) {
                throw new Error("Unexpected server response.");
            }

            const updatedOrder = result.data as Order;

            setOrders((previousOrders) =>
                previousOrders.map((order) =>
                    order.id === orderId
                        ? { ...order, status: updatedOrder.status }
                        : order
                )
            );

            setCancelMessage(`Order #${orderId} was cancelled successfully.`);
        } catch (err) {
            setCancelError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong while cancelling the order."
            );
        } finally {
            setCancellingId(null);
        }
    }


    useEffect(() => {
        async function fetchOrders() {
            const token = localStorage.getItem("shopsphere-token");

            if (!token) {
                setError("Please log in to view your orders.");
                setLoading(false);
                return;
            }

            try {
                const apiUrl =
                    process.env.NEXT_PUBLIC_API_GATEWAY_URL ??
                    "http://localhost:4000";

                const response = await fetch(
                    `${apiUrl}/api/orders`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const result: unknown = await response.json();

                if (!response.ok) {
                    throw new Error("Unable to load your orders.");
                }

                if (
                    typeof result !== "object" ||
                    result === null ||
                    !("data" in result) ||
                    !Array.isArray(result.data)
                ) {
                    throw new Error(
                        "Unexpected response from the server."
                    );
                }

                const loadedOrders = result.data as Order[];

                setOrders(loadedOrders);

                // Fetch each unique product name once.
                const productIds = [
                    ...new Set(
                        loadedOrders.flatMap((order) =>
                            (order.items ?? []).map(
                                (item) => item.product_id
                            )
                        )
                    ),
                ];

                const productEntries = await Promise.all(
                    productIds.map(
                        async (
                            productId
                        ): Promise<[number, string]> => {
                            try {
                                const productResponse = await fetch(
                                    `${apiUrl}/api/products/${productId}`
                                );

                                if (!productResponse.ok) {
                                    return [
                                        productId,
                                        `Product #${productId}`,
                                    ];
                                }

                                const body: unknown =
                                    await productResponse.json();

                                if (
                                    typeof body !== "object" ||
                                    body === null
                                ) {
                                    return [
                                        productId,
                                        `Product #${productId}`,
                                    ];
                                }

                                let product: unknown =
                                    "data" in body ? body.data : body;

                                if (
                                    typeof product === "object" &&
                                    product !== null &&
                                    "product" in product
                                ) {
                                    product = product.product;
                                }

                                if (
                                    typeof product === "object" &&
                                    product !== null &&
                                    "name" in product &&
                                    typeof product.name === "string"
                                ) {
                                    return [productId, product.name];
                                }

                                return [
                                    productId,
                                    `Product #${productId}`,
                                ];
                            } catch {
                                return [
                                    productId,
                                    `Product #${productId}`,
                                ];
                            }
                        }
                    )
                );

                setProductNames(
                    Object.fromEntries(productEntries)
                );
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Something went wrong."
                );
            } finally {
                setLoading(false);
            }
        }

        void fetchOrders();
    }, []);

    if (loading) {
        return (
            <main className="mx-auto max-w-5xl p-6">
                Loading orders...
            </main>
        );
    }

    if (error) {
        return (
            <main className="mx-auto max-w-5xl p-6">
                <h1 className="text-3xl font-bold">My Orders</h1>

                <p role="alert" className="mt-4 text-red-600">
                    {error}
                </p>
            </main>
        );
    }

    return (
        <main className="mx-auto max-w-5xl px-6 py-12">
            <h1 className="text-3xl font-bold">My Orders</h1>

            {cancelError && (
                <p role="alert" className="mt-4 text-sm text-red-600">
                    {cancelError}
                </p>
            )}

            {cancelMessage && (
                <p role="status" className="mt-4 text-sm text-green-700">
                    {cancelMessage}
                </p>
            )}

            {orders.length === 0 ? (
                <p className="mt-6 text-gray-600">
                    You haven&apos;t placed any orders yet.
                </p>
            ) : (
                <div className="mt-8 space-y-6">
                    {orders.map((order) => (
                        <article
                            key={order.id}
                            className="rounded-xl border p-6"
                        >
                            {/* Order heading */}
                            <div className="flex flex-wrap justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-semibold">
                                        Order #{order.id}
                                    </h2>

                                    <p className="mt-1 text-sm text-gray-500">
                                        {new Date(
                                            order.created_at
                                        ).toLocaleString("en-IN")}
                                    </p>
                                </div>


                                <div className="flex flex-col items-end gap-3">
                                    <span className="h-fit rounded-full bg-gray-100 px-3 py-1 text-sm font-medium">
                                        {order.status}
                                    </span>

                                    <Link
                                        href={`/orders/${order.id}`}
                                        className="inline-block text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                                    >
                                        Track Order
                                    </Link>

                                    {order.status === "PENDING" && (
                                        <button
                                            type="button"
                                            onClick={() => handleCancelOrder(order.id)}
                                            disabled={cancellingId === order.id}
                                            className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {cancellingId === order.id
                                                ? "Cancelling..."
                                                : "Cancel Order"}
                                        </button>
                                    )}
                                </div>

                            </div>

                            {/* Products */}
                            <div className="mt-5 space-y-3">
                                {order.items?.map((item, index) => (
                                    <div
                                        key={
                                            item.id ??
                                            `${item.product_id}-${index}`
                                        }
                                        className="flex justify-between gap-4 text-sm"
                                    >
                                        <span>
                                            {productNames[item.product_id] ??
                                                `Product #${item.product_id}`}{" "}
                                            × {item.quantity}
                                        </span>

                                        <span className="whitespace-nowrap">
                                            ₹
                                            {Number(
                                                item.subtotal
                                            ).toLocaleString("en-IN", {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Shipping details */}
                            <div className="mt-5 rounded-lg bg-gray-50 p-4">
                                <h3 className="font-semibold text-gray-900">
                                    Shipping Details
                                </h3>

                                {order.shipping_full_name ? (
                                    <div className="mt-3 space-y-1 text-sm text-gray-600">
                                        <p className="font-medium text-gray-900">
                                            {order.shipping_full_name}
                                        </p>

                                        {order.shipping_email && (
                                            <p>
                                                Email: {order.shipping_email}
                                            </p>
                                        )}

                                        {order.shipping_phone && (
                                            <p>
                                                Phone: {order.shipping_phone}
                                            </p>
                                        )}

                                        {order.shipping_address && (
                                            <p>
                                                {order.shipping_address}
                                            </p>
                                        )}

                                        <p>
                                            {[
                                                order.shipping_city,
                                                order.shipping_postal_code,
                                            ]
                                                .filter(Boolean)
                                                .join(", ")}
                                        </p>
                                    </div>
                                ) : (
                                    <p className="mt-2 text-sm text-gray-500">
                                        Shipping details are unavailable for
                                        this order.
                                    </p>
                                )}
                            </div>

                            {/* Order total */}
                            <div className="mt-5 flex justify-between border-t pt-4">
                                <span className="font-semibold">
                                    Order Total
                                </span>

                                <span className="text-lg font-bold">
                                    ₹
                                    {Number(
                                        order.total_price
                                    ).toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </span>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </main>
    );
}
