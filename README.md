# UVM ship tunnel

Standalone source for Dappnode package `uvm-tunnel.public.dappnode.eth` version
`0.1.0`, service `connector`, image
`connector.uvm-tunnel.public.dappnode.eth:0.1.0`, targeting `linux/amd64`.
This repository is for **source publication, not a public binary release**.
The companion ship manager is [OwlWilderness/dappnode-urbit](https://github.com/OwlWilderness/dappnode-urbit).
The connector does not run or manage a ship and has no dependency on a checkout
of that repository. No tunnel, DNS record, route or backend is created by these files.

## Qualification status

The preceding private deployment work built a real `0.1.0` candidate and passed
full SDK validation. Actual-image checks verified the pinned official
cloudflared `2026.10.3` executable, inherited nonroot identity and staged public
CA; the target connector was verified healthy. The owner subsequently confirmed
public ship login with EAuth through UVM `0.1.5`. These are historical private
qualification results supplied with this source split, not tests repeated by
`npm test`, and not a claim that an arbitrary new installation is ready.
No private receipts, deployment identifiers or certificates are published here.

`provenance.json` is preserved from initial source preparation: its source-only
status and `dockerComposeSchemaRun: false` describe that earlier checkpoint,
not the subsequent private candidate qualification. Package identity, version,
image pin and runtime descriptors are unchanged. The existing private image and
exports must not be rebuilt or replaced merely to split the source repository.
Catch-all behavior remains unverified; certificate renewal/rotation is unqualified.

## Boundaries

- No host ports, exposed ports, pier/ship mounts, Docker socket, admin UI or
  persistent volumes. No companion-repository files are needed at runtime.
- The Dockerfile inherits the pinned official image's `65532:65532` user and
  `cloudflared --no-autoupdate` entrypoint. Compose supplies
  `tunnel --loglevel error run`, drops all capabilities, sets
  `no-new-privileges:true`, disables Docker log storage with driver `none`, and
  requests SIGTERM with a 60-second grace period and `unless-stopped` restart.
- `read_only: true` is rejected by the pinned SDK's Dappnode service-key
  allowlist. It is deliberately omitted, not claimed as enforced.
- `origin-ca.pem` is absent from Git and gitignored. An authorized private build
  stage must supply **only the origin's public CA certificate**, readable by the
  inherited nonroot user. Here “public CA” means the non-secret CA certificate,
  not a claim that the origin uses a publicly trusted commercial authority.
  Never stage a private key, pier, token or credentials file. The Docker build
  context allowlist contains only the Dockerfile and this public certificate.
  A clean source checkout cannot build until that staged input exists. No CA
  certificate or fingerprint is included in this repository.
- The owner enters `TUNNEL_TOKEN` only through the private native Dappnode setup
  wizard. Its version-2 field is required and masked (`secret: true`). It is
  owner-managed Docker environment readable by an administrator, **not a
  portable secret vault**. Never put the token in CLI arguments, chat, agent
  tools, source, screenshots or logs. No secret-file delivery is implemented.
  The blank committed token is intentional; it cannot activate a tunnel.
- Cloudflare terminates public TLS at its edge and is a trusted intermediary
  able to observe application traffic. Verified origin TLS is a separate hop,
  not end-to-end encryption excluding Cloudflare. Tunnel connectivity does not
  replace ship authentication, EAuth or owner authorization.

## Origin route contract

Use an owner-managed named, remotely managed tunnel. The following values are
sanitized configuration guidance, not an automatically provisioned route:

| Setting | Required value |
| --- | --- |
| Public hostname (`publicHost`, placeholder) | `ship.example.com` |
| Service type | `HTTPS` |
| Service URL | `https://ship.uvm.public.dappnode.private:9444` |
| Origin Server Name (`originServerName`, TLS SNI/name verification) | `ship.uvm.public.dappnode.private` |
| CA Pool (`caPool`) | `/etc/cloudflared/origin-ca.pem` |
| HTTP Host Header (`httpHostHeader`) | `ship.example.com` |
| No TLS Verify (`noTLSVerify`) | `false` |

The private backend's `9444` listener serves the ship route. The separate private
`8443` management/importer listener must not be exposed through this tunnel.
Replace the placeholder public hostname only with an owner-approved hostname;
keep the HTTP Host Header exactly consistent with it and the ship's approved
public origin. SNI remains the private backend name, not the public hostname.
Read back the effective remote configuration, including exact Host, SNI and CA
pool. Never use `noTLSVerify=true` or a plaintext fallback to bypass a failure.

Verify the managed default catch-all returns `http_status:404` for unmatched
traffic; **do not assume** that default is present. This behavior has not been
verified by the private qualification reported above. Do not add an
importer/admin route or wildcard route.

**Do not publish the route or its DNS until backend readiness is verified.**
For each deployment, verify cross-package private DNS/reachability from the
connector, the backend certificate chain and exact name against the staged CA,
and compatible ship Host/Origin/authentication behavior. Package naming alone
proves none of these. Test public login and application/WebSocket behavior
separately; owner-confirmed login is not blanket WebSocket qualification.
This is not an Ames/UDP route and does not start a ship. Renewal, expiry handling
and coordinated CA replacement require separate qualification; do not infer
those guarantees from a healthy connector or successful login.

## Development and tests

The independent npm package pins its development SDK to `0.3.55`. With that SDK
already installed in this checkout, run from the repository root:

```sh
npm test
```

To reuse any existing installation without installing dependencies, set
`DAPPNODE_SDK_ROOT` to its `@dappnode/dappnodesdk` directory, then run `npm test`.
The helper rejects other SDK versions. This optional test-only override is not
a runtime dependency on the companion repository. No dependency installation
or lockfile generation was performed for this split.

Tests use the SDK package reader (`getPackagesToBuildProps`) and real schema
validators (`validateManifestSchema`, `validateDappnodeCompose` and
`validateSetupWizardSchema`), plus exact Dockerfile/Compose security assertions
and validator refusal cases. Tests resolve package files relative to this
repository, not an ancestor or sibling checkout.

The SDK's full file-validation task and `validateComposeSchema` invoke Docker;
`npm test` deliberately does not run them. Passing these tests is **not full Compose validation**,
an image build, target installation, tunnel activation or TLS/login acceptance.
The historical private candidate passed its separate full validation gate.
Normal source tests require no Docker, runtime, network access or production
credentials. Publication of binaries or production changes needs separate scope
and authorization; a public source repository is not a distribution clearance.

## License and attribution

Connector packaging, documentation and test contributions are derived from the
ship-tunnel package in the Dappnode Urbit project and are attributed to its
project contributors. This standalone source and its modifications are provided
under **GPL-3.0-only**; see [LICENSE](LICENSE), copied verbatim from the source
project's `LICENSES/GPL-3.0-only.txt`. This split adds standalone npm/test wiring
and updates documentation; it does not change the deployed package identity.

The pinned official cloudflared image and its components are upstream works
subject to their own license terms and notices, separate from the license on
these packaging contributions. The upstream project is
[cloudflare/cloudflared](https://github.com/cloudflare/cloudflared). No upstream
binary, license audit or third-party redistribution clearance is supplied here.
Before distributing an image, independently satisfy all applicable upstream
license, notice and corresponding-source obligations. The Dappnode manifest's
existing `GPL v3` label is retained; this source's precise identifier is
`GPL-3.0-only`.
