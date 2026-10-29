import {beforeEach, afterEach, describe, expect, it, vi} from 'vitest';
const m = vi.hoisted(() => ({queryOne: vi.fn(), fetch: vi.fn()}));
vi.mock('../lib/postgres/db.js', () => ({query: vi.fn(), queryOne: m.queryOne}));
vi.mock('../services/pushNotificationService.js', () => ({sendPushNotification: vi.fn()}));
vi.mock('../services/emailNotifications.js', () => ({sendTripApprovedEmail: vi.fn(), sendTripDeclinedEmail: vi.fn()}));
vi.mock('../lib/postgres/trips.js', () => ({updateTripRecord: vi.fn(), ensureTripBatchColumn: vi.fn()}));
vi.mock('../lib/cloudinaryDocuments.js', () => ({getViewableDocumentUrl: value => value}));
import {downloadTripProof} from '../controllers/AdminControllers/TripManagement.js';
function res() {return {code: 200, headers: {}, status(code) {this.code = code; return this;},
  setHeader(name, value) {this.headers[name] = value;}, json(value) {this.body = value; return this;}, send(value) {this.body = value; return this;}};}
beforeEach(() => {vi.clearAllMocks(); vi.stubGlobal('fetch', m.fetch);});
afterEach(() => vi.unstubAllGlobals());
describe('admin trip proof preview and download', () => {
  it('serves an extensionless PDF with its correct content type and filename', async () => {
    m.queryOne.mockResolvedValue({travel_document_url: 'https://res.cloudinary.com/bago/raw/upload/proof'});
    m.fetch.mockResolvedValue({ok: true, arrayBuffer: async () => Buffer.from('%PDF-1.7\nboarding pass')});
    const response = res(); await downloadTripProof({params: {id: 'trip'}, query: {preview: '1'}}, response);
    expect(response.code).toBe(200); expect(response.headers['Content-Type']).toBe('application/pdf');
    expect(response.headers['Content-Disposition']).toBe('inline; filename="travel-proof-trip.pdf"');
  });
  it('supports stored data-URI proofs', async () => {
    m.queryOne.mockResolvedValue({travel_document_url: `data:application/pdf;base64,${Buffer.from('%PDF-1.7').toString('base64')}`});
    const response = res(); await downloadTripProof({params: {id: 'trip'}}, response);
    expect(response.code).toBe(200); expect(response.headers['Content-Disposition']).toContain('attachment;');
  });
  it('does not save a Cloudinary error page as a broken proof', async () => {
    m.queryOne.mockResolvedValue({travel_document_url: 'https://res.cloudinary.com/bago/raw/upload/proof'});
    m.fetch.mockResolvedValue({ok: true, arrayBuffer: async () => Buffer.from('<html>Access denied</html>')});
    const response = res(); await downloadTripProof({params: {id: 'trip'}}, response);
    expect(response.code).toBe(502);
  });
  it('does not fetch internal or non-storage URLs', async () => {
    m.queryOne.mockResolvedValue({travel_document_url: 'http://127.0.0.1/internal'});
    const response = res(); await downloadTripProof({params: {id: 'trip'}}, response);
    expect(response.code).toBe(502); expect(m.fetch).not.toHaveBeenCalled();
  });
  it('clearly reports trips without an uploaded proof', async () => {
    m.queryOne.mockResolvedValue({travel_document_url: null});
    const response = res(); await downloadTripProof({params: {id: 'trip'}}, response);
    expect(response.code).toBe(404);
  });
});
