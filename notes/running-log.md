# Running log

Scratch observations captured during the build, written up properly at the end.

- matching.test.ts covered only non-matches. An always-false implementation would have
  passed both tests. Caught by reading the inputs rather than the names. Mine, and the third
  instance of the same pattern: enumerating examples instead of characterising the space they
  are drawn from.
- DL-11's merge branch assumes exactly two colliding events ("the other is marked merged").
  Agent flagged that three-way collisions are unhandled. Not fixing: rare, and the fix is a
  type change plus tests. Known limitation, my specification error.
- Active check skipped so far: mutation test on identity.ts intersection condition. The
  partial-overlap test exists and passes, but I have not confirmed it goes red when the
  condition is weakened.
- Mutation check on alertability: broke the `priorRecord === null` branch
  (`alert-new-match` -> `no-op`). Exactly one test went red, the one covering that row.
  Tests are not coupled and the branch is genuinely covered. Restored, 19/19 green.
- decideAlertability has a seventh transition DL-07 never names: prior record exists, did
  not match, still does not. The agent flagged it in a comment and returned "no-op" rather
  than inventing behaviour. Fourth instance of my enumerate-examples pattern.
- P3 settled by commit diff, not by inspection: adding the Slack adapter modified zero
  existing files. Four new files, no change to dispatcher.ts or registry.ts. The definition
  of done in 00-plan.md is met and the git history proves it.
- Agent stopped twice before installing @prisma/adapter-better-sqlite3@7.10.0, with evidence
  it had confirmed the version exists and matched it to the pinned Prisma major/minor.
  Clean instance of hard rule 2 working, and the counterpart to C6 where it did not.
- It then offered node:sqlite with raw SQL as a zero-dependency alternative, and correctly
  flagged that as a deviation needing my sign-off rather than deciding itself. Rejected: raw
  SQL against a Prisma-managed schema creates two access paths to the same database, and the
  raw one goes stale silently at the first schema change. That is the P6 drift class one
  layer down. Approved the adapter instead. One dependency, one access path.