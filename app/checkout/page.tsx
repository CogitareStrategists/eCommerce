"use client";

import { useEffect, useMemo, useState } from "react";
import { getCart, saveCart } from "@/app/lib/cart";
import { useRouter } from "next/navigation";

type CartItem = {
  variantId: string;
  productName: string;
  variantLabel: string;
  price: number;
  quantity: number;
};

type CheckoutUser = {
  id: string;
  full_name: string;
  email: string;
};

type SavedAddress = {
  id: string;
  full_name: string;
  phone: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
};

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("India");

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");

  const [placing, setPlacing] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setItems(getCart());
  }, []);

  useEffect(() => {
    async function loadCheckoutData() {
      const res = await fetch("/api/account/checkout-data", {
        cache: "no-store",
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data) return;

      const user: CheckoutUser | null = data.user ?? null;
      const addresses: SavedAddress[] = data.addresses ?? [];

      if (user) {
        setCustomerName((prev) => prev || user.full_name || "");
        setCustomerEmail((prev) => prev || user.email || "");
      }

      setSavedAddresses(addresses);

      const defaultAddress =
        addresses.find((a) => a.is_default) ?? addresses[0] ?? null;

      if (defaultAddress) {
        applyAddress(defaultAddress);
        setSelectedAddressId(defaultAddress.id);
      }
    }

    loadCheckoutData();
  }, []);

  function applyAddress(address: SavedAddress) {
    setCustomerName(address.full_name || "");
    setCustomerPhone(address.phone || "");
    setAddress1(address.address_line1 || "");
    setAddress2(address.address_line2 || "");
    setCity(address.city || "");
    setStateName(address.state || "");
    setPostalCode(address.postal_code || "");
    setCountry(address.country || "India");
  }

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  async function placeOrderAfterPayment(paymentResponse: any) {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        shipping_address_line1: address1,
        shipping_address_line2: address2,
        shipping_city: city,
        shipping_state: stateName,
        shipping_postal_code: postalCode,
        shipping_country: country,
        items,
        razorpay_payment_id: paymentResponse?.razorpay_payment_id,
        razorpay_order_id: paymentResponse?.razorpay_order_id,
        razorpay_signature: paymentResponse?.razorpay_signature,
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setMsg(data?.error ?? "Payment succeeded but order creation failed");
      return;
    }

    saveCart([]);
    window.dispatchEvent(new Event("cart-updated"));
    router.push(`/order/confirmation/${data.orderId}`);
  }

  async function startPayment() {
    setMsg(null);

    if (!items.length) {
      setMsg("Your cart is empty.");
      return;
    }

    if (
      !customerName ||
      !customerEmail ||
      !address1 ||
      !city ||
      !stateName ||
      !postalCode
    ) {
      setMsg("Please fill all required checkout details.");
      return;
    }

    if (!window.Razorpay) {
      setMsg("Razorpay SDK not loaded.");
      return;
    }

    setPlacing(true);

    const createOrderRes = await fetch("/api/razorpay/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount: subtotal }),
    });

    const orderData = await createOrderRes.json().catch(() => null);

    if (!createOrderRes.ok) {
      setPlacing(false);
      setMsg(orderData?.error ?? "Failed to start payment");
      return;
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: orderData.amount,
      currency: orderData.currency,
      name: "Your Store",
      description: "Order Payment",
      order_id: orderData.orderId,
      prefill: {
        name: customerName,
        email: customerEmail,
        contact: customerPhone,
      },
      theme: {
        color: "#000000",
      },
      handler: async function (response: any) {
        const verifyRes = await fetch("/api/razorpay/verify-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(response),
        });

        const verifyData = await verifyRes.json().catch(() => null);

        if (!verifyRes.ok) {
          setMsg(verifyData?.error ?? "Payment verification failed");
          return;
        }

        await placeOrderAfterPayment(response);
      },
      modal: {
        ondismiss: function () {
          setPlacing(false);
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
    setPlacing(false);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div>
          <h1 className="text-3xl font-bold">Checkout</h1>
          <p className="mt-2 text-black/70">Enter shipping and contact details.</p>
        </div>

        {msg && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm">
            {msg}
          </div>
        )}

        {savedAddresses.length > 0 && (
          <div className="space-y-4 rounded-xl border border-black/10 bg-white p-5">
            <h2 className="text-lg font-semibold">Saved Addresses</h2>

            <div className="space-y-3">
              {savedAddresses.map((address) => (
                <label
                  key={address.id}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-black/10 p-4"
                >
                  <input
                    type="radio"
                    name="saved-address"
                    checked={selectedAddressId === address.id}
                    onChange={() => {
                      setSelectedAddressId(address.id);
                      applyAddress(address);
                    }}
                  />

                  <div className="text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{address.full_name}</span>
                      {address.is_default && (
                        <span className="rounded-full bg-black px-2 py-0.5 text-xs text-white">
                          Default
                        </span>
                      )}
                    </div>

                    {address.phone && (
                      <div className="mt-1 text-black/70">{address.phone}</div>
                    )}

                    <div className="mt-1 text-black/70">
                      <div>{address.address_line1}</div>
                      {address.address_line2 && <div>{address.address_line2}</div>}
                      <div>
                        {address.city}, {address.state} {address.postal_code}
                      </div>
                      <div>{address.country}</div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4 rounded-xl border border-black/10 bg-white p-5">
          <h2 className="text-lg font-semibold">Contact Details</h2>

          <div>
            <label className="text-sm font-medium">Full Name</label>
            <input
              className="mt-1 w-full rounded-md border border-black/20 px-3 py-2"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              className="mt-1 w-full rounded-md border border-black/20 px-3 py-2"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Phone</label>
            <input
              className="mt-1 w-full rounded-md border border-black/20 px-3 py-2"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-black/10 bg-white p-5">
          <h2 className="text-lg font-semibold">Shipping Address</h2>

          <div>
            <label className="text-sm font-medium">Address Line 1</label>
            <input
              className="mt-1 w-full rounded-md border border-black/20 px-3 py-2"
              value={address1}
              onChange={(e) => setAddress1(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Address Line 2</label>
            <input
              className="mt-1 w-full rounded-md border border-black/20 px-3 py-2"
              value={address2}
              onChange={(e) => setAddress2(e.target.value)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium">City</label>
              <input
                className="mt-1 w-full rounded-md border border-black/20 px-3 py-2"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">State</label>
              <input
                className="mt-1 w-full rounded-md border border-black/20 px-3 py-2"
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Postal Code</label>
              <input
                className="mt-1 w-full rounded-md border border-black/20 px-3 py-2"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Country</label>
            <input
              className="mt-1 w-full rounded-md border border-black/20 px-3 py-2"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="h-fit rounded-xl border border-black/10 bg-white p-5">
        <h2 className="text-xl font-semibold">Order Summary</h2>

        <div className="mt-4 space-y-3">
          {items.length === 0 ? (
            <div className="text-sm text-black/60">Your cart is empty.</div>
          ) : (
            items.map((item) => (
              <div key={item.variantId} className="flex justify-between gap-4 text-sm">
                <div>
                  <div className="font-medium">{item.productName}</div>
                  <div className="text-black/60">
                    {item.variantLabel} × {item.quantity}
                  </div>
                </div>
                <div>₹ {item.price * item.quantity}</div>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 border-t border-black/10 pt-4">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>₹ {subtotal}</span>
          </div>

          <div className="mt-2 flex justify-between text-sm">
            <span>Shipping</span>
            <span>₹ 0</span>
          </div>

          <div className="mt-3 flex justify-between font-semibold">
            <span>Total</span>
            <span>₹ {subtotal}</span>
          </div>
        </div>

        <button
          onClick={startPayment}
          disabled={placing || items.length === 0}
          className="mt-6 w-full rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {placing ? "Starting Payment..." : "Pay Now"}
        </button>
      </div>
    </div>
  );
}