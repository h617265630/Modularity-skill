// Debug template loading

import { readFileSync } from 'fs';
import { join } from 'path';

const filepath = join(process.cwd(), 'src', 'templates', 'comment-m.json');
const content = readFileSync(filepath, 'utf-8');
const template = JSON.parse(content);

console.log('Template database tables:');
for (const table of template.database.tables) {
  console.log(`Table: ${table.name}`);
  for (const field of table.fields) {
    console.log(`  ${JSON.stringify(field)}`);
  }
}