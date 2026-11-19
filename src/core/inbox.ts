import type { InboxMessage } from './types';

/**
 * The demo inbox. It is hard-coded on purpose: the app never reads a real
 * SMS inbox, so no personal data ever reaches the model.
 */
export const DEMO_INBOX: readonly InboxMessage[] = [
  {
    id: 'm1',
    sender: 'Unknown number',
    handle: '+33 6 12 34 56 78',
    body:
      'URGENT: your account is suspended. Pay 49 EUR now at secure-verif1.xyz to keep access.',
  },
  {
    id: 'm2',
    sender: 'Amina Diallo',
    handle: 'supplier',
    body:
      'Invoice 2026-118 is ready, the amount is unchanged. Can you confirm receipt before Friday?',
  },
  {
    id: 'm3',
    sender: 'Bank (spoofed)',
    handle: '+33 1 44 55 66 77',
    body:
      'Dear client, a new beneficiary has been added to your account. Call +33 1 44 55 66 77 to cancel.',
  },
  {
    id: 'm4',
    sender: 'Team - canteen',
    handle: 'internal',
    body: 'The canteen menu for Thursday is posted in the usual place. See you there!',
  },
];

/** Pasted-message helper: a message built from arbitrary text. */
export function messageFromText(text: string): InboxMessage {
  return {
    id: 'pasted',
    sender: 'Pasted message',
    handle: 'pasted',
    body: text.trim(),
  };
}
