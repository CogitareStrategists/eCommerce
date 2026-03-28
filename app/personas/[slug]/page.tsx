import Link from "next/link";

type Persona = {
  id: string;
  title: string;
  image_url: string | null;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  price: string | number;
  discount_percent: string | number;
  image_url: string | null;
};

async function getPersona(slug: string): Promise<{
  persona: Persona | null;
  products: Product[];
}> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/personas/${slug}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return { persona: null, products: [] };
  }

  const data = await res.json();

  return {
    persona: data.persona ?? null,
    products: data.products ?? [],
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { persona, products } = await getPersona(slug);

  if (!persona) {
    return <div className="py-10 text-black/70">Persona not found.</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{persona.title}</h1>
        <p className="mt-2 text-black/70">
          Products curated for this persona.
        </p>
      </div>

      {persona.image_url && (
        <div className="overflow-hidden rounded-xl border border-black/10">
          <img
            src={persona.image_url}
            alt={persona.title}
            className="h-64 w-full object-cover"
          />
        </div>
      )}

      {products.length === 0 ? (
        <div className="rounded-xl border border-black/10 bg-white p-6 text-black/70">
          No products found for this persona yet.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              className="overflow-hidden rounded-xl border border-black/10 bg-white hover:shadow-sm"
            >
              <div className="h-48 bg-black/5">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-black/40">
                    No image
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="font-semibold">{product.name}</div>

                <div className="mt-2 flex items-center justify-between">
                  <div className="text-sm text-black/70">₹ {product.price}</div>

                  {Number(product.discount_percent) > 0 && (
                    <div className="text-xs text-green-700">
                      {product.discount_percent}% off
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}