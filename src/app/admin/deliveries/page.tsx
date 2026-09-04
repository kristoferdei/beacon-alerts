import Link from "next/link";
import { prisma } from "@/lib/prisma.ts";
import { deliveryOutcomeTag, formatDateTime } from "../format.ts";
import { Tag } from "../tag.tsx";

export const dynamic = "force-dynamic";

export default async function DeliveriesPage() {
  const attempts = await prisma.deliveryAttempt.findMany({
    orderBy: { attemptedAt: "desc" },
    include: {
      channelConfig: true,
      ruleMatch: { include: { rule: true, event: true } },
    },
  });

  return (
    <section>
      <h2>Delivery attempts ({attempts.length})</h2>
      {attempts.length === 0 ? (
        <p className="empty">
          No delivery attempts yet. Run <code>npm run cycle</code> to evaluate rules and
          dispatch alerts.
        </p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Outcome</th>
              <th>Rule</th>
              <th>Event</th>
              <th>When</th>
              <th>Channel</th>
              <th>Attempt #</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>
            {attempts.map((attempt) => {
              const tag = deliveryOutcomeTag(attempt.status);
              return (
                <tr key={attempt.id}>
                  <td className="cell-primary">
                    <Tag {...tag} />
                  </td>
                  <td className="cell-primary">
                    <Link href={`/admin/rules#rule-${attempt.ruleMatch.rule.id}`}>
                      {attempt.ruleMatch.rule.name}
                    </Link>
                  </td>
                  <td className="cell-primary">
                    <Link href={`/admin/events#event-${attempt.ruleMatch.event.id}`}>
                      {attempt.ruleMatch.event.title}
                    </Link>
                  </td>
                  <td className="cell-secondary muted" data-label="When">
                    {formatDateTime(attempt.attemptedAt)}
                  </td>
                  <td className="cell-secondary" data-label="Channel">
                    {attempt.channelConfig.channelId}
                  </td>
                  <td className="cell-secondary" data-label="Attempt #">
                    {attempt.attemptNumber}
                  </td>
                  <td className="cell-secondary muted" data-label="Error">
                    {attempt.error ?? "—"}
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
