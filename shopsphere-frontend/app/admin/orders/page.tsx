
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type OrderItem = {
    id?: number;
    product_id: number;
    quantity: number;
    unit_price?: number | string;
    subtotal?: number | string;
};

type Order = {
    id: number;
    user_id: number;
    total_price: number | string;
    status: string;
    created_at: string;
    shipping_full_name?: string;
    shipping_email?: string;
    shipping_phone?: string;
    shipping_address?: string;
    shipping_city?: string;
    shipping_postal_code?: string;
    items: OrderItem[];
};

const nextStatus: Record<string, string> = {
    PENDING: "CONFIRMED",
    CONFIRMED: "SHIPPED",
    SHIPPED: "DELIVERED",
};

export default function AdminOrdersPage() {
    const router = useRouter();

    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [actionMessage, setActionMessage] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function loadOrders() {
            const token = localStorage.getItem("shopsphere-token");
            const storedUser = localStorage.getItem("shopsphere-user");

            if (!token || !storedUser) {
                router.replace("/login");
                return;
            }

            try {
                const user = JSON.parse(storedUser);

                if (
                    typeof user.role !== "string" ||
                    user.role.toUpperCase() !== "ADMIN"
                ) {
                    router.replace("/profile");
                    return;
                }

                const apiUrl =
                    process.env.NEXT_PUBLIC_API_GATEWAY_URL ??
                    "http://localhost:4000";

                const response = await fetch(
                    `${apiUrl}/api/orders/admin/all`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        cache: "no-store",
                    }
                );

                const result = await response.json();

                if (!response.ok || !result.success) {
                    throw new Error(
                        result.message || "Unable to load orders."
                    );
                }

                if (!cancelled) {
                    setOrders(result.data ?? []);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Unable to load orders."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void loadOrders();

        return () => {
            cancelled = true;
        };
    }, [router]);

    async function handleStatusUpdate(
        orderId: number,
        status: string
    ) {
        const token = localStorage.getItem("shopsphere-token");

        if (!token) {
            router.replace("/login");
            return;
        }

        setUpdatingId(orderId);
        setActionMessage("");
        setError("");

        try {
            const apiUrl =
                process.env.NEXT_PUBLIC_API_GATEWAY_URL ??
                "http://localhost:4000";

            const response = await fetch(
                `${apiUrl}/api/orders/${orderId}/status`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ status }),
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Unable to update order."
                );
            }

            setOrders((currentOrders) =>
                currentOrders.map((order) =>
                    order.id === orderId
                        ? {
                            ...order,
                            status: result.data.status,
                        }
                        : order
                )
            );

            setActionMessage(
                `Order #${orderId} updated to ${status}.`
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to update order."
            );
        } finally {
            setUpdatingId(null);
        }
    }

    if (loading) {
        return (
            <main className="min-h-screen bg-gray-50 p-8 text-gray-900">
                Loading orders...
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 px-6 py-10 text-gray-900">
            <div className="mx-auto max-w-7xl">
                <Link
                    href="/admin"
                    className="text-sm text-blue-600 hover:underline"
                >
                    ← Back to Admin Dashboard
                </Link>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">
                            Order Management
                        </h1>

                        <p className="mt-2 text-gray-600">
                            View customer orders and manage deliveries.
                        </p>
                    </div>

                    <span className="rounded-lg border bg-white px-4 py-2 text-sm font-medium">
                        Total orders: {orders.length}
                    </span>
                </div>

                {error && (
                    <div
                        role="alert"
                        className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700"
                    >
                        {error}
                    </div>
                )}

                {actionMessage && (
                    <p
                        role="status"
                        className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800"
                    >
                        {actionMessage}
                    </p>
                )}

                {orders.length === 0 && !error ? (
                    <p className="mt-8 rounded-xl border bg-white p-6 text-gray-600">
                        No orders found.
                    </p>
                ) : (
                    orders.length > 0 && (
                        <div className="mt-8 overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-100 text-gray-700">
                                    <tr>
                                        <th className="p-4">Order ID</th>
                                        <th className="p-4">Customer</th>
                                        <th className="p-4">Date</th>
                                        <th className="p-4">Items</th>
                                        <th className="p-4">Total</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4">Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {orders.map((order) => (
                                        <tr
                                            key={order.id}
                                            className="border-t border-gray-200 hover:bg-gray-50"
                                        >
                                            <td className="whitespace-nowrap p-4 font-semibold">
                                                #{order.id}
                                            </td>

                                            <td className="p-4">
                                                <div className="font-medium">
                                                    {order.shipping_full_name ||
                                                        `Customer #${order.user_id}`}
                                                </div>

                                                {order.shipping_email && (
                                                    <div className="mt-1 text-xs text-gray-500">
                                                        {order.shipping_email}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="whitespace-nowrap p-4">
                                                {new Date(
                                                    order.created_at
                                                ).toLocaleDateString("en-IN")}
                                            </td>

                                            <td className="p-4">
                                                {order.items?.length ?? 0}
                                            </td>

                                            <td className="whitespace-nowrap p-4 font-medium">
                                                ₹
                                                {Number(
                                                    order.total_price
                                                ).toLocaleString("en-IN", {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </td>

                                            <td className="p-4">
                                                <span
                                                    className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${order.status ===
                                                            "DELIVERED"
                                                            ? "bg-green-100 text-green-800"
                                                            : order.status ===
                                                                "CANCELLED"
                                                                ? "bg-red-100 text-red-800"
                                                                : "bg-gray-100 text-gray-800"
                                                        }`}
                                                >
                                                    {order.status}
                                                </span>
                                            </td>

                                            <td className="p-4">
                                                {nextStatus[order.status] ? (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleStatusUpdate(
                                                                order.id,
                                                                nextStatus[
                                                                order.status
                                                                ]
                                                            )
                                                        }
                                                        disabled={
                                                            updatingId ===
                                                            order.id
                                                        }
                                                        className="whitespace-nowrap rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        {updatingId ===
                                                            order.id
                                                            ? "Updating..."
                                                            : `Mark ${nextStatus[
                                                            order.status
                                                            ]
                                                            }`}
                                                    </button>
                                                ) : (
                                                    <span className="whitespace-nowrap text-xs text-gray-500">
                                                        No further actions
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                )}
            </div>
        </main>
    );
}
