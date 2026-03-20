import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="w97dlg-overlay">
      <div className="w97dlg" role="dialog" aria-modal="true">
        <div className="w97dlg-titlebar">
          <span className="w97dlg-title">404: Page not found</span>
          <div className="w97dlg-titlebtns">
            <Link className="w97dlg-titlebtn" href="/" aria-label="Close">
              &#x2715;
            </Link>
          </div>
        </div>
        <div className="w97dlg-body">
          <div className="w97dlg-icon" aria-hidden="true">
            <svg viewBox="0 0 32 32" width="32" height="32" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="14" fill="#cc0000" stroke="#000" strokeWidth="1.5" />
              <line
                x1="10"
                y1="10"
                x2="22"
                y2="22"
                stroke="#fff"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <line
                x1="22"
                y1="10"
                x2="10"
                y2="22"
                stroke="#fff"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="w97dlg-message">
            <div style={{ fontWeight: 'bold', marginBottom: 6 }}>
              Cannot find the address you entered. Make sure the path and filename are correct and
              that all required libraries are available.
            </div>
          </div>
        </div>
        <div className="w97dlg-btnrow">
          <Link className="w97dlg-btn w97dlg-btn-default" href="/">
            Go to desktop
          </Link>
        </div>
      </div>
    </div>
  );
}
