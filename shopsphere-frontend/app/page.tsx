
const products = [
  {
    id: 1,
    name: "Wireless Headphones",
    category: "Electronics",
    price: 2499,
    icon: "🎧",
    color: "bg-blue-100",
  },
  {
    id: 2,
    name: "Smart Watch",
    category: "Accessories",
    price: 3499,
    icon: "⌚",
    color: "bg-purple-100",
  },
  {
    id: 3,
    name: "Running Shoes",
    category: "Fashion",
    price: 1999,
    icon: "👟",
    color: "bg-orange-100",
  },
  {
    id: 4,
    name: "Travel Backpack",
    category: "Lifestyle",
    price: 1599,
    icon: "🎒",
    color: "bg-green-100",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">

      {/* Hero */}
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 md:grid-cols-2 md:py-24">
        <div>
          <p className="font-semibold uppercase tracking-widest text-blue-700">
            Welcome to ShopSphere
          </p>

          <h1 className="mt-4 text-4xl font-bold leading-tight md:text-6xl">
            Everything you love,
            <span className="block text-blue-700">
              in one place.
            </span>
          </h1>

          <p className="mt-5 max-w-lg leading-7 text-gray-600">
            Discover everyday essentials, the latest gadgets,
            and products you'll love at great prices.
          </p>

          <a
            href="/products"
            className="mt-8 inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Explore Products
          </a>
        </div>

        <div className="flex min-h-64 items-center justify-center rounded-3xl bg-blue-100 p-10">
          <div className="text-center">
            <div className="text-8xl">🛍️</div>
            <p className="mt-4 text-lg font-semibold text-blue-900">
              Your next favourite find
            </p>
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="font-semibold text-blue-700">
              HANDPICKED FOR YOU
            </p>
            <h2 className="mt-2 text-3xl font-bold">
              Featured Products
            </h2>
          </div>

          <a
            href="/products"
            className="font-semibold text-blue-700 hover:underline"
          >
            View all →
          </a>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <article
              key={product.id}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div
                className={`flex h-48 items-center justify-center ${product.color}`}
              >
                <span className="text-7xl" role="img" aria-label={product.name}>
                  {product.icon}
                </span>
              </div>

              <div className="p-5">
                <p className="text-sm text-gray-500">
                  {product.category}
                </p>

                <h3 className="mt-2 font-semibold">
                  {product.name}
                </h3>

                <p className="mt-3 text-xl font-bold">
                  ₹{product.price.toLocaleString("en-IN")}
                </p>

                <button
                  type="button"
                  className="mt-4 w-full rounded-lg border border-blue-600 px-4 py-2 font-semibold text-blue-700 hover:bg-blue-50"
                >
                  View Product
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white px-6 py-8 text-center text-sm text-gray-500">
        © 2026 ShopSphere. All rights reserved.
      </footer>
    </main>
  );
}
