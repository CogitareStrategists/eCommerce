"use client";

function getUserIdFromCookie(): string | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith("user_token="));

  return match ? match.split("=")[1] : null;
}

function getCartKey() {
  const userId = getUserIdFromCookie();
  return userId ? `cart_user_${userId}` : "cart_guest";
}

export type CartItem = {
  variantId: string;
  productName: string;
  variantLabel: string;
  price: number;
  quantity: number;
};

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];

  const key = getCartKey();
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

export function saveCart(cart: CartItem[]) {
  const key = getCartKey();
  localStorage.setItem(key, JSON.stringify(cart));
}

export function addToCart(item: CartItem) {
  const cart = getCart();

  const existing = cart.find((c) => c.variantId === item.variantId);

  if (existing) {
    existing.quantity += item.quantity;
  } else {
    cart.push(item);
  }

  saveCart(cart);
}

export function mergeGuestCartIntoUserCart() {
  if (typeof window === "undefined") return;

  const userId = getUserIdFromCookie();
  if (!userId) return;

  const guestKey = "cart_guest";
  const userKey = `cart_user_${userId}`;

  const guestRaw = localStorage.getItem(guestKey);
  const userRaw = localStorage.getItem(userKey);

  const guestCart: CartItem[] = guestRaw ? JSON.parse(guestRaw) : [];
  const userCart: CartItem[] = userRaw ? JSON.parse(userRaw) : [];

  if (guestCart.length === 0) return;

  const merged = [...userCart];

  for (const guestItem of guestCart) {
    const existing = merged.find((item) => item.variantId === guestItem.variantId);

    if (existing) {
      existing.quantity += guestItem.quantity;
    } else {
      merged.push(guestItem);
    }
  }

  localStorage.setItem(userKey, JSON.stringify(merged));
  localStorage.removeItem(guestKey);
}