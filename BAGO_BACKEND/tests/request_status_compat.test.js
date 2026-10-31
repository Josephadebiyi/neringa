import { describe, expect, it } from 'vitest';
import { clientRequestStatus, withClientStatus } from '../services/requestStatusCompat.js';

describe('request status shown to mobile apps', () => {
  it('shows inspection stages as accepted so travelers get the status buttons', () => {
    for (const s of ['accepted_awaiting_inspection', 'inspection_in_progress', 'inspection_completed', 'approved_for_trip']) {
      expect(clientRequestStatus(s)).toBe('accepted');
    }
  });

  it('leaves every other status alone', () => {
    for (const s of ['pending', 'accepted', 'intransit', 'delivering', 'completed', 'rejected', 'cancelled', 'rejected_at_inspection_under_review']) {
      expect(clientRequestStatus(s)).toBe(s);
    }
  });

  it('keeps the real status in workflowStatus', () => {
    expect(withClientStatus({ id: 1, status: 'accepted_awaiting_inspection' }))
      .toEqual({ id: 1, status: 'accepted', workflowStatus: 'accepted_awaiting_inspection' });
  });
});
