# Contributing

Keep this connector independent of the companion ship manager. Preserve package
identity and pinned runtime inputs unless a separately reviewed change requires
otherwise. Explain security implications and extend the source tests for changes.

Run `npm test` using @dappnode/dappnodesdk exactly `0.3.55`. An existing SDK may be
selected with `DAPPNODE_SDK_ROOT`; no production environment is needed. These
checks do not build images or replace full SDK/runtime qualification.

Never submit tokens, certificates, keys, private receipts, deployment identifiers,
pier contents or personal paths. Use `ship.example.com` for examples. Do not
perform production actions, image rebuilds, deployment or publication as part of
an ordinary contribution. Preserve existing private artifacts.

Contributions to this repository are under GPL-3.0-only (see LICENSE). Preserve
upstream attribution; do not imply third-party binary redistribution clearance.
