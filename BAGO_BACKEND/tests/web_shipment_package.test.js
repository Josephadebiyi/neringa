import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildShipmentPackage, validateShipmentPackage } from '../../BAGO_WEBAPP/src/utils/shipmentPackage.js';
import { customerError } from '../../BAGO_WEBAPP/src/utils/customerErrors.js';

const mocks = vi.hoisted(() => ({ create: vi.fn(), scan: vi.fn() }));
vi.mock('../lib/postgres/shipping.js', () => ({ createPackageRecord: mocks.create, deletePackageRecord: vi.fn(), getPackageById: vi.fn() }));
vi.mock('../lib/postgres/db.js', () => ({ queryOne: vi.fn() }));
vi.mock('../services/itemImageSafetyService.js', () => ({ scanItemImageForSafety: mocks.scan }));
vi.mock('cloudinary', () => ({ default: { v2: { config: vi.fn(), uploader: { upload: vi.fn() } } } }));
import { createPackage } from '../controllers/PackageController.js';

const form = { contents: '2 cotton shirts\n1 pair of shoes', category: 'Clothing',
    packageWeight: '2.5', packageValue: '50', packageImage: 'https://example.invalid/item.jpg',
    fromCity: 'Lagos', fromCountry: 'Nigeria', toCity: 'Barcelona', toCountry: 'Spain',
    receiverName: 'Recipient', receiverPhone: '+34632466227', deliveryAddress: 'Test delivery address',
    specialInstructions: 'Call before delivery', declaration: { wrapped: true } };
const response = () => ({ code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });
beforeEach(() => {
    vi.clearAllMocks();
    mocks.scan.mockResolvedValue({ allowed: true, outcome: 'approved' });
    mocks.create.mockResolvedValue({ id: 'pkg', _id: 'pkg' });
});

describe('web form to actual package controller contract', () => {
    it('creates a package with all required fields, real contents and explicit inspection consent', async () => {
        const payload = buildShipmentPackage(form, [true, true, true], 'es');
        const res = response();
        await createPackage({ user: { id: 'sender' }, body: payload }, res);
        expect(res.code).toBe(201);
        expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({
            contents: ['2 cotton shirts', '1 pair of shoes'], packageWeight: 2.5, value: 50,
            receiverName: 'Recipient', receiverPhone: '+34632466227', fromCountry: 'Nigeria', toCountry: 'Spain',
            declaration: { wrapped: true, travellerMayInspect: true, refusesInspection: false },
        }));
    });

    it('the actual backend rejects the old payload, while the user sees readable instructions', async () => {
        const payload = buildShipmentPackage(form, [true, true, true], 'es');
        delete payload.package_details.contents;
        delete payload.package_details.declaration;
        const res = response();
        await createPackage({ user: { id: 'sender' }, body: payload }, res);
        expect(res.code).toBe(400);
        expect(res.body.missingFields).toEqual(['contents', 'travellerMayInspect']);
        const message = customerError({ response: { status: 400, data: res.body } });
        expect(message).toBe('List the items inside your package. Confirm that the traveller may inspect your package.');
        expect(message).not.toMatch(/Missing required|travellerMayInspect/);
        expect(mocks.create).not.toHaveBeenCalled();
    });

    it('does not invent contents from a category or auto-accept inspection', () => {
        expect(validateShipmentPackage({ ...form, contents: ' \n ' }, [true, false, true])).toMatchObject({
            contents: expect.any(String), inspection: expect.any(String), agreement: expect.any(String),
        });
        expect(() => buildShipmentPackage(form, [true, false, true], 'ES')).toThrow('Confirm that the traveller');
    });

    it.each([NaN, Infinity, 0, -1, 51])('rejects invalid package weights (%s) before sending', packageWeight => {
        expect(validateShipmentPackage({ ...form, packageWeight }, [true, true, true])).toHaveProperty('packageWeight');
    });

    it('validates all other required details before sending the request', () => {
        const invalid = Object.fromEntries(Object.keys(form).map(key => [key, '']));
        expect(Object.keys(validateShipmentPackage(invalid, []))).toEqual(expect.arrayContaining([
            'contents', 'inspection', 'agreement', 'packageWeight', 'packageValue', 'packageImage',
            'receiverName', 'receiverPhone', 'deliveryAddress', 'route', 'category',
        ]));
    });

    it.each([
        { response: { status: 500, data: { message: 'relation packages does not exist', error: 'SQLSTATE 42P01' } } },
        { response: { status: 400, data: { message: 'Missing required fields: travellerMayInspect', missingFields: ['unknownInternalField'] } } },
        new Error('Database password=secret failed at PackageController.js:124'),
    ])('never displays arbitrary technical errors', error => {
        expect(customerError(error, 'We couldn’t save your shipment. Please try again.')).toBe('We couldn’t save your shipment. Please try again.');
    });
});
