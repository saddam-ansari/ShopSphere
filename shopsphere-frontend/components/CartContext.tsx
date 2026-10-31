
"use client";

import { createContext, useContext, useEffect, useState, type ReactNode, } from "react";

import type { Product } from "@/types/product";
import type { CartItem } from "@/types/cart";

const CART_STORAGE_KEY = "shopsphere-cart";

type AddToCartResult = | { success: true } | { success: false; message: string };

type CartContextType = {
    cartItems: CartItem[];
    addToCart: (product: Product) => AddToCartResult;
    removeFromCart: (productId: number) => void;
    updateQuantity: (productId: number, quantity: number) => void;
    cartCount: number;
    clearCart: () => void;
    removePurchasedItems: (productIds: number[]) => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

type CartProviderProps = {
    children: ReactNode;
};

export function CartProvider({ children }: CartProviderProps) {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [isHydrated, setIsHydrated] = useState(false);

    // Restore the saved cart in the browser.
    useEffect(() => {
        try {
            const savedCart = localStorage.getItem(CART_STORAGE_KEY);

            if (savedCart) {
                const parsedCart: unknown = JSON.parse(savedCart);

                // Basic validation: ensure the stored value is an array.
                if (Array.isArray(parsedCart)) {
                    setCartItems(parsedCart as CartItem[]);
                }
            }
        } catch (error) {
            console.error("Could not restore the shopping cart:", error);
        } finally {
            setIsHydrated(true);
        }
    }, []);

    // Save cart changes only after restoration has finished.
    useEffect(() => {
        if (!isHydrated) return;

        try {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
        } catch (error) {
            console.error("Could not save the shopping cart:", error);
        }
    }, [cartItems, isHydrated]);

    function addToCart(product: Product): AddToCartResult {
        if (product.stock <= 0) {
            return {
                success: false,
                message: "This product is out of stock.",
            };
        }

        const existingItem = cartItems.find(
            (item) => item.product.id === product.id
        );

        if (existingItem) {
            if (existingItem.quantity >= product.stock) {
                return {
                    success: false,
                    message: `Only ${product.stock} units of ${product.name} are available. You already have the maximum quantity in your cart.`,
                };
            }

            setCartItems((previousItems) =>
                previousItems.map((item) =>
                    item.product.id === product.id
                        ? {
                            ...item,
                            product,
                            quantity: item.quantity + 1,
                        }
                        : item
                )
            );
        } else {
            setCartItems((previousItems) => [
                ...previousItems,
                { product, quantity: 1 },
            ]);
        }

        return { success: true };
    }

    function removeFromCart(productId: number): void {
        setCartItems((previousItems) =>
            previousItems.filter((item) => item.product.id !== productId)
        );
    }

    function updateQuantity(productId: number, quantity: number): void {
        if (!Number.isInteger(quantity)) return;

        setCartItems((previousItems) =>
            previousItems.map((item) => {
                if (item.product.id !== productId) return item;

                if (quantity < 1 || quantity > item.product.stock) {
                    return item;
                }

                return { ...item, quantity };
            })
        );
    }

    function clearCart(): void {
        setCartItems([]);
    }

    function removePurchasedItems(productIds: number[]): void {
        setCartItems((previousItems) =>
            previousItems.filter(
                (item) => !productIds.includes(item.product.id)
            )
        );
    }

    const cartCount = cartItems.reduce(
        (total, item) => total + item.quantity,
        0
    );

    return (
        <CartContext.Provider
            value={{
                cartItems,
                addToCart,
                removeFromCart,
                updateQuantity,
                cartCount,
                clearCart,
                removePurchasedItems,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart(): CartContextType {
    const context = useContext(CartContext);

    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }

    return context;
}
