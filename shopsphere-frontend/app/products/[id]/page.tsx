
import { Suspense } from "react";
import Link from "next/link";
import ProductDetails from "./ProductDetails";

type Props = {
    params: Promise<{ id: string }>;
};

function ProductDetailsFallback() {
    return (
        <div className="mt-8 animate-pulse rounded-2xl border bg-white p-8">
            <div className="h-8 w-1/3 rounded bg-gray-200" />
            <div className="mt-6 h-5 w-2/3 rounded bg-gray-200" />
            <div className="mt-4 h-5 w-1/2 rounded bg-gray-200" />
            <p className="mt-8 text-gray-500">
                Loading product details...
            </p>
        </div>
    );
}

export default function ProductDetailsPage({
    params,
}: Props) {
    return (
        <main className="min-h-screen bg-gray-50 px-6 py-12">
            <div className="mx-auto max-w-5xl">
                <Link
                    href="/products"
                    className="font-medium text-blue-700 hover:underline"
                >
                    ← Back to products
                </Link>

                <Suspense fallback={<ProductDetailsFallback />}>
                    <ProductDetailsContent params={params} />
                </Suspense>
            </div>
        </main>
    );
}

async function ProductDetailsContent({
    params,
}: Props) {
    const { id } = await params;

    return <ProductDetails id={id} />;
}
