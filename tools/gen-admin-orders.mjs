import fs from "fs";
import path from "path";

const root = process.cwd();

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf8");
  console.log("Wrote:", path.relative(root, filePath));
}

// API: list orders
writeFile(
  path.join(root, "app", "api", "admin", "orders", "route.ts"),
  `import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    const res = await pool.query(
      \`select
        id,
        order_number,
        customer_name,
        customer_email,
        total_amount,
        payment_status,
        order_status,
        created_at
       from orders
       order by created_at desc\`
    );

    return NextResponse.json({ orders: res.rows });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load orders", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
`
);

// API: single order + update statuses
writeFile(
  path.join(root, "app", "api", "admin", "orders", "[id]", "route.ts"),
  `import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

const ORDER_STATUSES = ["placed", "processing", "shipped", "delivered", "cancelled"];
const PAYMENT_STATUSES = ["pending", "paid", "failed"];

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const orderRes = await pool.query(
      \`select
        id,
        order_number,
        customer_name,
        customer_email,
        customer_phone,
        shipping_address_line1,
        shipping_address_line2,
        shipping_city,
        shipping_state,
        shipping_postal_code,
        shipping_country,
        subtotal,
        shipping_amount,
        total_amount,
        payment_status,
        order_status,
        created_at
       from orders
       where id = $1::uuid
       limit 1\`,
      [id]
    );

    const order = orderRes.rows[0];
    if (!order) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const itemsRes = await pool.query(
      \`select
        id,
        product_name,
        variant_label,
        unit_price,
        quantity,
        line_total
       from order_items
       where order_id = $1::uuid
       order by created_at asc\`,
      [id]
    );

    return NextResponse.json({
      order,
      items: itemsRes.rows,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load order", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await req.json().catch(() => null);
    const order_status = (body?.order_status ?? "").toString().trim().toLowerCase();
    const payment_status = (body?.payment_status ?? "").toString().trim().toLowerCase();

    if (!ORDER_STATUSES.includes(order_status)) {
      return NextResponse.json(
        { error: "Invalid order_status" },
        { status: 400 }
      );
    }

    if (!PAYMENT_STATUSES.includes(payment_status)) {
      return NextResponse.json(
        { error: "Invalid payment_status" },
        { status: 400 }
      );
    }

    const res = await pool.query(
      \`update orders
       set order_status = $1,
           payment_status = $2
       where id = $3::uuid
       returning id, order_status, payment_status\`,
      [order_status, payment_status, id]
    );

    const order = res.rows[0];
    if (!order) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to update order", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
`
);

// Admin list page
writeFile(
  path.join(root, "app", "admin", "orders", "page.tsx"),
  `"use client";

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
                  <Link className="underline" href={\`/admin/orders/\${order.id}\`}>
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
`
);

// Admin detail page
writeFile(
  path.join(root, "app", "admin", "orders", "[id]", "page.tsx"),
  `"use client";

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

    const res = await fetch(\`/api/admin/orders/\${id}\`, { cache: "no-store" });
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

    const res = await fetch(\`/api/admin/orders/\${id}\`, {
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
`
);

// Update dashboard link
writeFile(
  path.join(root, "app", "admin", "page.tsx"),
  `import Link from "next/link";

export default function AdminDashboard() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-black/70">Manage store content.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Link
          href="/admin/home"
          className="rounded-xl border border-black/10 p-4 hover:bg-black/5"
        >
          <div className="font-semibold">Home Page</div>
          <div className="mt-1 text-sm text-black/70">
            Sections, items, and ordering.
          </div>
        </Link>

        <Link
          href="/admin/collections"
          className="rounded-xl border border-black/10 p-4 hover:bg-black/5"
        >
          <div className="font-semibold">Collections</div>
          <div className="mt-1 text-sm text-black/70">
            Add, edit, and delete collections.
          </div>
        </Link>

        <Link
          href="/admin/categories"
          className="rounded-xl border border-black/10 p-4 hover:bg-black/5"
        >
          <div className="font-semibold">Categories</div>
          <div className="mt-1 text-sm text-black/70">
            Add, edit, and delete categories.
          </div>
        </Link>

        <Link
          href="/admin/orders"
          className="rounded-xl border border-black/10 p-4 hover:bg-black/5"
        >
          <div className="font-semibold">Orders</div>
          <div className="mt-1 text-sm text-black/70">
            View and update order statuses.
          </div>
        </Link>
      </div>
    </div>
  );
}
`
);

console.log("Done.");