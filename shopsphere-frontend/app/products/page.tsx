
import { Suspense } from "react";
import ProductList from "./ProductList";

export default function ProductsPage() {
    return (
        <main className="min-h-screen bg-gray-50 px-6 py-12">
            <div className="mx-auto max-w-7xl">
                <p className="font-semibold uppercase tracking-widest text-blue-700">
                    Explore ShopSphere
                </p>

                <h1 className="mt-3 text-4xl font-bold text-gray-900">
                    All Products
                </h1>

                <p className="mt-3 text-gray-600">
                    Explore our collection.
                </p>

                <Suspense
                    fallback={
                        <p className="mt-10 text-gray-600">
                            Loading products...
                        </p>
                    }
                >
                    <ProductList />
                </Suspense>
            </div>
        </main>
    );
}
