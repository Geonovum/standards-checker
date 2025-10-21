import { copyFile, mkdir, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const SRC_DIR = join(process.cwd(), 'src/specs');
const DEST_DIR = join(process.cwd(), 'dist/specs');

async function copyJsonFiles(sourceDir, targetDir) {
  const entries = await readdir(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = join(sourceDir, entry.name);
    const targetPath = join(targetDir, entry.name);

    if (entry.isDirectory()) {
      await copyJsonFiles(sourcePath, targetPath);
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.json')) {
      await mkdir(dirname(targetPath), { recursive: true });
      await copyFile(sourcePath, targetPath);
    }
  }
}

try {
  await copyJsonFiles(SRC_DIR, DEST_DIR);
} catch (error) {
  if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
    process.exit(0);
  }

  console.error('Failed to copy assets:', error);
  process.exit(1);
}
