import fs from 'fs';
import path from 'path';
import { appRegistry } from '@/app/registry';

function uniqSorted(xs: string[]) {
  return Array.from(new Set(xs)).sort();
}

describe('run/[appId] static params', () => {
  test('APP_IDS includes all appRegistry ids (and no extras)', () => {
    const filePath = path.join(process.cwd(), 'app', 'run', '[appId]', 'page.tsx');
    const src = fs.readFileSync(filePath, 'utf8');

    const blockMatch = src.match(/const\s+APP_IDS\s*=\s*\[([\s\S]*?)\]\s+as\s+const\s*;/);
    expect(blockMatch).toBeTruthy();

    const literals = (blockMatch?.[1] ?? '').match(/'([^']+)'/g) ?? [];
    const appIdsFromFile = literals.map((s) => s.slice(1, -1));

    expect(uniqSorted(appIdsFromFile)).toEqual(uniqSorted(appRegistry.map((a) => a.id)));
  });
});
