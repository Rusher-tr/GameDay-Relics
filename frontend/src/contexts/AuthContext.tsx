import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../lib/api';

interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, role: 'buyer' | 'seller' | 'admin') => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const checkAuth = async () => {
      try {
        const response = await api.get('/users/current-user');
        console.log("hwwww",response)
        // Backend returns: { statusCode, data: user, message, success }
        setUser(response.data.data);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    const response = await api.post('/users/login', { email, password });
    setUser(response.data.data.user);
    // Backend returns: { statusCode, data: { user, accessToken, refreshToken }, message, success }
  };

  const signUp = async (email: string, password: string, name: string, role: 'buyer' | 'seller' | 'admin' = 'buyer') => {
    const response = await api.post('/users/register', { email, password, username: name, role });
    // Backend returns: { statusCode, data: createdUser, message, success }
    setUser(response.data.data);
  };

  const signOut = async () => {
    try {
      await api.post('/users/logout');
    } catch (error) {
      // Ignore logout errors - clear local state anyway
      console.log('Logout API call failed, clearing local state');
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
