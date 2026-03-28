"use client";

import { useMemo, useState } from "react";
import { addToCart } from "@/app/lib/cart";

type ProductVariant = {
  id: string;
  label: string;
  price: string | number;
  discount_percent: string | number;
  stock_qty: number;
  sku: string | null;
  is_active: boolean;
};

export default function VariantSelector({
  variants,
  productName,
}: {
  variants: ProductVariant[];
  productName: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(
    variants[0]?.id ?? null
  );
  const [added, setAdded] = useState(false);

  const selected = useMemo(
    () => variants.find((v) => v.id === selectedId) ?? variants[0] ?? null,
    [variants, selectedId]
  );

  if (!variants.length) {
    return (
      <div className="mt-3 text-sm text-black/60">
        No variants available.
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-wrap gap-2">
        {variants.map((v) => {
          const active = selected?.id === v.id;

          return (
            <button
              key={v.id}
              type="button"
              onClick={() => setSelectedId(v.id)}
              className={`rounded-md border px-3 py-2 text-sm ${
                active
                  ? "border-black bg-black text-white"
                  : "border-black/20 bg-white text-black"
              }`}
            >
              {v.label}
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="rounded-lg border border-black/10 p-4">
          <div className="space-y-1">
            <div className="text-sm text-black/60">Selected</div>
            <div className="font-medium">{selected.label}</div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold">₹ {selected.price}</div>

              {Number(selected.discount_percent) > 0 && (
                <div className="text-sm text-green-700">
                  {selected.discount_percent}% off
                </div>
              )}
            </div>

            <div className="text-sm">
              {selected.stock_qty > 0 ? (
                <span className="text-green-700">In stock</span>
              ) : (
                <span className="text-red-600">Out of stock</span>
              )}
            </div>
          </div>

          {selected.sku && (
            <div className="mt-2 text-xs text-black/50">
              SKU: {selected.sku}
            </div>
          )}

          <button
            onClick={() => {
              addToCart({
                variantId: selected.id,
                productName,
                variantLabel: selected.label,
                price: Number(selected.price),
                quantity: 1,
              });

              window.dispatchEvent(new Event("cart-updated"));
              setAdded(true);
              setTimeout(() => setAdded(false), 2000);
            }}
            disabled={selected.stock_qty === 0}
            className="mt-4 w-full rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {selected.stock_qty > 0 ? "Add to Cart" : "Out of Stock"}
          </button>

          {added && (
            <div className="mt-2 text-sm text-green-700">
              Added to cart
            </div>
          )}
        </div>
      )}
    </div>
  );
}