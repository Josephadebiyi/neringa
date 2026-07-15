import { describe, expect, it } from 'vitest';

import { validateItem } from '../services/restrictedItems.js';

describe('Bago item policy', () => {
  it('approves ordinary multi-item contents', () => {
    expect(validateItem('Clothes and books', 'Fashion', 100, {
      items: ['Clothes', 'Books'], travellerMayInspect: true,
    })).toMatchObject({ outcome: 'approved', allowed: true });
  });

  it('requires inspection instead of rejecting wrapped packages', () => {
    expect(validateItem('Gift box', 'Gifts', 50, {
      items: ['Gift boxes'], wrapped: true, travellerMayInspect: true,
    })).toMatchObject({ outcome: 'approved_with_conditions', allowed: true });
  });

  it('sends high-value and standalone batteries to manual review', () => {
    expect(validateItem('Luxury watches', 'Fashion', 9000, {
      items: ['Luxury watches'], travellerMayInspect: true,
    })).toMatchObject({ outcome: 'manual_review', allowed: true });
  });

  it('rejects declared prohibited items and refusal of inspection', () => {
    expect(validateItem('Cash', 'Other', 100, {
      items: ['Cash'], travellerMayInspect: true,
    })).toMatchObject({ outcome: 'rejected', allowed: false });
    expect(validateItem('Personal box', 'Other', 100, {
      items: ['Personal box'], refusesInspection: true,
    })).toMatchObject({ outcome: 'rejected', allowed: false });
  });
});
