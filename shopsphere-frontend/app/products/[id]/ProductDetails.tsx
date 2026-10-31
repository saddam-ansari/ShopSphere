
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductById } from "../products-api";
import AddToCartButton from "./AddToCartButton";

type Props = {
    id: string;
};

export default async function ProductDetails({
    id,
}: Props) {
    let product;

    try {
        product = await getProductById(id);
    } catch (error) {
        if (
            error instanceof Error &&
            error.message === "PRODUCT_NOT_FOUND"
        ) {
            notFound();
        }

        console.error("Product details error:", error);

        return (
            <div className="rounded-xl bg-white p-8">
                <h1 className="text-2xl font-bold">
                    Unable to load product
                </h1>

                <p className="mt-3 text-gray-600">
                    Please check that the API Gateway and Product
                    Service are running.
                </p>

                <Link
                    href="/products"
                    className="mt-5 inline-block text-blue-700 hover:underline"
                >
                    Back to products
                </Link>
            </div>
        );
    }

    return (
        <div className="mt-8 grid gap-10 rounded-2xl border bg-white p-6 md:grid-cols-2 md:p-10">
            <div className="flex min-h-72 items-center justify-center rounded-xl bg-blue-50 text-8xl">
                💻
            </div>

            <div className="flex flex-col justify-center">
                <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
                    {product.category || "General"}
                </p>

                <h1 className="mt-3 text-3xl font-bold text-gray-400">
                    {product.name}
                </h1>

                <p className="mt-4 leading-7 text-gray-600">
                    {product.description || "Discover this product at ShopSphere."}
                </p>

                <p className="mt-6 text-3xl font-bold text-gray-400">
                    ₹{Number(product.price).toLocaleString("en-IN")}
                </p>

                <p className="mt-3 text-sm text-gray-600">
                    {product.stock > 0
                        ? `${product.stock} units available`
                        : "Currently out of stock"}
                </p>

                <AddToCartButton product={product} />
            </div>
        </div>
    );
}
