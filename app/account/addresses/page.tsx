"use client";

import { useEffect, useState } from "react";

type Address = {
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
  created_at: string;
};

const emptyForm = {
  full_name: "",
  phone: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "India",
  is_default: false,
};

export default function AccountAddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  async function load() {
    setLoading(true);
    setMsg(null);

    const res = await fetch("/api/account/addresses", {
      cache: "no-store",
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setMsg(data?.error ?? "Failed to load addresses");
      setLoading(false);
      return;
    }

    setAddresses(data.addresses ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setMsg(null);
  }

  function startEdit(address: Address) {
    setEditingId(address.id);
    setForm({
      full_name: address.full_name ?? "",
      phone: address.phone ?? "",
      address_line1: address.address_line1 ?? "",
      address_line2: address.address_line2 ?? "",
      city: address.city ?? "",
      state: address.state ?? "",
      postal_code: address.postal_code ?? "",
      country: address.country ?? "India",
      is_default: !!address.is_default,
    });
    setMsg(null);
  }

  async function save() {
    setSaving(true);
    setMsg(null);

    const url = editingId
      ? `/api/account/addresses/${editingId}`
      : "/api/account/addresses";

    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json().catch(() => null);
    setSaving(false);

    if (!res.ok) {
      setMsg(data?.error ?? "Failed to save address");
      return;
    }

    setMsg(editingId ? "Address updated." : "Address added.");
    setEditingId(null);
    setForm(emptyForm);
    await load();
  }

  async function removeAddress(id: string) {
    const ok = confirm("Delete this address?");
    if (!ok) return;

    const res = await fetch(`/api/account/addresses/${id}`, {
      method: "DELETE",
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setMsg(data?.error ?? "Failed to delete address");
      return;
    }

    setMsg("Address deleted.");
    await load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Addresses</h1>
        <p className="mt-2 text-black/70">
          Manage your saved delivery addresses.
        </p>
      </div>

      {msg && (
        <div className="rounded-md border border-black/10 bg-black/5 px-3 py-2 text-sm">
          {msg}
        </div>
      )}

      <div className="rounded-xl border border-black/10 bg-white p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {editingId ? "Edit Address" : "Add New Address"}
          </h2>

          <button
            type="button"
            onClick={startCreate}
            className="rounded-md border border-black/20 px-3 py-2 text-sm hover:bg-black/5"
          >
            New
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Full Name</label>
            <input
              className="mt-1 w-full rounded-md border border-black/20 px-3 py-2"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Phone</label>
            <input
              className="mt-1 w-full rounded-md border border-black/20 px-3 py-2"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Address Line 1</label>
          <input
            className="mt-1 w-full rounded-md border border-black/20 px-3 py-2"
            value={form.address_line1}
            onChange={(e) => setForm({ ...form, address_line1: e.target.value })}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Address Line 2</label>
          <input
            className="mt-1 w-full rounded-md border border-black/20 px-3 py-2"
            value={form.address_line2}
            onChange={(e) => setForm({ ...form, address_line2: e.target.value })}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="text-sm font-medium">City</label>
            <input
              className="mt-1 w-full rounded-md border border-black/20 px-3 py-2"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-medium">State</label>
            <input
              className="mt-1 w-full rounded-md border border-black/20 px-3 py-2"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Postal Code</label>
            <input
              className="mt-1 w-full rounded-md border border-black/20 px-3 py-2"
              value={form.postal_code}
              onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Country</label>
            <input
              className="mt-1 w-full rounded-md border border-black/20 px-3 py-2"
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_default}
            onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
          />
          Make this default address
        </label>

        <button
          onClick={save}
          disabled={saving}
          className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {saving ? "Saving..." : editingId ? "Update Address" : "Add Address"}
        </button>
      </div>

      {loading ? (
        <div className="text-black/70">Loading...</div>
      ) : addresses.length === 0 ? (
        <div className="rounded-xl border border-black/10 bg-white p-6 text-black/70">
          No saved addresses yet.
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className="rounded-xl border border-black/10 bg-white p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="font-medium">{address.full_name}</div>
                    {address.is_default && (
                      <span className="rounded-full bg-black px-2 py-0.5 text-xs text-white">
                        Default
                      </span>
                    )}
                  </div>

                  {address.phone && (
                    <div className="mt-1 text-sm text-black/70">{address.phone}</div>
                  )}

                  <div className="mt-2 text-sm text-black/70">
                    <div>{address.address_line1}</div>
                    {address.address_line2 && <div>{address.address_line2}</div>}
                    <div>
                      {address.city}, {address.state} {address.postal_code}
                    </div>
                    <div>{address.country}</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(address)}
                    className="rounded-md border border-black/20 px-3 py-2 text-sm hover:bg-black/5"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => removeAddress(address.id)}
                    className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}