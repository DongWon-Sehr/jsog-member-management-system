import fs from 'fs';
import { execSync } from 'child_process';

const claspJsonPath = './.clasp.json';

if (!fs.existsSync(claspJsonPath)) {
  console.error('Error: .clasp.json not found. Cannot determine script ID.');
  process.exit(1);
}

const claspConfig = JSON.parse(fs.readFileSync(claspJsonPath, 'utf8'));
const scriptId = claspConfig.scriptId;

if (!scriptId) {
  console.error('Error: scriptId not found in .clasp.json.');
  process.exit(1);
}

const baseUrl = `https://script.google.com/macros/s/${scriptId}/dev`;

console.log(`Setting BASE_URL to: ${baseUrl}`);

try {
  // We pass the debug flag if provided
  const args = process.argv.slice(2).join(' ');
  execSync(`npx playwright test e2e/smoke.spec.cjs ${args}`, {
    env: { ...process.env, BASE_URL: baseUrl },
    stdio: 'inherit'
  });
} catch (error) {
  process.exit(1);
}
