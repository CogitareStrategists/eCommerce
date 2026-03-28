"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Order = {
  id: string;
  order_number: string;
  total_amount: string | number;
  payment_status: string;
  order_status: string;
  created_at: string;
};

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setMsg(null);

    const res = await fetch("/api/account/orders", {
      cache: "no-store",
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setMsg(data?.error ?? "Failed to load orders");
      setLoading(false);
      return;
    }

    setOrders(data.orders ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Orders</h1>
        <p className="mt-2 text-black/70">
          View orders placed from your account.
        </p>
      </div>

      {msg && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm">
          {msg}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-black/70">Loading...</div>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-black/10 bg-white p-6 text-black/70">
          No orders found in your account yet.
        </div>
      ) : (
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

                <Link
                  href={`/account/orders/${order.id}`}
                  className="underline"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}