import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { getPackagesToBuildProps, validateManifestSchema, validateDappnodeCompose, validateSetupWizardSchema } from '../scripts/sdk.mjs';

const rootDir = fileURLToPath(new URL('../', import.meta.url));
const read = name => readFileSync(join(rootDir, name), 'utf8');
const load = () => getPackagesToBuildProps({ rootDir, variantsDirPath: join(rootDir, 'variants'), composeFileName: 'docker-compose.yml' });
// The SDK's validateComposeSchema invokes Docker; deliberately not imported.
const digest = 'sha256:c3f24df7c5e68c1467afc5486c155689f247eb02246b3a124fc5f42458728672';

test('descriptive metadata preserves the installed connector identity and token contract', () => {
  const { manifest, compose } = load()[0];
  assert.equal(manifest.name, 'uvm-tunnel.public.dappnode.eth');
  assert.equal(manifest.shortDescription, 'Urbit Ship Tunnel');
  assert.match(manifest.description, /^Urbit Ship Tunnel —/);
  assert.equal(Object.hasOwn(manifest, 'displayName'), false);
  assert.equal(manifest.mainService, 'connector');
  assert.equal(compose.services.connector.image, 'connector.uvm-tunnel.public.dappnode.eth:0.1.0');
  assert.deepEqual(compose.services.connector.environment, { TUNNEL_TOKEN: '' });
});

test('getting-started text explains the ship-only connector and its prerequisites', () => {
  const { manifest } = load()[0];
  const guide = manifest.gettingStarted;
  assert.match(guide, /Urbit Ship Tunnel/);
  assert.match(guide, /does not run or start a ship/);
  assert.match(guide, /public CA certificate/);
  assert.match(guide, /ship-only route/);
  assert.match(guide, /#origin-route-contract/);
  assert.doesNotMatch(guide, /private key|paste.*token/i);
});

test('standalone connector is read and validated by real SDK schemas without Docker', () => {
  assert.ok(existsSync(join(rootDir, 'dappnode_package.json')), 'connector source manifest must exist');
  const packages = load();
  assert.equal(packages.length, 1);
  const { manifest, compose, setupWizard, architectures } = packages[0];
  validateManifestSchema(manifest);
  validateDappnodeCompose(compose, manifest);
  validateSetupWizardSchema(setupWizard);
  assert.equal(manifest.name, 'uvm-tunnel.public.dappnode.eth');
  assert.equal(manifest.version, '0.1.0');
  assert.equal(manifest.mainService, 'connector');
  assert.deepEqual(architectures, ['linux/amd64']);
  assert.deepEqual(Object.keys(compose.services), ['connector']);
  assert.equal(setupWizard.version, '2');
  assert.equal(setupWizard.fields.length, 1);
  const field = setupWizard.fields[0];
  assert.deepEqual(field.target, { type: 'environment', name: 'TUNNEL_TOKEN', service: 'connector' });
  assert.equal(field.secret, true);
  assert.equal(field.required, true);
  // Exercise real validators' refusal paths; no substitute/mock schema.
  assert.throws(() => validateManifestSchema({ ...manifest, version: 123 }));
  assert.throws(() => validateSetupWizardSchema({ ...setupWizard, version: 'invalid' }));
  const unsafe = structuredClone(compose);
  unsafe.services.connector.privileged = true;
  assert.throws(() => validateDappnodeCompose(unsafe, manifest), /privileged/);
});

test('connector has no state mounts, listeners, credential defaults or entrypoint override', () => {
  const { compose, manifest } = load()[0];
  assert.deepEqual(Object.keys(compose).sort(), ['services', 'version']);
  const service = compose.services.connector;
  assert.deepEqual(Object.keys(service).sort(), ['build', 'cap_drop', 'command', 'environment', 'image', 'logging', 'restart', 'security_opt', 'stop_grace_period', 'stop_signal'].sort());
  assert.equal(service.image, 'connector.uvm-tunnel.public.dappnode.eth:0.1.0');
  assert.deepEqual(service.build, { context: '.', dockerfile: 'Dockerfile' });
  assert.deepEqual(service.environment, { TUNNEL_TOKEN: '' });
  assert.deepEqual(service.command, ['tunnel', '--loglevel', 'error', 'run']);
  assert.deepEqual(service.logging, { driver: 'none' });
  assert.deepEqual(service.cap_drop, ['ALL']);
  assert.deepEqual(service.security_opt, ['no-new-privileges:true']);
  assert.equal(service.restart, 'unless-stopped');
  assert.equal(service.stop_signal, 'SIGTERM');
  assert.equal(service.stop_grace_period, '60s');
  const readOnly = structuredClone(compose);
  readOnly.services.connector.read_only = true;
  assert.throws(() => validateDappnodeCompose(readOnly, manifest), /read_only.*not allowed/);
});

test('thin image preserves upstream nonroot entrypoint and copies only the staged public CA', () => {
  assert.ok(existsSync(join(rootDir, 'Dockerfile')), 'thin Dockerfile must exist');
  const instructions = read('Dockerfile').split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#'));
  assert.deepEqual(instructions, [
    `FROM cloudflare/cloudflared@${digest}`,
    'COPY origin-ca.pem /etc/cloudflared/origin-ca.pem'
  ]);
  assert.equal(existsSync(join(rootDir, 'origin-ca.pem')), false);
  assert.ok(read('.gitignore').split('\n').includes('/origin-ca.pem'));
  assert.deepEqual(read('.dockerignore').trim().split('\n'), ['*', '!Dockerfile', '!origin-ca.pem']);
  const provenance = JSON.parse(read('provenance.json'));
  assert.equal(provenance.image.manifestDigest, digest);
  assert.equal(provenance.image.platform, 'linux/amd64');
  assert.equal(provenance.image.user, '65532:65532');
  assert.deepEqual(provenance.image.entrypoint, ['cloudflared', '--no-autoupdate']);
  assert.equal(provenance.release.version, '2026.10.3');
  assert.equal(provenance.release.publishedDate, '2026-10-21');
});

test('operator guidance preserves strict origin route and activation boundaries', () => {
  const readme = read('README.md');
  for (const text of ['https://ship.uvm.public.dappnode.private:9444', 'originServerName', '/etc/cloudflared/origin-ca.pem', 'httpHostHeader', 'ship.example.com', 'noTLSVerify', '`false`', 'http_status:404', '**do not assume**', '**Do not publish the route or its DNS until backend readiness is verified.**', 'not a\n  portable secret vault', 'not full Compose validation']) {
    assert.ok(readme.includes(text), `missing documented boundary: ${text}`);
  }
  for (const name of ['Dockerfile', '.gitignore', '.dockerignore', 'docker-compose.yml', 'dappnode_package.json', 'setup-wizard.yaml', 'provenance.json', 'README.md']) {
    assert.doesNotMatch(read(name), /\/Users\/|\/home\/|BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY|BEGIN CERTIFICATE/);
  }
});
