import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './contexts/CartContext';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProductGrid from './components/ProductGrid';
import FeaturedCollections from './components/FeaturedCollections';
import TrustSection from './components/TrustSection';
import Cart from './components/Cart';
import AuthModal from './components/AuthModal';
import Footer from './components/Footer';
import OrderTracking from './components/OrderTracking';
import DisputeForm from './components/DisputeForm';
import VerificationFlow from './components/VerificationFlow';
import AdminDashboard from './components/AdminDashboard';
import NotificationContainer from './components/NotificationContainer';
import ProductDetailPage from './pages/ProductDetailPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentCancelledPage from './pages/PaymentCancelledPage';
import MyOrdersPage from './pages/MyOrdersPage';
import SellerOrdersPage from './pages/SellerOrdersPage';
import ListProductPage from './pages/ListProductPage';
import SellerProductsPage from './pages/SellerProductsPage';
import PaymentSettingsPage from './pages/PaymentSettingsPage';
import AdminLoginPage from './pages/AdminLoginPage';
import ShopPage from './pages/ShopPage';
import LoginPage from './pages/LoginPage';
import api from './lib/api';
import { Product } from './types';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { LoadingProvider } from './contexts/LoadingContext';
import GlobalLoadingAnimation from './components/GlobalLoadingAnimation';
import LoadingTransition from './components/LoadingTransition';

function AppContent() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isOrderTrackingOpen, setIsOrderTrackingOpen] = useState(false);
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);
  const [selectedOrderForDispute, setSelectedOrderForDispute] = useState('');
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [selectedOrderForVerification, setSelectedOrderForVerification] = useState('');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    // Fetch products from backend
    const fetchProducts = async () => {
      try {
        const response = await api.get('/products');
        // Backend returns: { statusCode, data: { products, pagination }, message, success }
        setProducts(response.data.data.products || []);
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  const handleRaiseDispute = (orderId: string) => {
    setSelectedOrderForDispute(orderId);
    setIsDisputeOpen(true);
  };

  const handleVerifyOrder = (orderId: string) => {
    setSelectedOrderForVerification(orderId);
    setIsVerificationOpen(true);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar
        onCartClick={() => setIsCartOpen(true)}
        onAuthClick={() => setIsAuthOpen(true)}
        onAdminClick={() => user && setIsAdminOpen(true)}
      />

      <Routes>
        <Route
          path="/"
          element={
            <>
              <Hero />
              <FeaturedCollections />
              {loadingProducts ? (
                <div className="py-16 text-center">
                  <p className="text-gray-600">Loading products...</p>
                </div>
              ) : (
                <ProductGrid products={products} />
              )}
              <TrustSection />
              <Footer />
            </>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/product/:productId" element={<ProductDetailPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />
        <Route path="/payment-success" element={<PaymentSuccessPage />} />
        <Route path="/payment-cancelled" element={<PaymentCancelledPage />} />
        <Route path="/my-orders" element={<MyOrdersPage />} />
        <Route path="/seller-orders" element={<SellerOrdersPage />} />
        <Route path="/seller-products" element={<SellerProductsPage />} />
        <Route path="/payment-settings" element={<PaymentSettingsPage />} />
        <Route path="/list-product" element={<ListProductPage />} />
        <Route path="/admin-login" element={<AdminLoginPage />} />
      </Routes>

      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      <OrderTracking
        isOpen={isOrderTrackingOpen}
        onClose={() => setIsOrderTrackingOpen(false)}
        onRaiseDispute={handleRaiseDispute}
        onVerify={handleVerifyOrder}
      />

      <DisputeForm
        isOpen={isDisputeOpen}
        onClose={() => setIsDisputeOpen(false)}
        orderId={selectedOrderForDispute}
        onSuccess={() => setIsOrderTrackingOpen(true)}
      />

      <VerificationFlow
        isOpen={isVerificationOpen}
        onClose={() => setIsVerificationOpen(false)}
        orderId={selectedOrderForVerification}
        onSuccess={() => setIsOrderTrackingOpen(true)}
      />

      <AdminDashboard
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <LoadingTransition />
      <LoadingProvider>
        <GlobalLoadingAnimation />
        <AuthProvider>
          <CartProvider>
            <NotificationProvider>
              <NotificationContainer />
              {/* ADD THIS */}
              <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                pauseOnHover
                draggable
                theme="light"
                aria-label={"toast-container"}
              />
              <AppContent />
            </NotificationProvider>
          </CartProvider>
        </AuthProvider>
      </LoadingProvider>
    </BrowserRouter>
  );
}

export default App;
