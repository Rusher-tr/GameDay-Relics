import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight, Shield } from 'lucide-react';
import api from '../lib/api';
import { useCart } from '../contexts/CartContext';

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      setError('No session ID found');
      setLoading(false);
      return;
    }

    // Verify payment with backend
    const verifyPayment = async () => {
      try {
        console.log('Verifying payment with session_id:', sessionId);
        const response = await api.get(`/payment/success?session_id=${sessionId}`);
        console.log('Payment verification response:', response.data);

        if (response.data.success) {
          setOrder(response.data.order);
          // Clear cart after successful payment
          clearCart();
        } else {
          console.error('Payment verification failed - response.data.success is false');
          setError('Payment verification failed');
        }
      } catch (err: any) {
        console.error('Payment verification error:', err);
        console.error('Error response:', err?.response);
        console.error('Error data:', err?.response?.data);
        console.error('Full URL attempted:', `${import.meta.env.VITE_API_URL}/payment/success?session_id=${sessionId}`);

        const errorMsg = err?.userMessage || err?.response?.data?.message || err?.message || 'Failed to verify payment';
        setError(`Payment verification failed: ${errorMsg}. Check console for details.`);
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams, clearCart]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-md">
          <div className="bg-red-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <span className="text-3xl">❌</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Verification Failed</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Message */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="text-center">
            <div className="bg-green-100 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>

            <h1 className="text-3xl font-black text-slate-900 mb-3" style={{ fontFamily: 'Georgia, serif' }}>
              Payment Successful!
            </h1>

            <p className="text-lg text-slate-600 mb-6">
              Your order has been placed successfully. Your funds are held in secure escrow until delivery confirmation.
            </p>

            {order && (
              <div className="bg-slate-50 rounded-lg p-6 mb-6">
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Order ID
                </h2>
                <p className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Georgia, serif' }}>
                  #{order._id}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Escrow Protection Info */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-start space-x-4">
            <div className="bg-amber-100 rounded-lg p-3">
              <Shield className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Protected by Escrow</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Your payment is securely held until you confirm receipt and authenticity of your item.
                This protects you from fraud and ensures you receive exactly what you ordered.
              </p>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
            <Package className="h-5 w-5 mr-2 text-amber-600" />
            What Happens Next?
          </h3>
          <ol className="space-y-4">
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-600 text-white text-sm flex items-center justify-center font-bold mr-3">
                1
              </span>
              <div>
                <p className="font-semibold text-slate-900">Seller Prepares Shipment</p>
                <p className="text-sm text-slate-600">The seller will prepare and ship your item</p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-600 text-white text-sm flex items-center justify-center font-bold mr-3">
                2
              </span>
              <div>
                <p className="font-semibold text-slate-900">Track Your Order</p>
                <p className="text-sm text-slate-600">Monitor your order status in "My Orders"</p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-600 text-white text-sm flex items-center justify-center font-bold mr-3">
                3
              </span>
              <div>
                <p className="font-semibold text-slate-900">Receive & Confirm</p>
                <p className="text-sm text-slate-600">Once received, confirm authenticity to release payment</p>
              </div>
            </li>
          </ol>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate('/my-orders')}
            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
          >
            <span>View My Orders</span>
            <ArrowRight className="ml-2 h-5 w-5" />
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-1 bg-white hover:bg-slate-50 text-slate-700 px-6 py-3 rounded-lg font-semibold transition-colors border-2 border-slate-300"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}
