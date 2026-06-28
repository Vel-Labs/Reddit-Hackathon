import { readdir, readFile } from 'node:fs/promises';
import Ajv2020 from 'ajv/dist/2020.js';

const ajv = new Ajv2020({ allErrors: true, strict: false, validateFormats: false });
const schemas = new Map();
for (const name of await readdir('contracts/schemas')) {
  if (!name.endsWith('.json')) continue;
  const schema = JSON.parse(await readFile(`contracts/schemas/${name}`, 'utf8'));
  schemas.set(name, ajv.compile(schema));
}
const tile = JSON.parse(await readFile('contracts/examples/course-tile.json', 'utf8'));
const validateTile = schemas.get('course-tile.schema.json');
if (!validateTile?.(tile))
  throw new Error(`Example tile failed schema validation: ${JSON.stringify(validateTile?.errors)}`);
console.log(`Contracts valid (${schemas.size} schemas).`);
