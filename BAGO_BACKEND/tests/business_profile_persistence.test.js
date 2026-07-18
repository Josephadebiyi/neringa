import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
  clientQuery: vi.fn(),
}));

vi.mock('../lib/postgres/db.js', () => ({
  query: mocks.query,
  queryOne: vi.fn(),
  withTransaction: async (work) => work({ query: mocks.clientQuery, release: vi.fn() }),
}));

vi.mock('../services/currencyConverter.js', () => ({
  CurrencyService: { getExchangeRate: vi.fn() },
}));

import { createProfileWithWallet } from '../lib/postgres/profiles.js';

describe('business profile persistence', () => {
  beforeEach(() => {
    mocks.clientQuery.mockReset();
    mocks.clientQuery
      .mockResolvedValueOnce({ rows: [{ id: 'business-user-id' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{
        id: 'business-user-id', email: 'ops@example.com', first_name: 'Ada', last_name: 'Cole',
        account_type: 'company', company_name: 'Acme Logistics Ltd', trading_name: 'Acme Express',
        business_registration_number: 'RC-12345', business_type: 'Logistics',
        business_address: '1 Market Street', business_tax_id: 'TAX-9', representative_role: 'Director',
        business_status: 'representative_kyc_required', wallet_currency: 'EUR', available_balance: 0,
      }] });
  });

  it('writes all business fields and creates the shared wallet in one transaction', async () => {
    const profile = await createProfileWithWallet({
      firstName: 'Ada', lastName: 'Cole', email: 'ops@example.com', phone: '+34123456789',
      passwordHash: 'hashed', country: 'Spain', dateOfBirth: '1990-01-01',
      paymentGateway: 'flutterwave', preferredCurrency: 'EUR', accountType: 'company',
      companyName: '  Acme Logistics Ltd  ', tradingName: ' Acme Express ',
      businessRegistrationNumber: ' RC-12345 ', businessType: ' Logistics ',
      businessAddress: ' 1 Market Street ', businessTaxId: ' TAX-9 ', representativeRole: ' Director ',
    });

    const insertParams = mocks.clientQuery.mock.calls[0][1];
    expect(insertParams.slice(14)).toEqual([
      'company', 'Acme Logistics Ltd', 'Acme Express', 'RC-12345', 'Logistics',
      '1 Market Street', 'TAX-9', 'Director', 'representative_kyc_required',
    ]);
    expect(mocks.clientQuery.mock.calls[1][1]).toEqual(['business-user-id', 'EUR']);
    expect(profile).toMatchObject({
      accountType: 'company', companyName: 'Acme Logistics Ltd', tradingName: 'Acme Express',
      businessRegistrationNumber: 'RC-12345', businessStatus: 'representative_kyc_required',
      walletCurrency: 'EUR', walletBalance: 0,
    });
  });
});
