import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Test-only loader. Optional explicit reuse never installs or builds anything.
const rootDir = fileURLToPath(new URL('../', import.meta.url));
const sdkRoot = process.env.DAPPNODE_SDK_ROOT
  ? resolve(process.env.DAPPNODE_SDK_ROOT)
  : resolve(rootDir, 'node_modules/@dappnode/dappnodesdk');
assert.equal(JSON.parse(readFileSync(resolve(sdkRoot, 'package.json'), 'utf8')).version,
  '0.3.55', 'Tests require @dappnode/dappnodesdk exactly 0.3.55');
export const { getPackagesToBuildProps } = await import(
  pathToFileURL(resolve(sdkRoot, 'dist/commands/build/variants.js')).href);
const require = createRequire(resolve(sdkRoot, 'package.json'));
const schemaRoot = dirname(require.resolve('@dappnode/schemas/package.json'));
export const { validateSetupWizardSchema, validateManifestSchema, validateDappnodeCompose } =
  await import(pathToFileURL(resolve(schemaRoot, 'dist/index.js')).href);
