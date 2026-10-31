
import { Suspense } from "react";
import EditProductClient from "./EditProductClient";

export default function EditProductPage({ params, }: {
    params: Promise<{ id: string }>;
}) {
    return (
        <Suspense fallback={<p className="p-6">Loading edit page...</p>}>
            <EditProductContent params={params} />
        </Suspense>
    );
}

async function EditProductContent({ params, }: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    return <EditProductClient productId={id} />;
}
