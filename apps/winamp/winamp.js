(function () {
  'use strict';

  var audio      = document.getElementById('winamp-audio');
  var playBtn    = document.getElementById('winamp-play');
  var pauseBtn   = document.getElementById('winamp-pause');
  var stopBtn    = document.getElementById('winamp-stop');
  var timeEl     = document.getElementById('winamp-time');
  var marqueeEl  = document.getElementById('winamp-marquee');

  if (!audio) return;

  var isPlaying = false;
  var timeTimer;

  function updateTime() {
    var secs = Math.floor(audio.currentTime);
    var m = Math.floor(secs / 60);
    var s = secs % 60;
    timeEl.textContent = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  if (playBtn) {
    playBtn.addEventListener('click', function () {
      audio.play().catch(function (e) { console.log('Audio play error', e); });
      isPlaying = true;
      marqueeEl.textContent = "WINAMP: IT REALLY WHIPS THE LLAMA'S ASS *** ";
      timeTimer = setInterval(updateTime, 1000);
      vizStart();
    });
  }

  if (pauseBtn) {
    pauseBtn.addEventListener('click', function () {
      audio.pause();
      isPlaying = false;
      marqueeEl.textContent = 'WINAMP [PAUSED]';
      clearInterval(timeTimer);
      vizStop();
    });
  }

  if (stopBtn) {
    stopBtn.addEventListener('click', function () {
      audio.pause();
      audio.currentTime = 0;
      isPlaying = false;
      marqueeEl.textContent = 'WINAMP [STOPPED]';
      updateTime();
      clearInterval(timeTimer);
      vizStop();
    });
  }

  audio.addEventListener('ended', function () {
    isPlaying = false;
    marqueeEl.textContent = 'WINAMP [STOPPED]';
    audio.currentTime = 0;
    updateTime();
    clearInterval(timeTimer);
    vizStop();
  });

  // ── Spectrum Visualizer ───────────────────────────────────────────────────

  var vizCanvas = document.getElementById('winamp-viz');
  var vizCtx    = vizCanvas ? vizCanvas.getContext('2d') : null;
  var vizAnimId = null;
  var vizActive = false; // true while playing

  var N = 75; // bars — authentic Winamp count
  var vizBars    = new Float32Array(N);
  var vizPeaks   = new Float32Array(N);
  var vizPeakVel = new Float32Array(N);

  // 6 frequency bands (index 0=bass, 5=treble)
  var bands    = new Float32Array(6);
  var bandsTgt = new Float32Array(6);

  var vizFrame = 0;
  var vizGrad  = null; // cached gradient

  function getGrad() {
    if (!vizGrad && vizCtx) {
      var H = vizCanvas.height;
      vizGrad = vizCtx.createLinearGradient(0, 0, 0, H);
      vizGrad.addColorStop(0.0, '#00FF00');
      vizGrad.addColorStop(0.5, '#00CC00');
      vizGrad.addColorStop(1.0, '#004400');
    }
    return vizGrad;
  }

  function vizStep() {
    vizFrame++;

    if (vizActive) {
      // Refresh band targets every 6 frames — bass louder on average
      if (vizFrame % 6 === 0) {
        for (var b = 0; b < 6; b++) {
          var base = b < 2 ? 0.65 : b < 4 ? 0.45 : 0.28;
          bandsTgt[b] = Math.max(0.02, Math.min(0.98, base + (Math.random() - 0.5) * 0.7));
        }
      }
      for (var b = 0; b < 6; b++) {
        bands[b] += (bandsTgt[b] - bands[b]) * 0.28;
      }
      for (var i = 0; i < N; i++) {
        var bIdx = Math.min(5, Math.floor(i / N * 6));
        var tgt  = Math.max(0, Math.min(1, bands[bIdx] * (0.72 + Math.random() * 0.56)));
        vizBars[i] += (tgt - vizBars[i]) * 0.38;
      }
    } else {
      // Decay bars toward zero
      for (var i = 0; i < N; i++) {
        vizBars[i] *= 0.84;
        if (vizBars[i] < 0.004) vizBars[i] = 0;
      }
    }

    // Update peak markers
    for (var i = 0; i < N; i++) {
      if (vizBars[i] >= vizPeaks[i]) {
        vizPeaks[i]   = vizBars[i];
        vizPeakVel[i] = 0;
      } else {
        vizPeakVel[i] += 0.0025;
        vizPeaks[i]    = Math.max(0, vizPeaks[i] - vizPeakVel[i]);
      }
    }
  }

  function vizDraw() {
    if (!vizCtx) return;
    var W = vizCanvas.width;
    var H = vizCanvas.height;

    vizCtx.fillStyle = '#000';
    vizCtx.fillRect(0, 0, W, H);

    var grad = getGrad();

    for (var i = 0; i < N; i++) {
      var x1 = Math.round(i * W / N);
      var x2 = Math.round((i + 1) * W / N) - 1;
      var bw  = Math.max(1, x2 - x1);
      var h   = Math.round(vizBars[i] * H);

      if (h > 0) {
        vizCtx.fillStyle = grad;
        vizCtx.fillRect(x1, H - h, bw, h);
      }

      // Peak dot
      if (vizPeaks[i] > 0.004) {
        var py = Math.round(vizPeaks[i] * H);
        vizCtx.fillStyle = '#00FF00';
        vizCtx.fillRect(x1, H - py, bw, 2);
      }
    }
  }

  function vizLoop() {
    vizStep();
    vizDraw();

    var stillMoving = vizActive;
    if (!stillMoving) {
      for (var i = 0; i < N; i++) {
        if (vizBars[i] > 0.004 || vizPeaks[i] > 0.004) { stillMoving = true; break; }
      }
    }

    if (stillMoving) {
      vizAnimId = requestAnimationFrame(vizLoop);
    } else {
      vizAnimId = null;
      // Clear to black when fully decayed
      if (vizCtx) {
        vizCtx.fillStyle = '#000';
        vizCtx.fillRect(0, 0, vizCanvas.width, vizCanvas.height);
      }
    }
  }

  function vizStart() {
    vizActive = true;
    if (!vizAnimId) vizLoop();
  }

  function vizStop() {
    vizActive = false;
    if (!vizAnimId) vizLoop(); // kick off decay loop
  }
})();
