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
    'DashboardView', 'MemberView', 'WorkoutView', 'RewardView', 'LogView', 
    'LayoutHeader', 'ModalMember', 'ModalWeekPlanner', 'ModalWorkoutLog', 
    'ModalReward', 'ModalRewardRecommendation', 'GlobalDialog', 'TimeInput'
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

    <!-- CDN Imports -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
    <script src="https://unpkg.com/@phosphor-icons/web"></script>
    <script src="https://unpkg.com/imask"></script>

    <!-- Chart.js for data visualization -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    
    <!-- html2canvas for screenshots -->
    <script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>

    <!-- Custom CSS styles -->
    <style>
      @keyframes highlight-fade {
        0% {
          background-color: rgba(253, 224, 71, 0.5);
        }
        100% {
          background-color: #ffffff;
        }
      }
      .animate-highlight {
        animation: highlight-fade 2s ease-out forwards;
      }
    </style>
  </head>
  <body class="bg-gray-50 text-gray-800 min-h-screen">
    <div id="app" class="min-h-screen flex flex-col relative" data-app-url="<?!= BASE_WEBAPP_URL ?>">
      <!-- Template Placeholders (for In-Browser Compilation if used, otherwise Vue handles via JS) -->
      <div style="display: none;">
        <?!= include('LayoutHeader'); ?>
        <?!= include('DashboardView'); ?>
        <?!= include('MemberView'); ?>
        <?!= include('WorkoutView'); ?>
        <?!= include('RewardView'); ?>
        <?!= include('LogView'); ?>
        <?!= include('ModalMember'); ?>
        <?!= include('ModalWeekPlanner'); ?>
        <?!= include('ModalWorkoutLog'); ?>
        <?!= include('ModalReward'); ?>
        <?!= include('ModalRewardRecommendation'); ?>
        <?!= include('GlobalDialog'); ?>
        <?!= include('TimeInput'); ?>
      </div>

      <!-- App mounting point -->
      <div class="flex-1 flex flex-col">
        <!-- Loader will be handled by Vue inside App.vue -->
      </div>
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
