
"use client";

import Link from "next/link";
import { useCart } from "@/components/CartContext";
import { useEffect, useState } from "react";
import { getProductById } from "@/app/products/products-api";
import type { Product } from "@/types/product";

export default function CartPage() {
    const { cartItems, removeFromCart, updateQuantity } = useCart();
    const [latestStock, setLatestStock] = useState<Record<number, number>>({});
    const [stockErrors, setStockErrors] = useState<string[]>([]);
    const [isCheckingStock, setIsCheckingStock] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function checkStock(): Promise<void> {
            setIsCheckingStock(true);
            setStockErrors([]);

            try {
                const results = await Promise.all(
                    cartItems.map(async (item) => {
                        try {
                            const product = await getProductById(
                                String(item.product.id)
                            );

                            return {
                                id: item.product.id,
                                stock: product.stock,
                                error: "",
                            };
                        } catch {
                            return {
                                id: item.product.id,
                                stock: -1,
                                error: `Unable to verify stock for ${item.product.name}. Please try again.`,
                            };
                        }
                    })
                );

                if (cancelled) return;

                const stockMap: Record<number, number> = {};

                for (const result of results) {
                    stockMap[result.id] = result.stock;
                }

                setLatestStock(stockMap);
                setStockErrors(
                    results
                        .filter((result) => result.error)
                        .map((result) => result.error)
                );
            } finally {
                if (!cancelled) {
                    setIsCheckingStock(false);
                }
            }
        }

        void checkStock();

        return () => {
            cancelled = true;
        };
    }, [cartItems]);

    const hasStockIssue = isCheckingStock || stockErrors.length > 0 || cartItems.some((item) => {
        const stock = latestStock[item.product.id];
        return stock === undefined || stock < item.quantity;
    });

    const totalPrice = cartItems.reduce(
        (total, item) => total + Number(item.product.price) * item.quantity, 0
    );

    if (cartItems.length === 0) {
        return (
            <main className="mx-auto max-w-7xl px-6 py-16">
                <h1 className="text-3xl font-bold">Your Shopping Cart</h1>

                <p className="mt-4 text-gray-600">
                    Your cart is empty.
                </p>

                <Link
                    href="/products"
                    className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
                >
                    Continue Shopping
                </Link>
            </main>
        );
    }

    return (
        <main className="mx-auto max-w-7xl px-6 py-12">
            <h1 className="text-3xl font-bold">Your Shopping Cart</h1>

            {isCheckingStock && (
                <p className="mt-4 text-sm text-gray-600" role="status">
                    Checking current stock...
                </p>
            )}

            {stockErrors.map((error) => (
                <p
                    key={error}
                    className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700"
                    role="alert"
                >
                    {error}
                </p>
            ))}

            {cartItems.map((item) => {
                const stock = latestStock[item.product.id];

                if (stock === undefined || stock >= item.quantity) {
                    return null;
                }

                return (
                    <p
                        key={item.product.id}
                        className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700"
                        role="alert"
                    >
                        {stock === 0
                            ? `${item.product.name} is now out of stock. Please remove it from your cart.`
                            : `Only ${stock} units of ${item.product.name} remain. Please reduce your quantity or remove this item.`}
                    </p>
                );
            })}

            <div className="mt-8 grid gap-8 lg:grid-cols-3">
                <section className="space-y-4 lg:col-span-2">
                    {cartItems.map((item) => (
                        <article
                            key={item.product.id}
                            className="flex flex-col justify-between gap-4 rounded-xl border p-5 sm:flex-row sm:items-center"
                        >
                            <div>
                                <h2 className="text-lg font-semibold">
                                    {item.product.name}
                                </h2>

                                <p className="mt-1 text-gray-600">
                                    ₹{Number(item.product.price).toLocaleString("en-IN")}
                                </p>

                                <button
                                    type="button"
                                    onClick={() =>
                                        updateQuantity(item.product.id, item.quantity - 1)
                                    }
                                    disabled={item.quantity <= 1}
                                    aria-label={`Decrease quantity of ${item.product.name}`}
                                    className="rounded border px-3 py-1 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    −
                                </button>

                                <span className="min-w-6 text-center">
                                    {item.quantity}
                                </span>

                                <button
                                    type="button"
                                    onClick={() =>
                                        updateQuantity(item.product.id, item.quantity + 1)
                                    }
                                    disabled={item.quantity >= item.product.stock}
                                    aria-label={`Increase quantity of ${item.product.name}`}
                                    className="rounded border px-3 py-1 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    +
                                </button>
                            </div>

                            <div className="flex items-center gap-4">
                                <p className="font-semibold">
                                    ₹
                                    {(
                                        Number(item.product.price) * item.quantity
                                    ).toLocaleString("en-IN")}
                                </p>

                                <button
                                    type="button"
                                    onClick={() => removeFromCart(item.product.id)}
                                    className="text-sm font-medium text-red-600 hover:text-red-800"
                                >
                                    Remove
                                </button>
                            </div>
                        </article>
                    ))}
                </section>

                <aside className="h-fit rounded-xl border p-6">
                    <h2 className="text-xl font-bold">Order Summary</h2>

                    <div className="mt-5 flex justify-between">
                        <span className="text-gray-600">Items</span>
                        <span>
                            {cartItems.reduce(
                                (total, item) => total + item.quantity,
                                0
                            )}
                        </span>
                    </div>

                    <div className="mt-4 flex justify-between border-t pt-4">
                        <span className="font-semibold">Total</span>
                        <span className="text-xl font-bold">
                            ₹{totalPrice.toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}
                        </span>
                    </div>

                    {hasStockIssue ? (
                        <button
                            type="button"
                            disabled
                            className="mt-6 block w-full cursor-not-allowed rounded-lg bg-gray-400 px-5 py-3 text-center font-semibold text-white"
                        >
                            {isCheckingStock ? "Checking Stock..." : "Checkout Unavailable"}
                        </button>
                    ) : (
                        <Link
                            href="/checkout"
                            className="mt-6 block w-full rounded-lg bg-blue-600 px-5 py-3 text-center font-semibold text-white hover:bg-blue-700"
                        >
                            Proceed to Checkout
                        </Link>
                    )}

                    <Link
                        href="/products"
                        className="mt-4 block text-center text-blue-600 hover:underline"
                    >
                        Continue Shopping
                    </Link>
                </aside>
            </div>
        </main>
    );
}
