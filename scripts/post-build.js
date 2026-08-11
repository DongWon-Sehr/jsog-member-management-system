import fs from 'fs';
import path from 'path';

const DIST_DIR = 'dist';
const ASSETS_DIR = path.join(DIST_DIR, 'assets');
const SRC_DIR = 'src';

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

  let jsContent = '';
  const mainJsFile = allAssetFiles.find(f => f.endsWith('.js'));
  if (mainJsFile) {
    jsContent = fs.readFileSync(path.join(ASSETS_DIR, mainJsFile), 'utf-8');
    // Escape <? ?> so GAS does not parse them as scriptlets
    jsContent = jsContent.replace(/<\?/g, '<\\?').replace(/\?>/g, '\\?>');
  }
  fs.writeFileSync(path.join(DIST_DIR, 'javascript.html'), `<script>\n${jsContent}\n</script>`);
  console.log(`[Post-Build] ✅ Created javascript.html (${jsContent.length} bytes)`);

  const components = [
    'DashboardView', 'MemberView', 'WorkoutView', 'RewardView', 'LogView', 
    'LayoutHeader', 'ModalMember', 'ModalWeekPlanner', 'ModalWorkoutLog', 
    'ModalReward', 'ModalRewardRecommendation', 'GlobalDialog', 'TimeInput'
  ];

  components.forEach(name => {
    let vuePath = path.join(SRC_DIR, 'views', `${name}.vue`);
    if (!fs.existsSync(vuePath)) vuePath = path.join(SRC_DIR, 'components', `${name}.vue`);

    const templateContent = extractTemplate(vuePath);
    fs.writeFileSync(path.join(DIST_DIR, `${name}.html`), templateContent);
  });
  console.log(`[Post-Build] ✅ Created ${components.length} component HTML files`);

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

      /* Loading overlay styles must live here: this template drops Vite's CSS bundle, and the
         Tailwind Play CDN boots too late for an overlay shown in the first seconds. */
      .loading-card {
        width: 320px;
        height: 232px;
        padding: 28px 24px;
        gap: 6px;
      }
      .loading-emoji-stage {
        position: relative;
        width: 72px;
        height: 72px;
        margin-bottom: 10px;
      }
      .loading-emoji {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 44px;
        line-height: 1;
      }
      /* New emoji slides in from the left as the old exits right; both run at once as a hand-off. */
      .emoji-swap-enter-active {
        transition: opacity 0.45s ease-out, transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
      }
      .emoji-swap-leave-active {
        transition: opacity 0.4s ease-in, transform 0.4s cubic-bezier(0.55, 0, 1, 0.45);
      }
      .emoji-swap-enter-from {
        opacity: 0;
        transform: translateX(-72px) scale(0.6) rotate(-14deg);
      }
      .emoji-swap-leave-to {
        opacity: 0;
        transform: translateX(72px) scale(0.6) rotate(14deg);
      }
      /* Two lines of room for the longest phrase, so the card never resizes as the text rotates. */
      .loading-phrase {
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0;
        font-size: 14px;
        line-height: 1.4;
      }
    </style>
  </head>
  <body class="bg-gray-50 text-gray-800 min-h-screen">
    <div id="app" class="min-h-screen flex flex-col relative" data-app-url="<?!= BASE_WEBAPP_URL ?>">
      <!-- Hidden component templates for Vue's in-browser compiler -->
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
        <!-- Intentionally empty: App.vue renders the loader and app here -->
      </div>
    </div>
    <?!= include('javascript'); ?>
  </body>
  </html>`;

  fs.writeFileSync(path.join(DIST_DIR, 'index.html'), gasIndexTemplate);
  console.log('[Post-Build] ✅ Replaced index.html with clean GAS template');

  fs.rmSync(ASSETS_DIR, { recursive: true, force: true });
  console.log('[Post-Build] 🎉 Build and split complete! CSS redundancy removed.');
}

run().catch(console.error);
