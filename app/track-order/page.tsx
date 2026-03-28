"use client";

import { useState } from "react";

type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  total_amount: string | number;
  payment_status: string;
  order_status: string;
  created_at: string;
};

export default function TrackOrderPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  async function trackOrders() {
    setLoading(true);
    setMsg(null);
    setOrders([]);

    const res = await fetch("/api/track-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customer_email: email,
      }),
    });

    const data = await res.json().catch(() => null);
    setLoading(false);

    if (!res.ok) {
      setMsg(data?.error ?? "Failed to fetch orders");
      return;
    }

    setOrders(data.orders ?? []);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-8">
      <div>
        <h1 className="text-3xl font-bold">Track Order</h1>
        <p className="mt-2 text-black/70">
          Enter your email to view your orders.
        </p>
      </div>

      <div className="space-y-4 rounded-xl border border-black/10 bg-white p-5">
        <div>
          <label className="text-sm font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-black/20 px-3 py-2"
            placeholder="you@example.com"
          />
        </div>

        <button
          onClick={trackOrders}
          disabled={loading}
          className="w-full rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Checking..." : "View Orders"}
        </button>
      </div>

      {msg && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm">
          {msg}
        </div>
      )}

      {orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-xl border border-black/10 bg-white p-5"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-medium">{order.order_number}</div>
                  <div className="text-sm text-black/60">
                    {new Date(order.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-medium">₹ {order.total_amount}</div>
                  <div className="text-xs text-black/60 capitalize">
                    {order.order_status}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-4 text-sm">
                <div>
                  Payment:{" "}
                  <span className="capitalize">{order.payment_status}</span>
                </div>

                <a
                  href={`/order/confirmation/${order.id}`}
                  className="underline"
                >
                  View Details
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}