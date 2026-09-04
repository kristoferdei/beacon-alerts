import Link from "next/link";

export const dynamic = "force-dynamic";

export default function AdminIndexPage() {
  return (
    <ul className="rule-list">
      <li>
        <Link href="/admin/events">Events</Link> — every ingested event, most recent first,
        with its status, aliases, attributes, and which rules matched it.
      </li>
      <li>
        <Link href="/admin/rules">Rules</Link> — every rule across every user, its condition,
        owner, channel, and when it last matched.
      </li>
      <li>
        <Link href="/admin/deliveries">Delivery attempts</Link> — every send attempt, most
        recent first, with its outcome and error.
      </li>
      <li>
        <Link href="/admin/sources">Source health</Link> — each registered source and how much
        it has produced.
      </li>
    </ul>
  );
}
