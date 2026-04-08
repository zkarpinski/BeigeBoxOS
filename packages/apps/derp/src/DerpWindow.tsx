'use client';

import React, { useState, useCallback } from 'react';
import type { AppConfig } from '@retro-web/core';
import { useOsShell } from '@retro-web/core/context';
import { CATEGORIES, FUNCTIONS, ERROR_DETAILS, VENDORS, REGIONS } from './mockData';

export const DERP_ICON_SRC = 'apps/derp/derp-icon.png';

export const derpAppConfig: AppConfig = {
  id: 'derp',
  label: 'DERP',
  icon: DERP_ICON_SRC,
  desktop: true,
  startMenu: { path: ['Programs', 'Tools'], label: 'Error Reporting' },
  taskbarLabel: 'DERP',
};

const today = new Date().toISOString().split('T')[0];

interface FormState {
  accountNumber: string;
  customerNumber: string;
  agentName: string;
  agentId: string;
  vendor: string;
  categoryId: number | null;
  functionId: number | null;
  selectedErrors: Set<number>;
  comments: string;
  errorDate: string;
  noErrors: boolean;
  region: string;
}

function defaultForm(): FormState {
  return {
    accountNumber: '',
    customerNumber: '',
    agentName: '',
    agentId: '',
    vendor: '',
    categoryId: null,
    functionId: null,
    selectedErrors: new Set(),
    comments: '',
    errorDate: today,
    noErrors: false,
    region: '',
  };
}

export function DerpWindow() {
  const { AppWindow, TitleBar } = useOsShell();
  const [form, setForm] = useState<FormState>(defaultForm);
  const [status, setStatus] = useState('Ready');
  const [isError, setIsError] = useState(false);
  const [positiveFeedbackEnabled, setPositiveFeedbackEnabled] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const availableFunctions = form.categoryId
    ? FUNCTIONS.filter(f => f.categoryId === form.categoryId)
    : [];

  const availableDetails = form.functionId
    ? ERROR_DETAILS.filter(d => d.functionId === form.functionId)
    : [];

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function handleCategorySelect(categoryId: number) {
    setForm(prev => ({ ...prev, categoryId, functionId: null, selectedErrors: new Set() }));
  }

  function handleFunctionSelect(functionId: number) {
    setForm(prev => ({ ...prev, functionId, selectedErrors: new Set() }));
  }

  function toggleError(detailId: number) {
    setForm(prev => {
      const next = new Set(prev.selectedErrors);
      next.has(detailId) ? next.delete(detailId) : next.add(detailId);
      return { ...prev, selectedErrors: next };
    });
  }

  function handleClear() {
    setForm(defaultForm());
    setStatus('Ready');
    setIsError(false);
  }

  const handleFill = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) { setStatus('Clipboard is empty'); setIsError(false); return; }
      // Tab-delimited: AgentName\tAgentID\tVendor\tAccountNumber\tCustomerNumber
      const parts = text.split('\t').map(s => s.trim());
      setForm(prev => ({
        ...prev,
        agentName:      parts[0] || prev.agentName,
        agentId:        parts[1] || prev.agentId,
        vendor:         parts[2] || prev.vendor,
        accountNumber:  (parts[3] || prev.accountNumber).replace(/\D/g, '').slice(0, 10),
        customerNumber: (parts[4] || prev.customerNumber).replace(/\D/g, '').slice(0, 9),
      }));
      setStatus('Contact information filled from clipboard');
      setIsError(false);
    } catch {
      setStatus('Clipboard access denied — paste fields manually');
      setIsError(true);
    }
  }, []);

  function handleSubmit() {
    function fail(msg: string) { setStatus(msg); setIsError(true); }

    if (!form.agentName.trim()) return fail('Agent name is required');
    if (!form.agentId.trim())   return fail('Agent ID is required');

    if (form.noErrors) {
      if (!form.vendor) return fail('Vendor is required for positive feedback');
      if (!form.region) return fail('Region is required for positive feedback');
      setStatus(`✓ Positive feedback submitted — ${form.agentName} (${form.agentId}) · ${form.vendor}`);
      setIsError(false);
      handleClear();
      return;
    }

    if (!form.accountNumber.trim()) return fail('Account number is required');
    if (!form.categoryId)           return fail('Please select a category');
    if (!form.functionId)           return fail('Please select a function / task');
    if (form.selectedErrors.size === 0) return fail('Please select at least one error detail');

    const codes = ERROR_DETAILS
      .filter(d => form.selectedErrors.has(d.id))
      .map(d => d.code)
      .join(', ');

    setStatus(`✓ Report submitted — ${form.agentName} (${form.agentId}) · ${codes}`);
    setIsError(false);
    handleClear();
  }

  function toggleNoErrors() {
    setForm(prev => ({
      ...prev,
      noErrors: !prev.noErrors,
      categoryId: null,
      functionId: null,
      selectedErrors: new Set(),
    }));
  }

  function closeMenu() { setOpenMenu(null); }

  return (
    <AppWindow
      id="derp-window"
      appId="derp"
      className="derp-window app-window app-window-hidden"
      titleBar={
        <TitleBar
          title="Desktop Error Reporting Program"
          showMin
          showMax={false}
          showClose
        />
      }
    >
      {/* About dialog */}
      {showAbout && (
        <div className="derp-overlay" onClick={() => setShowAbout(false)}>
          <div className="derp-dialog" onClick={e => e.stopPropagation()}>
            <div className="derp-dialog-title">About DERP</div>
            <div className="derp-dialog-body">
              <p><strong>Desktop Error Reporting Program</strong></p>
              <p>Version 1.0 — KarpOS Edition</p>
              <p>Originally written in VB.NET (2015)</p>
              <p style={{ marginTop: 8, fontSize: 11, opacity: 0.6 }}>
                Zachary Karpinski &copy; 2015–{new Date().getFullYear()}
              </p>
            </div>
            <div className="derp-dialog-footer">
              <button className="derp-btn" onClick={() => setShowAbout(false)}>OK</button>
            </div>
          </div>
        </div>
      )}

      <div className="derp-app" onClick={closeMenu}>
        {/* ── Menu bar ─────────────────────────────────────────────────────── */}
        <div className="derp-menubar">
          {(['file', 'tools', 'help'] as const).map(menu => (
            <div
              key={menu}
              className={`derp-menu-root${openMenu === menu ? ' open' : ''}`}
              onClick={e => { e.stopPropagation(); setOpenMenu(openMenu === menu ? null : menu); }}
            >
              {menu.charAt(0).toUpperCase() + menu.slice(1)}
              {openMenu === menu && (
                <div className="derp-menu-dropdown">
                  {menu === 'file' && (
                    <div className="derp-menu-item" onClick={closeMenu}>Exit</div>
                  )}
                  {menu === 'tools' && (
                    <div className="derp-menu-item" onClick={() => { setPositiveFeedbackEnabled(v => !v); closeMenu(); }}>
                      {positiveFeedbackEnabled ? '✓\u2009' : '\u2003'}Enable Positive Feedback
                    </div>
                  )}
                  {menu === 'help' && (
                    <div className="derp-menu-item" onClick={() => { setShowAbout(true); closeMenu(); }}>About</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── Form body ─────────────────────────────────────────────────────── */}
        <div className="derp-body">

          {/* Account / Customer */}
          <div className="derp-row">
            <div className="derp-field">
              <label className="derp-label">Account #</label>
              <input
                className="derp-input"
                maxLength={10}
                value={form.accountNumber}
                onChange={e => setField('accountNumber', e.target.value.replace(/\D/g, ''))}
                placeholder="0000000000"
              />
            </div>
            <div className="derp-field">
              <label className="derp-label">Customer #</label>
              <input
                className="derp-input"
                maxLength={9}
                value={form.customerNumber}
                onChange={e => setField('customerNumber', e.target.value.replace(/\D/g, ''))}
                placeholder="000000000"
              />
            </div>
          </div>

          {/* Erroneous Agent group */}
          <fieldset className="derp-fieldset">
            <legend className="derp-legend">Erroneous Agent</legend>
            <div className="derp-row">
              <div className="derp-field derp-field-grow">
                <label className="derp-label">Agent Name</label>
                <input
                  className="derp-input"
                  value={form.agentName}
                  onChange={e => setField('agentName', e.target.value)}
                  placeholder="First Last"
                />
              </div>
              <div className="derp-field">
                <label className="derp-label">Agent ID</label>
                <input
                  className="derp-input derp-input-sm"
                  value={form.agentId}
                  onChange={e => setField('agentId', e.target.value)}
                  placeholder="A0000"
                />
              </div>
            </div>
          </fieldset>

          {/* Vendor + No Errors toggle */}
          <div className="derp-row derp-row-vcenter">
            <div className="derp-field derp-field-grow">
              <label className="derp-label">Vendor</label>
              <select
                className="derp-select"
                value={form.vendor}
                onChange={e => setField('vendor', e.target.value)}
              >
                <option value="">— Select Vendor —</option>
                {VENDORS.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            {positiveFeedbackEnabled && (
              <label className="derp-checkbox-label">
                <input type="checkbox" checked={form.noErrors} onChange={toggleNoErrors} />
                No Errors
              </label>
            )}
          </div>

          {/* ── Positive feedback mode ───────────────────────────────────────── */}
          {form.noErrors ? (
            <div className="derp-field">
              <label className="derp-label">Region</label>
              <select
                className="derp-select"
                value={form.region}
                onChange={e => setField('region', e.target.value)}
              >
                <option value="">— Select Region —</option>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          ) : (
            /* ── Error selection ──────────────────────────────────────────────── */
            <>
              <div className="derp-row derp-lists-row">
                <div className="derp-field derp-field-grow">
                  <label className="derp-label">Category</label>
                  <div className="derp-listbox">
                    {CATEGORIES.map(cat => (
                      <div
                        key={cat.id}
                        className={`derp-listbox-item${form.categoryId === cat.id ? ' active' : ''}`}
                        onClick={() => handleCategorySelect(cat.id)}
                      >
                        {cat.name}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="derp-field derp-field-grow">
                  <label className="derp-label">Function / Task</label>
                  <div className="derp-listbox">
                    {availableFunctions.length === 0
                      ? <div className="derp-listbox-hint">← Select a category</div>
                      : availableFunctions.map(fn => (
                          <div
                            key={fn.id}
                            className={`derp-listbox-item${form.functionId === fn.id ? ' active' : ''}`}
                            onClick={() => handleFunctionSelect(fn.id)}
                          >
                            {fn.name}
                          </div>
                        ))
                    }
                  </div>
                </div>
              </div>

              <div className="derp-field">
                <label className="derp-label">Error Details</label>
                <div className="derp-grid">
                  {availableDetails.length === 0
                    ? <div className="derp-listbox-hint">Select a function to see available errors</div>
                    : availableDetails.map(detail => (
                        <label key={detail.id} className="derp-grid-row">
                          <input
                            type="checkbox"
                            checked={form.selectedErrors.has(detail.id)}
                            onChange={() => toggleError(detail.id)}
                          />
                          <span className="derp-grid-code">{detail.code}</span>
                          <span className="derp-grid-desc">{detail.description}</span>
                        </label>
                      ))
                  }
                </div>
              </div>
            </>
          )}

          {/* Date + Comments */}
          <div className="derp-row">
            <div className="derp-field">
              <label className="derp-label">Error Date</label>
              <input
                type="date"
                className="derp-input"
                value={form.errorDate}
                onChange={e => setField('errorDate', e.target.value)}
              />
            </div>
            <div className="derp-field derp-field-grow">
              <label className="derp-label">
                Comments&nbsp;
                <span className="derp-char-count">({form.comments.length}/255)</span>
              </label>
              <textarea
                className="derp-textarea"
                maxLength={255}
                rows={2}
                value={form.comments}
                onChange={e => setField('comments', e.target.value)}
                placeholder="Additional notes…"
              />
            </div>
          </div>
        </div>

        {/* ── Buttons ───────────────────────────────────────────────────────── */}
        <div className="derp-btnbar">
          <button className="derp-btn" onClick={handleFill} title="Paste tab-delimited contact info from clipboard">
            Fill
          </button>
          <button className="derp-btn derp-btn-primary" onClick={handleSubmit}>
            Submit
          </button>
          <button className="derp-btn" onClick={handleClear}>
            Clear
          </button>
        </div>

        {/* ── Status bar ────────────────────────────────────────────────────── */}
        <div className={`derp-statusbar${isError ? ' derp-statusbar-error' : ''}`}>
          {status}
        </div>
      </div>
    </AppWindow>
  );
}
