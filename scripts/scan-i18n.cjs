const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '../src');
const OUTPUT_FILE = path.join(__dirname, '../i18n-report.json');

// Regex para detectar textos
const TEXT_NODE_REGEX = />\s*([^<>{}\n]+)\s*</g;
const STRING_REGEX = /(["'`])((?:(?!\1).)*)\1/g;
const PLACEHOLDER_REGEX =
  /(placeholder|title|label|aria-label)=["'`]([^"'`]+)["'`]/g;

const IGNORE_PATTERNS = [
  /^\s*$/,
  /^[0-9]+$/,
  /^#[0-9a-fA-F]+$/,
  /^t\(/,
  /^className$/,
  /^w-\d+/,
  /^h-\d+/,
];

function shouldIgnore(text) {
  return IGNORE_PATTERNS.some((pattern) =>
    pattern.test(text.trim())
  );
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const results = new Set();

  let match;

  // 🔎 Detectar textos JSX >Texto<
  while ((match = TEXT_NODE_REGEX.exec(content)) !== null) {
    const text = match[1].trim();
    if (!shouldIgnore(text) && text.length > 2) {
      results.add(text);
    }
  }

  // 🔎 Detectar strings normais "Texto"
  while ((match = STRING_REGEX.exec(content)) !== null) {
    const text = match[2].trim();

    if (
      !shouldIgnore(text) &&
      !text.includes('t(') &&
      text.length > 2 &&
      /[A-Za-zÀ-ÿ]/.test(text)
    ) {
      results.add(text);
    }
  }

  // 🔎 Detectar placeholder, label etc
  while ((match = PLACEHOLDER_REGEX.exec(content)) !== null) {
    const text = match[2].trim();
    if (!shouldIgnore(text) && text.length > 2) {
      results.add(text);
    }
  }

  return Array.from(results);
}

function walkDir(dir, collected) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      walkDir(fullPath, collected);
    } else if (
      fullPath.endsWith('.tsx') ||
      fullPath.endsWith('.ts')
    ) {
      const results = scanFile(fullPath);

      if (results.length > 0) {
        collected[fullPath] = results;
      }
    }
  });
}

function run() {
  console.log('🔍 Scanning project for translatable texts...\n');

  const collected = {};
  walkDir(SRC_DIR, collected);

  fs.writeFileSync(
    OUTPUT_FILE,
    JSON.stringify(collected, null, 2)
  );

  console.log(`\n✅ Scan complete.`);
  console.log(`📄 Report saved to: ${OUTPUT_FILE}`);
}

run();