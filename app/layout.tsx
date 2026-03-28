// web/app/layout.tsx
import "./globals.css";
import Link from "next/link";
import SearchOverlay from "./components/SearchOverlay";
import CartLink from "./components/CartLink";
import HeaderAuthAction from "./components/HeaderAuthAction";
import Script from "next/script";

export const metadata = {
  title: "My Store",
  description: "Ecommerce store",
};

function Header() {
  return (
    <header className="border-b border-black/10 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-lg font-bold">
            My Store
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-3 text-sm md:flex">
            <SearchOverlay />
            <Link href="/track-order" className="hover:underline">
              Track Order
            </Link>
            <CartLink />
            <HeaderAuthAction />
          </nav>

          {/* Mobile: Search always visible + hamburger */}
          <div className="flex items-center gap-2 md:hidden">
            <SearchOverlay />

            <details className="group relative">
              <summary className="list-none cursor-pointer select-none rounded-lg border border-black/15 px-3 py-2 text-sm hover:bg-black/5">
                <span className="inline-flex items-center gap-2">
                  <span className="font-medium">Menu</span>
                  <span className="text-black/60 transition-transform group-open:rotate-90">
                    ☰
                  </span>
                </span>
              </summary>

              <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-black/10 bg-white shadow-lg">
                <Link
                  href="/track-order"
                  className="block px-4 py-3 text-sm hover:bg-black/5"
                >
                  Track Order
                </Link>
                <Link
                  href="/cart"
                  className="block px-4 py-3 text-sm hover:bg-black/5"
                >
                  Cart
                </Link>
                <Link
                  href="/login"
                  className="block px-4 py-3 text-sm hover:bg-black/5"
                >
                  Login
                </Link>
              </div>
            </details>
          </div>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-black/10 bg-white">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm md:grid-cols-3">
        <div>
          <div className="font-semibold">My Store</div>
          <p className="mt-2 text-black/70">
            Natural products, fast shipping, easy returns.
          </p>
        </div>

        <div>
          <div className="font-semibold">Company</div>
          <ul className="mt-2 space-y-2 text-black/70">
            <li>
              <Link className="hover:underline" href="/about">
                About
              </Link>
            </li>
            <li>
              <Link className="hover:underline" href="/contact">
                Contact
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <div className="font-semibold">Policies</div>
          <ul className="mt-2 space-y-2 text-black/70">
            <li>
              <Link className="hover:underline" href="/shipping-policy">
                Shipping Policy
              </Link>
            </li>
            <li>
              <Link className="hover:underline" href="/return-refund-policy">
                Return / Refund Policy
              </Link>
            </li>
            <li>
              <Link className="hover:underline" href="/terms">
                Terms
              </Link>
            </li>
            <li>
              <Link className="hover:underline" href="/privacy">
                Privacy
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-black/10 py-4 text-center text-xs text-black/60">
        © {new Date().getFullYear()} My Store. All rights reserved.
      </div>
    </footer>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-black">
        <Header />
        <main className="mx-auto min-h-[70vh] max-w-6xl px-4 py-8">
          {children}
        </main>
        <Footer />
        <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      </body>
    </html>
  );
}