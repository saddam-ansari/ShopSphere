
const API_GATEWAY_URL = process.env.API_GATEWAY_URL ?? "http://localhost:4000";

export type CreateOrderRequest = {
    productId: number;
    quantity: number;
};

export type CreateOrderResponse = {
    success: boolean;
    message: string;
    data?: unknown;
};

export async function createOrder(request: CreateOrderRequest, token: string): Promise<CreateOrderResponse> {
    const response = await fetch(`${API_GATEWAY_URL}/api/orders`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(request),
        cache: "no-store",
    });

    const result: unknown = await response.json();

    if (!response.ok) {
        let message = "Failed to create order";

        if (
            typeof result === "object" &&
            result !== null &&
            "message" in result &&
            typeof result.message === "string"
        ) {
            message = result.message;
        }

        throw new Error(message);
    }

    return result as CreateOrderResponse;
}
