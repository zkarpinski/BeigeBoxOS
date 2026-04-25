'use client';

import React, { useState, useEffect } from 'react';
import { usePalmSounds } from '../hooks/usePalmSounds';

interface Contact {
  id: string;
  lastName: string;
  firstName: string;
  company: string;
  phone: string;
  email: string;
  address: string;
}

const STORAGE_KEY = 'palmos-contacts';

const DEFAULT_CONTACTS: Contact[] = [
  {
    id: '1',
    lastName: 'Spronck',
    firstName: 'Pieter',
    company: 'Space Trader Games',
    phone: '555-0100',
    email: 'pieter@spacetrader.com',
    address: 'The Netherlands',
  },
  {
    id: '2',
    lastName: 'Jobs',
    firstName: 'Steve',
    company: 'Apple Computer',
    phone: '555-0101',
    email: 'sjobs@apple.com',
    address: 'Cupertino, CA',
  },
  {
    id: '3',
    lastName: 'Hawkins',
    firstName: 'Jeff',
    company: 'Palm Computing',
    phone: '555-0102',
    email: 'jhawkins@palm.com',
    address: 'Milpitas, CA',
  },
  {
    id: '4',
    lastName: 'Yankowski',
    firstName: 'Carl',
    company: 'Palm Inc.',
    phone: '555-0103',
    email: '',
    address: 'Santa Clara, CA',
  },
  {
    id: '5',
    lastName: 'Dubinsky',
    firstName: 'Donna',
    company: 'Handspring',
    phone: '555-0104',
    email: '',
    address: 'Mountain View, CA',
  },
];

function load(): Contact[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_CONTACTS;
  } catch {
    return DEFAULT_CONTACTS;
  }
}
function save(contacts: Contact[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
}

function displayName(c: Contact) {
  return c.lastName ? `${c.lastName}, ${c.firstName}` : c.firstName || c.company || '(no name)';
}

export function AddressApp() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const { playClick } = usePalmSounds();

  useEffect(() => {
    setContacts(load());
  }, []);

  const sorted = [...contacts].sort((a, b) => displayName(a).localeCompare(displayName(b)));

  // Build alphabetical groups
  const groups: { letter: string; contacts: Contact[] }[] = [];
  for (const c of sorted) {
    const letter = (c.lastName || c.firstName || '#')[0].toUpperCase();
    const last = groups[groups.length - 1];
    if (last?.letter === letter) {
      last.contacts.push(c);
    } else {
      groups.push({ letter, contacts: [c] });
    }
  }

  const currentContact = contacts.find((c) => c.id === selected) ?? null;

  if (currentContact) {
    return (
      <div
        style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'white' }}
      >
        {/* Detail header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px solid #000',
            padding: '2px 4px',
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => {
              setSelected(null);
              playClick();
            }}
            style={{
              border: '1px solid #000',
              background: 'white',
              padding: '0 6px',
              fontSize: '10px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            ◀ Done
          </button>
        </div>

        {/* Contact detail */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '6px 8px',
            fontSize: '11px',
            color: '#000',
          }}
        >
          <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '6px' }}>
            {currentContact.firstName} {currentContact.lastName}
          </div>
          {currentContact.company && <Field label="Company" value={currentContact.company} />}
          {currentContact.phone && <Field label="Work" value={currentContact.phone} />}
          {currentContact.email && <Field label="Email" value={currentContact.email} />}
          {currentContact.address && <Field label="Address" value={currentContact.address} />}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'white' }}>
      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {groups.map(({ letter, contacts: group }) => (
          <React.Fragment key={letter}>
            {/* Alpha divider */}
            <div
              style={{
                background: '#1A1A8C',
                color: 'white',
                padding: '1px 6px',
                fontSize: '10px',
                fontWeight: 'bold',
              }}
            >
              {letter}
            </div>
            {group.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setSelected(c.id);
                  playClick();
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  borderBottom: '1px solid #eee',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  color: '#000',
                }}
              >
                <span style={{ fontWeight: 'bold' }}>{displayName(c)}</span>
                {c.phone && (
                  <span style={{ color: '#666', marginLeft: '6px', fontSize: '10px' }}>
                    {c.phone}
                  </span>
                )}
              </button>
            ))}
          </React.Fragment>
        ))}
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          padding: '4px',
          borderTop: '1px solid #000',
          flexShrink: 0,
        }}
      >
        <div style={{ fontSize: '10px', color: '#555', alignSelf: 'center' }}>
          {contacts.length} contacts
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: '5px' }}>
      <span style={{ color: '#888', fontSize: '9px', display: 'block' }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
