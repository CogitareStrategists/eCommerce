import AutoScrollRow from "./components/AutoScrollRow";
import HeroSlider from "./components/HeroSlider";
import AddToCartButton from "./components/AddToCartButton";

type HomeApiResponse = {
  sections?: Array<{
    key: string;
    title: string | null;
    items: Array<{
      type: string;
      order: number;
      data: any;
    }>;
  }>;
  error?: string;
  detail?: string;
};

function knowMoreHref(it: { type: string; data: any }) {
  if (it.type === "collection") return `/collections/${it.data?.slug ?? ""}`;
  if (it.type === "product") return `/products/${it.data?.slug ?? ""}`;
  if (it.type === "persona") return `/personas/${it.data?.filter_key ?? ""}`;
  if (it.type === "concern") return `/concerns/${it.data?.filter_key ?? ""}`;
  if (it.type === "video") return it.data?.video_url ?? "#";
  return "/about";
}

function cardImageUrl(it: { type: string; data: any }) {
  if (it.type === "collection") return it.data?.image_url ?? null;
  if (it.type === "persona") return it.data?.image_url ?? null;
  if (it.type === "concern") return it.data?.image_url ?? null;
  if (it.type === "video") return it.data?.thumbnail_url ?? null;
  if (it.type === "product") return it.data?.primary_image_url ?? null;
  return null;
}

function Card({
  it,
  showAddToCart,
}: {
  it: NonNullable<HomeApiResponse["sections"]>[number]["items"][number];
  showAddToCart: boolean;
}) {
  const typeLabel = it.type.replaceAll("_", " ");
  const imageUrl = cardImageUrl(it);
  const href = knowMoreHref(it);
  const isOutOfStock = it.type === "product" && it.data?.in_stock === false;

  return (
    <div className="w-[480px] flex-none overflow-hidden rounded-3xl border border-black/10 bg-white">
      <div className="h-[260px] w-full bg-black/5">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={typeLabel}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-black/40">
            Image
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="text-xs uppercase tracking-wide text-black/50">
          {typeLabel}
        </div>

        {it.type === "collection" && (
          <div className="mt-1 text-2xl font-semibold">{it.data?.name}</div>
        )}

        {it.type === "product" && (
          <div className="mt-1">
            <div className="text-2xl font-semibold">{it.data?.name}</div>
            <div className="mt-2 text-base text-black/70">
              ₹
              {it.data?.starting_price != null
                ? Number(it.data.starting_price).toFixed(2)
                : Number(it.data?.price ?? 0).toFixed(2)}
            </div>
            {it.data?.has_discount && (
              <div className="mt-1 text-xs text-green-700">
                Discount available
              </div>
            )}
            {isOutOfStock && (
              <div className="mt-1 text-xs text-red-600">Out of stock</div>
            )}
          </div>
        )}

        {(it.type === "persona" || it.type === "concern") && (
          <div className="mt-1">
            <div className="text-2xl font-semibold">{it.data?.title}</div>
          </div>
        )}

        {it.type === "video" && (
          <div className="mt-1">
            <div className="text-2xl font-semibold">{it.data?.title}</div>
            <div className="mt-2 text-sm text-black/60">
              {it.data?.platform}
            </div>
          </div>
        )}

        {it.type === "testimonial" && (
          <div className="mt-1">
            <div className="text-2xl font-semibold">
              {it.data?.customer_name}
            </div>
            <div className="mt-2 text-base">
              {"★".repeat(it.data?.rating ?? 0)}
              <span className="text-black/20">
                {"★".repeat(5 - (it.data?.rating ?? 0))}
              </span>
            </div>
            <div className="mt-3 line-clamp-3 text-base text-black/70">
              {it.data?.content}
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <a
            href={href}
            className="rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold hover:bg-black/5"
          >
            {it.type === "collection" ? "View Collection" : "Know More"}
          </a>

          {showAddToCart && it.type === "product" && (
            <AddToCartButton
              item={{
                type: "product",
                id: it.data?.id,
                name: it.data?.name,
                price: Number(
                  it.data?.starting_price != null
                    ? it.data.starting_price
                    : it.data?.price ?? 0
                ),
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function SectionRow({
  sectionKey,
  title,
  items,
}: {
  sectionKey: string;
  title: string;
  items: NonNullable<HomeApiResponse["sections"]>[number]["items"];
}) {
  if (!items?.length) return null;

  const showAddToCart =
    sectionKey === "popular_products" || sectionKey === "all_products";

  return (
    <section className="mb-14">
      <h2 className="mb-8 text-center text-4xl font-semibold">{title}</h2>

      <AutoScrollRow seconds={28}>
        {items.map((it, idx) => (
          <Card
            key={`${it.type}-${it.data?.id ?? idx}`}
            it={it}
            showAddToCart={showAddToCart}
          />
        ))}
      </AutoScrollRow>
    </section>
  );
}

async function fetchProductCards(ids: string[]) {
  const clean = ids.filter(Boolean);
  if (!clean.length) return [];

  const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/public/products/cards?ids=${clean.join(",")}`;
  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json().catch(() => null);

  if (!res.ok) return [];
  return data?.products ?? [];
}

export default async function HomePage() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/home`, { cache: "no-store" });
  const data = (await res.json().catch(() => ({}))) as HomeApiResponse;

  if (!res.ok || !Array.isArray(data.sections)) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-xl font-semibold">Home page failed to load</h1>
        <p className="mt-2 text-sm text-black/70">
          {data?.error || "Unknown error"}
        </p>
        {data?.detail ? (
          <pre className="mt-3 overflow-auto rounded bg-white p-3 text-xs">
            {data.detail}
          </pre>
        ) : null}
      </div>
    );
  }

  const popularIds =
    data.sections
      .find((s) => s.key === "popular_products")
      ?.items?.filter((it) => it.type === "product")
      .map((it) => it.data?.id) ?? [];

  const allIds =
    data.sections
      .find((s) => s.key === "all_products")
      ?.items?.filter((it) => it.type === "product")
      .map((it) => it.data?.id) ?? [];

  const [popularCards, allCards] = await Promise.all([
    fetchProductCards(popularIds),
    fetchProductCards(allIds),
  ]);

  const cardById = new Map<string, any>();
  for (const p of [...popularCards, ...allCards]) {
    cardById.set(p.id, p);
  }

  const merged: HomeApiResponse = {
    sections: data.sections.map((section) => ({
      ...section,
      items: section.items.map((it) => {
        if (it.type !== "product") return it;
        const extra = cardById.get(it.data?.id);
        if (!extra) return it;

        return {
          ...it,
          data: {
            ...it.data,
            primary_image_url: extra.primary_image_url ?? null,
            starting_price: extra.starting_price ?? null,
            has_discount: !!extra.has_discount,
            in_stock: extra.in_stock !== false,
          },
        };
      }),
    })),
  };

  const heroImages = [
    "https://placehold.co/1400x700",
    "https://placehold.co/1400x700?text=Slide+2",
    "https://placehold.co/1400x700?text=Slide+3",
  ];

  return (
    <div>
      <div className="space-y-6">
        <HeroSlider images={heroImages} intervalMs={2500} />

        <div className="rounded-3xl border border-black/10 bg-white p-8">
          <div className="text-sm font-medium text-black/60">Welcome</div>

          <h1 className="mt-2 text-4xl font-bold leading-tight md:text-5xl">
            Discover products that fit your life
          </h1>

          <p className="mt-4 max-w-3xl text-base text-black/70 md:text-lg">
            Shop collections, explore concerns, and find what works for you.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="/products"
              className="rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white hover:opacity-90"
            >
              Shop All Products
            </a>
            <a
              href="/collections"
              className="rounded-xl border border-black/10 px-6 py-3 text-sm font-semibold hover:bg-black/5"
            >
              Browse Collections
            </a>
          </div>
        </div>
      </div>

      <div className="mt-12">
        {merged.sections?.map((section) => (
          <SectionRow
            key={section.key}
            sectionKey={section.key}
            title={section.title ?? section.key}
            items={section.items}
          />
        ))}
      </div>
    </div>
  );
}