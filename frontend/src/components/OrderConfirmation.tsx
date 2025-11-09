import { CheckCircle, X, ArrowRight } from 'lucide-react';

interface OrderConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onViewOrders: () => void;
  orderId: string;
}

export default function OrderConfirmation({ isOpen, onClose, onViewOrders, orderId }: OrderConfirmationProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden text-center p-8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="h-6 w-6 text-slate-700" />
          </button>

          <div className="mb-6">
            <CheckCircle className="h-24 w-24 text-green-600 mx-auto mb-4" />
            <h2 className="text-3xl font-black text-slate-900 mb-2">Order Placed!</h2>
            <p className="text-slate-600">Your payment has been securely escrowed.</p>
          </div>

          <div className="space-y-4 mb-8 text-left">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-600 mb-1">Order ID</p>
              <p className="font-mono font-bold text-slate-900 break-all">{orderId}</p>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-semibold text-amber-900 mb-2">What Happens Next?</p>
              <ol className="text-sm text-amber-800 space-y-2">
                <li className="flex items-start space-x-2">
                  <span className="font-bold flex-shrink-0">1.</span>
                  <span>Seller ships the item within 3 days</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="font-bold flex-shrink-0">2.</span>
                  <span>You receive tracking information</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="font-bold flex-shrink-0">3.</span>
                  <span>Confirm receipt and verify authenticity</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="font-bold flex-shrink-0">4.</span>
                  <span>Seller gets paid once verified</span>
                </li>
              </ol>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                onViewOrders();
                onClose();
              }}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-lg font-bold transition-colors flex items-center justify-center space-x-2"
            >
              <span>Track Your Order</span>
              <ArrowRight className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900 py-3 rounded-lg font-bold transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
