import { Shield, CheckCircle, Package } from 'lucide-react';

export default function Hero() {
  return (
    <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-amber-900 text-white overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.05) 35px, rgba(255,255,255,.05) 70px)`,
        }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h2 className="text-5xl md:text-7xl font-black mb-6 tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
            Authentic Vintage
            <span className="block text-amber-400 mt-2">Sports Memorabilia</span>
          </h2>
          <p className="text-xl md:text-2xl text-amber-100 mb-12 max-w-3xl mx-auto leading-relaxed">
            Own a piece of sports history. Verified jerseys, signed collectibles, and rare memorabilia from legendary moments.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-16">
            <button className="bg-amber-600 hover:bg-amber-500 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 shadow-xl">
              Shop Collection
            </button>
            <button className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-lg font-bold text-lg border-2 border-white/30 transition-all">
              Learn More
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="flex flex-col items-center space-y-3 p-6 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
              <Shield className="h-12 w-12 text-amber-400" />
              <h3 className="font-bold text-lg">Verified Authentic</h3>
              <p className="text-amber-200 text-sm">Third-party authentication on every item</p>
            </div>

            <div className="flex flex-col items-center space-y-3 p-6 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
              <CheckCircle className="h-12 w-12 text-amber-400" />
              <h3 className="font-bold text-lg">Buyer Protection</h3>
              <p className="text-amber-200 text-sm">Secure escrow payment system</p>
            </div>

            <div className="flex flex-col items-center space-y-3 p-6 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
              <Package className="h-12 w-12 text-amber-400" />
              <h3 className="font-bold text-lg">Global Shipping</h3>
              <p className="text-amber-200 text-sm">Safe delivery worldwide</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
