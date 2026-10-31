import type { Product } from "@/types/product";

const API_URL =
    process.env.API_GATEWAY_URL ?? "http://localhost:4000";

export async function getProducts(): Promise<Product[]> {
    const response = await fetch(`${API_URL}/api/products`, {
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
    }

    const result: unknown = await response.json();

    if (Array.isArray(result)) {
        return result as Product[];
    }

    if (typeof result === "object" && result !== null) {
        const body = result as Record<string, unknown>;

        if (Array.isArray(body.data)) {
            return body.data as Product[];
        }

        if (Array.isArray(body.products)) {
            return body.products as Product[];
        }
    }

    throw new Error("Unexpected products API response format");
}


export async function getProductById(id: string): Promise<Product> {
    const response = await fetch(
        `${API_URL}/api/products/${encodeURIComponent(id)}`,
        {
            cache: "no-store",
        }
    );

    if (response.status === 404) {
        throw new Error("PRODUCT_NOT_FOUND");
    }

    if (!response.ok) {
        throw new Error(
            `Failed to fetch product: ${response.status}`
        );
    }

    const result: unknown = await response.json();

    // Supports either a direct product object or
    // a response wrapped in { data: product }.
    if (typeof result === "object" && result !== null) {
        const body = result as Record<string, unknown>;

        if (typeof body.id === "number" && typeof body.name === "string") {
            return body as unknown as Product;
        }

        if (typeof body.data === "object" && body.data !== null) {
            const product = body.data as Record<string, unknown>;

            if (typeof product.id === "number" && typeof product.name === "string") {
                return product as unknown as Product;
            }
        }
    }

    throw new Error("Unexpected product API response format");
}
