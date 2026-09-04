import Link from "next/link";
import "./admin.css";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin">
      <h1>Admin</h1>
      <p className="lede">
        Read-only. Scoped to one question: why did this user not get their alert? No
        authentication (DL-09, a known gap).
      </p>
      <nav className="admin-nav">
        <Link href="/admin/events">Events</Link>
        <Link href="/admin/rules">Rules</Link>
        <Link href="/admin/deliveries">Delivery attempts</Link>
        <Link href="/admin/sources">Source health</Link>
      </nav>
      {children}
    </div>
  );
}
