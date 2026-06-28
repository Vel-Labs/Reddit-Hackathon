import { access, readFile } from 'node:fs/promises';
const manifest = JSON.parse(await readFile('assets/kenney-manifest.json', 'utf8'));
if (manifest.version !== 1) throw new Error('Unsupported art manifest version.');
if (!Array.isArray(manifest.requiredRoles) || manifest.requiredRoles.length < 8)
  throw new Error('Art role list is incomplete.');
if (manifest.mode === 'kenney') {
  for (const [role, path] of Object.entries(manifest.mappings ?? {})) {
    if (!manifest.requiredRoles.includes(role)) throw new Error(`Unknown art role: ${role}`);
    await access(`public/assets/kenney/${path}`);
  }
}
console.log(`Art manifest valid in ${manifest.mode} mode.`);
