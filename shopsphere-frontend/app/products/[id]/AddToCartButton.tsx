
"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/components/CartContext";
import type { Product } from "@/types/product";

type AddToCartButtonProps = {
    product: Product;
};

export default function AddToCartButton({ product, }: AddToCartButtonProps) {
    const { addToCart } = useCart();
    const [message, setMessage] = useState<string>("");

    function handleAddToCart(): void {
        const result = addToCart(product);

        if (!result.success) {
            setMessage(result.message);
            return;
        }

        setMessage(`${product.name} added to cart!`);
    }

    useEffect(() => {
        if (!message) return;

        const timer = setTimeout(() => {
            setMessage("");
        }, 3000);

        return () => clearTimeout(timer);
    }, [message]);

    return (
        <div className="mt-6">
            <button
                type="button"
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
                {product.stock <= 0 ? "Out of Stock" : "Add to Cart"}
            </button>

            {message && (
                <p
                    className={`mt-3 text-sm ${message.includes("added to cart")
                            ? "text-green-700"
                            : "text-red-600"
                        }`}
                    role="status"
                >
                    {message}
                </p>
            )}
        </div>
    );
}
