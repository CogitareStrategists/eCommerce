"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCart } from "@/app/lib/cart";

export default function CartLink() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    function update() {
      const cart = getCart();
      const total = cart.reduce((sum, item) => sum + item.quantity, 0);
      setCount(total);
    }

    update();

    window.addEventListener("cart-updated", update);
    window.addEventListener("auth-updated", update);
    window.addEventListener("storage", update);

    return () => {
      window.removeEventListener("cart-updated", update);
      window.removeEventListener("auth-updated", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  return (
    <Link href="/cart" className="rounded-md px-3 py-1 hover:bg-black/5">
      Cart
      {count > 0 && (
        <span className="ml-2 rounded-full bg-black px-2 py-0.5 text-xs text-white">
          {count}
        </span>
      )}
    </Link>
  );
}