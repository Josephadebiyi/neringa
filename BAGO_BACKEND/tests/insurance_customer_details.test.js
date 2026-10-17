import {beforeEach, expect, it, vi} from 'vitest';
const m = vi.hoisted(() => ({query: vi.fn(), get: vi.fn(), buy: vi.fn()}));
vi.mock('../lib/postgres/db.js', () => ({query: m.query}));
vi.mock('../lib/postgres/shipping.js', () => ({getShipmentRequestById: m.get}));
vi.mock('../services/myCoverService.js', () => ({purchaseMyCoverPolicy: m.buy}));
import {completeInsuranceDetails} from '../controllers/InsuranceCustomerController.js';
const shipment = {id: 'shipment', senderId: 'sender', insurance: true, insuranceCost: 20, status: 'accepted_awaiting_inspection', insuranceStatus: 'failed'};
function response() {return {code: 200, status(code) {this.code = code; return this;}, json(data) {this.data = data; return this;}};}
function request(user = 'sender', gender = 'female') {return {params: {requestId: 'shipment'}, user: {id: user}, body: {gender}};}
beforeEach(() => {vi.clearAllMocks(); m.get.mockResolvedValue(shipment); m.query.mockResolvedValue({rows: [{id: 'shipment'}]}); m.buy.mockResolvedValue('policy');});
it('only the sender can supply their own insurance details', async () => {
  const res = response(); await completeInsuranceDetails(request('traveler'), res);
  expect(res.code).toBe(403); expect(m.query).not.toHaveBeenCalled(); expect(m.buy).not.toHaveBeenCalled();
});
it('saves the supplied gender then retries using the refreshed shipment', async () => {
  const refreshed = {...shipment, insurancePolicyData: {customerDetails: {gender: 'Female'}}};
  m.get.mockResolvedValueOnce(shipment).mockResolvedValueOnce(refreshed).mockResolvedValueOnce({...refreshed, insuranceStatus: 'active', insurancePolicyId: 'policy'});
  const res = response(); await completeInsuranceDetails(request(), res);
  expect(m.query.mock.calls[0][1]).toEqual(['shipment', 'sender', 'Female']);
  expect(m.buy).toHaveBeenCalledWith(refreshed); expect(res.data.data.insuranceStatus).toBe('active');
});
it('rejects invalid gender instead of substituting a value', async () => {
  const res = response(); await completeInsuranceDetails(request('sender', 'unknown'), res);
  expect(res.code).toBe(400); expect(m.buy).not.toHaveBeenCalled();
});
it('does not repurchase or modify an already-submitted policy', async () => {
  m.get.mockResolvedValue({...shipment, insurancePolicyData: {submittedAt: '2026-10-17'}});
  const res = response(); await completeInsuranceDetails(request(), res);
  expect(res.code).toBe(409); expect(m.query).not.toHaveBeenCalled(); expect(m.buy).not.toHaveBeenCalled();
});
it('does not overwrite an issued policy', async () => {
  m.get.mockResolvedValue({...shipment, insurancePolicyId: 'policy'});
  const res = response(); await completeInsuranceDetails(request(), res);
  expect(res.code).toBe(200); expect(m.query).not.toHaveBeenCalled(); expect(m.buy).not.toHaveBeenCalled();
});

it('blocks retrying legacy pending applications that already contain a submitted payload', async () => {
  m.get.mockResolvedValue({...shipment, insuranceStatus: 'pending_purchase', insurancePolicyData: {payload: {email: 'sender@example.com'}}});
  const res = response(); await completeInsuranceDetails(request(), res);
  expect(res.code).toBe(409); expect(m.buy).not.toHaveBeenCalled();
});
