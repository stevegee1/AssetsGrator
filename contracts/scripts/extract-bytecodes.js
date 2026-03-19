#!/usr/bin/env node
/**
 * extract-bytecodes.js
 * Reads compiled Hardhat artifacts and writes bytecodes to the frontend.
 * Run after: npx hardhat compile
 * Usage:    node scripts/extract-bytecodes.js
 */
const fs = require("fs");
const path = require("path");

const CONTRACTS = [
  "SecurityToken",
  "PropertyVault",
  "PropertyGovernance",
  "TokenSale",
];
const OUTPUT = path.join(
  __dirname,
  "../../frontend/lib/contracts/bytecodes.ts",
);

let out = `// Auto-generated from Hardhat artifacts — do not edit manually.
// Re-generate after recompiling: node contracts/scripts/extract-bytecodes.js\n\n`;

for (const name of CONTRACTS) {
  const artPath = path.join(
    __dirname,
    "../artifacts/contracts",
    `${name}.sol`,
    `${name}.json`,
  );
  const { bytecode } = JSON.parse(fs.readFileSync(artPath, "utf8"));
  out += `export const ${name.toUpperCase()}_BYTECODE = "${bytecode}" as \`0x\${string}\`;\n\n`;
  console.log(`✓ ${name}: ${bytecode.length} chars`);
}

fs.writeFileSync(OUTPUT, out);
console.log("\nWritten to:", OUTPUT);
