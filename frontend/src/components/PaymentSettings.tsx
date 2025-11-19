import { useState, useEffect } from 'react';
import { DollarSign, Save, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../lib/api';

interface PaymentSettingsProps {
  onUpdate?: () => void;
}

type PaymentGateway = 'nayapay' | 'easypaisa' | 'jazzcash' | 'stripe' | '';

interface PaymentDetails {
  accountNumber?: string;
  accountName?: string;
  stripeAccountId?: string;
}

export default function PaymentSettings({ onUpdate }: PaymentSettingsProps) {
  const [paymentGateway, setPaymentGateway] = useState<PaymentGateway>('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [stripeAccountId, setStripeAccountId] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchPaymentSettings();
  }, []);

  const fetchPaymentSettings = async () => {
    try {
      setFetchLoading(true);
      const response = await api.get('/users/payment-settings');
      const data = response.data.data;

      if (data.paymentGateway) {
        setPaymentGateway(data.paymentGateway);
      }

      if (data.paymentDetails) {
        setAccountNumber(data.paymentDetails.accountNumber || '');
        setAccountName(data.paymentDetails.accountName || '');
        setStripeAccountId(data.paymentDetails.stripeAccountId || '');
      }
    } catch (err: any) {
      console.error('Error fetching payment settings:', err);
      // Don't show error if settings don't exist yet
      if (err?.response?.status !== 404) {
        setError(err?.response?.data?.message || 'Failed to load payment settings');
      }
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!paymentGateway) {
      setError('Please select a payment gateway');
      return;
    }

    if (paymentGateway === 'stripe') {
      if (!stripeAccountId.trim()) {
        setError('Stripe Account ID is required');
        return;
      }
    } else {
      if (!accountNumber.trim() || !accountName.trim()) {
        setError('Account number and account name are required');
        return;
      }
    }

    setLoading(true);

    try {
      await api.patch('/users/payment-settings', {
        paymentGateway,
        accountNumber,
        accountName,
        stripeAccountId,
      });

      setSuccess('Payment settings updated successfully!');
      if (onUpdate) {
        onUpdate();
      }

      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error updating payment settings:', err);
      setError(err?.response?.data?.message || 'Failed to update payment settings');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading payment settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-amber-100 rounded-full p-3">
          <DollarSign className="h-6 w-6 text-amber-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Georgia, serif' }}>
            Payment Settings
          </h2>
          <p className="text-sm text-slate-600">
            Configure how you receive payments from escrow
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Payment Gateway Selection */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Payment Gateway <span className="text-red-500">*</span>
          </label>
          <select
            value={paymentGateway}
            onChange={(e) => setPaymentGateway(e.target.value as PaymentGateway)}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
            required
          >
            <option value="">Select Payment Gateway</option>
            <option value="nayapay">NayaPay</option>
            <option value="easypaisa">EasyPaisa</option>
            <option value="jazzcash">JazzCash</option>
            <option value="stripe">Stripe</option>
          </select>
          <p className="mt-1 text-xs text-slate-500">
            Choose how you want to receive payments when admin releases escrow
          </p>
        </div>

        {/* Conditional Fields based on Gateway */}
        {paymentGateway && paymentGateway !== 'stripe' && (
          <>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Account Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Enter your mobile wallet number"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                required
              />
              <p className="mt-1 text-xs text-slate-500">
                Your {paymentGateway.charAt(0).toUpperCase() + paymentGateway.slice(1)} account number
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Account Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Enter account holder name"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                required
              />
              <p className="mt-1 text-xs text-slate-500">
                Name as registered on your wallet account
              </p>
            </div>
          </>
        )}

        {paymentGateway === 'stripe' && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Stripe Account ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={stripeAccountId}
              onChange={(e) => setStripeAccountId(e.target.value)}
              placeholder="acct_xxxxxxxxxxxx"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              required
            />
            <p className="mt-1 text-xs text-slate-500">
              Your Stripe Connect account ID for receiving payments
            </p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !paymentGateway}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Save className="h-5 w-5" />
          <span>{loading ? 'Saving...' : 'Save Payment Settings'}</span>
        </button>
      </form>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> These payment details will be used by the admin to transfer funds when releasing escrow payments. Make sure your information is accurate to avoid payment delays.
        </p>
      </div>
    </div>
  );
}
