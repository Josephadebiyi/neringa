import { describe, it, expect } from 'vitest';
import { getBusinessRestrictionState, BUSINESS_MIN_PAYOUT_NGN, GRACE_PERIOD_DAYS } from '../services/businessRestrictionService.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const hoursAgo = (h) => new Date(Date.now() - h * 60 * 60 * 1000).toISOString();
const daysAgo = (d) => new Date(Date.now() - d * DAY_MS).toISOString();

describe('getBusinessRestrictionState', () => {
  it('does not govern individual accounts', () => {
    const state = getBusinessRestrictionState({ accountType: 'individual' });
    expect(state).toMatchObject({ governed: false, graceActive: false, restricted: false, deadline: null });
  });

  it('does not govern a company account that has not started its grace period yet (e.g. admin-created, temp password not changed)', () => {
    const state = getBusinessRestrictionState({
      accountType: 'company', businessStatus: 'not_started', businessGracePeriodStartedAt: null,
    });
    expect(state).toMatchObject({ governed: true, graceActive: false, restricted: false, deadline: null });
  });

  it('is fully usable (graceActive) just after the grace period starts — self-signup path', () => {
    const state = getBusinessRestrictionState({
      accountType: 'company', businessStatus: 'representative_kyc_required',
      businessGracePeriodStartedAt: hoursAgo(1),
    });
    expect(state.governed).toBe(true);
    expect(state.graceActive).toBe(true);
    expect(state.restricted).toBe(false);
  });

  it('is fully usable (graceActive) just after the grace period starts — admin-created path (post first login)', () => {
    const state = getBusinessRestrictionState({
      accountType: 'company', businessStatus: 'pending_review',
      businessGracePeriodStartedAt: daysAgo(1),
    });
    expect(state.graceActive).toBe(true);
    expect(state.restricted).toBe(false);
  });

  it(`stays active right up to the ${GRACE_PERIOD_DAYS}-day boundary`, () => {
    const state = getBusinessRestrictionState({
      accountType: 'company', businessStatus: 'pending_review',
      businessGracePeriodStartedAt: daysAgo(GRACE_PERIOD_DAYS - 0.01),
    });
    expect(state.graceActive).toBe(true);
    expect(state.restricted).toBe(false);
  });

  it(`becomes restricted once the grace period exceeds ${GRACE_PERIOD_DAYS} days without admin approval`, () => {
    const state = getBusinessRestrictionState({
      accountType: 'company', businessStatus: 'pending_review',
      businessGracePeriodStartedAt: daysAgo(GRACE_PERIOD_DAYS + 1),
    });
    expect(state.governed).toBe(true);
    expect(state.graceActive).toBe(false);
    expect(state.restricted).toBe(true);
  });

  it('is never restricted once an admin has approved the business, regardless of how old the grace period start is', () => {
    const state = getBusinessRestrictionState({
      accountType: 'company', businessStatus: 'verified',
      businessGracePeriodStartedAt: daysAgo(GRACE_PERIOD_DAYS + 30),
    });
    expect(state).toMatchObject({ governed: true, graceActive: false, restricted: false, deadline: null });
  });

  it('accepts snake_case profile rows (as returned directly from SQL) as well as camelCase', () => {
    const state = getBusinessRestrictionState({
      account_type: 'company', business_status: 'pending_review',
      business_grace_period_started_at: daysAgo(GRACE_PERIOD_DAYS + 1),
    });
    expect(state.restricted).toBe(true);
  });

  it('exposes the minimum grace-period payout threshold used by the withdrawal gate', () => {
    expect(BUSINESS_MIN_PAYOUT_NGN).toBe(1_000_000);
  });
});
