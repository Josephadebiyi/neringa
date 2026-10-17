import { beforeEach, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({query: vi.fn(), one: vi.fn()}));
vi.mock('../lib/postgres/db.js', () => ({query: m.query, queryOne: m.one, withTransaction: work => work({query: m.query})}));
vi.mock('../lib/postgres/tripCapacity.js', () => ({ensureTripCapacityColumns: vi.fn(), syncTripCapacity: vi.fn(), buildTripCapacitySnapshot: vi.fn(), isTripPubliclyVisible: vi.fn()}));
vi.mock('../lib/postgres/operationalRecords.js', () => ({recordOperationalEvent: vi.fn()}));
vi.mock('../services/currencyConverter.js', () => ({convertCurrency: vi.fn()}));
vi.mock('../services/chatPolicyService.js', () => ({classifyChatMessage: vi.fn().mockResolvedValue({})}));
import {updateShipmentRequestStatus} from '../lib/postgres/shipping.js';
import {getConversationById} from '../lib/postgres/messaging.js';
const request = {id: 'new-request', status: 'pending', sender_id: 'sender', traveler_id: 'traveler', trip_id: 'trip', package_id: 'pkg'};
beforeEach(() => {
  vi.clearAllMocks();
  m.query.mockImplementation(async sql => {
    if (sql.includes('from public.shipment_requests sr')) return {rows: [request]};
    if (sql.includes('from public.conversations')) return {rows: [{id: 'old-chat'}]};
    return {rows: []};
  });
  m.one.mockResolvedValue(request);
});
it('acceptance reuses and relinks a previous chat and creates the handover PIN', async () => {
  await updateShipmentRequestStatus({requestId: 'new-request', travelerId: 'traveler', status: 'accepted'});
  const link = m.query.mock.calls.find(([sql]) => sql.includes('update public.conversations'));
  expect(link).toBeTruthy();
  expect(link[0]).toContain('request_id = $3');
  expect(link[1]).toEqual(['old-chat', expect.any(String), 'new-request', 'trip']);
  expect(m.query.mock.calls.some(([sql]) => sql.includes('SET handover_pin'))).toBe(true);
});
it('an active shipment overrides the completed shipment linked to an older chat', async () => {
  m.one.mockResolvedValue({id: 'chat', request_id: 'old-request', request_status: 'completed', active_requests: [{id: 'new-request', status: 'accepted_awaiting_inspection'}]});
  const conversation = await getConversationById('chat', 'sender');
  expect(conversation.request.status).toBe('accepted_awaiting_inspection');
  expect(conversation.request.id).toBe('new-request');
});
it('does not reopen chats when all shipments really are closed', async () => {
  m.one.mockResolvedValue({id: 'chat', request_id: 'old-request', request_status: 'completed', active_requests: []});
  expect((await getConversationById('chat')).request.status).toBe('completed');
});
it('allows the traveler to start transit without inspection photos or approvals', async () => {
  await expect(updateShipmentRequestStatus({requestId: 'new-request', travelerId: 'traveler', status: 'intransit'})).resolves.toBeTruthy();
  const update = m.query.mock.calls.find(([sql]) => sql.includes('set status = $2'));
  expect(update[1][1]).toBe('intransit');
});
it('still prevents someone other than the traveler from updating status', async () => {
  await expect(updateShipmentRequestStatus({requestId: 'new-request', travelerId: 'stranger', status: 'intransit'})).rejects.toMatchObject({code: 'UNAUTHORIZED'});
});
it('marking delivered still waits for sender confirmation rather than completing the shipment', async () => {
  await updateShipmentRequestStatus({requestId: 'new-request', travelerId: 'traveler', status: 'delivered'});
  const update = m.query.mock.calls.find(([sql]) => sql.includes('set status = $2'));
  expect(update[1][1]).toBe('delivering');
});
