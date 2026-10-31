
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useCart } from "@/components/CartContext";

type ShippingDetails = {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
};

export default function CheckoutPage() {
    const { cartItems, removePurchasedItems } = useCart();

    const [shipping, setShipping] = useState<ShippingDetails>({
        fullName: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        postalCode: "",
    });

    const [submitted, setSubmitted] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [orderId, setOrderId] = useState<number | string | null>(null);

    const totalPrice = cartItems.reduce(
        (total, item) =>
            total + Number(item.product.price) * item.quantity,
        0
    );

    function handleChange(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void {
        const { name, value } = event.target;

        setShipping((previous) => ({
            ...previous, [name]: value,
        }));
    }


    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ): Promise<void> {
        event.preventDefault();

        if (cartItems.length === 0 || submitted) return;

        const token = localStorage.getItem("shopsphere-token");

        if (!token) {
            setSubmitError("Please log in before placing your order.");
            return;
        }

        setSubmitted(true);
        setSubmitError("");

        try {
            const apiUrl =
                process.env.NEXT_PUBLIC_API_GATEWAY_URL ??
                "http://localhost:4000";

            const response = await fetch(`${apiUrl}/api/orders`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },

                body: JSON.stringify({
                    items: cartItems.map((item) => ({
                        productId: item.product.id,
                        quantity: item.quantity,
                    })),

                    shippingAddress: {
                        fullName: shipping.fullName.trim(),
                        email: shipping.email.trim(),
                        phone: shipping.phone.trim(),
                        address: shipping.address.trim(),
                        city: shipping.city.trim(),
                        postalCode: shipping.postalCode.trim(),
                    },
                }),

            });

            const result: unknown = await response.json().catch(() => null);

            if (!response.ok) {
                const message =
                    typeof result === "object" &&
                        result !== null &&
                        "message" in result &&
                        typeof result.message === "string"
                        ? result.message
                        : "Unable to place your order.";

                throw new Error(message);
            }

            if (
                typeof result !== "object" ||
                result === null ||
                !("data" in result) ||
                typeof result.data !== "object" ||
                result.data === null ||
                !("id" in result.data)
            ) {
                throw new Error(
                    "The server response did not include an order ID. Please check your order history before trying again."
                );
            }

            const createdOrderId = result.data.id;

            if (
                typeof createdOrderId !== "string" &&
                typeof createdOrderId !== "number"
            ) {
                throw new Error("The server returned an invalid order ID.");
            }

            setOrderId(createdOrderId);

            const purchasedProductIds = cartItems.map(
                (item) => item.product.id
            );

            removePurchasedItems(purchasedProductIds);
            setSubmitted(true);
        } catch (error) {
            setSubmitError(
                error instanceof Error
                    ? error.message
                    : "Something went wrong while placing your order."
            );
        } finally {
            setSubmitted(false);
        }
    }


    if (submitted) {
        return (
            <main className="mx-auto max-w-3xl px-6 py-16">
                <h1 className="text-3xl font-bold text-green-700">
                    Order Placed Successfully!
                </h1>

                <p className="mt-4 text-gray-600">
                    Your order has been created.
                </p>

                {orderId !== null && (
                    <p className="mt-2 font-semibold">
                        Order ID: {orderId}
                    </p>
                )}

                <Link
                    href="/products"
                    className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
                >
                    Continue Shopping
                </Link>
            </main>
        );
    }

    if (cartItems.length === 0) {
        return (
            <main className="mx-auto max-w-3xl px-6 py-16">
                <h1 className="text-3xl font-bold">Checkout</h1>
                <p className="mt-4 text-gray-600">
                    Your cart is empty. Add a product before checking out.
                </p>
                <Link
                    href="/products"
                    className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
                >
                    Browse Products
                </Link>
            </main>
        );
    }

    return (
        <main className="mx-auto max-w-7xl px-6 py-12">
            <h1 className="text-3xl font-bold">Checkout</h1>

            <div className="mt-8 grid gap-8 lg:grid-cols-3">
                <form
                    onSubmit={handleSubmit}
                    className="space-y-5 rounded-xl border p-6 lg:col-span-2"
                >
                    <h2 className="text-xl font-semibold">
                        Shipping Information
                    </h2>

                    <div>
                        <label htmlFor="fullName" className="mb-1 block text-sm font-medium">
                            Full Name
                        </label>
                        <input
                            id="fullName"
                            name="fullName"
                            value={shipping.fullName}
                            onChange={handleChange}
                            required
                            autoComplete="name"
                            className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-600"
                            placeholder="Enter your full name"
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="mb-1 block text-sm font-medium">
                            Email Address
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            value={shipping.email}
                            onChange={handleChange}
                            required
                            autoComplete="email"
                            className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-600"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div>
                        <label htmlFor="phone" className="mb-1 block text-sm font-medium">
                            Phone Number
                        </label>
                        <input
                            id="phone"
                            name="phone"
                            type="tel"
                            value={shipping.phone}
                            onChange={handleChange}
                            required
                            autoComplete="tel"
                            pattern="[0-9]{10}"
                            title="Enter a 10-digit phone number"
                            className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-600"
                            placeholder="10-digit mobile number"
                        />
                    </div>

                    <div>
                        <label htmlFor="address" className="mb-1 block text-sm font-medium">
                            Street Address
                        </label>
                        <textarea
                            id="address"
                            name="address"
                            value={shipping.address}
                            onChange={handleChange}
                            required
                            autoComplete="street-address"
                            rows={3}
                            className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-600"
                            placeholder="House number, street, area"
                        />
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                            <label htmlFor="city" className="mb-1 block text-sm font-medium">
                                City
                            </label>
                            <input
                                id="city"
                                name="city"
                                value={shipping.city}
                                onChange={handleChange}
                                required
                                autoComplete="address-level2"
                                className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-600"
                                placeholder="Enter city"
                            />
                        </div>

                        <div>
                            <label htmlFor="postalCode" className="mb-1 block text-sm font-medium">
                                PIN Code
                            </label>
                            <input
                                id="postalCode"
                                name="postalCode"
                                value={shipping.postalCode}
                                onChange={handleChange}
                                required
                                pattern="[0-9]{6}"
                                title="Enter a 6-digit PIN code"
                                autoComplete="postal-code"
                                className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-600"
                                placeholder="6-digit PIN code"
                            />
                        </div>
                    </div>

                    {submitError && (
                        <p role="alert" className="text-sm text-red-600">
                            {submitError}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={submitted}
                        className="w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {submitted ? "Placing Order..." : "Place Order"}
                    </button>
                </form>

                <aside className="h-fit rounded-xl border p-6">
                    <h2 className="text-xl font-bold">Order Summary</h2>

                    <div className="mt-5 space-y-4">
                        {cartItems.map((item) => (
                            <div
                                key={item.product.id}
                                className="flex justify-between gap-4 text-sm"
                            >
                                <span>
                                    {item.product.name} × {item.quantity}
                                </span>
                                <span className="whitespace-nowrap">
                                    ₹
                                    {(
                                        Number(item.product.price) * item.quantity
                                    ).toLocaleString("en-IN")}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-5 flex justify-between border-t pt-4 font-bold">
                        <span>Total</span>
                        <span>
                            ₹
                            {totalPrice.toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}
                        </span>
                    </div>

                    <p className="mt-4 text-xs text-gray-500">
                        This is a frontend demonstration. Shipping charges, taxes,
                        order creation, and payment are not implemented yet.
                    </p>
                </aside>
            </div>
        </main>
    );
}
