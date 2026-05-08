import fs from 'fs';
import path from 'path';

const DIST_DIR = 'dist';
const ASSETS_DIR = path.join(DIST_DIR, 'assets');
const SRC_DIR = 'src';

// Helper to extract template from Vue SFC
function extractTemplate(filePath) {
  if (!fs.existsSync(filePath)) return `<!-- ${path.basename(filePath)} not found -->`;
  const content = fs.readFileSync(filePath, 'utf-8');
  const match = content.match(/<template>([\s\S]*)<\/template>/);
  return match ? match[1].trim() : `<!-- No template found in ${path.basename(filePath)} -->`;
}

async function run() {
  console.log('[Post-Build] Starting simplified GAS build process (CDN mode)...');

  if (!fs.existsSync(ASSETS_DIR)) {
    console.error('[Post-Build] Error: dist/assets not found. Make sure "npm run build" finished successfully.');
    return;
  }

  const allAssetFiles = fs.readdirSync(ASSETS_DIR);

  // 1. Extract JS -> javascript.html
  let jsContent = '';
  const mainJsFile = allAssetFiles.find(f => f.endsWith('.js'));
  if (mainJsFile) {
    jsContent = fs.readFileSync(path.join(ASSETS_DIR, mainJsFile), 'utf-8');
    // GAS Template Safety: Escape scriptlets
    jsContent = jsContent.replace(/<\?/g, '<\\?').replace(/\?>/g, '\\?>');
  }
  fs.writeFileSync(path.join(DIST_DIR, 'javascript.html'), `<script>\n${jsContent}\n</script>`);
  console.log(`[Post-Build] ✅ Created javascript.html (${jsContent.length} bytes)`);

  // 2. Extract Templates (Existing Vue SFCs)
  const components = [
    'DashboardView', 'MemberView', 'WorkoutView', 'RewardView', 'LogView', 'LayoutHeader', 'ModalMember'
  ];

  components.forEach(name => {
    // Try to find the file in either views or components
    let vuePath = path.join(SRC_DIR, 'views', `${name}.vue`);
    if (!fs.existsSync(vuePath)) vuePath = path.join(SRC_DIR, 'components', `${name}.vue`);
    
    const templateContent = extractTemplate(vuePath);
    fs.writeFileSync(path.join(DIST_DIR, `${name}.html`), templateContent);
  });
  console.log(`[Post-Build] ✅ Created ${components.length} component HTML files`);

  // 3. Create the FINAL index.html (Optimized CDN mode)
  const gasIndexTemplate = `<!DOCTYPE html>
<html>
  <head>
    <base target="_top" />
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>주삼오공 Admin</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
    <script src="https://unpkg.com/@phosphor-icons/web"></script>
  </head>
  <body class="bg-gray-50 text-gray-800 min-h-screen">
    <div id="app" class="min-h-screen flex flex-col relative" data-app-url="<?!= BASE_WEBAPP_URL ?>">
      <?!= include('LayoutHeader'); ?>
      <main class="flex-1 relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <?!= include('DashboardView'); ?>
        <?!= include('MemberView'); ?>
        <?!= include('WorkoutView'); ?>
        <?!= include('RewardView'); ?>
        <?!= include('LogView'); ?>
      </main>
      <footer class="p-4 bg-gray-200 text-gray-600 text-xs font-bold text-center border-t">
        Made with ♥︎ By 🐟
      </footer>
    </div>
    <?!= include('javascript'); ?>
  </body>
</html>`;

  fs.writeFileSync(path.join(DIST_DIR, 'index.html'), gasIndexTemplate);
  console.log('[Post-Build] ✅ Replaced index.html with clean GAS template');

  // 4. Clean up
  fs.rmSync(ASSETS_DIR, { recursive: true, force: true });
  console.log('[Post-Build] 🎉 Build and split complete! CSS redundancy removed.');
}

run().catch(console.error);
