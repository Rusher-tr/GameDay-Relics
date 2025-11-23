import { X, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type UserRole = 'buyer' | 'seller' | 'admin';

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('buyer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn, signUp, signOut, user } = useAuth();

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password, name, role);
      } else {
        await signIn(email, password);
      }
      // Only close on success
      onClose();
    } catch (err: any) {
      // Use enhanced error message from API interceptor
      let errorMessage = err?.userMessage || 'An error occurred';

      // Fallback to other error sources if userMessage not available
      if (!err?.userMessage) {
        if (err?.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }
      }

      console.error('[AuthModal] Error:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      onClose();
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ overflow: 'hidden' }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <X className="h-6 w-6 text-slate-700" />
        </button>

        <div className="p-6 sm:p-8">
          {user ? (
            <div className="text-center">
              <h2 className="text-3xl font-black text-slate-900 mb-4">Welcome Back!</h2>
              <p className="text-slate-600 mb-2">Signed in as:</p>
              <p className="text-lg font-semibold text-amber-700 mb-8">{user.username}</p>
              <button
                onClick={handleSignOut}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2 text-center">
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </h2>
              <p className="text-slate-600 text-center mb-6 text-sm">
                {isSignUp ? 'Join GameDay Relics today' : 'Sign in to your account'}
              </p>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3" autoComplete="off">
                {/* Dummy inputs to trick browser autofill */}
                <input type="text" style={{ display: 'none' }} />
                <input type="password" style={{ display: 'none' }} />

                {isSignUp && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                      autoComplete="off"
                      name="new-name-field-random"
                    />
                  </div>
                )}

                {isSignUp && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      I want to sign up as:
                    </label>
                    <div className="space-y-1.5">
                      <label className="flex items-center p-2 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors" style={{ borderColor: role === 'buyer' ? '#b45309' : undefined, backgroundColor: role === 'buyer' ? '#fef3c7' : undefined }}>
                        <input
                          type="radio"
                          name="role"
                          value="buyer"
                          checked={role === 'buyer'}
                          onChange={(e) => setRole(e.target.value as UserRole)}
                          className="w-4 h-4 text-amber-600"
                        />
                        <span className="ml-2 font-medium text-slate-700 text-sm">Buyer</span>
                        <span className="ml-1 text-xs text-slate-500">Purchase items</span>
                      </label>

                      <label className="flex items-center p-2 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors" style={{ borderColor: role === 'seller' ? '#b45309' : undefined, backgroundColor: role === 'seller' ? '#fef3c7' : undefined }}>
                        <input
                          type="radio"
                          name="role"
                          value="seller"
                          checked={role === 'seller'}
                          onChange={(e) => setRole(e.target.value as UserRole)}
                          className="w-4 h-4 text-amber-600"
                        />
                        <span className="ml-2 font-medium text-slate-700 text-sm">Seller</span>
                        <span className="ml-1 text-xs text-slate-500">List & sell items</span>
                      </label>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                    autoComplete="email"
                    name="email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                    autoComplete="new-password"
                    name="password"
                    readOnly={true}
                    onFocus={(e) => {
                      e.target.readOnly = false;
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Sign In'}
                </button>
              </form>

              <div className="mt-4 text-center space-y-3">
                <button
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setRole('buyer');
                    setError('');
                  }}
                  className="text-amber-700 hover:text-amber-800 font-semibold block w-full"
                >
                  {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                </button>

                {!isSignUp && (
                  <button
                    onClick={() => {
                      onClose();
                      navigate('/admin-login');
                    }}
                    className="text-slate-600 hover:text-slate-800 font-medium text-sm flex items-center justify-center gap-2 w-full"
                  >
                    <Shield className="h-4 w-4" />
                    <span>Are you an admin? Login here</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
