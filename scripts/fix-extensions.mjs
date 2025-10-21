import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const DIST_DIR = join(process.cwd(), 'dist');
const EXTENSION_PATTERN = /\.(?:[cm]?js|json)$/;
const RELATIVE_SPECIFIER = /^(\.{1,2}\/)/;
const SPECIFIER_RE = /(from\s+['"])([^'"\s]+)(['"])/g;
const EXPORT_RE = /(export\s+\*\s+from\s+['"])([^'"\s]+)(['"])/g;
const IMPORT_CALL_RE = /(import\s*\(\s*['"])([^'"\s]+)(['"]\s*\))/g;

const normalizeSpecifier = (filePath, specifier) => {
  if (!RELATIVE_SPECIFIER.test(specifier) || EXTENSION_PATTERN.test(specifier)) {
    return specifier;
  }

  const basePath = join(dirname(filePath), specifier);

  if (existsSync(`${basePath}.js`)) {
    return `${specifier}.js`;
  }

  if (existsSync(join(basePath, 'index.js'))) {
    return `${specifier.replace(/\/?$/, '')}/index.js`;
  }

  return `${specifier}.js`;
};

const rewriteContent = (filePath, content) => {
  let updated = content;

  for (const regex of [SPECIFIER_RE, EXPORT_RE, IMPORT_CALL_RE]) {
    updated = updated.replace(regex, (_, start, specifier, end) => {
      const normalized = normalizeSpecifier(filePath, specifier);
      return `${start}${normalized}${end}`;
    });
  }

  return updated;
};

const walk = dir => {
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(path);
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.js')) {
      const original = readFileSync(path, 'utf8');
      const updated = rewriteContent(path, original);

      if (updated !== original) {
        writeFileSync(path, updated, 'utf8');
      }
    }
  }
};

walk(DIST_DIR);
