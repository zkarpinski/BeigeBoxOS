'use client';

export function BootScreen() {
  return (
    <>
      <div id="boot-screen">
        <div className="boot-inner">
          <img src="shell/images/win98-boot.jpg" className="boot-splash" alt="Windows 98" />
          <div className="boot-bar-wrap">
            <div className="boot-bar-track">
              <div id="boot-bar-fill" className="boot-bar-fill"></div>
            </div>
          </div>
          <div id="boot-click-prompt" className="boot-click-prompt" hidden>
            Click anywhere to continue
          </div>
        </div>
      </div>
      <audio id="boot-sound" src="shell/sounds/startup.wav" preload="auto" />
    </>
  );
}
