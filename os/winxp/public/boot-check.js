(function () {
  try {
    var BOT = new RegExp(
      [
        // Search engines
        'googlebot',
        'bingbot',
        'slurp',
        'duckduckbot',
        'baiduspider',
        'yandexbot',
        'sogou',
        'exabot',
        'applebot',
        'naverbot',
        'daumoa',
        'seznambot',
        'qwantify',
        'petalbot',
        'bytespider',
        // Generic crawler signals
        'bot',
        'crawl',
        'spider',
        // AI / LLM crawlers
        'gptbot',
        'chatgpt-user',
        'google-extended',
        'perplexitybot',
        'ccbot',
        'diffbot',
        'claude',
        'anthropic',
        'cohere',
        'meta-externalagent',
        'omgilibot',
        'amazonsimpledb',
        // Social link previews
        'facebookexternalhit',
        'twitterbot',
        'linkedinbot',
        'slackbot',
        'telegrambot',
        'whatsapp',
        'discordbot',
        'embedly',
        'pinterest',
        'redditbot',
        'skypeuripreview',
        'iframely',
        'flipboard',
        'pocketparser',
        // SEO tools
        'ahrefsbot',
        'semrushbot',
        'mj12bot',
        'dotbot',
        'rogerbot',
        'blexbot',
        'screaming frog',
        // Feed readers
        'feedly',
        'feedburner',
        'newsblur',
        // Monitoring & testing
        'uptimerobot',
        'pingdom',
        'gtmetrix',
        'webpagetest',
        'lighthouse',
        // Headless / automation
        'headless',
        'phantomjs',
        'prerender',
        'preview',
        // Generic HTTP clients (non-browser)
        'python-requests',
        'python-urllib',
        'go-http-client',
        'curl',
        'wget',
        'java/',
        'ruby',
        'axios',
        // Archive
        'archive',
        'ia_archiver',
      ].join('|'),
      'i',
    );
    var isBot = BOT.test(navigator.userAgent);
    var s = localStorage.getItem('word97-booted');

    if (isBot || (s && Date.now() - parseInt(s, 10) < 2592000000)) {
      var css = '#boot-screen{display:none!important}';
      if (isBot) {
        css +=
          'body.booting #taskbar,body.booting #desktop-icons,body.booting .app-window{opacity:1!important;pointer-events:auto!important}';
      }
      var style = document.createElement('style');
      style.textContent = css;
      document.head.appendChild(style);
    }
  } catch (e) {}
})();
