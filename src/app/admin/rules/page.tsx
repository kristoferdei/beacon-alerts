import { prisma } from "@/lib/prisma.ts";
import { formatCondition, formatDateTime } from "../format.ts";

export const dynamic = "force-dynamic";

export default async function RulesPage() {
  const rules = await prisma.alertRule.findMany({
    include: { user: true, channelConfig: true },
    orderBy: { name: "asc" },
  });

  const lastMatchedByRuleId = new Map<string, Date | null>();
  for (const rule of rules) {
    const lastMatch = await prisma.ruleMatch.findFirst({
      where: { ruleId: rule.id, matched: true },
      orderBy: { lastEvaluatedAt: "desc" },
    });
    lastMatchedByRuleId.set(rule.id, lastMatch?.lastEvaluatedAt ?? null);
  }

  return (
    <section>
      <h2>Rules ({rules.length})</h2>
      {rules.length === 0 ? (
        <p className="empty">
          No rules exist yet. Run <code>npm run seed</code> to create the seeded rules.
        </p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Enabled</th>
              <th>Condition</th>
              <th>Source</th>
              <th>Owner</th>
              <th>Channel</th>
              <th>Last matched</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr key={rule.id} id={`rule-${rule.id}`}>
                <td className="cell-primary">{rule.name}</td>
                <td className="cell-primary">{rule.enabled ? "yes" : "no"}</td>
                <td className="cell-primary">{formatCondition(rule)}</td>
                <td className="cell-secondary" data-label="Source">
                  {rule.source}
                </td>
                <td className="cell-secondary" data-label="Owner">
                  {rule.user.name}
                </td>
                <td className="cell-secondary" data-label="Channel">
                  {rule.channelConfig.channelId}
                </td>
                <td className="cell-secondary muted" data-label="Last matched">
                  {formatDateTime(lastMatchedByRuleId.get(rule.id) ?? null)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
