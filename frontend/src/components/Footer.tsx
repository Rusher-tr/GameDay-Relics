export default function Footer() {
  return (
    <footer style={{ backgroundColor: '#f2dec4' }} className="pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
          {/* Left Section - Logo and Description */}
          <div>
            <div className="flex items-center space-x-4 mb-6">
              <img
                src="/Gameday-green.png"
                alt="GameDay Relics"
                className="h-20 w-auto object-contain"
              />
            </div>
            <p className="font-inter leading-relaxed mb-6" style={{ color: '#1c452a' }}>
              Your trusted marketplace for authentic vintage sports jerseys and memorabilia. Every item verified (optional), every transaction secured.
            </p>
          </div>

          {/* Right Section - Navigation Links */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h4 className="font-georgia font-bold text-lg mb-4" style={{ color: '#1c452a' }}>Navigation</h4>
              <ul className="space-y-2 font-inter text-sm" style={{ color: '#1c452a' }}>
                <li className="hover:opacity-70 cursor-pointer transition-opacity">Home</li>
                <li className="hover:opacity-70 cursor-pointer transition-opacity">About</li>
                <li className="hover:opacity-70 cursor-pointer transition-opacity">Shop</li>
                <li className="hover:opacity-70 cursor-pointer transition-opacity">Services</li>
              </ul>
            </div>
            <div>
              <h4 className="font-georgia font-bold text-lg mb-4" style={{ color: '#1c452a' }}>Contact</h4>
              <ul className="space-y-2 font-inter text-sm" style={{ color: '#1c452a' }}>
                <li>Phone: +92 (317) 456-5090</li>
                <li>Phone: +92 (331) 287-3585</li>
                <li>Phone: +92 (370) 126-5737</li>
                <li>Email: syedahmerali12789@gmail.com</li>
                <li>Address: Karachi, Pakistan</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Section - Copyright and Links */}
        <div className="border-t" style={{ borderColor: '#1c452a', opacity: 0.3 }}>
          <div className="pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="font-inter text-sm" style={{ color: '#1c452a' }}>
              © 2025 GameDay Relics. All rights reserved.
            </p>
            <div className="flex space-x-6 font-inter text-sm" style={{ color: '#1c452a' }}>
              <span className="hover:opacity-70 cursor-pointer transition-opacity">Privacy Policy</span>
              <span className="hover:opacity-70 cursor-pointer transition-opacity">Terms of Service</span>
              <span className="hover:opacity-70 cursor-pointer transition-opacity">Contact</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
