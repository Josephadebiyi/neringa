import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { getTracking, getAllUsers } from '../services/api';

interface User {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
}



export default function OrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [users, setUsers] = useState<{ [key: string]: User }>({});
    const [, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);

            // We'll use the tracking endpoint but label it as Orders/Requests
            const data = await getTracking();

            // Fetch users
            const usersData = await getAllUsers();
            const userMap: { [key: string]: User } = {};
            if (Array.isArray(usersData.data)) {
                usersData.data.forEach((u: any) => {
                    userMap[u._id] = u;
                });
            }
            setUsers(userMap);

            // Flatten the tracking data for orders view
            const flattened: any[] = [];
            if (data && Array.isArray(data.data)) {
                data.data.forEach((item: any) => {
                    if (Array.isArray(item.requests)) {
                        item.requests.forEach((req: any) => {
                            flattened.push({
                                ...req,
                                package: item.package
                            });
                        });
                    }
                });
            }
            setOrders(flattened);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = orders.filter(o =>
        (statusFilter === 'all' || o.status === statusFilter) &&
        (o.package?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (o._id ?? '').toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Booking Requests</h1>
                    <p className="text-gray-600">Manage all shipments and booking requests</p>
                </div>
            </div>

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
                                    <div className="text-sm text-gray-900">{order.package?.description || 'Package'}</div>
                                    <div className="text-xs text-gray-500">{order.package?.packageWeight} KG</div>
                                </td>
                                <td className="py-4 px-4">
                                    <div className="text-sm font-medium text-gray-900">
                                        {users[order.sender]?.firstName} {users[order.sender]?.lastName}
                                    </div>
                                    <div className="text-xs text-gray-500">{users[order.sender]?.email}</div>
                                </td>
                                <td className="py-4 px-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            order.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                                                order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                                    'bg-gray-100 text-gray-800'
                                        }`}>
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
            </div>
        </div>
    );
}
