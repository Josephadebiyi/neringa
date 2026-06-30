import { useEffect, useState } from 'react';
import { Search, Download, RefreshCw, Shield, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { getTracking, getAllUsers, getInsuredShipments } from '../services/api';

interface User {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
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

const INSURANCE_STATUS_COLORS: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    pending_purchase: 'bg-amber-100 text-amber-700',
    failed: 'bg-red-100 text-red-700',
    not_selected: 'bg-gray-100 text-gray-500',
};

function InsuranceStatusIcon({ status }: { status: string }) {
    if (status === 'active') return <CheckCircle className="w-3 h-3" />;
    if (status === 'failed') return <XCircle className="w-3 h-3" />;
    if (status === 'pending_purchase') return <Clock className="w-3 h-3" />;
    return <AlertCircle className="w-3 h-3" />;
}

function exportCsv(shipments: InsuredShipment[], filename = 'bago-insurance') {
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
        .map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
        .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

export default function OrdersPage() {
    const [activeTab, setActiveTab] = useState<'orders' | 'insurance'>('orders');

    // — Orders state —
    const [orders, setOrders] = useState<any[]>([]);
    const [users, setUsers] = useState<{ [key: string]: User }>({});
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // — Insurance state —
    const [insured, setInsured] = useState<InsuredShipment[]>([]);
    const [insuredLoading, setInsuredLoading] = useState(false);
    const [insuredFilter, setInsuredFilter] = useState('all');
    const [insuredSearch, setInsuredSearch] = useState('');

    useEffect(() => { fetchOrders(); }, []);
    useEffect(() => {
        if (activeTab === 'insurance' && insured.length === 0) fetchInsured();
    }, [activeTab]);

    const fetchOrders = async () => {
        try {
            setOrdersLoading(true);
            const data = await getTracking();
            const usersData = await getAllUsers();
            const userMap: { [key: string]: User } = {};
            if (Array.isArray(usersData.data)) {
                usersData.data.forEach((u: any) => { userMap[u._id] = u; });
            }
            setUsers(userMap);
            const flattened: any[] = [];
            if (data && Array.isArray(data.data)) {
                data.data.forEach((item: any) => {
                    if (Array.isArray(item.requests)) {
                        item.requests.forEach((req: any) => { flattened.push({ ...req, package: item.package }); });
                    }
                });
            }
            setOrders(flattened);
        } catch (error) {
            console.error(error);
        } finally {
            setOrdersLoading(false);
        }
    };

    const fetchInsured = async () => {
        setInsuredLoading(true);
        try {
            const res = await getInsuredShipments(insuredFilter !== 'all' ? insuredFilter : undefined);
            if (res.success) setInsured(res.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setInsuredLoading(false);
        }
    };

    // re-fetch when filter changes
    useEffect(() => {
        if (activeTab === 'insurance') fetchInsured();
    }, [insuredFilter]);

    const filteredOrders = orders.filter(o =>
        (statusFilter === 'all' || o.status === statusFilter) &&
        (o.package?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (o._id ?? '').toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const filteredInsured = insured.filter(s =>
        !insuredSearch ||
        s.trackingNumber?.toLowerCase().includes(insuredSearch.toLowerCase()) ||
        s.sender.name.toLowerCase().includes(insuredSearch.toLowerCase()) ||
        s.sender.email.toLowerCase().includes(insuredSearch.toLowerCase()) ||
        s.item.description?.toLowerCase().includes(insuredSearch.toLowerCase())
    );

    const insuredCounts = {
        all: insured.length,
        active: insured.filter(s => s.insuranceStatus === 'active').length,
        pending_purchase: insured.filter(s => s.insuranceStatus === 'pending_purchase').length,
        failed: insured.filter(s => s.insuranceStatus === 'failed').length,
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
                    <p className="text-gray-600">Manage all shipments and booking requests</p>
                </div>
            </div>

            {/* Tab switcher */}
            <div className="flex gap-1 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('orders')}
                    className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'orders' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                >
                    All Orders
                </button>
                <button
                    onClick={() => setActiveTab('insurance')}
                    className={`flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'insurance' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                >
                    <Shield className="w-4 h-4" />
                    Insured Shipments
                    {insuredCounts.all > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 text-[10px] font-black rounded-full bg-purple-100 text-purple-600">{insuredCounts.all}</span>
                    )}
                </button>
            </div>

            {activeTab === 'orders' ? (
                <>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search by ID or description..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg"
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="accepted">Accepted</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {ordersLoading ? (
                            <div className="py-16 text-center text-gray-400">Loading orders…</div>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left py-3 px-4 font-medium text-gray-900">Order ID</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-900">Items</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-900">Sender</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-900">Amount</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredOrders.map(order => (
                                        <tr key={order._id} className="hover:bg-gray-50">
                                            <td className="py-4 px-4 font-medium text-gray-900 text-sm">#{(order._id ?? '').slice(-6).toUpperCase()}</td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-3">
                                                    {order.package?.image ? (
                                                        <img src={order.package.image} alt="item" className="w-12 h-12 rounded-lg object-cover border border-gray-100 flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-300 text-xs font-bold">IMG</div>
                                                    )}
                                                    <div>
                                                        <div className="text-sm text-gray-900">{order.package?.description || 'Package'}</div>
                                                        <div className="text-xs text-gray-500">{order.package?.packageWeight} KG</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="text-sm font-medium text-gray-900">{users[order.sender]?.firstName} {users[order.sender]?.lastName}</div>
                                                <div className="text-xs text-gray-500">{users[order.sender]?.email}</div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : order.status === 'accepted' ? 'bg-blue-100 text-blue-800' : order.status === 'delivered' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-sm font-bold text-gray-900">
                                                ${Number(order.amount || order.insuranceCost * 1.5).toFixed(2)}
                                            </td>
                                            <td className="py-4 px-4 text-xs text-gray-500">
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>
            ) : (
                /* ── Insured Shipments tab ── */
                <>
                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-4">
                        {([
                            { label: 'Total', key: 'all', color: 'text-gray-700' },
                            { label: 'Active Policies', key: 'active', color: 'text-emerald-600' },
                            { label: 'Pending Purchase', key: 'pending_purchase', color: 'text-amber-600' },
                            { label: 'Failed', key: 'failed', color: 'text-red-600' },
                        ] as const).map(({ label, key, color }) => (
                            <div key={key} className="bg-white rounded-xl border border-gray-200 p-4">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
                                <p className={`text-2xl font-black mt-1 ${color}`}>{insuredCounts[key]}</p>
                            </div>
                        ))}
                    </div>

                    {/* Filters + export */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search by tracking, sender, item…"
                                value={insuredSearch}
                                onChange={e => setInsuredSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
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
                        <button onClick={fetchInsured} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                            <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => exportCsv(filteredInsured)}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700"
                        >
                            <Download className="w-4 h-4" />
                            Export All ({filteredInsured.length})
                        </button>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {insuredLoading ? (
                            <div className="py-16 text-center text-gray-400">Loading insured shipments…</div>
                        ) : filteredInsured.length === 0 ? (
                            <div className="py-16 text-center text-gray-400">No insured shipments found.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            {['Tracking', 'Date', 'Policy Status', 'Cost', 'Item', 'Route', 'Sender', 'Traveler', 'Receiver', 'Export'].map(h => (
                                                <th key={h} className="text-left py-3 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredInsured.map((s) => (
                                            <tr key={s.id} className="hover:bg-gray-50">
                                                <td className="py-3 px-4 font-mono text-xs text-gray-700 whitespace-nowrap">{s.trackingNumber || s.id.slice(0, 8)}</td>
                                                <td className="py-3 px-4 text-xs text-gray-500 whitespace-nowrap">{new Date(s.createdAt).toLocaleDateString()}</td>
                                                <td className="py-3 px-4">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${INSURANCE_STATUS_COLORS[s.insuranceStatus] || 'bg-gray-100 text-gray-500'}`}>
                                                        <InsuranceStatusIcon status={s.insuranceStatus} />
                                                        {s.insuranceStatus.replace(/_/g, ' ')}
                                                    </span>
                                                    {s.insuranceError && <p className="text-[10px] text-red-500 mt-0.5 max-w-[150px] truncate" title={s.insuranceError}>{s.insuranceError}</p>}
                                                    {s.policyId && <p className="text-[10px] text-gray-400 font-mono mt-0.5">{s.policyId.slice(0, 10)}…</p>}
                                                </td>
                                                <td className="py-3 px-4 text-xs font-bold whitespace-nowrap">{s.currency} {Number(s.insuranceCost).toLocaleString()}</td>
                                                <td className="py-3 px-4">
                                                    <p className="text-xs font-medium text-gray-700 max-w-[130px] truncate">{s.item.description || s.item.category || '—'}</p>
                                                    {s.item.weight && <p className="text-[10px] text-gray-400">{s.item.weight} kg</p>}
                                                    {s.item.declaredValue && <p className="text-[10px] text-gray-400">₦{Number(s.item.declaredValue).toLocaleString()}</p>}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <p className="text-xs font-medium whitespace-nowrap">{[s.route.fromCity, s.route.fromCountry].filter(Boolean).join(', ') || '—'}</p>
                                                    <p className="text-[10px] text-gray-400">→ {[s.route.toCity, s.route.toCountry].filter(Boolean).join(', ') || '—'}</p>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <p className="text-xs font-medium">{s.sender.name || '—'}</p>
                                                    <p className="text-[10px] text-gray-400">{s.sender.email}</p>
                                                    <p className="text-[10px] text-gray-400">{s.sender.phone}</p>
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
                                                    <button onClick={() => exportCsv([s], `bago-insurance-${s.trackingNumber || s.id.slice(0, 8)}`)} className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-purple-600 border border-purple-200 rounded hover:bg-purple-50">
                                                        <Download className="w-3 h-3" />
                                                        CSV
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
