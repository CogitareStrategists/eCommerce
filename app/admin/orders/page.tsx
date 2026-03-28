"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setMsg(null);

    const res = await fetch("/api/admin/orders", { cache: "no-store" });
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
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="mt-1 text-sm text-black/70">
            View and manage customer orders.
          </p>
        </div>

        <Link
          href="/admin"
          className="rounded-md border border-black/20 px-3 py-2 text-sm hover:bg-black/5"
        >
          Dashboard
        </Link>
      </div>

      {msg && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm">
          {msg}
        </div>
      )}

      {loading ? (
        <div className="py-10 text-sm text-black/70">Loading...</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-black/10">
          <div className="grid grid-cols-12 bg-black/5 px-4 py-3 text-xs font-semibold uppercase text-black/70">
            <div className="col-span-2">Order</div>
            <div className="col-span-3">Customer</div>
            <div className="col-span-2">Total</div>
            <div className="col-span-2">Payment</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1 text-right">View</div>
          </div>

          <div className="divide-y divide-black/10">
            {orders.map((order) => (
              <div key={order.id} className="grid grid-cols-12 items-center px-4 py-3 text-sm">
                <div className="col-span-2">
                  <div className="font-medium">{order.order_number}</div>
                  <div className="text-xs text-black/60">
                    {new Date(order.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="col-span-3">
                  <div className="font-medium">{order.customer_name}</div>
                  <div className="text-xs text-black/60">{order.customer_email}</div>
                </div>

                <div className="col-span-2">₹ {order.total_amount}</div>
                <div className="col-span-2 capitalize">{order.payment_status}</div>
                <div className="col-span-2 capitalize">{order.order_status}</div>

                <div className="col-span-1 text-right">
                  <Link className="underline" href={`/admin/orders/${order.id}`}>
                    View
                  </Link>
                </div>
              </div>
            ))}

            {orders.length === 0 && (
              <div className="px-4 py-8 text-sm text-black/70">
                No orders found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
