import { ShoppingCart, User, Search, Trophy } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

interface NavbarProps {
  onCartClick: () => void;
  onAuthClick: () => void;
  onAdminClick?: () => void;
}

export default function Navbar({ onCartClick, onAuthClick, onAdminClick }: NavbarProps) {
  const { items } = useCart();
  const { user } = useAuth();
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const isAdmin = user && user.user_metadata?.role === 'admin';

  return (
    <nav className="bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900 text-amber-50 sticky top-0 z-50 shadow-lg border-b-2 border-amber-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-3">
            <Trophy className="h-10 w-10 text-amber-300" strokeWidth={2.5} />
            <div>
              <h1 className="text-3xl font-black tracking-tight text-amber-50" style={{ fontFamily: 'Georgia, serif' }}>
                GameDay Relics
              </h1>
              <p className="text-xs text-amber-300 tracking-widest uppercase">Vintage Sports Memorabilia</p>
            </div>
          </div>

          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search jerseys, memorabilia..."
                className="w-full px-4 py-2 pl-10 bg-amber-950/50 border border-amber-700 rounded-lg text-amber-50 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-amber-400" />
            </div>
          </div>

          <div className="flex items-center space-x-6">
            {isAdmin && (
              <button
                onClick={onAdminClick}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold text-sm transition-colors"
              >
                Admin Panel
              </button>
            )}

            <button
              onClick={onAuthClick}
              className="flex items-center space-x-2 hover:text-amber-300 transition-colors"
            >
              <User className="h-6 w-6" />
              <span className="hidden sm:inline font-medium">
                {user ? 'Account' : 'Sign In'}
              </span>
            </button>

            <button
              onClick={onCartClick}
              className="relative flex items-center space-x-2 hover:text-amber-300 transition-colors"
            >
              <ShoppingCart className="h-6 w-6" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
              <span className="hidden sm:inline font-medium">Cart</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
