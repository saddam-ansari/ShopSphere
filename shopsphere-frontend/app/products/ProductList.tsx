import Link from "next/link";
import { getProducts } from "./products-api";

export default async function ProductList() {
    let products;

    try {
        products = await getProducts();
    } catch (error) {
        console.error("Product loading error:", error);

        return (
            <p className="mt-6 text-red-600">
                Unable to load products. Check the API Gateway
                and Product Service.
            </p>
        );
    }

    if (products.length === 0) {
        return (
            <p className="mt-6 text-gray-600">
                No products available.
            </p>
        );
    }

    return (
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (

                <article
                    key={product.id}
                    className="rounded-2xl border bg-white p-6 transition hover:shadow-lg"
                >
                    <Link
                        href={`/products/${product.id}`}
                        className="block"
                    >
                        <div className="flex h-32 items-center justify-center rounded-xl bg-blue-50 text-5xl">
                            💻
                        </div>

                        <p className="mt-4 text-sm text-gray-500">
                            {product.category || "General"}
                        </p>

                        <h2 className="mt-2 text-lg font-semibold text-gray-400">
                            {product.name}
                        </h2>

                        <p className="mt-2 text-sm text-gray-600">
                            {product.description || "Discover this product at ShopSphere."}
                        </p>

                        <p className="mt-4 text-xl font-bold text-gray-400">
                            ₹{Number(product.price).toLocaleString("en-IN")}
                        </p>

                        <p className="mt-2 text-sm text-gray-500">
                            {product.stock > 0
                                ? `${product.stock} in stock`
                                : "Out of stock"}
                        </p>
                    </Link>
                </article>

            ))}
        </div>
    );
}
