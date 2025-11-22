import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const sportsAnimations = [
    'football-spin',
    'baseball-swing',
    'basketball-bounce',
    'cricket-bowl',
    'tennis-serve'
];

export default function LoadingTransition() {
    const location = useLocation();
    const [isLoading, setIsLoading] = useState(false);
    const [animation, setAnimation] = useState(sportsAnimations[0]);

    useEffect(() => {
        setIsLoading(true);

        const randomIndex = Math.floor(Math.random() * sportsAnimations.length);
        setAnimation(sportsAnimations[randomIndex]);

        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 800);

        return () => clearTimeout(timer);
    }, [location.pathname]);

    if (!isLoading) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none"
            style={{ animation: 'fadeInOut 0.8s ease-in-out' }}>

            <div className="absolute inset-0 bg-gradient-to-br from-slate-900/40 to-amber-900/40 backdrop-blur-md" />

            <div className="relative z-10 flex flex-col items-center">

                <div className="mb-6">
                    {animation === 'football-spin' && <FootballSpin />}
                    {animation === 'baseball-swing' && <BaseballSwing />}
                    {animation === 'basketball-bounce' && <BasketballBounce />}
                    {animation === 'cricket-bowl' && <CricketBowl />}
                    {animation === 'tennis-serve' && <TennisServe />}
                </div>

                <div className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black rounded-full shadow-2xl text-sm tracking-wider"
                    style={{ animation: 'pulse 0.8s ease-in-out infinite' }}>
                    LOADING...
                </div>
            </div>

            <style>{`
        @keyframes fadeInOut {
          0%, 100% { opacity: 0; }
          15%, 85% { opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.9; }
        }
      `}</style>
        </div>
    );
}

// IMPROVED Football Spinning Animation
function FootballSpin() {
    return (
        <div style={{ animation: 'spin 0.8s linear infinite' }}>
            <svg width="120" height="120" viewBox="0 0 120 120">
                <defs>
                    <radialGradient id="footballGrad">
                        <stop offset="0%" stopColor="#a0522d" />
                        <stop offset="70%" stopColor="#8b4513" />
                        <stop offset="100%" stopColor="#654321" />
                    </radialGradient>
                </defs>
                {/* Football body */}
                <ellipse cx="60" cy="60" rx="35" ry="52" fill="url(#footballGrad)" stroke="#3e2723" strokeWidth="2.5" />
                {/* Laces */}
                <line x1="45" y1="35" x2="75" y2="35" stroke="#f5f5f5" strokeWidth="3" strokeLinecap="round" />
                <line x1="50" y1="42" x2="53" y2="42" stroke="#f5f5f5" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="67" y1="42" x2="70" y2="42" stroke="#f5f5f5" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="50" y1="50" x2="53" y2="50" stroke="#f5f5f5" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="67" y1="50" x2="70" y2="50" stroke="#f5f5f5" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="50" y1="58" x2="53" y2="58" stroke="#f5f5f5" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="67" y1="58" x2="70" y2="58" stroke="#f5f5f5" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="50" y1="66" x2="53" y2="66" stroke="#f5f5f5" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="67" y1="66" x2="70" y2="66" stroke="#f5f5f5" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="50" y1="74" x2="53" y2="74" stroke="#f5f5f5" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="67" y1="74" x2="70" y2="74" stroke="#f5f5f5" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="45" y1="85" x2="75" y2="85" stroke="#f5f5f5" strokeWidth="3" strokeLinecap="round" />
                {/* Center line */}
                <line x1="60" y1="20" x2="60" y2="100" stroke="#f5f5f5" strokeWidth="1" opacity="0.5" />
            </svg>
        </div>
    );
}

// IMPROVED Baseball Bat Swinging
function BaseballSwing() {
    return (
        <div className="relative w-32 h-32">
            {/* Ball */}
            <div className="absolute" style={{
                animation: 'ballFly 0.8s ease-out infinite',
                top: '50%',
                left: '0'
            }}>
                <svg width="25" height="25" viewBox="0 0 25 25">
                    <defs>
                        <radialGradient id="ballGrad">
                            <stop offset="0%" stopColor="#ffffff" />
                            <stop offset="100%" stopColor="#e0e0e0" />
                        </radialGradient>
                    </defs>
                    <circle cx="12.5" cy="12.5" r="11" fill="url(#ballGrad)" stroke="#999" strokeWidth="0.5" />
                    <path d="M 6 10 Q 12.5 8 19 10" stroke="#c62828" fill="none" strokeWidth="1.5" />
                    <path d="M 6 15 Q 12.5 17 19 15" stroke="#c62828" fill="none" strokeWidth="1.5" />
                </svg>
            </div>
            {/* Bat */}
            <div className="absolute" style={{
                animation: 'batSwing 0.8s ease-in-out infinite',
                transformOrigin: 'bottom right',
                top: '25%',
                right: '25%'
            }}>
                <svg width="70" height="18" viewBox="0 0 70 18">
                    <defs>
                        <linearGradient id="batGrad">
                            <stop offset="0%" stopColor="#8b4513" />
                            <stop offset="100%" stopColor="#654321" />
                        </linearGradient>
                    </defs>
                    <rect x="0" y="6" width="55" height="6" fill="url(#batGrad)" rx="3" />
                    <rect x="55" y="4" width="12" height="10" fill="#3e2723" rx="2" />
                    <line x1="5" y1="8" x2="5" y2="10" stroke="#654321" strokeWidth="0.5" />
                    <line x1="15" y1="8" x2="15" y2="10" stroke="#654321" strokeWidth="0.5" />
                    <line x1="25" y1="8" x2="25" y2="10" stroke="#654321" strokeWidth="0.5" />
                </svg>
            </div>
        </div>
    );
}

// IMPROVED Basketball Bouncing
function BasketballBounce() {
    return (
        <div className="relative w-28 h-28">
            <div style={{ animation: 'bounce 0.6s ease-in-out infinite' }}>
                <svg width="90" height="90" viewBox="0 0 90 90">
                    <defs>
                        <radialGradient id="basketballGrad">
                            <stop offset="0%" stopColor="#ff8c00" />
                            <stop offset="70%" stopColor="#ff6600" />
                            <stop offset="100%" stopColor="#cc5200" />
                        </radialGradient>
                    </defs>
                    <circle cx="45" cy="45" r="40" fill="url(#basketballGrad)" stroke="#1a1a1a" strokeWidth="2.5" />
                    {/* Curved lines */}
                    <path d="M 10 45 Q 45 25 80 45" stroke="#1a1a1a" strokeWidth="2.5" fill="none" />
                    <path d="M 10 45 Q 45 65 80 45" stroke="#1a1a1a" strokeWidth="2.5" fill="none" />
                    <path d="M 45 5 L 45 85" stroke="#1a1a1a" strokeWidth="2.5" />
                    <circle cx="45" cy="45" r="40" fill="none" stroke="#1a1a1a" strokeWidth="2.5" />
                </svg>
            </div>
        </div>
    );
}

// IMPROVED Cricket Bowling
function CricketBowl() {
    return (
        <div className="relative w-32 h-32">
            {/* Ball */}
            <div style={{ animation: 'cricketBall 0.8s linear infinite' }}>
                <svg width="28" height="28" viewBox="0 0 28 28">
                    <defs>
                        <radialGradient id="cricketGrad">
                            <stop offset="0%" stopColor="#ff1744" />
                            <stop offset="100%" stopColor="#c62828" />
                        </radialGradient>
                    </defs>
                    <circle cx="14" cy="14" r="12" fill="url(#cricketGrad)" stroke="#8b0000" strokeWidth="1" />
                    <path d="M 6 14 Q 14 10 22 14" stroke="#fff" strokeWidth="2" fill="none" />
                    <path d="M 6 14 Q 14 18 22 14" stroke="#fff" strokeWidth="2" fill="none" />
                </svg>
            </div>
            {/* Stumps with bails */}
            <div className="absolute bottom-0 right-2" style={{ animation: 'stumpsShake 0.8s ease-in-out infinite' }}>
                <svg width="50" height="60" viewBox="0 0 50 60">
                    {/* Ground */}
                    <rect x="0" y="50" width="50" height="3" fill="#4a7c3b" />
                    {/* Stumps */}
                    <rect x="6" y="15" width="5" height="35" fill="#d4a373" stroke="#8b6f47" strokeWidth="1" />
                    <rect x="22.5" y="15" width="5" height="35" fill="#d4a373" stroke="#8b6f47" strokeWidth="1" />
                    <rect x="39" y="15" width="5" height="35" fill="#d4a373" stroke="#8b6f47" strokeWidth="1" />
                    {/* Bails */}
                    <rect x="5" y="13" width="7" height="2.5" fill="#654321" rx="1" />
                    <rect x="21.5" y="13" width="7" height="2.5" fill="#654321" rx="1" />
                    <rect x="38" y="13" width="7" height="2.5" fill="#654321" rx="1" />
                </svg>
            </div>
        </div>
    );
}

// IMPROVED Tennis Serve
function TennisServe() {
    return (
        <div className="relative w-32 h-32">
            {/* Ball */}
            <div style={{ animation: 'tennisBall 0.8s ease-in-out infinite' }}>
                <svg width="22" height="22" viewBox="0 0 22 22">
                    <defs>
                        <radialGradient id="tennisGrad">
                            <stop offset="0%" stopColor="#c5e63f" />
                            <stop offset="100%" stopColor="#9bc31a" />
                        </radialGradient>
                    </defs>
                    <circle cx="11" cy="11" r="10" fill="url(#tennisGrad)" stroke="#7a9b17" strokeWidth="1" />
                    <path d="M 4 9 Q 11 13 18 9" stroke="#fff" fill="none" strokeWidth="1.5" />
                    <path d="M 4 13 Q 11 9 18 13" stroke="#fff" fill="none" strokeWidth="1.5" />
                </svg>
            </div>
            {/* Racket */}
            <div className="absolute bottom-1 right-2" style={{
                animation: 'racketSwing 0.8s ease-in-out infinite',
                transformOrigin: 'bottom center'
            }}>
                <svg width="50" height="70" viewBox="0 0 50 70">
                    <defs>
                        <linearGradient id="racketGrad">
                            <stop offset="0%" stopColor="#1565c0" />
                            <stop offset="100%" stopColor="#0d47a1" />
                        </linearGradient>
                    </defs>
                    {/* Racket head */}
                    <ellipse cx="25" cy="23" rx="18" ry="21" fill="none" stroke="url(#racketGrad)" strokeWidth="4" />
                    {/* Strings */}
                    <line x1="13" y1="23" x2="37" y2="23" stroke="#fff" strokeWidth="0.8" />
                    <line x1="25" y1="8" x2="25" y2="38" stroke="#fff" strokeWidth="0.8" />
                    <line x1="17" y1="15" x2="33" y2="31" stroke="#fff" strokeWidth="0.6" />
                    <line x1="17" y1="31" x2="33" y2="15" stroke="#fff" strokeWidth="0.6" />
                    {/* Handle */}
                    <rect x="22" y="42" width="6" height="28" fill="#8b4513" rx="2" />
                    <rect x="22" y="65" width="6" height="5" fill="#654321" rx="1" />
                </svg>
            </div>
        </div>
    );
}
