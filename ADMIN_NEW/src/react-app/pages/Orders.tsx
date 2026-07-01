import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Search, Download, RefreshCw, Shield, CheckCircle, XCircle, Clock, AlertCircle,
  X, Package, MapPin, User, ChevronLeft, ChevronRight, ZoomIn, Loader2
} from 'lucide-react';
import { getOrders, updateOrderStatus, getInsuredShipments } from '../services/api';

// ── Types ──────────────────────────────────────────────────────────────────────

interface OrderPackage {
  id: string;
  description?: string;
  category?: string;
  weight: number;
  value: number;
  image?: string;
  fromCity?: string;
  fromCountry?: string;
  toCity?: string;
  toCountry?: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  receiverName?: string;
  receiverEmail?: string;
  receiverPhone?: string;
}

interface OrderPerson {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  image?: string;
  kycStatus?: string;
}

interface Order {
  id: string;
  status: string;
  amount: number;
  currency?: string;
  trackingNumber?: string;
  insurance: boolean;
  insuranceCost: number;
  insuranceStatus?: string;
  insuranceError?: string;
  insurancePolicyId?: string;
  paymentStatus?: string;
  createdAt: string;
  updatedAt: string;
  package: OrderPackage;
  sender: OrderPerson;
  traveler: OrderPerson;
}

interface InsuredShipment {
  id: string;
  trackingNumber?: string;
  createdAt: string;
  shipmentStatus: string;
  insuranceStatus: string;
  insuranceCost: number;
  currency: string;
  policyId?: string;
  insuranceError?: string;
  item: { description?: string; category?: string; weight?: number; declaredValue?: number };
  route: { fromCity?: string; toCity?: string; fromCountry?: string; toCountry?: string; pickupAddress?: string; deliveryAddress?: string };
  receiver: { name?: string; phone?: string; email?: string };
  sender: { id: string; name: string; email: string; phone: string };
  traveler: { id: string; name: string; email: string; phone: string };
}

// ── Status helpers ─────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  pending:    'bg-amber-100 text-amber-700',
  accepted:   'bg-blue-100 text-blue-700',
  intransit:  'bg-indigo-100 text-indigo-700',
  delivering: 'bg-purple-100 text-purple-700',
  completed:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-700',
  rejected:   'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  pending:    'Pending',
  accepted:   'Accepted',
  intransit:  'In Transit',
  delivering: 'Out for Delivery',
  completed:  'Completed',
  cancelled:  'Cancelled',
  rejected:   'Declined',
};

const VALID_STATUSES = ['pending', 'accepted', 'intransit', 'delivering', 'completed', 'cancelled', 'rejected'];

const INS_COLORS: Record<string, string> = {
  active:           'bg-emerald-100 text-emerald-700',
  pending_purchase: 'bg-amber-100 text-amber-700',
  failed:           'bg-red-100 text-red-700',
  not_selected:     'bg-gray-100 text-gray-500',
};

// ── Image lightbox ─────────────────────────────────────────────────────────────

function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/90" onClick={onClose}>
      <button className="absolute top-4 right-4 text-white/60 hover:text-white" onClick={onClose}>
        <X className="w-8 h-8" />
      </button>
      <img
        src={src}
        alt="Package"
        className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
        onClick={e => e.stopPropagation()}
      />
    </div>
  );
}

// ── Order detail drawer ────────────────────────────────────────────────────────

function OrderDetail({ order, onClose, onStatusChange }: {
  order: Order;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => Promise<void>;
}) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState(order.status);
  const [location, setLocation]  = useState('');
  const [notes, setNotes]        = useState('');
  const [saving, setSaving]      = useState(false);
  const [saveMsg, setSaveMsg]    = useState<{ ok: boolean; text: string } | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      await onStatusChange(order.id, newStatus);
      setSaveMsg({ ok: true, text: 'Status updated.' });
    } catch (e: any) {
      setSaveMsg({ ok: false, text: e?.message || 'Update failed.' });
    } finally {
      setSaving(false);
    }
  };

  const pkg = order.package;
  const from = [pkg.fromCity, pkg.fromCountry].filter(Boolean).join(', ') || '—';
  const to   = [pkg.toCity,   pkg.toCountry  ].filter(Boolean).join(', ') || '—';

  return (
    <>
      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}

      <div className="fixed inset-0 z-[300] flex">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative ml-auto h-full w-full max-w-xl bg-white shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
            <div>
              <h2 className="text-base font-black text-gray-900">
                {order.trackingNumber || `#${order.id.slice(-8).toUpperCase()}`}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">{new Date(order.createdAt).toLocaleString()}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">

            {/* Package image */}
            {pkg.image ? (
              <div className="relative group cursor-pointer" onClick={() => setLightbox(pkg.image!)}>
                <img
                  src={pkg.image}
                  alt="Package"
                  className="w-full h-52 object-cover rounded-2xl border border-gray-100"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 rounded-2xl">
                  <ZoomIn className="w-8 h-8 text-white" />
                  <span className="ml-2 text-white font-bold text-sm">View fullscreen</span>
                </div>
              </div>
            ) : (
              <div className="w-full h-36 rounded-2xl bg-gray-50 border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-300">
                <Package className="w-8 h-8 mb-1" />
                <span className="text-xs font-semibold">No image uploaded</span>
              </div>
            )}

            {/* Status + amount */}
            <div className="flex items-center justify-between">
              <span className={`px-3 py-1.5 rounded-full text-xs font-black ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-500'}`}>
                {STATUS_LABELS[order.status] || order.status}
              </span>
              <span className="text-lg font-black text-gray-900">
                {order.currency || 'USD'} {Number(order.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Package details */}
            <section>
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" /> Package
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Description',     value: pkg.description || '—' },
                  { label: 'Category',        value: pkg.category    || '—' },
                  { label: 'Weight',          value: pkg.weight ? `${pkg.weight} kg` : '—' },
                  { label: 'Declared value',  value: pkg.value ? `${order.currency || 'USD'} ${Number(pkg.value).toLocaleString()}` : '—' },
                  { label: 'Pickup address',  value: pkg.pickupAddress   || '—' },
                  { label: 'Delivery address',value: pkg.deliveryAddress || '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
                    <p className="text-xs font-semibold text-gray-800 break-words">{value}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Route */}
            <section>
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Route
              </h3>
              <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                <div className="flex-1 text-center">
                  <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">From</p>
                  <p className="text-sm font-black text-gray-800 mt-0.5">{from}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 shrink-0" />
                <div className="flex-1 text-center">
                  <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">To</p>
                  <p className="text-sm font-black text-gray-800 mt-0.5">{to}</p>
                </div>
              </div>
            </section>

            {/* People */}
            {[
              { label: 'Sender', person: order.sender },
              { label: 'Traveler', person: order.traveler },
              ...(pkg.receiverName ? [{ label: 'Receiver', person: { id: '', name: pkg.receiverName, email: pkg.receiverEmail, phone: pkg.receiverPhone } }] : []),
            ].map(({ label, person }) => (
              <section key={label}>
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> {label}
                </h3>
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                    {person.image
                      ? <img src={person.image} alt="" className="w-9 h-9 rounded-full object-cover" />
                      : <span className="text-indigo-600 font-black text-sm">{(person.name || '?')[0].toUpperCase()}</span>}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{person.name || '—'}</p>
                    {person.email && <p className="text-xs text-gray-400">{person.email}</p>}
                    {person.phone && <p className="text-xs text-gray-400">{person.phone}</p>}
                  </div>
                  {(person as any).kycStatus && (
                    <span className={`ml-auto text-[9px] px-2 py-0.5 rounded-full font-black ${(person as any).kycStatus === 'approved' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                      {(person as any).kycStatus === 'approved' ? 'KYC ✓' : 'Unverified'}
                    </span>
                  )}
                </div>
              </section>
            ))}

            {/* Insurance */}
            {order.insurance && (
              <section>
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> Insurance
                </h3>
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-purple-700">Status</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${INS_COLORS[order.insuranceStatus || ''] || 'bg-gray-100 text-gray-500'}`}>
                      {(order.insuranceStatus || 'unknown').replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-purple-700">Cost</span>
                    <span className="text-xs font-black text-purple-900">{order.currency || 'USD'} {Number(order.insuranceCost).toFixed(2)}</span>
                  </div>
                  {order.insurancePolicyId && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-purple-700">Policy ID</span>
                      <span className="text-[10px] font-mono text-purple-500">{order.insurancePolicyId.slice(0, 16)}…</span>
                    </div>
                  )}
                  {order.insuranceError && <p className="text-[10px] text-red-500 mt-1">{order.insuranceError}</p>}
                </div>
              </section>
            )}

            {/* Update status */}
            <section className="border-t border-gray-100 pt-5">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Update Status</h3>
              <div className="space-y-3">
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                >
                  {VALID_STATUSES.map(s => (
                    <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>
                  ))}
                </select>
                {['intransit', 'delivering', 'completed'].includes(newStatus) && (
                  <>
                    <input
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      placeholder="Current location (optional)"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                    />
                    <input
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Notes (optional)"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                    />
                  </>
                )}
                {saveMsg && (
                  <p className={`text-xs font-bold px-3 py-2 rounded-lg ${saveMsg.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                    {saveMsg.text}
                  </p>
                )}
                <button
                  onClick={handleSave}
                  disabled={saving || newStatus === order.status}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Status'}
                </button>
              </div>
            </section>

          </div>
        </div>
      </div>
    </>
  );
}

// ── Insurance CSV export ───────────────────────────────────────────────────────

function exportInsuredCsv(shipments: InsuredShipment[], filename = 'bago-insurance') {
  const headers = [
    'Tracking Number', 'Date', 'Insurance Status', 'Insurance Cost', 'Currency',
    'Policy ID', 'Item Description', 'Item Category', 'Weight (kg)', 'Declared Value',
    'From', 'To', 'Pickup Address', 'Delivery Address',
    'Sender Name', 'Sender Email', 'Sender Phone',
    'Traveler Name', 'Traveler Email', 'Traveler Phone',
    'Receiver Name', 'Receiver Phone', 'Receiver Email',
  ];
  const rows = shipments.map((s) => [
    s.trackingNumber || s.id,
    new Date(s.createdAt).toLocaleDateString(),
    s.insuranceStatus,
    s.insuranceCost,
    s.currency,
    s.policyId || '',
    s.item.description || '',
    s.item.category || '',
    s.item.weight || '',
    s.item.declaredValue || '',
    [s.route.fromCity, s.route.fromCountry].filter(Boolean).join(', '),
    [s.route.toCity, s.route.toCountry].filter(Boolean).join(', '),
    s.route.pickupAddress || '',
    s.route.deliveryAddress || '',
    s.sender.name, s.sender.email, s.sender.phone,
    s.traveler.name, s.traveler.email, s.traveler.phone,
    s.receiver.name || '', s.receiver.phone || '', s.receiver.email || '',
  ]);
  const csv = [headers, ...rows]
    .map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'insurance'>('orders');

  // orders
  const [orders, setOrders]           = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const searchTimeout                 = useRef<ReturnType<typeof setTimeout> | null>(null);
  const limit                         = 30;

  // insurance
  const [insured, setInsured]           = useState<InsuredShipment[]>([]);
  const [insuredLoading, setInsuredLoading] = useState(false);
  const [insuredFilter, setInsuredFilter] = useState('all');
  const [insuredSearch, setInsuredSearch] = useState('');

  const fetchOrders = useCallback(async (p = page, s = search, st = statusFilter) => {
    setOrdersLoading(true);
    try {
      const res = await getOrders(p, limit, st, s);
      if (res?.success) {
        setOrders(res.data || []);
        setTotal(res.total || 0);
      }
    } catch (e) { console.error(e); }
    finally { setOrdersLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchOrders(); }, [page, statusFilter]);

  // debounce search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setPage(1);
      fetchOrders(1, search, statusFilter);
    }, 350);
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [search]);

  const fetchInsured = async () => {
    setInsuredLoading(true);
    try {
      const res = await getInsuredShipments(insuredFilter !== 'all' ? insuredFilter : undefined);
      if (res?.success) setInsured(res.data || []);
    } catch (e) { console.error(e); }
    finally { setInsuredLoading(false); }
  };

  useEffect(() => {
    if (activeTab === 'insurance' && insured.length === 0) fetchInsured();
  }, [activeTab]);
  useEffect(() => {
    if (activeTab === 'insurance') fetchInsured();
  }, [insuredFilter]);

  const handleStatusChange = async (id: string, status: string) => {
    await updateOrderStatus(id, status);
    // refresh list + update the selected order in place
    await fetchOrders();
    setSelectedOrder(prev => prev && prev.id === id ? { ...prev, status } : prev);
  };

  const filteredInsured = insured.filter(s =>
    !insuredSearch ||
    s.trackingNumber?.toLowerCase().includes(insuredSearch.toLowerCase()) ||
    s.sender.name.toLowerCase().includes(insuredSearch.toLowerCase()) ||
    s.item.description?.toLowerCase().includes(insuredSearch.toLowerCase())
  );

  const insuredCounts = {
    all:              insured.length,
    active:           insured.filter(s => s.insuranceStatus === 'active').length,
    pending_purchase: insured.filter(s => s.insuranceStatus === 'pending_purchase').length,
    failed:           insured.filter(s => s.insuranceStatus === 'failed').length,
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {selectedOrder && (
        <OrderDetail
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={handleStatusChange}
        />
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage all shipment requests</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'orders' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          All Orders {total > 0 && <span className="ml-1 text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-black">{total}</span>}
        </button>
        <button
          onClick={() => setActiveTab('insurance')}
          className={`flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'insurance' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          <Shield className="w-4 h-4" />
          Insured Shipments
          {insuredCounts.all > 0 && <span className="ml-1 text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full font-black">{insuredCounts.all}</span>}
        </button>
      </div>

      {activeTab === 'orders' ? (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by tracking #, sender name, package…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none bg-white"
            >
              <option value="all">All Status</option>
              {VALID_STATUSES.map(s => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
            <button
              onClick={() => fetchOrders()}
              className="p-2.5 border border-gray-200 rounded-xl text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-all"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${ordersLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {ordersLoading ? (
              <div className="flex items-center justify-center py-20 text-gray-400 gap-3">
                <Loader2 className="w-5 h-5 animate-spin" /> Loading orders…
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Package className="w-10 h-10 mb-3 opacity-30" />
                <p className="font-semibold">No orders found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      {['Package', 'Route', 'Sender', 'Traveler', 'Status', 'Amount', 'Date', ''].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {orders.map(order => {
                      const pkg  = order.package;
                      const from = [pkg.fromCity, pkg.fromCountry].filter(Boolean).join(', ') || '—';
                      const to   = [pkg.toCity,   pkg.toCountry  ].filter(Boolean).join(', ') || '—';
                      return (
                        <tr
                          key={order.id}
                          className="hover:bg-gray-50/80 cursor-pointer transition-colors"
                          onClick={() => setSelectedOrder(order)}
                        >
                          {/* Package */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {pkg.image ? (
                                <img
                                  src={pkg.image}
                                  alt=""
                                  className="w-11 h-11 rounded-lg object-cover border border-gray-100 shrink-0"
                                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                              ) : (
                                <div className="w-11 h-11 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                  <Package className="w-5 h-5 text-gray-300" />
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-gray-900 max-w-[140px] truncate">{pkg.description || 'Package'}</p>
                                <p className="text-[10px] text-gray-400">{pkg.weight ? `${pkg.weight} kg` : ''} {pkg.category || ''}</p>
                                {order.trackingNumber && <p className="text-[9px] font-mono text-indigo-400 mt-0.5">{order.trackingNumber}</p>}
                              </div>
                            </div>
                          </td>
                          {/* Route */}
                          <td className="px-4 py-3 text-xs text-gray-600">
                            <p className="font-semibold">{from}</p>
                            <p className="text-gray-400">→ {to}</p>
                          </td>
                          {/* Sender */}
                          <td className="px-4 py-3">
                            <p className="font-semibold text-gray-900 text-xs">{order.sender.name}</p>
                            <p className="text-[10px] text-gray-400 truncate max-w-[120px]">{order.sender.email}</p>
                          </td>
                          {/* Traveler */}
                          <td className="px-4 py-3">
                            <p className="font-semibold text-gray-900 text-xs">{order.traveler.name || '—'}</p>
                            <p className="text-[10px] text-gray-400 truncate max-w-[120px]">{order.traveler.email || ''}</p>
                          </td>
                          {/* Status */}
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black capitalize ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-500'}`}>
                              {STATUS_LABELS[order.status] || order.status}
                            </span>
                            {order.insurance && (
                              <span className="mt-1 flex items-center gap-0.5 text-[9px] text-purple-500 font-bold">
                                <Shield className="w-2.5 h-2.5" /> Insured
                              </span>
                            )}
                          </td>
                          {/* Amount */}
                          <td className="px-4 py-3 font-bold text-gray-900 text-xs whitespace-nowrap">
                            {order.currency || 'USD'} {Number(order.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          {/* Date */}
                          <td className="px-4 py-3 text-[10px] text-gray-400 whitespace-nowrap">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                          {/* CTA */}
                          <td className="px-4 py-3">
                            <span className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 whitespace-nowrap">View →</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white px-5 py-3 rounded-2xl border border-gray-100">
              <p className="text-xs text-gray-400 font-semibold">Page {page} of {totalPages} · {total} orders</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || ordersLoading}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || ordersLoading}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        /* ── Insured Shipments tab ── */
        <>
          <div className="grid grid-cols-4 gap-4">
            {([
              { label: 'Total',             key: 'all' as const,              color: 'text-gray-700'    },
              { label: 'Active Policies',   key: 'active' as const,           color: 'text-emerald-600' },
              { label: 'Pending Purchase',  key: 'pending_purchase' as const, color: 'text-amber-600'   },
              { label: 'Failed',            key: 'failed' as const,           color: 'text-red-600'     },
            ]).map(({ label, key, color }) => (
              <div key={key} className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
                <p className={`text-2xl font-black mt-1 ${color}`}>{insuredCounts[key]}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                value={insuredSearch}
                onChange={e => setInsuredSearch(e.target.value)}
                placeholder="Search by tracking, sender, item…"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 outline-none"
              />
            </div>
            <div className="flex gap-1.5">
              {(['all', 'active', 'pending_purchase', 'failed'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setInsuredFilter(s)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${insuredFilter === s ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  {s === 'all' ? 'All' : s.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
            <button onClick={fetchInsured} className="p-2 text-gray-400 border border-gray-200 rounded-lg hover:bg-gray-50">
              <RefreshCw className={`w-4 h-4 ${insuredLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => exportInsuredCsv(filteredInsured)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700"
            >
              <Download className="w-4 h-4" /> Export ({filteredInsured.length})
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {insuredLoading ? (
              <div className="py-16 text-center text-gray-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading…
              </div>
            ) : filteredInsured.length === 0 ? (
              <div className="py-16 text-center text-gray-400">No insured shipments found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['Tracking', 'Date', 'Policy Status', 'Cost', 'Item', 'Route', 'Sender', 'Traveler', 'Receiver', ''].map(h => (
                        <th key={h} className="text-left py-3 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredInsured.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-mono text-xs text-gray-700">{s.trackingNumber || s.id.slice(0, 8)}</td>
                        <td className="py-3 px-4 text-xs text-gray-500 whitespace-nowrap">{new Date(s.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${INS_COLORS[s.insuranceStatus] || 'bg-gray-100 text-gray-500'}`}>
                            {s.insuranceStatus === 'active' ? <CheckCircle className="w-3 h-3" /> : s.insuranceStatus === 'failed' ? <XCircle className="w-3 h-3" /> : s.insuranceStatus === 'pending_purchase' ? <Clock className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                            {s.insuranceStatus.replace(/_/g, ' ')}
                          </span>
                          {s.policyId && <p className="text-[9px] text-gray-400 font-mono mt-0.5">{s.policyId.slice(0, 10)}…</p>}
                        </td>
                        <td className="py-3 px-4 text-xs font-bold whitespace-nowrap">{s.currency} {Number(s.insuranceCost).toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <p className="text-xs font-medium text-gray-700 max-w-[130px] truncate">{s.item.description || s.item.category || '—'}</p>
                          {s.item.weight && <p className="text-[10px] text-gray-400">{s.item.weight} kg</p>}
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-500">
                          <p>{[s.route.fromCity, s.route.fromCountry].filter(Boolean).join(', ') || '—'}</p>
                          <p className="text-gray-400">→ {[s.route.toCity, s.route.toCountry].filter(Boolean).join(', ') || '—'}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-xs font-medium">{s.sender.name || '—'}</p>
                          <p className="text-[10px] text-gray-400">{s.sender.email}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-xs font-medium">{s.traveler.name || '—'}</p>
                          <p className="text-[10px] text-gray-400">{s.traveler.email}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-xs font-medium">{s.receiver.name || '—'}</p>
                          <p className="text-[10px] text-gray-400">{s.receiver.phone}</p>
                        </td>
                        <td className="py-3 px-4">
                          <button onClick={() => exportInsuredCsv([s], `bago-insurance-${s.trackingNumber || s.id.slice(0, 8)}`)} className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-purple-600 border border-purple-200 rounded hover:bg-purple-50">
                            <Download className="w-3 h-3" /> CSV
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
