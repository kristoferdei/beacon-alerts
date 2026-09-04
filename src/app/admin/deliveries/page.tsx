import Link from "next/link";
import { prisma } from "@/lib/prisma.ts";
import { formatDateTime } from "../format.ts";

export const dynamic = "force-dynamic";

function outcomeClass(status: string): string {
  if (status === "sent") return "outcome-sent";
  if (status === "failed") return "outcome-failed";
  return "outcome-pending";
}

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
              <th>When</th>
              <th>Rule</th>
              <th>Event</th>
              <th>Channel</th>
              <th>Attempt #</th>
              <th>Outcome</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>
            {attempts.map((attempt) => (
              <tr key={attempt.id}>
                <td className="muted">{formatDateTime(attempt.attemptedAt)}</td>
                <td>
                  <Link href={`/admin/rules#rule-${attempt.ruleMatch.rule.id}`}>
                    {attempt.ruleMatch.rule.name}
                  </Link>
                </td>
                <td>
                  <Link href={`/admin/events#event-${attempt.ruleMatch.event.id}`}>
                    {attempt.ruleMatch.event.title}
                  </Link>
                </td>
                <td className="mono">{attempt.channelConfig.channelId}</td>
                <td>{attempt.attemptNumber}</td>
                <td>
                  <span className={`tag ${outcomeClass(attempt.status)}`}>
                    {attempt.status}
                  </span>
                </td>
                <td className="muted">{attempt.error ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
