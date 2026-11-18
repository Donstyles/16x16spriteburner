# Vault

Snapshots of the game to go back to. Each is a commit on this branch (it stays in the history for good) and a frozen,
playable copy published as its own artifact.

| Name | Commit | Date | Game version | Frozen copy |
| --- | --- | --- | --- | --- |
| pre-inventory | `fc4da12` | 2026-11-18 | v135 | https://claude.ai/artifact/BBmihUxLcvrLfbYQzLbivy |

To go back to one: ask Claude to restore it by name. By hand, on the working branch, a new commit that brings back the
snapshot's tree exactly (files added since are removed):

```
git rm -r -q . && git checkout fc4da12 -- . && git commit -m "Restore vault: pre-inventory"
```

The playable game itself can also be put back at once: publish the frozen copy's file over the main game artifact.
