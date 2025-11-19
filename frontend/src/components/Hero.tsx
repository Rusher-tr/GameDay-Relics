export default function Hero() {

  return (
    <div className="relative overflow-hidden">
      {/* Hero Background Image - extends behind navbar */}
      <div 
        className="relative w-full h-[400px] md:h-[500px] flex flex-col items-center justify-center -mt-[80px] pt-[80px]"
        style={{
          backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.5)), url("/hero-img.jpg")',
          backgroundAttachment: 'fixed',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Logo Overlay */}
        <img
          src="/Gameday.png"
          alt="GameDay Relics"
          className="h-32 w-auto object-contain"
          style={{ filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.8)) drop-shadow(0 0 20px rgba(242, 222, 196, 0.3))' }}
        />
      </div>
    </div>
  );
}

