import { useEffect, useState } from 'react';
import { Search, Filter, Package, MapPin, User, Calendar, DollarSign, Truck, UserPlus } from 'lucide-react';
import { getAdminAuthHeaders } from '../services/api';

// Request status options (based on API data)
const REQUEST_STATUSES = ['pending', 'accepted', 'picked_up', 'in_transit', 'customs', 'delivered', 'cancelled'];

// Interface for package data from API
interface Package {
  _id: string;
  userId: string;
  fromCountry: string;
  fromCity: string;
  toCountry: string;
  toCity: string;
  packageWeight: number;
  receiverName: string;
  receiverPhone: string;
  description: string;
  createdAt: string;
}

// Interface for request data from API
interface Request {
  _id: string;
  sender?: string;
  sender_id?: string;
  traveler?: string;
  traveler_id?: string;
  package?: string;
  package_id?: string;
  trip?: string;
  trip_id?: string;
  status: string;
  insurance: boolean;
  insuranceCost: number;
  createdAt: string;
  updatedAt: string;
  id?: string;
  created_at?: string;
}

// Interface for user data (fetched separately for sender/traveler)
interface User {
  _id: string;
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
}

// Interface for tracking data
interface TrackingData {
  package: Package;
  requests: Request[];
}

// Interface for API response
interface TrackingResponse {
  data: TrackingData[];
  totalCount: number;
  page: number;
  limit: number;
  success: boolean;
  error: boolean;
  message: string;
}

// Interface for table item (transformed for display)
interface TableItem {
  id: string; // package._id
  title: string; // package.description
  tracking_number: string; // package._id
  pickup_country: string; // package.fromCountry
  delivery_country: string; // package.toCountry
  sender_name: string; // Fetched from Users
  sender_email: string; // Fetched from Users
  traveler_name: string | null; // Fetched from Users
  traveler_email: string | null; // Fetched from Users
  traveler_id: string | null; // request.traveler
  status: string; // request.status
  price: number; // request.insuranceCost
  commission_amount: number; // Calculated (e.g., 10% of price)
  created_at: string; // package.createdAt
  request_id: string; // request._id
}

import { API_BASE_URL } from '../config/api';

export default function Tracking() {
  const [items, setItems] = useState<TableItem[]>([]);
  const [users, setUsers] = useState<{ [key: string]: User }>({}); // Cache user data
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [updatingItem, setUpdatingItem] = useState<TableItem | null>(null);
  const [updateStatus, setUpdateStatus] = useState<string>('');
  const [updateTravelerId, setUpdateTravelerId] = useState<string>('');
  const [updateError, setUpdateError] = useState<string | null>(null);
  const limit = 20;

  useEffect(() => {
    fetchTrackingAndUsers();
  }, [currentPage]);

  const fetchTrackingAndUsers = async () => {
    try {
      setLoading(true);
      // Fetch tracking data
      const trackingResponse = await fetch(
        `${API_BASE_URL}/tracking?page=${currentPage}&limit=${limit}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: getAdminAuthHeaders(),
        }
      );

      if (!trackingResponse.ok) {
        throw new Error('Failed to fetch tracking data');
      }

      const trackingData: TrackingResponse = await trackingResponse.json();
      if (!trackingData.success) {
        throw new Error(trackingData.message || 'Failed to fetch tracking data');
      }

      // Fetch user data for senders and travelers
      const userIds = new Set<string>();
      trackingData.data.forEach((item) => {
        item.requests.forEach((req) => {
          if (req.sender) userIds.add(req.sender);
          if (req.traveler) userIds.add(req.traveler);
        });
      });

      const usersResponse = await fetch(`${API_BASE_URL}/GetAllUsers?limit=1000`, {
        method: 'GET',
        credentials: 'include',
        headers: getAdminAuthHeaders(),
      });

      if (!usersResponse.ok) {
        throw new Error('Failed to fetch users');
      }

      const usersData = await usersResponse.json();
      const userMap: { [key: string]: User } = {};
      usersData.data.forEach((user: User) => {
        const userId = user._id || user.id;
        if (userId) {
          userMap[userId] = user;
        }
      });

      // Transform tracking data into table items
      const tableItems: TableItem[] = [];
      if (trackingData.data && Array.isArray(trackingData.data)) {
        trackingData.data.forEach((item) => {
          if (!item.package || !item.requests) return;

          item.requests.forEach((req) => {
            if (!req) return;
            const senderId = req.sender || req.sender_id || '';
            const travelerId = req.traveler || req.traveler_id || null;
            const packageId = item.package._id || (item.package as any).id;
            const packageDescription = item.package.description || `Package ${packageId}`;
            const fromCountry = item.package.fromCountry || (item.package as any).from_country || 'Unknown';
            const toCountry = item.package.toCountry || (item.package as any).to_country || 'Unknown';
            const packageCreatedAt = item.package.createdAt || (item.package as any).created_at || new Date().toISOString();
            const requestId = req._id || req.id || '';

            tableItems.push({
              id: packageId,
              title: packageDescription,
              tracking_number: packageId,
              pickup_country: fromCountry,
              delivery_country: toCountry,
              sender_name: (senderId && userMap[senderId])
                ? `${userMap[senderId].firstName || ''} ${userMap[senderId].lastName || ''}`.trim() || 'User'
                : 'Unknown',
              sender_email: (senderId && userMap[senderId]?.email) || 'Unknown',
              traveler_name: travelerId
                ? userMap[travelerId]
                  ? `${userMap[travelerId].firstName || ''} ${userMap[travelerId].lastName || ''}`.trim() || 'Traveler'
                  : 'Unknown'
                : null,
              traveler_email: travelerId ? userMap[travelerId]?.email || 'Unknown' : null,
              traveler_id: travelerId,
              status: req.status || 'pending',
              price: Number(req.insuranceCost) || 0,
              commission_amount: Number(req.insuranceCost) ? Number(req.insuranceCost) * 0.1 : 0,
              created_at: packageCreatedAt,
              request_id: requestId,
            });
          });
        });
      }

      setItems(tableItems);
      setUsers(userMap);
      setTotalCount(trackingData.totalCount);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setItems([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tracking_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sender_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.traveler_email && item.traveler_email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-blue-100 text-blue-800';
      case 'picked_up':
        return 'bg-purple-100 text-purple-800';
      case 'in_transit':
        return 'bg-indigo-100 text-indigo-800';
      case 'customs':
        return 'bg-orange-100 text-orange-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalPages = Math.ceil(totalCount / limit);

  const handleUpdateRequest = async () => {
    if (!updatingItem) return;
    try {
      const res = await fetch(`${API_BASE_URL}/tracking/${updatingItem.request_id}`, {
        method: 'PUT',
        headers: {
          ...getAdminAuthHeaders({ 'Content-Type': 'application/json' }),
        },
        credentials: 'include',
        body: JSON.stringify({
          status: updateStatus,
          travelerId: updateTravelerId || null
        })
      });

      if (!res.ok) throw new Error('Failed to update request');

      setUpdatingItem(null);
      fetchTrackingAndUsers();
    } catch (error) {
      setUpdateError('Failed to update request. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Package Tracking</h1>
          <p className="text-gray-600">Monitor shipments and update tracking status</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {REQUEST_STATUSES.map((status) => {
          const count = items.filter((item) => item.status === status).length;
          return (
            <div key={status} className="bg-white rounded-lg p-4 border border-gray-200">
              <div className={`text-2xl font-bold ${getStatusColor(status).split(' ')[1]}`}>
                {count}
              </div>
              <div className="text-gray-600 text-sm capitalize">{status.replace('_', ' ')}</div>
            </div>
          );
        })}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by description, tracking number, or user email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            {REQUEST_STATUSES.map((status) => (
              <option key={status} value={status} className="capitalize">
                {status.replace('_', ' ')}
              </option>
            ))}
          </select>
          <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors">
            <Filter className="w-4 h-4" />
            <span>More Filters</span>
          </button>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Package</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Route</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Sender</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Traveler</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Price</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Created</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <tr key={`${item.id}-${item.request_id}`} className="hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-purple-100 w-10 h-10 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{item.title}</div>
                        <div className="text-gray-500 text-sm">{item.tracking_number}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-sm">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">{item.pickup_country || 'Not specified'}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="text-gray-400">→</span>
                        <span className="text-gray-900">{item.delivery_country || 'Not specified'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-gray-900 text-sm">{item.sender_name || 'Unknown'}</div>
                        <div className="text-gray-500 text-xs">{item.sender_email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    {item.traveler_id ? (
                      <div className="flex items-center space-x-2">
                        <Truck className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-gray-900 text-sm">{item.traveler_name || 'Unknown'}</div>
                          <div className="text-gray-500 text-xs">{item.traveler_email}</div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-500 text-sm">Not assigned</span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(item.status)}`}
                    >
                      {(item.status || 'pending').replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900 font-medium">${(Number(item.price) || 0).toFixed(2)}</span>
                    </div>
                    {item.commission_amount > 0 && (
                      <div className="text-xs text-gray-500">
                        Commission: ${(Number(item.commission_amount) || 0).toFixed(2)}
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex space-x-2">
                      {item.traveler_id ? (
                        <button
                          onClick={() => {
                            setUpdatingItem(item);
                            setUpdateStatus(item.status);
                            setUpdateTravelerId(item.traveler_id || '');
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1"
                        >
                          <UserPlus className="w-3 h-3" />
                          <span>Update</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setUpdatingItem(item);
                            setUpdateStatus(item.status);
                            setUpdateTravelerId('');
                          }}
                          className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center space-x-1"
                        >
                          <UserPlus className="w-3 h-3" />
                          <span>Assign Traveler</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, totalCount)} of{' '}
            {totalCount} results
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded bg-white border border-gray-300 text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded bg-white border border-gray-300 text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Update Modal */}
      {updatingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 text-lg">Update Booking Request</h3>
              <button onClick={() => { setUpdatingItem(null); setUpdateError(null); }} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              {updateError && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-sm font-medium px-4 py-3 rounded-lg">
                  {updateError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {REQUEST_STATUSES.map(s => (
                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign Traveler Account</label>
                <select
                  value={updateTravelerId}
                  onChange={(e) => setUpdateTravelerId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- No Traveler Assigned --</option>
                  {Object.values(users).map(u => (
                    <option key={u._id} value={u._id}>{u.firstName} {u.lastName} ({u.email})</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => { setUpdatingItem(null); setUpdateError(null); }}
                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors border border-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateRequest}
                className="px-4 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-lg transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
