import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Shield, Package, ShoppingCart, ArrowLeft, Trash2 } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../contexts/CartContext';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import api from '../lib/api';
import ConfirmationModal from '../components/ConfirmationModal';

export default function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasPendingOrder, setHasPendingOrder] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { addToCart } = useCart();
  const { addNotification } = useNotification();
  const { user } = useAuth();

  const isSeller = user?.role === 'seller';
  const isAdmin = user?.role === 'admin';
  const canAddToCart = !isSeller && !hasPendingOrder;
  const sellerId = product?.sellerId && typeof product.sellerId === 'object' ? product.sellerId._id : product?.sellerId;
  const canDeleteProduct = user && product && (isAdmin || (isSeller && sellerId === user._id));
  const shouldRefresh = searchParams.get('refresh') === 'true';

  useEffect(() => {
    // Fetch product from backend API
    const fetchProduct = async () => {
      try {
        const response = await api.get(`/products/${productId}`);
        // Backend returns: { statusCode, data: product, message, success }
        const responseData = response.data as { data: Product };
        setProduct(responseData.data);
      } catch (error) {
        console.error('Error fetching product:', error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  // Check if buyer has pending order for this product
  useEffect(() => {
    const checkPendingOrder = async () => {
      if (!user || !productId || user.role !== 'buyer') {
        console.log('[ProductDetail] Skipping pending order check:', { user: !!user, productId, role: user?.role });
        setHasPendingOrder(false);
        return;
      }

      console.log('[ProductDetail] Checking pending orders for product:', productId);
      try {
        const response = await api.get('/orders/mine');
        const responseData = response.data as { data: any[] };
        const orders = responseData.data || [];
        console.log('[ProductDetail] Total orders from API:', orders.length);

        // Define what statuses are considered "active/pending" (blocking repurchase)
        const activePendingStatuses = ['pending', 'Escrow', 'Held', 'shipped', 'Disputed'];

        // Check if there's any ACTIVE order for this product
        // Completed and Refunded orders should NOT block repurchasing
        const pendingOrder = orders.find((order: any) => {
          const orderProductId = order.productId?._id || order.productId;
          const isMatchingProduct = orderProductId === productId;
          const isActiveOrder = activePendingStatuses.includes(order.status);

          if (isMatchingProduct) {
            console.log('[ProductDetail] Found order for this product:', {
              orderId: order._id,
              status: order.status,
              isActive: isActiveOrder
            });
          }

          return isMatchingProduct && isActiveOrder;
        });

        console.log('[ProductDetail] Pending order check result:', {
          productId,
          hasPendingOrder: !!pendingOrder,
          status: pendingOrder?.status,
          orderId: pendingOrder?._id
        });

        setHasPendingOrder(!!pendingOrder);
      } catch (error) {
        console.error('[ProductDetail] Error checking pending orders:', error);
        setHasPendingOrder(false);
      }
    };

    checkPendingOrder();
  }, [user, productId, shouldRefresh]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-black text-slate-900 mb-4">Product Not Found</h1>
          <p className="text-slate-600 mb-8">The product you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const conditionColors: Record<string, string> = {
    Mint: 'bg-green-100 text-green-800 border-green-300',
    Good: 'bg-blue-100 text-blue-800 border-blue-300',
    Fair: 'bg-amber-100 text-amber-800 border-amber-300',
    new: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  };

  const handleAddToCart = () => {
    const result = addToCart(product);
    if (result === 'already_in_cart') {
      addNotification('Product already in cart', 'warning', 1500);
    } else {
      addNotification('Added to cart', 'success', 1500);
    }
  };

  const handleDeleteProduct = () => {
    setConfirmDelete(true);
  };

  const confirmDeleteProduct = async () => {
    if (!product) return;

    try {
      await api.delete(`/products/delete/${product._id}`);
      toast.success(`✅ Product "${product.title}" deleted successfully`, {
        position: 'top-right',
        autoClose: 3000,
      });
      setConfirmDelete(false);
      setTimeout(() => navigate('/shop'), 1000);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to delete product';
      console.error('[ProductDetail] Delete error:', error);
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 5000,
      });
      setConfirmDelete(false);
    }
  };



  return (
    <div className="min-h-screen bg-white">
      {/* Back Button */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-amber-600 hover:text-amber-700 font-semibold transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Products</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Images Section */}
            <div className="flex flex-col">
              <div className="mb-6 relative aspect-square rounded-xl overflow-hidden bg-slate-100 shadow-lg border-2 border-slate-200">
                <img
                  src={product.images[selectedImage] || 'https://images.pexels.com/photos/3886244/pexels-photo-3886244.jpeg'}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
                {product.verified && (
                  <div className="absolute top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-full flex items-center space-x-2 text-sm font-bold shadow-lg">
                    <CheckCircle className="h-5 w-5" />
                    <span>Verified Authentic</span>
                  </div>
                )}
              </div>

              {/* Image Thumbnails */}
              {product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-all hover:border-amber-400 ${selectedImage === index
                        ? 'border-amber-600 shadow-md ring-2 ring-amber-200'
                        : 'border-slate-300'
                        }`}
                    >
                      <img src={image} alt={`${product.title} ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details Section */}
            <div className="flex flex-col">
              <div className="mb-6">
                <div className={`inline-block px-4 py-2 rounded-full text-sm font-bold border mb-4 ${conditionColors[product.condition] || 'bg-gray-100 text-gray-800 border-gray-300'}`}>
                  {product.condition} Condition
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 mb-6 leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
                  {product.title}
                </h1>

                {/* Product Info */}
                <div className="flex flex-wrap gap-3 mb-8">
                  <span className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold text-sm border border-slate-200">
                    {product.verified ? '✓ Verified' : 'Not Verified'}
                  </span>
                  <span className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold text-sm border border-slate-200">
                    📦 {product.images.length} Image{product.images.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-slate-900 mb-3">Description</h2>
                <p className="text-slate-600 text-lg leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-4 mb-8 p-6 bg-amber-50 rounded-xl border-2 border-amber-200">
                <div className="text-center">
                  <Shield className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-600 font-semibold">Verified</p>
                </div>
                <div className="text-center">
                  <CheckCircle className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-600 font-semibold">Escrow</p>
                </div>
                <div className="text-center">
                  <Package className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-600 font-semibold">Insured</p>
                </div>
              </div>

              {/* Stock Info */}
              <div className="mb-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-sm text-slate-600">
                  <span className="font-semibold text-slate-900">Stock Available:</span> In Stock
                </p>
              </div>

              {/* Price and CTA */}
              <div className="mt-auto">
                <div className="flex items-baseline justify-between mb-6 pb-6 border-b-2 border-slate-200">
                  <span className="text-5xl font-black text-amber-700">
                    ${product.price.toLocaleString()}
                  </span>
                  <span className="text-sm text-slate-500">+ shipping</span>
                </div>

                {canAddToCart ? (
                  <button
                    onClick={handleAddToCart}
                    className="w-full bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 flex items-center justify-center space-x-3 mb-4"
                  >
                    <ShoppingCart className="h-6 w-6" />
                    <span>Add to Cart</span>
                  </button>
                ) : (
                  <div className="mb-4 p-4 bg-slate-100 border border-slate-300 rounded-xl text-center">
                    <p className="text-slate-700 font-semibold">
                      {isSeller
                        ? 'Sellers cannot purchase products'
                        : 'You already have a pending order for this product'}
                    </p>
                  </div>
                )}

                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 py-3 rounded-lg font-semibold transition-colors"
                >
                  Continue Shopping
                </button>

                {canDeleteProduct && (
                  <button
                    onClick={handleDeleteProduct}
                    className="w-full mt-3 bg-red-50 hover:bg-red-100 text-red-700 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 border border-red-200"
                  >
                    <Trash2 className="h-5 w-5" />
                    <span>Delete Product</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={confirmDeleteProduct}
        title="Delete Product"
        message={`Are you sure you want to delete "${product.title}"?\n\nNote: Products in Escrow, Shipped, or Disputed orders cannot be deleted.`}
        confirmText="Delete Product"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}
