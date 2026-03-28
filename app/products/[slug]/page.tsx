import VariantSelector from "./VariantSelector";

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  ingredients: string | null;
  benefits: string | null;
  how_to_use: string | null;
  category_name: string | null;
};

type ProductImage = {
  id: string;
  image_url: string;
  sort_order: number;
  is_primary: boolean;
};

type ProductVariant = {
  id: string;
  label: string;
  price: string | number;
  discount_percent: string | number;
  stock_qty: number;
  sku: string | null;
  is_active: boolean;
};

type ProductReview = {
  id: string;
  reviewer_name: string;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
};

async function getProduct(slug: string): Promise<{
  product: Product | null;
  images: ProductImage[];
  variants: ProductVariant[];
  reviews: ProductReview[];
}> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/products/${slug}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return {
      product: null,
      images: [],
      variants: [],
      reviews: [],
    };
  }

  const data = await res.json();

  return {
    product: data.product ?? null,
    images: data.images ?? [],
    variants: data.variants ?? [],
    reviews: data.reviews ?? [],
  };
}

function renderStars(rating: number) {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { product, images, variants, reviews } = await getProduct(slug);

  if (!product) {
    return <div className="py-10 text-black/70">Product not found.</div>;
  }

  const primaryImage =
    images.find((img) => img.is_primary) ?? images[0] ?? null;

  return (
    <div className="space-y-10">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-black/10 bg-white">
            {primaryImage ? (
              <img
                src={primaryImage.image_url}
                alt={product.name}
                className="h-[420px] w-full object-cover"
              />
            ) : (
              <div className="flex h-[420px] items-center justify-center text-black/50">
                No image
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="overflow-hidden rounded-lg border border-black/10 bg-white"
                >
                  <img
                    src={img.image_url}
                    alt={product.name}
                    className="h-24 w-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            {product.category_name && (
              <div className="text-sm text-black/60">{product.category_name}</div>
            )}
            <h1 className="mt-1 text-3xl font-bold">{product.name}</h1>
            {product.description && (
              <p className="mt-3 text-black/70">{product.description}</p>
            )}
          </div>

          <div className="rounded-xl border border-black/10 bg-white p-5">
            <h2 className="text-lg font-semibold">Variants</h2>

            {variants.length === 0 ? (
              <div className="mt-3 text-sm text-black/60">
                No variants available.
              </div>
            ) : (
          <div className="rounded-xl border border-black/10 bg-white p-5">
            <h2 className="text-lg font-semibold">Select</h2>
            <VariantSelector
              variants={variants}
              productName={product.name}
            />
          </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-black/10 bg-white p-5">
          <h2 className="text-lg font-semibold">Ingredients</h2>
          <p className="mt-3 whitespace-pre-line text-black/70">
            {product.ingredients || "Not added yet."}
          </p>
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-5">
          <h2 className="text-lg font-semibold">Benefits</h2>
          <p className="mt-3 whitespace-pre-line text-black/70">
            {product.benefits || "Not added yet."}
          </p>
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-5">
          <h2 className="text-lg font-semibold">How to Use</h2>
          <p className="mt-3 whitespace-pre-line text-black/70">
            {product.how_to_use || "Not added yet."}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-black/10 bg-white p-5">
        <h2 className="text-lg font-semibold">Reviews</h2>

        {reviews.length === 0 ? (
          <p className="mt-3 text-black/60">No reviews yet.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="border-b border-black/10 pb-4 last:border-b-0">
                <div className="flex items-center justify-between gap-4">
                  <div className="font-medium">{review.reviewer_name}</div>
                  <div className="text-sm text-amber-600">
                    {renderStars(review.rating)}
                  </div>
                </div>

                {review.title && (
                  <div className="mt-2 font-medium">{review.title}</div>
                )}

                {review.body && (
                  <p className="mt-1 text-black/70">{review.body}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
