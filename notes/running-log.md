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