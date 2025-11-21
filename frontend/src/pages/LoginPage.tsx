import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, AlertCircle } from 'lucide-react';
import api from '../lib/api';

type UserRole = 'buyer' | 'seller' | 'admin';

interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
}

interface LoginResponse {
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
  message: string;
  statusCode: number;
  success: boolean;
}

interface SignUpResponse {
  data: User;
  message: string;
  statusCode: number;
  success: boolean;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('buyer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Debug: Log when component mounts
  useEffect(() => {
    console.log('[LoginPage] Component mounted');
    return () => {
      console.log('[LoginPage] Component unmounted');
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[LoginPage] Form submitted');

    // Don't proceed if already loading
    if (loading) {
      console.log('[LoginPage] Already loading, ignoring submit');
      return;
    }

    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        console.log('[LoginPage] Sign up attempt');
        const response = await api.post<SignUpResponse>('/users/register', {
          email,
          password,
          username: name,
          role,
        });

        console.log('[LoginPage] Sign up response status:', response.status);
        console.log('[LoginPage] Sign up response data:', response.data);

        if (response.data.success) {
          console.log('[LoginPage] Sign up successful!');
          navigate('/shop');
          return;
        }
      } else {
        console.log('[LoginPage] Sign in attempt with email:', email);
        const response = await api.post<LoginResponse>('/users/login', {
          email,
          password,
        });

        console.log('[LoginPage] Login response status:', response.status);
        console.log('[LoginPage] Login response data:', response.data);

        if (response.data.success) {
          console.log('[LoginPage] Login successful!');
          navigate('/shop');
          return;
        }
      }
    } catch (err: any) {
      console.error('[LoginPage] Caught error:', err);

      // Use enhanced error message from API interceptor
      let errorMessage = err?.userMessage || 'An error occurred';

      // If no userMessage, try other sources
      if (!err?.userMessage) {
        if (err?.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err?.message) {
          errorMessage = err.message;
        }
      }

      console.error('[LoginPage] Setting error state to:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
      console.log('[LoginPage] Loading finished');
    }
  };

  const handleToggleMode = () => {
    console.log('[LoginPage] Toggling mode from:', isSignUp ? 'signup' : 'signin');
    setIsSignUp(!isSignUp);
    setRole('buyer');
    setError('');
    setEmail('');
    setPassword('');
    setName('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-slate-900 mb-2">
            GameDay Relics
          </h1>
          <p className="text-slate-600">Authentic Sports Collectibles</p>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2 text-center">
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </h2>
        <p className="text-slate-600 text-center mb-6 text-sm">
          {isSignUp ? 'Join GameDay Relics today' : 'Sign in to your account'}
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border-2 border-red-500 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 font-semibold">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
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
                disabled={loading}
              />
            </div>
          )}

          {isSignUp && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                I want to sign up as:
              </label>
              <div className="space-y-1.5">
                <label
                  className="flex items-center p-2 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                  style={{
                    borderColor: role === 'buyer' ? '#b45309' : undefined,
                    backgroundColor: role === 'buyer' ? '#fef3c7' : undefined,
                  }}
                >
                  <input
                    type="radio"
                    name="role"
                    value="buyer"
                    checked={role === 'buyer'}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-4 h-4 text-amber-600"
                    disabled={loading}
                  />
                  <span className="ml-2 font-medium text-slate-700 text-sm">
                    Buyer
                  </span>
                  <span className="ml-1 text-xs text-slate-500">
                    Purchase items
                  </span>
                </label>

                <label
                  className="flex items-center p-2 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                  style={{
                    borderColor: role === 'seller' ? '#b45309' : undefined,
                    backgroundColor: role === 'seller' ? '#fef3c7' : undefined,
                  }}
                >
                  <input
                    type="radio"
                    name="role"
                    value="seller"
                    checked={role === 'seller'}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-4 h-4 text-amber-600"
                    disabled={loading}
                  />
                  <span className="ml-2 font-medium text-slate-700 text-sm">
                    Seller
                  </span>
                  <span className="ml-1 text-xs text-slate-500">
                    List & sell items
                  </span>
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
              disabled={loading}
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
              disabled={loading}
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

        <div className="mt-6 text-center space-y-3">
          <button
            onClick={handleToggleMode}
            disabled={loading}
            className="text-amber-700 hover:text-amber-800 font-semibold block w-full disabled:opacity-50"
          >
            {isSignUp
              ? 'Already have an account? Sign in'
              : "Don't have an account? Sign up"}
          </button>

          {!isSignUp && (
            <button
              onClick={() => navigate('/admin-login')}
              disabled={loading}
              className="text-slate-600 hover:text-slate-800 font-medium text-sm flex items-center justify-center gap-2 w-full disabled:opacity-50"
            >
              <Shield className="h-4 w-4" />
              <span>Are you an admin? Login here</span>
            </button>
          )}
        </div>

        <p className="text-center text-slate-600 text-sm mt-6">
          Don't have an account yet?{' '}
          {!isSignUp && (
            <button
              onClick={handleToggleMode}
              className="text-amber-700 hover:text-amber-800 font-semibold"
              disabled={loading}
            >
              Create one
            </button>
          )}
        </p>
      </div>
    </div>
  );
}
