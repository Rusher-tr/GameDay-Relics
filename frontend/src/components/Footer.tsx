import { Trophy, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-slate-900 via-slate-800 to-amber-900 text-amber-50 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <Trophy className="h-10 w-10 text-amber-400" strokeWidth={2.5} />
              <div>
                <h3 className="text-2xl font-black text-amber-50" style={{ fontFamily: 'Georgia, serif' }}>
                  GameDay Relics
                </h3>
                <p className="text-xs text-amber-300 tracking-widest uppercase">Vintage Sports Memorabilia</p>
              </div>
            </div>
            <p className="text-amber-200 leading-relaxed mb-6">
              Your trusted marketplace for authentic vintage sports jerseys and memorabilia.
              Every item verified, every transaction secured.
            </p>
            <div className="flex space-x-4">
              <div className="w-10 h-10 bg-amber-700 hover:bg-amber-600 rounded-full flex items-center justify-center cursor-pointer transition-colors">
                <Mail className="h-5 w-5" />
              </div>
              <div className="w-10 h-10 bg-amber-700 hover:bg-amber-600 rounded-full flex items-center justify-center cursor-pointer transition-colors">
                <Phone className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-4 text-amber-300">Shop</h4>
            <ul className="space-y-2 text-amber-200">
              <li className="hover:text-amber-400 cursor-pointer transition-colors">Jerseys</li>
              <li className="hover:text-amber-400 cursor-pointer transition-colors">Signed Items</li>
              <li className="hover:text-amber-400 cursor-pointer transition-colors">Memorabilia</li>
              <li className="hover:text-amber-400 cursor-pointer transition-colors">New Arrivals</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-4 text-amber-300">Support</h4>
            <ul className="space-y-2 text-amber-200">
              <li className="hover:text-amber-400 cursor-pointer transition-colors">Help Center</li>
              <li className="hover:text-amber-400 cursor-pointer transition-colors">Authentication</li>
              <li className="hover:text-amber-400 cursor-pointer transition-colors">Shipping Info</li>
              <li className="hover:text-amber-400 cursor-pointer transition-colors">Returns</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-amber-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-amber-300 text-sm">
              © 2025 GameDay Relics. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm text-amber-300">
              <span className="hover:text-amber-400 cursor-pointer transition-colors">Privacy Policy</span>
              <span className="hover:text-amber-400 cursor-pointer transition-colors">Terms of Service</span>
              <span className="hover:text-amber-400 cursor-pointer transition-colors">Contact</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
