#!/usr/bin/env node
'use strict';

const { readFile } = require('node:fs/promises');

async function main() {
  const args = process.argv.slice(2);

  if (args.length !== 1) {
    console.error('Usage: node test.js <filename>');
    process.exitCode = 1;
    return;
  }

  const filename = args[0];

  try {
    const contents = await readFile(filename, 'utf8');
    process.stdout.write(contents);
  } catch (error) {
    console.error(`Unable to read "${filename}": ${error.message}`);
    process.exitCode = 1;
  }
}

main();
