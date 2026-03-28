import fs from "fs";
import path from "path";

const pages = [
  ["app/collections/page.tsx", "Collections"],
  ["app/collections/[slug]/page.tsx", "Collection Detail"],
  ["app/products/page.tsx", "All Products"],
  ["app/products/[slug]/page.tsx", "Product Detail"],
  ["app/search/page.tsx", "Search Results"],
  ["app/cart/page.tsx", "Cart"],
  ["app/checkout/page.tsx", "Checkout"],
  ["app/payment/confirmation/page.tsx", "Payment Confirmation"],
  ["app/order/confirmation/[orderId]/page.tsx", "Order Confirmation"],
  ["app/signup/page.tsx", "Sign Up"],
  ["app/login/page.tsx", "Login"],
  ["app/forgot-password/page.tsx", "Forgot Password"],
  ["app/reset-password/page.tsx", "Reset Password"],
  ["app/verify/page.tsx", "Email Verification"],
  ["app/about/page.tsx", "About Us"],
  ["app/contact/page.tsx", "Contact Us"],
  ["app/shipping-policy/page.tsx", "Shipping Policy"],
  ["app/return-refund-policy/page.tsx", "Return / Refund Policy"],
  ["app/terms/page.tsx", "Terms & Conditions"],
  ["app/privacy/page.tsx", "Privacy Policy"],
  ["app/track-order/page.tsx", "Track Order"],
  ["app/account/page.tsx", "Account Dashboard"],
  ["app/account/profile/page.tsx", "Profile"],
  ["app/account/addresses/page.tsx", "Address Management"],
  ["app/account/orders/page.tsx", "My Orders"],
  ["app/account/orders/[orderId]/page.tsx", "Order Details"],
];

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeFile(filePath, title) {
  const content = `export default function Page() {
  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold">${title}</h1>
    </div>
  );
}
`;
  fs.writeFileSync(filePath, content, "utf8");
}

let count = 0;
for (const [rel, title] of pages) {
  const full = path.join(process.cwd(), rel);
  ensureDir(path.dirname(full));
  writeFile(full, title);
  count++;
}

console.log(`DONE: Created/filled ${count} pages.`);