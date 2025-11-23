import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { X, ShoppingCart, Home } from 'lucide-react';
import api from '../lib/api';
import { useCart } from '../contexts/CartContext';
import { Product } from '../types';

interface OrderData {
  _id: string;
  productId: Product;
}

export default function PaymentCancelledPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const orderId = searchParams.get('order_id');

    const handlePaymentCancellation = async () => {
      if (!orderId) {
        // No order ID, just show cancellation message
        console.log('[PaymentCancelled] No order ID provided');
        setLoading(false);
        return;
      }

      try {
        // Step 1: Fetch the order data FIRST (before deletion) to get product details
        console.log('[PaymentCancelled] Step 1: Fetching order details for:', orderId);
        const orderResponse = await api.get(`/orders/${orderId}`);
        const responseData = orderResponse.data as { data: OrderData };
        
        if (responseData.data && responseData.data.productId) {
          const orderData = responseData.data;
          const productData = orderData.productId;
          
          console.log('[PaymentCancelled] Step 1: Order fetched, product:', productData.title);
          setProduct(productData);
          
          // Step 2: Add product to cart
          console.log('[PaymentCancelled] Step 2: Adding product to cart:', productData.title);
          const result = addToCart(productData);
          console.log('[PaymentCancelled] Step 2: Cart add result:', result);
          
          // Step 3: Call backend to delete the pending order
          console.log('[PaymentCancelled] Step 3: Calling backend to delete pending order');
          const cancelResponse = await api.post('/payment/cancel-order');
          console.log('[PaymentCancelled] Step 3: Order deletion response:', cancelResponse.data);
          
          setSuccess(true);
          console.log('[PaymentCancelled] Success! Product restored to cart');
        } else {
          setError('Could not fetch order details');
        }
      } catch (err: any) {
        console.error('[PaymentCancelled] Error:', err);
        const errorMsg = err?.response?.data?.message || err?.message || 'Failed to process cancellation';
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    handlePaymentCancellation();
  }, [searchParams, addToCart]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Processing cancellation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-md mx-auto px-4 py-12">
        {error && (
          <div className="bg-red-100 border border-red-400 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <X className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="font-bold text-red-900 mb-1">Payment Cancelled</h2>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <ShoppingCart className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="font-bold text-green-900 mb-1">Item Restored to Cart</h2>
                <p className="text-green-700 text-sm">
                  {product?.title || 'Your item'} has been added back to your cart.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
              <X className="h-8 w-8 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Cancelled</h1>
            <p className="text-slate-600">
              Your payment was not completed. No charges have been made to your account.
            </p>
          </div>

          {product && (
            <div className="border border-slate-200 rounded-lg p-4 mb-6">
              <p className="text-xs text-slate-500 mb-2">CANCELLED ORDER</p>
              <div className="flex gap-4">
                <img
                  src={product.images[0]}
                  alt={product.title}
                  className="w-20 h-20 object-cover rounded"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 mb-1">
                    {product.title}
                  </h3>
                  <p className="text-lg font-bold text-amber-600">
                    PKR {product.price.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {product && (
              <button
                onClick={() => navigate(`/product/${product._id}?refresh=true`)}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingCart className="h-5 w-5" />
                <span>View Product Again</span>
              </button>
            )}
            <button
              onClick={() => navigate('/checkout')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <ShoppingCart className="h-5 w-5" />
              <span>Go to Checkout</span>
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Home className="h-5 w-5" />
              <span>Return to Shopping</span>
            </button>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-sm text-blue-900">
            💡 <strong>Tip:</strong> Your item is still available and has been restored to your cart. Try again whenever you're ready!
          </p>
        </div>
      </div>
    </div>
  );
}
