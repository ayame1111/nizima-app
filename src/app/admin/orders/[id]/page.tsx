
'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { ArrowLeft, Download, AlertTriangle, CheckCircle, Clock, User, Shield } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function AdminOrderDetailsPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const response = await axios.get(`/api/admin/orders/${id}`);
      setOrder(response.data);
    } catch (error) {
      console.error('Failed to fetch order details:', error);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-8 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
        <Link href="/admin/orders" className="text-blue-400 hover:underline">
          Return to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/admin/orders" className="text-gray-400 hover:text-white flex items-center gap-2 mb-6 transition-colors">
            <ArrowLeft size={16} /> Back to Orders
        </Link>
        
        <div className="flex justify-between items-start mb-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Order Details</h1>
                <p className="font-mono text-gray-500 text-sm">ID: {order.id}</p>
                <p className="font-mono text-gray-500 text-xs mt-1">Stripe Payment ID: {order.paymentId}</p>
            </div>
            <div className="text-right">
                <div className="text-3xl font-bold text-white mb-1">{formatCurrency(order.amount)}</div>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                    order.status === 'COMPLETED' ? 'bg-green-900/30 text-green-400 border border-green-900' :
                    order.status === 'PENDING' ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-900' :
                    'bg-red-900/30 text-red-400 border border-red-900'
                }`}>
                    {order.status === 'COMPLETED' ? <CheckCircle size={12} /> : <Clock size={12} />}
                    {order.status}
                </span>
            </div>
        </div>

        {/* Customer & Legal Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
                <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                    <User size={16} /> Customer Info
                </h3>
                <div className="space-y-3">
                    <div>
                        <span className="text-gray-500 text-xs block">Name</span>
                        <span className="text-white font-medium">{order.user?.name || 'Guest Checkout'}</span>
                    </div>
                    <div>
                        <span className="text-gray-500 text-xs block">Email</span>
                        <span className="text-white font-medium">{order.buyerEmail || order.user?.email}</span>
                    </div>
                    <div>
                        <span className="text-gray-500 text-xs block">Purchase IP (if tracked)</span>
                        <span className="font-mono text-gray-400 text-sm">{order.purchaseIp || 'Not logged'}</span>
                    </div>
                </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
                <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Shield size={16} /> Legal & Compliance
                </h3>
                <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                        <span className="text-gray-400 text-sm">Refund Waiver Agreed</span>
                        {order.refundWaived ? (
                            <span className="text-green-400 font-bold text-sm flex items-center gap-1">
                                <CheckCircle size={14} /> YES
                            </span>
                        ) : (
                            <span className="text-red-400 font-bold text-sm flex items-center gap-1">
                                <AlertTriangle size={14} /> NO / UNKNOWN
                            </span>
                        )}
                    </div>
                    <div className="text-xs text-gray-500 leading-relaxed">
                        {order.refundWaived 
                            ? "Customer explicitly agreed to waive their right to a refund for this digital product download at checkout."
                            : "No explicit waiver recorded for this transaction."
                        }
                    </div>
                </div>
            </div>
        </div>

        {/* Purchased Items */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-800">
                <h2 className="text-xl font-bold text-white">Items Purchased</h2>
            </div>
            <div className="p-6">
                {order.items.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-4 mb-4 last:mb-0">
                        <div className="w-16 h-16 bg-gray-800 rounded-lg overflow-hidden border border-gray-700 flex-shrink-0">
                            {item.product.iconUrl && (
                                <img src={item.product.iconUrl} alt={item.product.title} className="w-full h-full object-cover" />
                            )}
                        </div>
                        <div className="flex-grow">
                            <h3 className="text-white font-bold">{item.product.title}</h3>
                            <p className="text-sm text-gray-400">Sold by: {item.product.creator?.name}</p>
                        </div>
                        <div className="text-white font-bold">{formatCurrency(item.price)}</div>
                    </div>
                ))}
            </div>
        </div>

        {/* Download Logs */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Download size={20} /> Download Activity Log
                </h2>
                <span className="bg-gray-800 text-gray-400 px-2 py-1 rounded text-xs font-mono">
                    Total Attempts: {order.downloadLogs.length}
                </span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-800/50 text-gray-400 text-xs uppercase tracking-wider">
                            <th className="p-4 font-medium">Timestamp</th>
                            <th className="p-4 font-medium">IP Address</th>
                            <th className="p-4 font-medium">Status</th>
                            <th className="p-4 font-medium">Details</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-gray-800">
                        {order.downloadLogs.map((log: any) => (
                            <tr key={log.id} className="hover:bg-gray-800/30 transition-colors">
                                <td className="p-4 text-gray-300 whitespace-nowrap">
                                    {formatDate(log.downloadedAt)}
                                </td>
                                <td className="p-4 font-mono text-blue-400">
                                    {log.ip}
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                        log.status === 'SUCCESS' ? 'bg-green-900/30 text-green-400 border border-green-900' :
                                        'bg-red-900/30 text-red-400 border border-red-900'
                                    }`}>
                                        {log.status}
                                    </span>
                                </td>
                                <td className="p-4 text-gray-500 max-w-xs truncate" title={log.userAgent}>
                                    {log.reason ? (
                                        <span className="text-red-400">{log.reason}</span>
                                    ) : (
                                        <span className="text-xs font-mono">{log.userAgent}</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {order.downloadLogs.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-gray-500">
                                    No download activity recorded yet.
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
