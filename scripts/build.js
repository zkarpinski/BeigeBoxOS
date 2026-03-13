#!/usr/bin/env node
/**
 * Minify the entire site into dist/ (HTML, CSS, JS). Safe for S3 static hosting.
 *
 * Usage:
 *   node scripts/build.js           Minify only (multiple files in dist/)
 *   node scripts/build.js --bundle  Single index.html with inlined CSS + JS (1 file)
 *   node scripts/build.js --obfuscate  Minify + mangle variable names (harder to read)
 *   node scripts/build.js --bundle --obfuscate  Single file + obfuscated JS
 *
 * Note: Full obfuscation is not recommended—it can break code and doesn't provide
 * real security. --obfuscate only enables terser name mangling (reserved globals kept).
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');

const argv = process.argv.slice(2);
const bundle = argv.includes('--bundle');
const obfuscate = argv.includes('--obfuscate');

const localCss = [
  // Shell
  'shell/shell.css',
  'shell/taskbar.css',
  'shell/desktop.css',
  'shell/dialog.css',
  'shell/run.css',
  'shell/boot.css',
  'shell/shutdown.css',
  'shell/bsod.css',
  // Apps
  'apps/word/word.css',
  'apps/thps2/thps2.css',
  'apps/vb6/vb6.css',
  'apps/napster/napster.css',
  'apps/aim/aim.css',
  'apps/navigator/navigator.css',
  'apps/winamp/winamp.css',
  'apps/pinball/pinball.css',
  'apps/notepad/notepad.css',
  'apps/minesweeper/minesweeper.css',
  'apps/paint/paint.css',
  'apps/the_incredible_machine/tim.css',
  'apps/calculator/calculator.css',
  'apps/ie5/ie5.css',
  'apps/defrag/defrag.css',
  'apps/mycomputer/mycomputer.css',
  'apps/controlpanel/controlpanel.css',
  'apps/msdos/msdos.css',
];
const localScripts = [
  'shell/windows97.js',
  'shell/windowChrome.js',
  'shell/taskbar.js',
  'shell/desktopMenu.js',
  'shell/run.js',
  'shell/shutdown.js',
  'shell/windowManager.js',
  'shell/state.js',
  'shell/dialog.js',
  'shell/bsod.js',
  'apps/word/word.js',
  'apps/word/sanitizer.js',
  'apps/word/editor.js',
  'apps/word/toolbar.js',
  'apps/word/resume.js',
  'apps/word/statusBar.js',
  'apps/word/window.js',
  'apps/word/fileMenu.js',
  'apps/word/menus.js',
  'apps/word/clippy97.js',
  'apps/word/pinball.js',
  'apps/word/editor-ui.js',
  'apps/vb6/window.js',
  'apps/napster/napster.js',
  'apps/napster/window.js',
  'apps/napster/tabs.js',
  'apps/napster/search.js',
  'apps/napster/transfer.js',
  'apps/aim/aim.js',
  'apps/aim/window.js',
  'apps/aim/buddylist.js',
  'apps/aim/chat.js',
  'apps/navigator/navigator.js',
  'apps/navigator/window.js',
  'apps/navigator/toolbar.js',
  'apps/navigator/menus.js',
  'apps/thps2/thps2.js',
  'apps/winamp/winamp.js',
  'apps/winamp/window.js',
  'apps/pinball/pinball.js',
  'apps/pinball/window.js',
  'apps/notepad/notepad.js',
  'apps/notepad/window.js',
  'apps/minesweeper/minesweeper.js',
  'apps/minesweeper/window.js',
  'apps/paint/paint.js',
  'apps/paint/window.js',
  'apps/the_incredible_machine/tim.js',
  'apps/calculator/calculator.js',
  'apps/calculator/window.js',
  'apps/ie5/ie5.js',
  'apps/ie5/window.js',
  'apps/ie5/windowsupdate.js',
  'apps/defrag/defrag.js',
  'apps/defrag/window.js',
  'apps/mycomputer/mycomputer.js',
  'apps/mycomputer/window.js',
  'apps/controlpanel/controlpanel.js',
  'apps/controlpanel/window.js',
  'apps/controlpanel/display.js',
  'apps/msdos/msdos.js',
  'apps/msdos/window.js',
  'apps/controlpanel/datetime.js',
  'apps/controlpanel/sounds.js',
  'apps/controlpanel/mouse.js',
  'apps/controlpanel/system.js',
];

// Globals that must not be mangled (exposed on window; referenced by other scripts or inline HTML)
const reserved = [
  'Word97', 'Windows97', 'Navigator97', 'AIM97', 'Napster97', 'ControlPanel97', 'MSDOS98', 'WindowsUpdate97',
  'openPinball', 'closePinball', 'attachWindowChrome',
  'Run97', 'Word97State', 'closeWordWindow', 'Minesweeper98', 'Defrag98', 'VB6', 'IE597',
  'Clippy98Agent', 'BonziAgent', '_loadClippy98', '_loadBonzi', '_onDesktopReady',
  'openSpaceCadet', 'closeSpaceCadet', 'Paint98', 'MyComputer97', 'launchThps2', 'launchTim', 'Notepad98',
];

// Static assets (images, audio, etc.) to copy to dist unchanged. Add new paths here as needed.
const staticAssets = [
  // Favicons
  'favicon.ico',
  'favicon-16x16.png',
  'favicon-32x32.png',
  'apple-touch-icon.png',
  'android-chrome-192x192.png',
  'android-chrome-512x512.png',
  'site.webmanifest',
  // Boot screen + wallpapers
  'shell/images/win98-boot.jpg',
  'shell/images/windows_98_logo.svg',
  'shell/images/clouds.png',
  'shell/sounds/startup.wav',
  // Assets
  'assets/linkedin-logo.png',
  'assets/github-logo.png',
  // Icons (win98 + app icons)
  'assets/icons/aim-1.png',
  'assets/icons/aim.png',
  'assets/icons/aol.png',
  'assets/icons/calculator-1.png',
  'assets/icons/cd_drive-0.png',
  'assets/icons/computer_explorer.png',
  'assets/icons/console_prompt-0.png',
  'assets/icons/control_pangel.png',
  'assets/icons/desktop_mini.png',
  'assets/icons/directory.png',
  'assets/icons/display_properties-0.png',
  'assets/icons/executable-0.png',
  'assets/icons/floppy_drive-0.png',
  'assets/icons/folder-0.png',
  'assets/icons/folder_document-0.png',
  'assets/icons/hard_disk_drive-0.png',
  'assets/icons/help.png',
  'assets/icons/ie.png',
  'assets/icons/microsoft_word-2.png',
  'assets/icons/minesweeper-0.png',
  'assets/icons/mouse-0.png',
  'assets/icons/ms_dos.png',
  'assets/icons/msie1-2.png',
  'assets/icons/my_documents.png',
  'assets/icons/napster.png',
  'assets/icons/network_neighborhood.png',
  'assets/icons/notepad-1.png',
  'assets/icons/paint_file-1.png',
  'assets/icons/program_group.png',
  'assets/icons/properties_system-0.png',
  'assets/icons/run-0.png',
  'assets/icons/run.png',
  'assets/icons/search-0.png',
  'assets/icons/settings_gear-0.png',
  'assets/icons/shut_down.png',
  'assets/icons/smile.png',
  'assets/icons/sound-0.png',
  'assets/icons/start-button.png',
  'assets/icons/system_tools-0.png',
  'assets/icons/time_and_date-0.png',
  'assets/icons/winamp.png',
  'assets/icons/windows_program_manager-0.png',
  'assets/icons/windows_update_large-1.png',
  // Apps
  'apps/word/resume-icon.png',
  'apps/defrag/defrag-icon.png',
  'apps/navigator/netscape-logo.png',
  'apps/thps2/thps2-icon.png',
  'apps/thps2/thps2-title-screen.png',
  'apps/winamp/llama.mp3',
  'apps/the_incredible_machine/tim-icon.png',
  'apps/the_incredible_machine/logo.png',
  'apps/the_incredible_machine/sierra.mp3',
];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyStaticAssets() {
  for (const file of staticAssets) {
    const src = path.join(root, file);
    const dest = path.join(dist, file);
    if (fs.existsSync(src)) {
      ensureDir(path.dirname(dest));
      fs.copyFileSync(src, dest);
      console.log('Copied', file);
    }
  }
}

async function main() {
  const htmlMinifier = require('html-minifier-terser');
  const { minify: minifyJs } = require('terser');
  const CleanCSS = require('clean-css');

  ensureDir(dist);

  const cleanCss = new CleanCSS({ level: 2 });
  const jsOpts = {
    compress: { passes: 1 },
    mangle: obfuscate ? { reserved } : false,
    format: { comments: false },
  };

  if (bundle) {
    // Single file: one index.html with inlined CSS and JS
    const htmlPath = path.join(root, 'index.html');
    let html = fs.readFileSync(htmlPath, 'utf8');

    // Bundle CSS
    let combinedCss = '';
    for (const file of localCss) {
      combinedCss += fs.readFileSync(path.join(root, file), 'utf8') + '\n';
    }
    const cssResult = cleanCss.minify(combinedCss);
    if (cssResult.errors && cssResult.errors.length) {
      console.error('CSS errors:', cssResult.errors);
      process.exit(1);
    }
    const bundledCss = cssResult.styles;

    // Bundle JS (same order as localScripts)
    let combinedJs = '';
    for (const file of localScripts) {
      combinedJs += fs.readFileSync(path.join(root, file), 'utf8') + '\n';
    }
    const jsResult = await minifyJs(combinedJs, jsOpts);
    if (jsResult.error) {
      console.error('JS error:', jsResult.error);
      process.exit(1);
    }
    const bundledJs = jsResult.code;

    // Replace local stylesheets with one inlined <style>
    const linkLines = localCss.map((c) => `    <link rel="stylesheet" href="${c}">`);
    const linkBlock = linkLines.join('\n');
    if (!html.includes(linkLines[0])) {
      console.error('Build: could not find local stylesheet block in index.html');
      process.exit(1);
    }
    html = html.replace(linkBlock, '    <style>' + bundledCss + '</style>');

    // Replace all local <script src="..."> with one inlined <script>
    const scriptLines = localScripts.map((s) => '    <script src="' + s + '"></script>');
    const scriptBlock = '\n' + scriptLines.join('\n') + '\n';
    if (!html.includes(scriptLines[0])) {
      console.error('Build: could not find script block in index.html');
      process.exit(1);
    }
    html = html.replace(scriptBlock, '\n    <script>' + bundledJs + '</script>\n');

    // Minify the whole HTML
    html = await htmlMinifier.minify(html, {
      collapseBooleanAttributes: true,
      collapseWhitespace: true,
      minifyCSS: true,
      minifyJS: true,
      removeComments: true,
      removeEmptyAttributes: true,
    });

    fs.writeFileSync(path.join(dist, 'index.html'), html, 'utf8');
    for (const name of ['robots.txt', 'sitemap.xml']) {
      const src = path.join(root, name);
      if (fs.existsSync(src)) fs.copyFileSync(src, path.join(dist, name));
    }
    copyStaticAssets();
    console.log('Bundled and minified to dist/index.html (1 file)' + (obfuscate ? ' [obfuscated]' : ''));
    return;
  }

  // Non-bundle: minify each file into dist/ (original structure)
  const htmlPath = path.join(root, 'index.html');
  let html = fs.readFileSync(htmlPath, 'utf8');
  html = await htmlMinifier.minify(html, {
    collapseBooleanAttributes: true,
    collapseWhitespace: true,
    minifyCSS: true,
    minifyJS: true,
    removeComments: true,
    removeEmptyAttributes: true,
  });
  fs.writeFileSync(path.join(dist, 'index.html'), html, 'utf8');
  console.log('Minified index.html');

  for (const file of localCss) {
    const srcPath = path.join(root, file);
    const outPath = path.join(dist, file);
    ensureDir(path.dirname(outPath));
    const css = fs.readFileSync(srcPath, 'utf8');
    const result = cleanCss.minify(css);
    if (result.errors && result.errors.length) {
      console.error('CSS errors in', file, result.errors);
      process.exit(1);
    }
    fs.writeFileSync(outPath, result.styles, 'utf8');
    console.log('Minified', file);
  }

  for (const file of localScripts) {
    const srcPath = path.join(root, file);
    const outPath = path.join(dist, file);
    ensureDir(path.dirname(outPath));
    const code = fs.readFileSync(srcPath, 'utf8');
    const result = await minifyJs(code, jsOpts);
    if (result.error) {
      console.error('JS error in', file, result.error);
      process.exit(1);
    }
    fs.writeFileSync(outPath, result.code, 'utf8');
    console.log('Minified', file);
  }

  // Copy SEO / crawler files to dist
  const rootFiles = ['robots.txt', 'sitemap.xml'];
  for (const name of rootFiles) {
    const src = path.join(root, name);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(dist, name));
      console.log('Copied', name);
    }
  }

  copyStaticAssets();

  console.log('\nBuild complete. Output in dist/' + (obfuscate ? ' [obfuscated]' : ''));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
