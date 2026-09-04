// Alertability, docs/02-architecture.md section 5 and docs/03-decision-log.md
// DL-07. Matching and alerting are separate questions: a rule can match the
// same event on every poll forever, but should only ever alert on the
// transition into a matching state.

// The stored rule_matches row for this (rule, event) pair, if one exists yet.
export type PriorMatchRecord = { matched: boolean } | null;

// One name per row of the DL-07 transition table, so a test can assert on
// exactly which row fired.
export type AlertabilityAction =
  | "alert-new-match" // no record, rule now matches
  | "no-op" // no record, rule does not match
  | "already-alerted" // prior record matched, still matches
  | "record-no-alert" // prior record matched, revision no longer matches
  | "alert-revision-match" // prior record did not match, revision now matches
  | "withdraw"; // event withdrawn, regardless of prior record

export function decideAlertability(
  eventStatus: "active" | "withdrawn",
  currentlyMatches: boolean,
  priorRecord: PriorMatchRecord,
): AlertabilityAction {
  if (eventStatus === "withdrawn") {
    return "withdraw";
  }

  if (priorRecord === null) {
    return currentlyMatches ? "alert-new-match" : "no-op";
  }

  if (priorRecord.matched) {
    return currentlyMatches ? "already-alerted" : "record-no-alert";
  }

  // priorRecord.matched === false. The transition table has no row for
  // "not matched, still not matching" (only "not matched -> now matches" is
  // named); nothing to alert and nothing changed, so it's a no-op like the
  // no-record case above.
  return currentlyMatches ? "alert-revision-match" : "no-op";
}
