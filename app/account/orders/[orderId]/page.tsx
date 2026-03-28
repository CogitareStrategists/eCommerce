"use client";

import { useEffect, useState } from "react";

type Order = {
  id: string;
  order_number: string;
  total_amount: string | number;
  subtotal: string | number;
  shipping_amount: string | number;
  payment_status: string;
  order_status: string;
  created_at: string;
};

type OrderItem = {
  id: string;
  product_name: string;
  variant_label: string;
  unit_price: string | number;
  quantity: number;
  line_total: string | number;
};

export default function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const [orderId, setOrderId] = useState<string>("");
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const resolved = await params;
      if (!active) return;

      setOrderId(resolved.orderId);
      setLoading(true);
      setMsg(null);

      const res = await fetch(`/api/account/orders/${resolved.orderId}`, {
        cache: "no-store",
      });

      const data = await res.json().catch(() => null);

      if (!active) return;

      if (!res.ok) {
        setMsg(data?.error ?? "Failed to load order");
        setLoading(false);
        return;
      }

      setOrder(data.order ?? null);
      setItems(data.items ?? []);
      setLoading(false);
    }

    load();

    return () => {
      active = false;
    };
  }, [params]);

  if (loading) {
    return <div className="py-10 text-black/70">Loading...</div>;
  }

  if (!order) {
    return (
      <div className="space-y-4 py-10">
        <div className="text-black/70">{msg ?? "Order not found."}</div>
        <a href="/account/orders" className="underline">
          Back to My Orders
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Order {order.order_number}</h1>
        <p className="mt-2 text-black/70">View details of your order.</p>
      </div>

      <div className="rounded-xl border border-black/10 bg-white p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="text-sm text-black/60">Order Status</div>
            <div className="font-medium capitalize">{order.order_status}</div>
          </div>

          <div>
            <div className="text-sm text-black/60">Payment Status</div>
            <div className="font-medium capitalize">{order.payment_status}</div>
          </div>

          <div>
            <div className="text-sm text-black/60">Date</div>
            <div className="font-medium">
              {new Date(order.created_at).toLocaleDateString()}
            </div>
          </div>

          <div>
            <div className="text-sm text-black/60">Order Number</div>
            <div className="font-medium">{order.order_number}</div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-black/10 bg-white p-6">
        <h2 className="text-xl font-semibold">Items</h2>

        <div className="mt-4 space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex justify-between gap-4 border-b border-black/10 pb-4 last:border-b-0"
            >
              <div>
                <div className="font-medium">{item.product_name}</div>
                <div className="text-sm text-black/60">
                  {item.variant_label} × {item.quantity}
                </div>
                <div className="text-sm text-black/60">
                  Unit: ₹ {item.unit_price}
                </div>
              </div>

              <div className="font-medium">₹ {item.line_total}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-2 border-t border-black/10 pt-4 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>₹ {order.subtotal}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>₹ {order.shipping_amount}</span>
          </div>
          <div className="flex justify-between text-base font-semibold">
            <span>Total</span>
            <span>₹ {order.total_amount}</span>
          </div>
        </div>
      </div>

      <a href="/account/orders" className="underline">
        Back to My Orders
      </a>
    </div>
  );
}