import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { syncAll } from './lib/systems-lib.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'systems');
const changed = await syncAll(root);
console.log(`Synced inline themes in ${changed} file(s).`);
