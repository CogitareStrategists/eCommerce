import Link from "next/link";

type Section = {
  id: string;
  key: string;
  title: string | null;
  is_enabled: boolean;
  display_order: number;
  item_count: string; // comes from SQL as text
};

async function getData(): Promise<Section[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/home`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return [];
  }

  const data = await res.json();
  return data.sections ?? [];
}

export default async function AdminHomePage() {
  const sections = await getData();

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Home Page Manager</h1>
          <p className="mt-1 text-sm text-black/70">
            View sections and what’s currently selected. Editing comes next.
          </p>
        </div>

        <Link
          href="/"
          className="rounded-md border border-black/20 px-3 py-2 text-sm hover:bg-black/5"
        >
          View Store
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-black/10">
        <div className="grid grid-cols-12 bg-black/5 px-4 py-3 text-xs font-semibold uppercase text-black/70">
          <div className="col-span-1">Order</div>
          <div className="col-span-3">Key</div>
          <div className="col-span-4">Title</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1">Items</div>
          <div className="col-span-1 text-right">Action</div>
        </div>

        <div className="divide-y divide-black/10">
          {sections.map((s) => (
            <div key={s.id} className="grid grid-cols-12 px-4 py-3 text-sm">
              <div className="col-span-1">{s.display_order}</div>
              <div className="col-span-3 font-medium">{s.key}</div>
              <div className="col-span-4 text-black/80">{s.title ?? "-"}</div>
              <div className="col-span-2">
                {s.is_enabled ? (
                  <span className="rounded-full bg-green-100 px-2 py-1 text-xs">
                    Enabled
                  </span>
                ) : (
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs">
                    Disabled
                  </span>
                )}
              </div>
              <div className="col-span-1">{s.item_count}</div>
              <div className="col-span-1 text-right">
                <Link
                  href={`/admin/home/${s.key}`}
                  className="text-sm font-medium underline"
                >
                  Manage
                </Link>
              </div>
            </div>
          ))}

          {sections.length === 0 && (
            <div className="px-4 py-8 text-sm text-black/70">
              No sections found. (If this is unexpected, your API may be failing.)
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
