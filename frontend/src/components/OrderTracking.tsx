import { ChevronRight, Package, Truck, CheckCircle, AlertCircle, Flag } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Order, OrderVerification } from '../types';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

interface OrderTrackingProps {
  isOpen: boolean;
  onClose: () => void;
  onRaiseDispute: (orderId: string) => void;
  onVerify: (orderId: string) => void;
}

export default function OrderTracking({ isOpen, onClose, onRaiseDispute, onVerify }: OrderTrackingProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      fetchOrders();
    }
  }, [isOpen, user]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await api.get('/orders/my-orders');
      setOrders(response.data.data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending_payment':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'pending_shipment':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'in_transit':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'disputed':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'refunded':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending_shipment':
        return <Package className="h-5 w-5" />;
      case 'in_transit':
        return <Truck className="h-5 w-5" />;
      case 'delivered':
      case 'completed':
        return <CheckCircle className="h-5 w-5" />;
      case 'disputed':
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Package className="h-5 w-5" />;
    }
  };

  const getStatusLabel = (status: Order['status']) => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl overflow-y-auto">
        <div className="sticky top-0 p-6 border-b-2 border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100 z-10">
          <h2 className="text-2xl font-black text-slate-900">Order History</h2>
          <p className="text-slate-600 text-sm mt-1">Track and manage your purchases</p>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin h-12 w-12 border-4 border-amber-200 border-t-amber-600 rounded-full mx-auto mb-4"></div>
            <p className="text-slate-600">Loading your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">No Orders Yet</h3>
            <p className="text-slate-600">Start shopping to place your first order</p>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="border-2 border-slate-200 rounded-lg overflow-hidden hover:border-amber-300 transition-colors">
                <button
                  onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center space-x-1 ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span>{getStatusLabel(order.status)}</span>
                      </span>
                      <span className="text-2xl font-black text-amber-700">PKR {order.price.toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-slate-600">Order ID: {order.id.slice(0, 8)}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(order.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <ChevronRight
                    className={`h-5 w-5 text-slate-400 transition-transform ${
                      expandedOrder === order.id ? 'rotate-90' : ''
                    }`}
                  />
                </button>

                {expandedOrder === order.id && (
                  <div className="border-t border-slate-200 p-4 space-y-4 bg-slate-50">
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-semibold">Payment Status</p>
                        <p className="text-sm font-semibold text-slate-900 capitalize mt-1">
                          {order.payment_status.replace('_', ' ')} (Escrowed)
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500 uppercase font-semibold">Order Status</p>
                        <p className="text-sm font-semibold text-slate-900 capitalize mt-1">
                          {order.status.replace('_', ' ')}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500 uppercase font-semibold">Amount</p>
                        <p className="text-lg font-black text-amber-700 mt-1">PKR {order.price.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-200">
                      {(order.status === 'delivered' || order.status === 'in_transit') && (
                        <button
                          onClick={() => onVerify(order.id)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm transition-colors"
                        >
                          Verify & Complete
                        </button>
                      )}

                      {(order.status === 'delivered' || order.status === 'in_transit') && (
                        <button
                          onClick={() => onRaiseDispute(order.id)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-sm transition-colors flex items-center justify-center space-x-2"
                        >
                          <Flag className="h-4 w-4" />
                          <span>Raise Dispute</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
