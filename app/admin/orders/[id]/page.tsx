"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  shipping_address_line1: string;
  shipping_address_line2: string | null;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  shipping_country: string;
  subtotal: string | number;
  shipping_amount: string | number;
  total_amount: string | number;
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

const ORDER_STATUSES = ["placed", "processing", "shipped", "delivered", "cancelled"];
const PAYMENT_STATUSES = ["pending", "paid", "failed"];

export default function AdminOrderDetailPage() {
  const params = useParams();
  const raw = (params as any)?.id;
  const id = Array.isArray(raw) ? raw[0] : raw;

  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [orderStatus, setOrderStatus] = useState("placed");
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setMsg(null);

    const res = await fetch(`/api/admin/orders/${id}`, { cache: "no-store" });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setMsg(data?.error ?? "Failed to load order");
      setLoading(false);
      return;
    }

    setOrder(data.order ?? null);
    setItems(data.items ?? []);
    setOrderStatus(data.order?.order_status ?? "placed");
    setPaymentStatus(data.order?.payment_status ?? "pending");
    setLoading(false);
  }

  useEffect(() => {
    if (id) load();
  }, [id]);

  async function saveStatuses() {
    setSaving(true);
    setMsg(null);

    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_status: orderStatus,
        payment_status: paymentStatus,
      }),
    });

    const data = await res.json().catch(() => null);
    setSaving(false);

    if (!res.ok) {
      setMsg(data?.error ?? "Failed to update");
      return;
    }

    setMsg("Statuses updated successfully.");
    await load();
  }

  if (loading) {
    return <div className="py-10 text-sm text-black/70">Loading...</div>;
  }

  if (!order) {
    return <div className="py-10 text-sm text-black/70">Order not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Order {order.order_number}</h1>
          <p className="mt-1 text-sm text-black/70">
            Manage order and payment status.
          </p>
        </div>

        <Link
          href="/admin/orders"
          className="rounded-md border border-black/20 px-3 py-2 text-sm hover:bg-black/5"
        >
          Back to Orders
        </Link>
      </div>

      {msg && (
        <div className="rounded-md border border-black/10 bg-black/5 px-3 py-2 text-sm">
          {msg}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-black/10 bg-white p-5">
            <h2 className="text-lg font-semibold">Items</h2>

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
          </div>

          <div className="rounded-xl border border-black/10 bg-white p-5">
            <h2 className="text-lg font-semibold">Shipping</h2>

            <div className="mt-4 space-y-1 text-sm text-black/80">
              <div>{order.customer_name}</div>
              <div>{order.customer_email}</div>
              {order.customer_phone && <div>{order.customer_phone}</div>}
              <div>{order.shipping_address_line1}</div>
              {order.shipping_address_line2 && <div>{order.shipping_address_line2}</div>}
              <div>
                {order.shipping_city}, {order.shipping_state} {order.shipping_postal_code}
              </div>
              <div>{order.shipping_country}</div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-black/10 bg-white p-5">
            <h2 className="text-lg font-semibold">Statuses</h2>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium">Order Status</label>
                <select
                  value={orderStatus}
                  onChange={(e) => setOrderStatus(e.target.value)}
                  className="mt-1 w-full rounded-md border border-black/20 px-3 py-2"
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Payment Status</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="mt-1 w-full rounded-md border border-black/20 px-3 py-2"
                >
                  {PAYMENT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={saveStatuses}
                disabled={saving}
                className="w-full rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Statuses"}
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-black/10 bg-white p-5">
            <h2 className="text-lg font-semibold">Summary</h2>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹ {order.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>₹ {order.shipping_amount}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>₹ {order.total_amount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
