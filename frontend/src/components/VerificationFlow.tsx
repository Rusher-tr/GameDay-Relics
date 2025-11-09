import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

interface VerificationFlowProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  onSuccess: () => void;
}

const VERIFICATION_SERVICES = [
  {
    id: 'PSA',
    name: 'PSA - Professional Sports Authenticator',
    description: 'Leading sports card and memorabilia authentication service'
  },
  {
    id: 'DNA',
    name: 'DNA - Dynamic Autographs',
    description: 'Specializes in autograph authentication'
  },
  {
    id: 'JSA',
    name: 'JSA - James Spence Authentication',
    description: 'Expert in autographed sports memorabilia'
  },
  {
    id: 'other',
    name: 'Other Verification Service',
    description: 'Alternative authentication provider'
  }
];

export default function VerificationFlow({ isOpen, onClose, orderId, onSuccess }: VerificationFlowProps) {
  const [step, setStep] = useState<'select' | 'certificate' | 'complete'>('select');
  const [selectedService, setSelectedService] = useState<string>('');
  const [certificateId, setCertificateId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  if (!isOpen) return null;

  const handleSelectService = (serviceId: string) => {
    setSelectedService(serviceId);
    setStep('certificate');
  };

  const handleSubmitVerification = async () => {
    if (!certificateId.trim()) {
      setError('Please enter a certificate ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post(`/orders/${orderId}/verify`, {
        serviceProvider: selectedService,
        certificateId: certificateId
      });

      setStep('complete');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit verification');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'complete') {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        <div className="relative min-h-screen flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden text-center p-8">
            <CheckCircle className="h-20 w-20 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-slate-900 mb-2">Order Verified!</h2>
            <p className="text-slate-600 mb-2">
              Item verified as authentic by {selectedService}
            </p>
            <p className="text-sm text-slate-500 mb-6">
              Payment has been released to the seller.
            </p>
            <button
              onClick={onClose}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold transition-colors"
            >
              Back to Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-lg transition-colors z-10"
          >
            <X className="h-6 w-6 text-slate-700" />
          </button>

          <div className="p-8">
            {step === 'select' && (
              <>
                <h2 className="text-2xl font-black text-slate-900 mb-2">Verify Order Authenticity</h2>
                <p className="text-slate-600 mb-6">
                  Select a trusted third-party verification service to authenticate this item
                </p>

                <div className="space-y-3 mb-6">
                  {VERIFICATION_SERVICES.map((service) => (
                    <button
                      key={service.id}
                      onClick={() => handleSelectService(service.id)}
                      className="w-full p-4 border-2 border-slate-200 hover:border-amber-400 hover:bg-amber-50 rounded-lg text-left transition-all group"
                    >
                      <p className="font-bold text-slate-900 group-hover:text-amber-700">{service.name}</p>
                      <p className="text-sm text-slate-600 mt-1">{service.description}</p>
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 'certificate' && (
              <>
                <h2 className="text-2xl font-black text-slate-900 mb-2">Enter Certificate Details</h2>
                <p className="text-slate-600 mb-6">
                  Provide the authentication certificate ID from {selectedService}
                </p>

                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-semibold">How to get a certificate:</p>
                      <p className="mt-1">
                        Contact the verification service directly or upload photos of your item for authentication.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Certificate ID
                    </label>
                    <input
                      type="text"
                      value={certificateId}
                      onChange={(e) => setCertificateId(e.target.value)}
                      placeholder="e.g., PSA-123456789"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2 text-red-700">
                      <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{error}</span>
                    </div>
                  )}

                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => setStep('select')}
                      className="flex-1 px-4 py-3 border-2 border-slate-300 text-slate-900 rounded-lg font-bold hover:bg-slate-50 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleSubmitVerification}
                      disabled={loading}
                      className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Verifying...' : 'Confirm Verification'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
