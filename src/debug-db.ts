// Quick debug of foreign key generation

import { DatabaseGenerator } from './generators/database.js';
import { getTemplate } from './templates/index.js';

async function debug() {
  const template = await getTemplate('/comment-m');
  if (!template) {
    console.log('Template not found');
    return;
  }

  const gen = new DatabaseGenerator();
  const dbCode = await gen.generate(template, {} as any);

  // Find the CREATE TABLE part
  const createTableMatch = dbCode.match(/CREATE TABLE IF NOT EXISTS comments \([^)]+\)/s);
  if (createTableMatch) {
    console.log('CREATE TABLE statement:');
    console.log(createTableMatch[0]);
  }

  // Check fields
  console.log('\nTable fields from template:');
  for (const table of template.database.tables) {
    console.log(`Table: ${table.name}`);
    for (const field of table.fields) {
      console.log(`  ${field.name}: type=${field.type}, nullable=${field.nullable}, fk=${field.foreign_key}`);
    }
  }
}

debug().catch(console.error);