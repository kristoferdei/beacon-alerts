import Link from "next/link";
import { prisma } from "@/lib/prisma.ts";
import { eventStatusTag, formatAttributes, formatDateTime } from "../format.ts";
import { Tag } from "../tag.tsx";

export const dynamic = "force-dynamic";

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
              <th>Status</th>
              <th>Occurred at</th>
              <th>Source</th>
              <th>Aliases</th>
              <th>Attributes</th>
              <th>Matched by</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => {
              const tag = eventStatusTag(event.status);
              return (
                <tr key={event.id} id={`event-${event.id}`}>
                  <td className="cell-primary">{event.title}</td>
                  <td className="cell-primary">
                    <Tag {...tag} />
                  </td>
                  <td className="cell-primary muted">{formatDateTime(event.occurredAt)}</td>
                  <td className="cell-secondary" data-label="Source">
                    {event.source}
                  </td>
                  <td className="cell-secondary" data-label="Aliases">
                    <ul className="aliases">
                      {event.aliases.map((alias) => (
                        <li key={alias.id} className="id">
                          {alias.alias}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="cell-secondary" data-label="Attributes">
                    {formatAttributes(event.attributes)}
                  </td>
                  <td className="cell-secondary" data-label="Matched by">
                    {event.ruleMatches.length === 0 ? (
                      "none"
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
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
