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

type OrderItem = {
  id: string;
  product_name: string;
  variant_label: string;
  unit_price: string | number;
  quantity: number;
  line_total: string | number;
};

async function getOrder(id: string): Promise<{
  order: Order | null;
  items: OrderItem[];
}> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/orders/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return { order: null, items: [] };
  }

  const data = await res.json();
  return {
    order: data.order ?? null,
    items: data.items ?? [],
  };
}

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const { order, items } = await getOrder(orderId);

  if (!order) {
    return <div className="py-10 text-black/70">Order not found.</div>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-xl border border-black/10 bg-white p-6">
        <h1 className="text-3xl font-bold">Order Confirmed</h1>
        <p className="mt-2 text-black/70">
          Thank you, {order.customer_name}. Your order has been placed.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div>
            <div className="text-sm text-black/60">Order Number</div>
            <div className="font-medium">{order.order_number}</div>
          </div>
          <div>
            <div className="text-sm text-black/60">Email</div>
            <div className="font-medium">{order.customer_email}</div>
          </div>
          <div>
            <div className="text-sm text-black/60">Order Status</div>
            <div className="font-medium capitalize">{order.order_status}</div>
          </div>
          <div>
            <div className="text-sm text-black/60">Payment Status</div>
            <div className="font-medium capitalize">{order.payment_status}</div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-black/10 bg-white p-6">
        <h2 className="text-xl font-semibold">Items</h2>

        <div className="mt-4 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between gap-4 border-b border-black/10 pb-4 last:border-b-0">
              <div>
                <div className="font-medium">{item.product_name}</div>
                <div className="text-sm text-black/60">
                  {item.variant_label} × {item.quantity}
                </div>
              </div>
              <div className="font-medium">₹ {item.line_total}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-between border-t border-black/10 pt-4 text-lg font-semibold">
          <span>Total</span>
          <span>₹ {order.total_amount}</span>
        </div>
      </div>
    </div>
  );
}