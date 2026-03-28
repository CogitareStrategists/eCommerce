import Link from "next/link";

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
