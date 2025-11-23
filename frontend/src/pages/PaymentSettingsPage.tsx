import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CreditCard, CheckCircle, AlertCircle, Link2, Unlink2, Loader } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../lib/api';

interface AccountStatus {
  status: 'not_connected' | 'pending' | 'completed';
  accountId?: string;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  requirements?: string[];
  url?: string | null;
}

export default function PaymentSettingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'seller') {
      navigate('/');
      return;
    }
    
    // Check if returning from Stripe onboarding
    const params = new URLSearchParams(window.location.search);
    const isSuccess = params.get('success') === 'true';
    const isRefresh = params.get('refresh') === 'true';
    
    // Load status immediately
    checkAccountStatus();
    
    // If returning from Stripe, show success message and refresh
    if (isSuccess) {
      setTimeout(() => {
        toast.success('✅ Stripe onboarding completed! Refreshing status...');
        checkAccountStatus();
      }, 1000);
    }
    
    if (isRefresh) {
      toast.info('📝 Please complete your Stripe onboarding');
    }
  }, [user, navigate]);

  const checkAccountStatus = async () => {
    try {
      setLoading(true);
      const response = await api.get('/payment/connect/status');
      setAccountStatus(response.data.data);
    } catch (error) {
      console.error('[Payment Settings] Error checking status:', error);
      toast.error('Failed to load payment settings');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectStripe = async () => {
    try {
      setConnecting(true);
      const response = await api.post('/payment/connect/create-link');
      const { url } = response.data.data;

      if (url) {
        // Redirect to Stripe onboarding
        window.location.href = url;
      } else {
        toast.error('Failed to generate onboarding link');
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to connect Stripe account';
      console.error('[Payment Settings] Connect error:', error);
      toast.error(errorMessage);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Stripe account? You will need to reconnect to receive payouts.')) {
      return;
    }

    try {
      setDisconnecting(true);
      await api.post('/payment/connect/disconnect');
      toast.success('Stripe account disconnected successfully');
      await checkAccountStatus();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to disconnect account';
      console.error('[Payment Settings] Disconnect error:', error);
      toast.error(errorMessage);
    } finally {
      setDisconnecting(false);
    }
  };

  const handleRefreshStatus = async () => {
    await checkAccountStatus();
    toast.info('Status refreshed');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading payment settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-slate-900">Payment Settings</h1>
              <p className="text-slate-600 mt-1">Manage your Stripe account and payout settings</p>
            </div>
            <button
              onClick={() => navigate('/seller-products')}
              className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stripe Connect Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <CreditCard className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Stripe Connect</h2>
                <p className="text-slate-600 text-sm">Connect your Stripe account to receive automatic payouts</p>
              </div>
            </div>
          </div>

          {/* Connection Status */}
          <div className="mb-6">
            {accountStatus?.status === 'completed' ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-green-900">Connected</p>
                  <p className="text-green-700 text-sm mt-1">
                    Your Stripe account is connected and verified. You'll receive automatic payouts when orders are completed.
                  </p>
                  {accountStatus.accountId && (
                    <p className="text-green-700 text-xs mt-2 font-mono bg-green-100 px-2 py-1 rounded inline-block">
                      Account: {accountStatus.accountId.substring(0, 20)}...
                    </p>
                  )}
                </div>
              </div>
            ) : accountStatus?.status === 'pending' ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-amber-900">Onboarding in Progress</p>
                  <p className="text-amber-700 text-sm mt-1">
                    Your Stripe account is being set up. Please complete the onboarding process to start receiving payouts.
                  </p>
                  {accountStatus.requirements && accountStatus.requirements.length > 0 && (
                    <div className="mt-2">
                      <p className="text-amber-700 text-xs font-semibold">Requirements:</p>
                      <ul className="text-amber-700 text-xs mt-1 list-disc list-inside">
                        {accountStatus.requirements.map((req, idx) => (
                          <li key={idx}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-slate-900">Not Connected</p>
                  <p className="text-slate-600 text-sm mt-1">
                    Connect your Stripe account to enable automatic payouts. This is required to receive payments for your orders.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {accountStatus?.status === 'not_connected' || accountStatus?.status === 'pending' ? (
              <button
                onClick={handleConnectStripe}
                disabled={connecting}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2"
              >
                {connecting ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <Link2 className="h-5 w-5" />
                    <span>Connect Stripe Account</span>
                  </>
                )}
              </button>
            ) : null}

            <button
              onClick={handleRefreshStatus}
              disabled={loading}
              className="bg-slate-200 hover:bg-slate-300 text-slate-900 px-6 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2"
            >
              <span>Refresh Status</span>
            </button>

            {accountStatus?.status === 'completed' && (
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="bg-red-100 hover:bg-red-200 disabled:bg-red-50 text-red-700 px-6 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2"
              >
                {disconnecting ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    <span>Disconnecting...</span>
                  </>
                ) : (
                  <>
                    <Unlink2 className="h-5 w-5" />
                    <span>Disconnect</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Information Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-bold text-blue-900 mb-3">How It Works</h3>
          <ol className="space-y-2 text-blue-800 text-sm">
            <li className="flex items-start space-x-3">
              <span className="font-bold flex-shrink-0">1.</span>
              <span>Connect your Stripe account using the button above</span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="font-bold flex-shrink-0">2.</span>
              <span>Complete Stripe's verification process</span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="font-bold flex-shrink-0">3.</span>
              <span>When a buyer completes an order, payment goes to escrow</span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="font-bold flex-shrink-0">4.</span>
              <span>After delivery confirmation, funds are automatically transferred to your Stripe account</span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="font-bold flex-shrink-0">5.</span>
              <span>Withdraw funds to your bank account anytime from your Stripe dashboard</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
