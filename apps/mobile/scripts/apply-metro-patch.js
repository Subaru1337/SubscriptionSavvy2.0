/**
 * Post-install script that fixes two monorepo compatibility issues:
 *
 * 1. Patches metro-config/src/loadConfig.js to fix ERR_UNSUPPORTED_ESM_URL_SCHEME
 *    on Windows (Node 20+). Metro uses import() with a raw C:\... path which
 *    Node's ESM loader rejects. We wrap it in pathToFileURL() instead.
 *
 * 2. Copies @babel/traverse into metro's nested node_modules so it can be
 *    resolved by metro-source-map in the transform worker.
 */
const fs = require('fs');
const path = require('path');

// In a clean npm workspace install, all packages are hoisted to the monorepo root
const mobileRoot = path.join(__dirname, '..');
const workspaceRoot = path.join(mobileRoot, '../..');

// metro-config and metro may be in root node_modules (hoisted) or mobile node_modules
function findNodeModules(packageName) {
  const candidates = [
    path.join(mobileRoot, 'node_modules', packageName),
    path.join(workspaceRoot, 'node_modules', packageName),
  ];
  return candidates.find(p => fs.existsSync(p)) || null;
}

function findNodeModulesRoot(packageName) {
  const mobileCandidate = path.join(mobileRoot, 'node_modules', packageName);
  if (fs.existsSync(mobileCandidate)) return path.join(mobileRoot, 'node_modules');
  const rootCandidate = path.join(workspaceRoot, 'node_modules', packageName);
  if (fs.existsSync(rootCandidate)) return path.join(workspaceRoot, 'node_modules');
  return null;
}

// ─── Fix 1: metro-config ESM Windows path patch ─────────────────────────────
function applyMetroPatch() {
  const metroConfigDir = findNodeModules('metro-config');
  if (!metroConfigDir) {
    console.log('[metro-patch] metro-config not found anywhere, skipping patch.');
    return;
  }

  const filePath = path.join(metroConfigDir, 'src/loadConfig.js');
  if (!fs.existsSync(filePath)) {
    console.log('[metro-patch] loadConfig.js not found, skipping patch.');
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  const BROKEN = `        const configModule = await import(absolutePath);`;
  const FIXED = `        const { pathToFileURL } = require('url');\n        const configModule = await import(path.isAbsolute(absolutePath) ? pathToFileURL(absolutePath).href : absolutePath);`;

  if (content.includes(FIXED)) {
    console.log('[metro-patch] ESM path patch already applied, skipping.');
    return;
  }

  if (!content.includes(BROKEN)) {
    console.log('[metro-patch] Target line not found (may have been updated upstream). Skipping ESM patch.');
    return;
  }

  content = content.replace(BROKEN, FIXED);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('[metro-patch] ✓ Patched metro-config for Windows ESM compatibility.');
}

// ─── Fix 2: Copy @babel/traverse into metro's nested node_modules ────────────
function copyBabelTraverse() {
  const nodeModulesWithTraverse = findNodeModulesRoot('@babel/traverse');
  if (!nodeModulesWithTraverse) {
    console.log('[metro-patch] @babel/traverse not found anywhere, skipping copy.');
    return;
  }

  const src = path.join(nodeModulesWithTraverse, '@babel/traverse');

  const metroDir = findNodeModules('metro');
  if (!metroDir) {
    console.log('[metro-patch] metro not found, skipping @babel/traverse copy.');
    return;
  }

  const dest = path.join(metroDir, 'node_modules/@babel/traverse');
  if (fs.existsSync(dest)) {
    console.log('[metro-patch] @babel/traverse already in metro/node_modules, skipping copy.');
    return;
  }

  function copyDir(from, to) {
    fs.mkdirSync(to, { recursive: true });
    for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
      const srcPath = path.join(from, entry.name);
      const destPath = path.join(to, entry.name);
      if (entry.isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  copyDir(src, dest);
  console.log('[metro-patch] ✓ Copied @babel/traverse into metro/node_modules.');
}

applyMetroPatch();
copyBabelTraverse();
