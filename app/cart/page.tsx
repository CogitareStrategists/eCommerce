"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getCart, saveCart } from "@/app/lib/cart";

type CartItem = {
  variantId: string;
  productName: string;
  variantLabel: string;
  price: number;
  quantity: number;
};

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(getCart());
  }, []);

  function updateQuantity(variantId: string, nextQty: number) {
    const updated = items
      .map((item) =>
        item.variantId === variantId
          ? { ...item, quantity: Math.max(1, nextQty) }
          : item
      )
      .filter((item) => item.quantity > 0);

    setItems(updated);
    saveCart(updated);
  }

  function removeItem(variantId: string) {
    const updated = items.filter((item) => item.variantId !== variantId);
    setItems(updated);
    saveCart(updated);
  }

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div>
          <h1 className="text-3xl font-bold">Cart</h1>
          <p className="mt-2 text-black/70">Review items before checkout.</p>
        </div>

        {items.length === 0 ? (
          <div className="rounded-xl border border-black/10 bg-white p-6 text-black/70">
            Your cart is empty.
            <div className="mt-3">
              <Link href="/products" className="underline">
                Continue shopping
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.variantId}
                className="rounded-xl border border-black/10 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold">{item.productName}</div>
                    <div className="text-sm text-black/70">
                      {item.variantLabel}
                    </div>
                    <div className="mt-2 text-sm text-black/70">
                      ₹ {item.price}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-semibold">
                      ₹ {item.price * item.quantity}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        updateQuantity(item.variantId, item.quantity - 1)
                      }
                      className="rounded-md border border-black/20 px-3 py-1"
                    >
                      -
                    </button>

                    <div className="min-w-8 text-center text-sm">
                      {item.quantity}
                    </div>

                    <button
                      onClick={() =>
                        updateQuantity(item.variantId, item.quantity + 1)
                      }
                      className="rounded-md border border-black/20 px-3 py-1"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(item.variantId)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="h-fit rounded-xl border border-black/10 bg-white p-5">
        <h2 className="text-xl font-semibold">Order Summary</h2>

        <div className="mt-4 flex justify-between text-sm">
          <span>Subtotal</span>
          <span>₹ {subtotal}</span>
        </div>

        <div className="mt-2 flex justify-between text-sm">
          <span>Shipping</span>
          <span>Calculated at checkout</span>
        </div>

        <Link
          href="/checkout"
          className={`mt-6 block w-full rounded-md px-4 py-2 text-center text-white ${
            items.length === 0
              ? "pointer-events-none bg-black/40"
              : "bg-black"
          }`}
        >
          Proceed to Checkout
        </Link>

        <Link
          href="/products"
          className="mt-3 block text-center text-sm text-black/70 hover:underline"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}