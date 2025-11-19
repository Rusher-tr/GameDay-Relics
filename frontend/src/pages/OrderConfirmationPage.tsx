import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';

export default function OrderConfirmationPage() {
  const navigate = useNavigate();
  const { orderId } = useParams();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          <CheckCircle className="h-24 w-24 text-green-600 animate-bounce" />
        </div>

        <h1 className="text-3xl font-black text-slate-900 mb-2">Order Confirmed!</h1>
        
        <p className="text-slate-600 mb-6">
          Thank you for your purchase. Your order has been received and is being processed.
        </p>

        <div className="bg-slate-50 p-4 rounded-lg mb-8 border border-slate-200">
          <p className="text-sm text-slate-600 mb-1">Order Number</p>
          <p className="text-lg font-bold text-slate-900 font-mono break-all">{orderId}</p>
        </div>

        <div className="space-y-3 mb-8 text-left">
          <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700">
              <span className="font-semibold">Payment Secured:</span> Your payment is held safely in escrow
            </p>
          </div>

          <div className="flex items-start space-x-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <CheckCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700">
              <span className="font-semibold">Seller Notified:</span> The seller has been notified to ship your item
            </p>
          </div>

          <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
            <CheckCircle className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-purple-700">
              <span className="font-semibold">Tracking Available:</span> You'll receive shipping updates soon
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate('/orders')}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-lg font-bold transition-colors flex items-center justify-center space-x-2"
          >
            <span>Track Your Order</span>
            <ArrowRight className="h-5 w-5" />
          </button>

          <button
            onClick={() => navigate('/')}
            className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 py-3 rounded-lg font-bold transition-colors"
          >
            Continue Shopping
          </button>
        </div>

        <p className="text-xs text-slate-500 mt-6">
          A confirmation email has been sent to your registered email address with order details and tracking information.
        </p>
      </div>
    </div>
  );
}
