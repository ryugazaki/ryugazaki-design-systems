// Builds every Pencil (pencil.dev) source file in design/ from the system manifests.
// Run: npm run build:pen
import { build as glassAurora } from './glass-aurora.mjs';
import { build as bauhausGeometric } from './bauhaus-geometric.mjs';
import { build as clayPlayful } from './clay-playful.mjs';

for (const build of [glassAurora, bauhausGeometric, clayPlayful]) {
  try {
    console.log(`Wrote ${await build()}.`);
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
  }
}
