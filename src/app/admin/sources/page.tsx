import { prisma } from "@/lib/prisma.ts";
import { usgsSourceDefinition } from "@/sources/usgs/definition.ts";
import { formatDateTime } from "../format.ts";

export const dynamic = "force-dynamic";

// Source definitions live in code, not the database (architecture doc
// section 8). Only one source is registered today.
const REGISTERED_SOURCES = [usgsSourceDefinition];

export default async function SourcesPage() {
  const rows = await Promise.all(
    REGISTERED_SOURCES.map(async (source) => {
      const [eventCount, mostRecentEvent] = await Promise.all([
        prisma.event.count({ where: { source: source.id } }),
        prisma.event.findFirst({
          where: { source: source.id },
          orderBy: { ingestedAt: "desc" },
        }),
      ]);
      return {
        id: source.id,
        name: source.name,
        eventCount,
        lastIngestedAt: mostRecentEvent?.ingestedAt ?? null,
      };
    }),
  );

  return (
    <section>
      <h2>Source health ({rows.length})</h2>
      <p className="muted">
        &quot;Last successfully polled&quot; is approximated as the most recent time this
        source produced a new or revised event. A poll that ran and found nothing new does not
        move this timestamp, since no record of poll attempts themselves is kept yet.
      </p>
      {rows.length === 0 ? (
        <p className="empty">No sources are registered.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Source</th>
              <th>Events produced</th>
              <th>Last successful activity</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="cell-primary">{row.name}</td>
                <td className="cell-primary">{row.eventCount}</td>
                <td className="cell-secondary muted" data-label="Last successful activity">
                  {formatDateTime(row.lastIngestedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
