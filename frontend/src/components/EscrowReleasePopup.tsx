import { Trophy, Zap, CheckCircle, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface EscrowReleasePopupProps {
  isVisible: boolean;
  sellerName: string;
  amount: number;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function EscrowReleasePopup({
  isVisible,
  sellerName,
  amount,
  onConfirm,
  onCancel,
  isLoading = false
}: EscrowReleasePopupProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [displayAmount, setDisplayAmount] = useState(0);

  useEffect(() => {
    if (isVisible) {
      setShowConfetti(true);
      // Animate amount counter
      let current = 0;
      const target = amount;
      const increment = target / 30;
      const interval = setInterval(() => {
        current += increment;
        if (current >= target) {
          setDisplayAmount(target);
          clearInterval(interval);
        } else {
          setDisplayAmount(Math.floor(current));
        }
      }, 20);
      return () => clearInterval(interval);
    }
  }, [isVisible, amount]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-auto">
      {/* Animated background blur */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-md transition-all duration-300"
        onClick={onCancel}
        style={{
          animation: 'fadeIn 0.3s ease-out'
        }}
      />

      {/* Confetti Animation */}
      {showConfetti && (
        <>
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute pointer-events-none"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-20px`,
                animation: `confetti-fall ${2 + Math.random()}s ease-out forwards`,
                animationDelay: `${Math.random() * 0.5}s`,
                opacity: 0.8
              }}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  i % 3 === 0
                    ? 'bg-yellow-400'
                    : i % 3 === 1
                    ? 'bg-green-400'
                    : 'bg-blue-400'
                }`}
                style={{
                  transform: `rotate(${Math.random() * 360}deg)`,
                }}
              />
            </div>
          ))}
        </>
      )}

      {/* Main Popup */}
      <div
        className="relative z-10 w-full max-w-md mx-4 bg-gradient-to-br from-green-50 via-white to-emerald-50 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto"
        style={{
          animation: 'slideInScale 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      >
        {/* Golden top accent */}
        <div className="h-1 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400" />

        {/* Close button */}
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="absolute top-4 right-4 p-2 hover:bg-red-100 rounded-full transition-colors disabled:opacity-50 z-20"
        >
          <X className="h-5 w-5 text-slate-600" />
        </button>

        <div className="p-8">
          {/* Trophy Icon with bounce animation */}
          <div className="flex justify-center mb-6">
            <div
              style={{
                animation: 'bounce-trophy 2s ease-in-out infinite'
              }}
              className="relative"
            >
              <Trophy className="h-16 w-16 text-yellow-500 drop-shadow-lg" />
              <Zap className="h-6 w-6 text-orange-500 absolute -bottom-2 -right-2 animate-pulse" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-black text-center text-slate-900 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
            🎯 Victory!
          </h2>
          <p className="text-center text-slate-600 text-sm mb-6">
            Escrow Payment Release Confirmed
          </p>

          {/* Seller Name Card */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl p-4 mb-6">
            <p className="text-xs font-semibold text-blue-700 mb-1">WINNER</p>
            <p className="text-lg font-bold text-blue-900 text-center">
              {sellerName}
            </p>
          </div>

          {/* Amount Display with counter animation */}
          <div className="text-center mb-6">
            <p className="text-sm font-semibold text-slate-600 mb-2">Released Amount</p>
            <div
              className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600"
              style={{
                animation: 'scaleUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both'
              }}
            >
              PKR {displayAmount.toLocaleString()}
            </div>
          </div>

          {/* Status Checkmark */}
          <div className="flex justify-center mb-6">
            <div
              style={{
                animation: 'checkmark-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s both'
              }}
            >
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
          </div>

          {/* Info Text */}
          <p className="text-center text-sm text-slate-700 mb-6 leading-relaxed">
            The escrow amount has been successfully released to <span className="font-semibold">{sellerName}</span>. They can now access their funds!
          </p>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Close
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Confirm
                </>
              )}
            </button>
          </div>

          {/* Success message */}
          <p className="text-center text-xs text-green-600 font-semibold mt-4">
            ✓ Transaction Recorded & Audit Logged
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideInScale {
          from {
            opacity: 0;
            transform: scale(0.8) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes bounce-trophy {
          0%, 100% {
            transform: translateY(0);
          }
          25% {
            transform: translateY(-15px);
          }
          50% {
            transform: translateY(0);
          }
          75% {
            transform: translateY(-8px);
          }
        }

        @keyframes scaleUp {
          from {
            opacity: 0;
            transform: scale(0.5);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes checkmark-pop {
          from {
            opacity: 0;
            transform: scale(0) rotate(-90deg);
          }
          to {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }

        @keyframes confetti-fall {
          to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
