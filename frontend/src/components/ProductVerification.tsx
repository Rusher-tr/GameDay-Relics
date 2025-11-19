import { X, CheckCircle, AlertCircle, FileText, Shield } from 'lucide-react';
import { useState } from 'react';
import api from '../lib/api';

interface ProductVerificationProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  onSuccess: () => void;
}

const VERIFICATION_SERVICES = [
  {
    id: 'PSA',
    name: 'PSA - Professional Sports Authenticator',
    description: 'Leading sports card and memorabilia authentication service',
    url: 'https://www.psacard.com/'
  },
  {
    id: 'DNA',
    name: 'DNA - Dynamic Autographs',
    description: 'Specializes in autograph authentication',
    url: 'https://www.psadna.com/'
  },
  {
    id: 'JSA',
    name: 'JSA - James Spence Authentication',
    description: 'Expert in autographed sports memorabilia',
    url: 'https://www.spenceloa.com/'
  },
  {
    id: 'BGS',
    name: 'BGS - Beckett Grading Services',
    description: 'Premier grading and authentication service',
    url: 'https://www.beckett.com/grading'
  },
  {
    id: 'SGC',
    name: 'SGC - Sportscard Guaranty',
    description: 'Trusted third-party grading company',
    url: 'https://www.gosgc.com/'
  },
  {
    id: 'other',
    name: 'Other Verification Service',
    description: 'Alternative authentication provider',
    url: ''
  }
];

export default function ProductVerification({ isOpen, onClose, productId, onSuccess }: ProductVerificationProps) {
  const [step, setStep] = useState<'select' | 'details' | 'complete'>('select');
  const [selectedService, setSelectedService] = useState<string>('');
  const [certificationId, setCertificationId] = useState('');
  const [certificationURL, setCertificationURL] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSelectService = (serviceId: string) => {
    setSelectedService(serviceId);
    const service = VERIFICATION_SERVICES.find(s => s.id === serviceId);
    if (service?.url) {
      setCertificationURL(service.url);
    }
    setStep('details');
  };

  const handleSubmitVerification = async () => {
    if (!certificationId.trim()) {
      setError('Please enter a certification ID');
      return;
    }

    if (!certificationURL.trim()) {
      setError('Please enter a certification URL');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Backend endpoint: POST /products/verify/:id
      // Body: { verified, verificationby, certificationId, certificationURL }
      await api.post(`/products/verify/${productId}`, {
        verified: 'true', // String as per backend validation
        verificationby: selectedService,
        certificationId: certificationId.trim(),
        certificationURL: certificationURL.trim()
      });

      setStep('complete');
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 3000);
    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err?.response?.data?.message || 'Failed to submit verification. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('select');
    setSelectedService('');
    setCertificationId('');
    setCertificationURL('');
    setError('');
    onClose();
  };

  if (step === 'complete') {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />
        <div className="relative min-h-screen flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden text-center p-8">
            <div className="bg-green-100 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-3" style={{ fontFamily: 'Georgia, serif' }}>
              Verification Submitted!
            </h2>
            <p className="text-lg text-slate-600 mb-2">
              Your product verification request has been submitted successfully.
            </p>
            <p className="text-sm text-slate-500 mb-6">
              Verified by: <span className="font-semibold text-slate-700">{selectedService}</span>
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>What's next?</strong> Your product will be marked as verified and buyers will see the authentication certificate.
              </p>
            </div>
            <button
              onClick={handleClose}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-lg transition-colors z-10"
          >
            <X className="h-6 w-6 text-slate-700" />
          </button>

          <div className="p-8">
            {step === 'select' && (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-amber-100 rounded-full p-3">
                    <Shield className="h-8 w-8 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-slate-900" style={{ fontFamily: 'Georgia, serif' }}>
                      Verify Your Product
                    </h2>
                    <p className="text-slate-600">
                      Increase buyer trust with third-party authentication
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-slate-700">
                    <strong>Why verify?</strong> Verified products sell faster and at higher prices. Choose a trusted authentication service to verify your item's authenticity.
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  {VERIFICATION_SERVICES.map((service) => (
                    <button
                      key={service.id}
                      onClick={() => handleSelectService(service.id)}
                      className="w-full p-4 border-2 border-slate-200 hover:border-amber-400 hover:bg-amber-50 rounded-lg text-left transition-all group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-bold text-slate-900 group-hover:text-amber-700">{service.name}</p>
                          <p className="text-sm text-slate-600 mt-1">{service.description}</p>
                        </div>
                        <Shield className="h-5 w-5 text-slate-400 group-hover:text-amber-600 flex-shrink-0 ml-3" />
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 'details' && (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-blue-100 rounded-full p-3">
                    <FileText className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-slate-900" style={{ fontFamily: 'Georgia, serif' }}>
                      Enter Certificate Details
                    </h2>
                    <p className="text-slate-600">
                      Provide authentication certificate from {selectedService}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-semibold">How to get a certificate:</p>
                      <ol className="mt-2 space-y-1 list-decimal list-inside">
                        <li>Send your item to {selectedService} for authentication</li>
                        <li>Receive the certificate ID and certificate URL</li>
                        <li>Enter the details below to verify your product listing</li>
                      </ol>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Certification ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={certificationId}
                      onChange={(e) => setCertificationId(e.target.value)}
                      placeholder={`e.g., ${selectedService}-123456789`}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      The unique certificate number provided by the authentication service
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Certification URL <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="url"
                      value={certificationURL}
                      onChange={(e) => setCertificationURL(e.target.value)}
                      placeholder="https://example.com/verify/123456789"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Link to verify the certificate on the authentication service's website
                    </p>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2 text-red-700">
                      <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{error}</span>
                    </div>
                  )}

                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => {
                        setStep('select');
                        setError('');
                      }}
                      className="flex-1 px-4 py-3 border-2 border-slate-300 text-slate-900 rounded-lg font-bold hover:bg-slate-50 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleSubmitVerification}
                      disabled={loading}
                      className="flex-1 px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Submitting...' : 'Submit Verification'}
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
