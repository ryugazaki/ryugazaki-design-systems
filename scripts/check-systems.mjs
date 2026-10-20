import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkAll } from './lib/systems-lib.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'systems');
const errors = await checkAll(root);
if (errors.length) {
  console.error(errors.map((e) => `x ${e}`).join('\n'));
  console.error(`\n${errors.length} problem(s) found.`);
  process.exit(1);
}
console.log('All systems pass.');
