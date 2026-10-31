import { Suspense } from "react";
import TrackOrderPage from "./tracking-client";

export default function Page() {
    return (
        <Suspense fallback={<main className="p-6">Loading order tracking...</main>}>
            <TrackOrderPage />
        </Suspense>
    );
}