import { ShoppingCart, User, Search, Package, Plus, Home, LogIn, Settings, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect, useRef } from 'react';

interface NavbarProps {
  onCartClick: () => void;
  onAuthClick: () => void;
  onAdminClick?: () => void;
}

interface Command {
  id: string;
  label: string;
  icon: any;
  action: () => void;
  roles?: string[]; // If undefined, available to all
}

export default function Navbar({ onCartClick, onAuthClick, onAdminClick }: NavbarProps) {
  const navigate = useNavigate();
  const { items } = useCart();
  const { user } = useAuth();
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const isAdmin = user && user.role === 'admin';
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCommands, setShowCommands] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowCommands(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Define all available commands based on role
  const allCommands: Command[] = [
    {
      id: 'home',
      label: 'Go to Home',
      icon: Home,
      action: () => { navigate('/'); setShowCommands(false); }
    },
    {
      id: 'shop',
      label: 'Browse Shop',
      icon: ShoppingCart,
      action: () => { navigate('/shop'); setShowCommands(false); }
    },
    {
      id: 'login',
      label: 'Sign In / Register',
      icon: LogIn,
      action: () => { onAuthClick(); setShowCommands(false); },
      roles: [] // Only show when not logged in
    },
    {
      id: 'account',
      label: 'My Account',
      icon: User,
      action: () => { onAuthClick(); setShowCommands(false); },
      roles: ['buyer', 'seller', 'admin']
    },
    {
      id: 'cart',
      label: 'View Cart',
      icon: ShoppingCart,
      action: () => { onCartClick(); setShowCommands(false); }
      // Available to buyers and guests (no role restriction)
    },
    {
      id: 'my-orders',
      label: 'My Orders',
      icon: Package,
      action: () => { navigate('/my-orders'); setShowCommands(false); },
      roles: ['buyer']
    },
    {
      id: 'list-product',
      label: 'List New Product',
      icon: Plus,
      action: () => { navigate('/list-product'); setShowCommands(false); },
      roles: ['seller']
    },
    {
      id: 'seller-orders',
      label: 'My Sales',
      icon: Truck,
      action: () => { navigate('/seller-orders'); setShowCommands(false); },
      roles: ['seller']
    },
    {
      id: 'seller-products',
      label: 'My Products',
      icon: Package,
      action: () => { navigate('/seller-products'); setShowCommands(false); },
      roles: ['seller']
    },
    {
      id: 'admin',
      label: 'Admin Panel',
      icon: Settings,
      action: () => { if (onAdminClick) onAdminClick(); setShowCommands(false); },
      roles: ['admin']
    },
  ];

  // Filter commands based on user role and search query
  const filteredCommands = allCommands.filter(cmd => {
    // Check role access
    if (cmd.roles !== undefined) {
      if (!user && !cmd.roles.includes(null as any)) return false;
      if (user && cmd.roles.length > 0 && !cmd.roles.includes(user.role)) return false;
      if (user && cmd.roles.length === 0) return false; // Login command only for guests
    }

    // Filter by search query
    if (searchQuery) {
      return cmd.label.toLowerCase().includes(searchQuery.toLowerCase());
    }

    return true;
  });

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

          {/* Command Palette Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-8" ref={searchRef}>
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search commands... (Shop, Orders, Cart, etc.)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowCommands(true)}
                className="w-full px-4 py-2 pl-10 rounded text-slate-900 placeholder-slate-400 focus:outline-none border"
                style={{
                  backgroundColor: 'transparent',
                  borderColor: '#1c452a',
                  color: '#1c452a'
                }}
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5" style={{ color: '#1c452a' }} />

              {/* Command Dropdown */}
              {showCommands && filteredCommands.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-2xl border-2 border-amber-200 max-h-96 overflow-y-auto z-[100]">
                  {filteredCommands.map((cmd) => {
                    const Icon = cmd.icon;
                    return (
                      <button
                        key={cmd.id}
                        onClick={cmd.action}
                        className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-amber-50 transition-colors border-b border-slate-100 last:border-0"
                      >
                        <Icon className="h-5 w-5 text-amber-600" />
                        <span className="font-medium text-slate-900">{cmd.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
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
                  <Truck className="h-5 w-5" />
                  <span>My Sales</span>
                </button>
                <button
                  onClick={() => navigate('/seller-products')}
                  className="flex items-center space-x-1 font-semibold transition-colors hidden sm:flex"
                  style={{ color: '#1c452a' }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                >
                  <Package className="h-5 w-5" />
                  <span>My Products</span>
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
                {user ? user.username : 'Sign In'}
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
