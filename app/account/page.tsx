export default function AccountPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Account</h1>
        <p className="mt-2 text-black/70">
          Welcome to your account dashboard.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <a
          href="/account/profile"
          className="rounded-xl border border-black/10 bg-white p-5 hover:bg-black/5"
        >
          <div className="font-semibold">Profile</div>
          <div className="mt-1 text-sm text-black/70">
            View and update your profile
          </div>
        </a>

        <a
          href="/account/addresses"
          className="rounded-xl border border-black/10 bg-white p-5 hover:bg-black/5"
        >
          <div className="font-semibold">Addresses</div>
          <div className="mt-1 text-sm text-black/70">
            Manage saved addresses
          </div>
        </a>

        <a
          href="/account/orders"
          className="rounded-xl border border-black/10 bg-white p-5 hover:bg-black/5"
        >
          <div className="font-semibold">My Orders</div>
          <div className="mt-1 text-sm text-black/70">
            View your order history
          </div>
        </a>
      </div>
    </div>
  );
}