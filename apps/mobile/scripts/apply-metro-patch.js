/**
 * Patches metro-config/src/loadConfig.js to fix ERR_UNSUPPORTED_ESM_URL_SCHEME
 * on Windows (Node 20+). Metro uses import() with a raw C:\... path which
 * Node's ESM loader rejects. We wrap it in pathToFileURL() instead.
 */
const fs = require('fs');
const path = require('path');

const filePath = path.join(
  __dirname,
  '../node_modules/metro-config/src/loadConfig.js'
);

if (!fs.existsSync(filePath)) {
  console.log('[metro-patch] metro-config not found, skipping patch.');
  process.exit(0);
}

let content = fs.readFileSync(filePath, 'utf8');

const BROKEN = `        const configModule = await import(absolutePath);`;
const FIXED = `        const { pathToFileURL } = require('url');\n        const configModule = await import(path.isAbsolute(absolutePath) ? pathToFileURL(absolutePath).href : absolutePath);`;

if (content.includes(FIXED)) {
  console.log('[metro-patch] Already patched, skipping.');
  process.exit(0);
}

if (!content.includes(BROKEN)) {
  console.log('[metro-patch] Target line not found (may have changed). Skipping patch.');
  process.exit(0);
}

content = content.replace(BROKEN, FIXED);
fs.writeFileSync(filePath, content, 'utf8');
console.log('[metro-patch] Successfully patched metro-config for Windows ESM compatibility.');
