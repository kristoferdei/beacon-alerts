import Link from "next/link";
import { prisma } from "@/lib/prisma.ts";
import { formatAttributes, formatDateTime } from "../format.ts";

export const dynamic = "force-dynamic";

function statusClass(status: string): string {
  if (status === "active") return "status-active";
  if (status === "withdrawn") return "status-withdrawn";
  if (status === "merged") return "status-merged";
  return "";
}

export default async function EventsPage() {
  const events = await prisma.event.findMany({
    orderBy: { occurredAt: "desc" },
    include: {
      aliases: true,
      ruleMatches: { where: { matched: true }, include: { rule: true } },
    },
  });

  return (
    <section>
      <h2>Events ({events.length})</h2>
      {events.length === 0 ? (
        <p className="empty">
          No events ingested yet. Run <code>npm run cycle</code> to fetch and process the USGS
          feed.
        </p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Source</th>
              <th>Occurred at</th>
              <th>Status</th>
              <th>Aliases</th>
              <th>Attributes</th>
              <th>Matched by</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id} id={`event-${event.id}`}>
                <td>{event.title}</td>
                <td className="mono">{event.source}</td>
                <td className="muted">{formatDateTime(event.occurredAt)}</td>
                <td>
                  <span className={`tag ${statusClass(event.status)}`}>{event.status}</span>
                </td>
                <td>
                  <ul className="aliases">
                    {event.aliases.map((alias) => (
                      <li key={alias.id} className="mono">
                        {alias.alias}
                      </li>
                    ))}
                  </ul>
                </td>
                <td className="mono">{formatAttributes(event.attributes)}</td>
                <td>
                  {event.ruleMatches.length === 0 ? (
                    <span className="muted">none</span>
                  ) : (
                    <ul className="rule-list">
                      {event.ruleMatches.map((ruleMatch) => (
                        <li key={ruleMatch.id}>
                          <Link href={`/admin/rules#rule-${ruleMatch.rule.id}`}>
                            {ruleMatch.rule.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
