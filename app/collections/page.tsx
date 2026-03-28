import Link from "next/link";

type Collection = {
  id: string;
  name: string;
  slug: string;
  image_url: string;
};

async function getCollections(): Promise<Collection[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/collections`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return [];
  }

  const data = await res.json();
  return data.collections ?? [];
}

export default async function CollectionsPage() {
  const collections = await getCollections();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Collections</h1>
        <p className="mt-2 text-black/70">
          Browse product collections curated for different needs.
        </p>
      </div>

      {collections.length === 0 ? (
        <div className="rounded-xl border border-black/10 bg-white p-6 text-black/70">
          No collections found.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {collections.map((item) => (
            <Link
              key={item.id}
              href={`/collections/${item.slug}`}
              className="overflow-hidden rounded-xl border border-black/10 bg-white transition hover:-translate-y-0.5"
            >
              <img
                src={item.image_url}
                alt={item.name}
                className="h-48 w-full object-cover"
              />
              <div className="p-4">
                <h2 className="font-semibold">{item.name}</h2>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}