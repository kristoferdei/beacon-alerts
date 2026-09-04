import Link from "next/link";
import "./admin/admin.css";

export default function Home() {
  return (
    <main className="admin">
      <h1>beacon-alerts</h1>
      <p className="lede">
        An alerting system: users subscribe to rules, events are ingested from external
        sources, and matching events are delivered over email and Slack through a channel
        abstraction that new channels can be added to.
      </p>
      <p>
        There is no data yet. Populate it, then open <Link href="/admin">/admin</Link>:
      </p>
      <ol>
        <li>
          <code className="mono">npm run seed</code> — creates a user, a channel, and two
          alert rules.
        </li>
        <li>
          <code className="mono">npm run cycle</code> — fetches the live USGS feed, evaluates
          the rules, and dispatches any alerts.
        </li>
      </ol>
    </main>
  );
}
