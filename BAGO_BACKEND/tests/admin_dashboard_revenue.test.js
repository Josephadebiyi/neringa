import { describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({ query: vi.fn(async () => ({ rows: [] })), queryOne: vi.fn() }));
vi.mock('../lib/postgres/db.js', () => ({ query: m.query, queryOne: m.queryOne }));

import { dashboard } from '../controllers/AdminControllers/getDasboarddata.js';

describe('admin dashboard revenue', () => {
  it('reports income and commission from paid bookings, including ones awaiting the traveler', async () => {
    m.queryOne.mockImplementation(async (sql) => (sql.includes('total_income_eur')
      ? { total_income_eur: '68.79', total_commission_eur: '8.97', unconverted_count: 0 }
      : { total: 0 }));
    const res = { status() { return this; }, json(data) { this.data = data; return this; } };
    await dashboard({ query: {} }, res, vi.fn());
    const totals = res.data.data?.stats || res.data.data || res.data;
    const payload = JSON.stringify(res.data);
    expect(payload).toContain('"totalIncome":68.79');
    expect(payload).toContain('"totalCommission":8.97');
    const sql = m.queryOne.mock.calls.find(([q]) => q.includes('total_income_eur'))[0];
    expect(sql).toContain('sl.shipment_id IS NOT NULL');
    expect(sql).toContain("NOT IN ('cancelled', 'rejected', 'refund_approved')");
    expect(m.queryOne.mock.calls.filter(([q]) => q.includes('total_income_eur'))).toHaveLength(1);
    expect(totals).toBeTruthy();
  });
});
