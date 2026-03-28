"use client";

import { useState } from "react";

type CartItem = {
  type: "product" | "collection";
  id: string;
  name: string;
  price?: number;
  qty: number;
};

export default function AddToCartButton({
  item,
}: {
  item: Omit<CartItem, "qty">;
}) {
  const [added, setAdded] = useState(false);

  function addToCart() {
    try {
      const raw = localStorage.getItem("cart_v1");
      const cart: CartItem[] = raw ? JSON.parse(raw) : [];

      const found = cart.find((c) => c.type === item.type && c.id === item.id);
      if (found) {
        found.qty += 1;
      } else {
        cart.push({ ...item, qty: 1 });
      }

      localStorage.setItem("cart_v1", JSON.stringify(cart));
      setAdded(true);
      setTimeout(() => setAdded(false), 900);
    } catch {
      // do nothing (very rare)
    }
  }

  return (
    <button
      onClick={addToCart}
      className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
      type="button"
    >
      {added ? "Added ✓" : "Add to Cart"}
    </button>
  );
}