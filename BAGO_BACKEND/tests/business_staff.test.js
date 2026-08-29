import { describe, it, expect, vi, beforeEach } from 'vitest';

const { query, queryOne } = vi.hoisted(() => ({ query: vi.fn(), queryOne: vi.fn() }));
vi.mock('../lib/postgres/db.js', () => ({ query, queryOne }));

const { createStaffAccount, MAX_STAFF_PER_BUSINESS } = await import('../lib/postgres/businessStaff.js');

describe('createStaffAccount', () => {
  beforeEach(() => {
    query.mockReset();
    queryOne.mockReset();
  });

  it('rejects when the email is already taken by another staff account', async () => {
    queryOne.mockResolvedValueOnce({ id: 'existing-staff', email: 'staff@biz.com', permissions: [] });

    await expect(
      createStaffAccount({ businessProfileId: 'biz-1', email: 'staff@biz.com', password: 'password123' }),
    ).rejects.toMatchObject({ code: 'EMAIL_TAKEN' });
  });

  it(`rejects the ${MAX_STAFF_PER_BUSINESS + 1}th active staff account for one business`, async () => {
    queryOne
      .mockResolvedValueOnce(null) // findStaffByEmail: no existing staff with this email
      .mockResolvedValueOnce({ total: MAX_STAFF_PER_BUSINESS }); // countActiveStaffForBusiness: already at the cap

    await expect(
      createStaffAccount({ businessProfileId: 'biz-1', email: 'new-staff@biz.com', password: 'password123' }),
    ).rejects.toMatchObject({ code: 'STAFF_LIMIT_REACHED' });
  });

  it('creates a staff account when under the cap and the email is free', async () => {
    queryOne
      .mockResolvedValueOnce(null) // findStaffByEmail
      .mockResolvedValueOnce({ total: MAX_STAFF_PER_BUSINESS - 1 }) // countActiveStaffForBusiness
      .mockResolvedValueOnce({
        id: 'new-staff-id', business_profile_id: 'biz-1', email: 'new-staff@biz.com',
        full_name: null, permissions: ['deliveries.manage'], is_active: true,
        last_login_at: null, created_at: new Date(), updated_at: new Date(),
      });

    const staff = await createStaffAccount({
      businessProfileId: 'biz-1', email: 'new-staff@biz.com', password: 'password123', permissions: ['deliveries.manage'],
    });

    expect(staff).toMatchObject({ id: 'new-staff-id', email: 'new-staff@biz.com', permissions: ['deliveries.manage'] });
  });
});
