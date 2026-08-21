import { execSync } from 'child_process';

let baseUrl = process.env.BASE_URL;

if (!baseUrl) {
  try {
    console.log('Fetching deployment URL via clasp...');
    // Fetch deployments and parse the one tagged @HEAD (or just grab the first valid web app URL)
    const output = execSync('npx clasp deployments', { encoding: 'utf8' });

    // clasp deployments output looks like:
    // 2 Deployments.
    // - AKfycbz1... @1 - web app meta-version
    // - AKfycbw2... @HEAD - web app meta-version

    const lines = output.split('\n');
    let deploymentId = null;

    for (const line of lines) {
      if (line.includes('@HEAD')) {
        const match = line.match(/- ([a-zA-Z0-9_-]+) @HEAD/);
        if (match && match[1]) {
          deploymentId = match[1];
          break;
        }
      }
    }

    // Fallback if @HEAD not found but another deployment exists
    if (!deploymentId) {
       for (const line of lines) {
          const match = line.match(/- ([a-zA-Z0-9_-]+) @/);
          if (match && match[1]) {
            deploymentId = match[1];
            break;
          }
       }
    }

    if (deploymentId) {
      baseUrl = `https://script.google.com/macros/s/${deploymentId}/dev`;
    } else {
      console.error('Could not parse deployment ID from clasp output.');
    }
  } catch (error) {
    console.error('Failed to run clasp deployments. Are you logged in?');
  }
}

if (!baseUrl) {
  console.error('\n[Error] Could not determine BASE_URL automatically.');
  console.error('Please pass it via environment variable: BASE_URL=... npm run e2e');
  process.exit(1);
}

console.log(`\nUsing BASE_URL: ${baseUrl}\n`);

try {
  const args = process.argv.slice(2).join(' ');
  execSync(`npx playwright test e2e/smoke.spec.cjs ${args}`, {
    env: { ...process.env, BASE_URL: baseUrl },
    stdio: 'inherit'
  });
} catch (error) {
  process.exit(1);
}
