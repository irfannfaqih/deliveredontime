const fs = require('fs');
const path = require('path');

function sanitize(input) {
  const lines = input.split(/\r?\n/);
  const keep = [];
  const reCreateDb = /^\s*CREATE\s+DATABASE/i;
  const reUseDb = /^\s*USE\s+`?\w+`?\s*;/i;
  const reDelimiter = /^\s*DELIMITER\b/i;
  const reTrigger = /\bTRIGGER\b/i;
  const reDefiner = /\bDEFINER\b/i;
  const reView = /\bVIEW\b/i;

  for (const l of lines) {
    if (reCreateDb.test(l)) continue;
    if (reUseDb.test(l)) continue;
    if (reDelimiter.test(l)) continue;
    if (reTrigger.test(l)) continue;
    if (reDefiner.test(l)) continue;
    if (reView.test(l)) continue;
    keep.push(l);
  }
  return keep.join('\n');
}

function main() {
  const src = path.resolve('downloads', 'delivered_cpanel.sql');
  const dst = path.resolve('downloads', 'delivered_cpanel_clean.sql');
  if (!fs.existsSync(src)) {
    console.error('Source dump not found:', src);
    process.exit(1);
  }
  const raw = fs.readFileSync(src, 'utf8');
  const cleaned = sanitize(raw)
    .replace(/utf8mb4_0900_ai_ci/gi, 'utf8mb4_unicode_ci');
  fs.writeFileSync(dst, cleaned, 'utf8');
  console.log('Sanitized dump written:', dst);
}

if (require.main === module) {
  main();
}

