
'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { ArrowLeft, DollarSign, ShoppingBag, CheckCircle, Clock } from 'lucide-react';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/api/admin/orders');
      setOrders(response.data.orders);
      setAnalytics(response.data.analytics);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
            <Link href="/admin" className="text-gray-400 hover:text-white flex items-center gap-2 mb-4 transition-colors">
                <ArrowLeft size={16} /> Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-white">Orders & Analytics</h1>
            <p className="text-gray-400">Monitor sales performance and transaction history.</p>
        </div>

        {/* Analytics Cards */}
        {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-400 text-sm font-medium">Total Volume</h3>
                        <div className="p-2 bg-blue-900/30 text-blue-400 rounded-lg">
                            <DollarSign size={20} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-white">{formatCurrency(analytics.totalRevenue)}</div>
                    <p className="text-xs text-gray-500 mt-1">Gross Merchandise Value</p>
                </div>

                <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-400 text-sm font-medium">Platform Revenue</h3>
                        <div className="p-2 bg-green-900/30 text-green-400 rounded-lg">
                            <DollarSign size={20} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-white">{formatCurrency(analytics.platformRevenue)}</div>
                    <p className="text-xs text-gray-500 mt-1">Estimated 15% Fees</p>
                </div>

                <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-400 text-sm font-medium">Total Orders</h3>
                        <div className="p-2 bg-purple-900/30 text-purple-400 rounded-lg">
                            <ShoppingBag size={20} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-white">{analytics.totalOrders}</div>
                    <p className="text-xs text-gray-500 mt-1">All time transactions</p>
                </div>

                <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-400 text-sm font-medium">Success Rate</h3>
                        <div className="p-2 bg-yellow-900/30 text-yellow-400 rounded-lg">
                            <CheckCircle size={20} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-white">
                        {analytics.totalOrders > 0 ? Math.round((analytics.completedOrders / analytics.totalOrders) * 100) : 0}%
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Completed transactions</p>
                </div>
            </div>
        )}

        {/* Orders Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-800">
                <h2 className="text-xl font-bold text-white">Recent Orders</h2>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-800/50 text-gray-400 text-sm">
                            <th className="p-4 font-medium">Order ID</th>
                            <th className="p-4 font-medium">Customer</th>
                            <th className="p-4 font-medium">Product</th>
                            <th className="p-4 font-medium">Creator</th>
                            <th className="p-4 font-medium">Amount</th>
                            <th className="p-4 font-medium">Status</th>
                            <th className="p-4 font-medium">Date</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-gray-800">
                        {orders.map((order) => (
                            <tr 
                                key={order.id} 
                                className="hover:bg-gray-800/30 transition-colors cursor-pointer"
                                onClick={() => window.location.href = `/admin/orders/${order.id}`}
                            >
                                <td className="p-4 font-mono text-gray-500 text-xs">
                                    <Link href={`/admin/orders/${order.id}`} className="hover:text-blue-400 hover:underline" onClick={(e) => e.stopPropagation()}>
                                        {order.id.slice(-8)}
                                    </Link>
                                </td>
                                <td className="p-4">
                                    <div className="font-medium text-white">{order.user?.name || 'Guest'}</div>
                                    <div className="text-xs text-gray-500">{order.buyerEmail || order.user?.email}</div>
                                </td>
                                <td className="p-4 text-gray-300">
                                    {order.items.map((item: any) => item.product.title).join(', ')}
                                </td>
                                <td className="p-4 text-gray-400">
                                    {order.items[0]?.product.creator?.name || 'Unknown'}
                                </td>
                                <td className="p-4 font-medium text-white">
                                    {formatCurrency(order.amount)}
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        order.status === 'completed' ? 'bg-green-100 text-green-700' :
                                        order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                                        'bg-indigo-50 text-indigo-600'
                                    }`}>
                                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                    </span>
                                </td>
                                <td className="p-4 text-gray-500">
                                    {new Date(order.createdAt).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                        {orders.length === 0 && (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-gray-500">
                                    No orders found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
}
