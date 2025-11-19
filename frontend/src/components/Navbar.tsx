import { ShoppingCart, User, Search, Package, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';

interface NavbarProps {
  onCartClick: () => void;
  onAuthClick: () => void;
  onAdminClick?: () => void;
}

export default function Navbar({ onCartClick, onAuthClick, onAdminClick }: NavbarProps) {
  const navigate = useNavigate();
  const { items } = useCart();
  const { user } = useAuth();
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const isAdmin = user && user.role === 'admin';
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav 
      className="sticky top-0 z-50 transition-all duration-300"
      style={{
        backgroundColor: isScrolled ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.5)',
        backdropFilter: 'blur(10px)',
        boxShadow: isScrolled ? '0 2px 8px rgba(0, 0, 0, 0.1)' : 'none',
        zIndex: 50
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center">
            <button 
              onClick={() => navigate('/')} 
              className="cursor-pointer hover:opacity-90 transition-opacity"
              title="GameDay Relics Home"
            >
              <img
                src="/Gameday-icon.png"
                alt="GameDay Relics"
                className="h-20 w-auto object-contain"
              />
            </button>
          </div>

          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search..."
                className="w-full px-4 py-2 pl-10 rounded text-slate-900 placeholder-slate-400 focus:outline-none border"
                style={{ 
                  backgroundColor: 'transparent',
                  borderColor: '#1c452a',
                  color: '#1c452a'
                }}
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5" style={{ color: '#1c452a' }} />
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <button
              onClick={() => navigate('/shop')}
              className="font-semibold transition-colors hidden sm:inline"
              style={{ color: '#1c452a' }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
            >
              Shop
            </button>

            {user && user.role === 'buyer' && (
              <button
                onClick={() => navigate('/my-orders')}
                className="flex items-center space-x-1 font-semibold transition-colors hidden sm:flex"
                style={{ color: '#1c452a' }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
              >
                <Package className="h-5 w-5" />
                <span>My Orders</span>
              </button>
            )}

            {user && user.role === 'seller' && (
              <>
                <button
                  onClick={() => navigate('/list-product')}
                  className="flex items-center space-x-1 font-semibold transition-colors hidden sm:flex"
                  style={{ color: '#1c452a' }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                >
                  <Plus className="h-5 w-5" />
                  <span>List Product</span>
                </button>
                <button
                  onClick={() => navigate('/seller-orders')}
                  className="flex items-center space-x-1 font-semibold transition-colors hidden sm:flex"
                  style={{ color: '#1c452a' }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                >
                  <Package className="h-5 w-5" />
                  <span>My Sales</span>
                </button>
              </>
            )}

            {isAdmin && (
              <button
                onClick={onAdminClick}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold text-sm transition-colors text-white"
              >
                Admin Panel
              </button>
            )}

            <button
              onClick={onAuthClick}
              className="flex items-center space-x-2 transition-colors"
              style={{ color: '#1c452a' }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
            >
              <User className="h-6 w-6" />
              <span className="hidden sm:inline font-medium">
                {user ? 'Account' : 'Sign In'}
              </span>
            </button>

            {(!user || user.role !== 'seller') && (
              <button
                onClick={onCartClick}
                className="relative flex items-center space-x-2 transition-colors"
                style={{ color: '#1c452a' }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
              >
                <ShoppingCart className="h-6 w-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
                <span className="hidden sm:inline font-medium">Cart</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
