import { useState } from 'react';
import { CartProvider } from './contexts/CartContext';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProductGrid from './components/ProductGrid';
import Cart from './components/Cart';
import ProductDetail from './components/ProductDetail';
import AuthModal from './components/AuthModal';
import Footer from './components/Footer';
import Checkout from './components/Checkout';
import OrderConfirmation from './components/OrderConfirmation';
import OrderTracking from './components/OrderTracking';
import DisputeForm from './components/DisputeForm';
import VerificationFlow from './components/VerificationFlow';
import AdminDashboard from './components/AdminDashboard';
import { mockProducts } from './data/mockProducts';
import { Product } from './types';
import { useCart } from './contexts/CartContext';

function AppContent() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOrderConfirmationOpen, setIsOrderConfirmationOpen] = useState(false);
  const [confirmationOrderId, setConfirmationOrderId] = useState('');
  const [isOrderTrackingOpen, setIsOrderTrackingOpen] = useState(false);
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);
  const [selectedOrderForDispute, setSelectedOrderForDispute] = useState('');
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [selectedOrderForVerification, setSelectedOrderForVerification] = useState('');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const { addToCart, items, clearCart } = useCart();
  const { user } = useAuth();

  const handleCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleOrderSuccess = (orderId: string) => {
    setConfirmationOrderId(orderId);
    setIsCheckoutOpen(false);
    setIsOrderConfirmationOpen(true);
  };

  const handleViewOrders = () => {
    setIsOrderConfirmationOpen(false);
    setIsOrderTrackingOpen(true);
  };

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

      <Hero />

      <ProductGrid
        products={mockProducts}
        onProductClick={(product) => setSelectedProduct(product)}
      />

      <Footer />

      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={handleCheckout}
      />

      <ProductDetail
        product={selectedProduct}
        isOpen={selectedProduct !== null}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={addToCart}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      <Checkout
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSuccess={handleOrderSuccess}
      />

      <OrderConfirmation
        isOpen={isOrderConfirmationOpen}
        onClose={() => setIsOrderConfirmationOpen(false)}
        onViewOrders={handleViewOrders}
        orderId={confirmationOrderId}
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
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
