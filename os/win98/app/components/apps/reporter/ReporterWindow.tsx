'use client';

import React, { useState } from 'react';
import { AppWindow, TitleBar } from '../../win98';
import type { AppConfig } from '@/app/types/app-config';
import { useWindowManager } from '@retro-web/core/context';

const ICON = 'shell/icons/help.png';

export const reporterAppConfig: AppConfig = {
  id: 'reporter',
  label: 'Feature Request & Bug Reporter',
  icon: ICON,
  desktop: true,
  startMenu: { path: ['Programs'] },
  taskbarLabel: 'Feature Request & Bug Reporter',
};

export function ReporterWindow() {
  const { apps, hideApp } = useWindowManager();
  const [submitChecked, setSubmitChecked] = useState(true);
  const [comment, setComment] = useState('');
  const [includeContext, setIncludeContext] = useState(true);
  const [emailMe, setEmailMe] = useState(false);
  const [email, setEmail] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [reportType, setReportType] = useState<'bug' | 'feature'>('bug');
  const [steps, setSteps] = useState('');

  const handleSubmit = () => {
    const subject = encodeURIComponent(
      `[Windows 98 Remake] ${reportType === 'bug' ? 'Bug' : 'Feature'}: ${(comment || 'No description').slice(0, 50)}...`,
    );
    const bodyParts: string[] = [];
    bodyParts.push((comment || 'No description').trim());
    if (detailsOpen && steps.trim()) {
      bodyParts.push('');
      bodyParts.push('Steps to reproduce:');
      bodyParts.push(steps.trim());
    }
    if (includeContext) {
      bodyParts.push('');
      bodyParts.push('Context: [Include current app/context was checked]');
    }
    if (emailMe && email.trim()) {
      bodyParts.push('');
      bodyParts.push(`Contact: ${email.trim()}`);
    }
    const body = encodeURIComponent(bodyParts.join('\n'));
    window.open(`mailto:zkarpinski@protonmail.com?subject=${subject}&body=${body}`, '_blank');
    hideApp('reporter');
  };

  const handleCancel = () => {
    hideApp('reporter');
  };

  return (
    <AppWindow
      id="reporter-window"
      appId="reporter"
      className="reporter-window app-window app-window-hidden"
      titleBar={
        <TitleBar
          title="Feature Request & Bug Reporter"
          icon={<img src={ICON} alt="" style={{ width: 16, height: 16, marginRight: 4 }} />}
          showMin
          showMax={false}
          showClose
        />
      }
      allowResize={false}
      onClose={() => hideApp('reporter')}
    >
      <div className="reporter-body">
        <h2 className="reporter-heading">Report a bug or suggest a feature</h2>
        <p className="reporter-intro">
          Found something broken or have an idea to make this Windows 98 remake better? Use this
          form to send feedback.
        </p>
        <p className="reporter-cta">
          To help improve the site, you can send a report with your comments below.
        </p>

        <div className="reporter-options">
          <label className="reporter-checkbox">
            <input
              type="checkbox"
              checked={submitChecked}
              onChange={(e) => setSubmitChecked(e.target.checked)}
            />
            <span>Submit this report when I click Submit Report</span>
          </label>
          <button
            type="button"
            className="reporter-details-btn win-btn"
            onClick={() => setDetailsOpen((o) => !o)}
          >
            Details...
          </button>
        </div>

        {detailsOpen && (
          <div className="reporter-details-panel">
            <label className="reporter-field">
              <span className="reporter-label">Type:</span>
              <select
                className="reporter-select"
                value={reportType}
                onChange={(e) => setReportType(e.target.value as 'bug' | 'feature')}
              >
                <option value="bug">Bug</option>
                <option value="feature">Feature request</option>
              </select>
            </label>
            <label className="reporter-field">
              <span className="reporter-label">Steps to reproduce (optional):</span>
              <textarea
                className="reporter-textarea reporter-textarea-small"
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                placeholder="Describe how to reproduce the issue..."
                rows={3}
              />
            </label>
          </div>
        )}

        <label className="reporter-field">
          <span className="reporter-label">Comment (required):</span>
          <textarea
            className="reporter-textarea"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment (describe the bug or feature idea)"
            rows={4}
          />
        </label>

        <label className="reporter-checkbox">
          <input
            type="checkbox"
            checked={includeContext}
            onChange={(e) => setIncludeContext(e.target.checked)}
          />
          <span>Include current app/context (e.g. which window was open)</span>
        </label>

        <label className="reporter-checkbox">
          <input type="checkbox" checked={emailMe} onChange={(e) => setEmailMe(e.target.checked)} />
          <span>Email me when there&apos;s an update</span>
        </label>
        {emailMe && (
          <label className="reporter-field reporter-email-field">
            <span className="reporter-label">Enter your email address here:</span>
            <input
              type="email"
              className="reporter-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
            />
          </label>
        )}

        <p className="reporter-notice">
          Your report will be submitted when you click Submit Report.
        </p>

        <div className="reporter-buttons">
          <button type="button" className="reporter-btn win-btn" onClick={handleCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="reporter-btn reporter-btn-primary win-btn"
            onClick={handleSubmit}
          >
            Submit Report
          </button>
        </div>
      </div>
    </AppWindow>
  );
}
