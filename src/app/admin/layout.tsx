import { ConsoleNav } from "./console-nav.tsx";
import "../console.css";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="console console--dense">
      <div className="console-shell">
        <h1>Admin</h1>
        <p className="lede">
          Read-only. Scoped to one question: why did this user not get their alert? No
          authentication (DL-09, a known gap).
        </p>
        <ConsoleNav />
        {children}
      </div>
    </div>
  );
}
