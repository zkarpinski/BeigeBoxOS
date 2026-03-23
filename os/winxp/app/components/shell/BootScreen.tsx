'use client';

export function BootScreen() {
  return (
    <>
      <div id="boot-screen">
        <div className="boot-inner">
          <img src="shell/images/winxp-boot.gif" className="boot-splash" alt="Windows XP" />
<div id="boot-click-prompt" className="boot-click-prompt" hidden>
            Click anywhere to continue
          </div>
        </div>
      </div>
      <audio id="boot-sound" src="shell/sounds/startup.mp3" preload="auto" />
    </>
  );
}
