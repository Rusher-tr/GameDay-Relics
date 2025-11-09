import { X, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

interface DisputeFormProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  onSuccess: () => void;
}

export default function DisputeForm({ isOpen, onClose, orderId, onSuccess }: DisputeFormProps) {
  const [reason, setReason] = useState<'fake' | 'broken' | 'not_verified' | 'other'>('fake');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { user } = useAuth();

  if (!isOpen) return null;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (images.length === 0) {
      setError('At least one image is required as evidence');
      return;
    }

    if (!user) {
      setError('Please sign in to raise a dispute');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('orderId', orderId);
      formData.append('reason', reason);
      formData.append('description', description);
      images.forEach((image) => {
        formData.append('images', image);
      });

      const { data } = await api.post('/disputes', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSubmitted(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 3000);

      setSubmitted(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit dispute');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        <div className="relative min-h-screen flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden text-center p-8">
            <CheckCircle className="h-20 w-20 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-slate-900 mb-2">Dispute Submitted</h2>
            <p className="text-slate-600 mb-6">
              Our admin team will review your evidence and respond within 24-48 hours.
            </p>
            <button
              onClick={onClose}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-lg font-bold transition-colors"
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
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-lg transition-colors z-10"
          >
            <X className="h-6 w-6 text-slate-700" />
          </button>

          <div className="p-8">
            <h2 className="text-2xl font-black text-slate-900 mb-2">Raise a Dispute</h2>
            <p className="text-slate-600 mb-6">Report any issues with your order</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Reason for Dispute
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as any)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="fake">Item is Counterfeit/Fake</option>
                  <option value="broken">Item is Broken/Damaged</option>
                  <option value="not_verified">Item Not Verified as Authentic</option>
                  <option value="other">Other Issue</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the issue in detail..."
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Upload Evidence (Required - At least 1 image)
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-amber-400 transition-colors cursor-pointer"
                  onClick={() => document.getElementById('image-input')?.click()}
                >
                  <Upload className="h-10 w-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">Click to upload images</p>
                  <p className="text-xs text-slate-500">PNG, JPG up to 10MB each</p>
                </div>
                <input
                  id="image-input"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                {images.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {images.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200">
                        <span className="text-sm text-slate-700">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => setImages(images.filter((_, i) => i !== idx))}
                          className="text-red-600 hover:text-red-700 text-xs font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2 text-red-700">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || images.length === 0}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                {loading ? 'Submitting...' : 'Submit Dispute'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
