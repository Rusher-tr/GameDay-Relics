import { CheckCircle, Users, Zap, Award } from 'lucide-react';

export default function TrustSection() {
  const stats = [
    {
      icon: Award,
      value: '5,000+',
      label: 'Verified Items',
      color: 'bg-amber-100 text-amber-600'
    },
    {
      icon: Users,
      value: '12,000+',
      label: 'Active Collectors',
      color: 'bg-emerald-100 text-emerald-600'
    },
    {
      icon: CheckCircle,
      value: '100%',
      label: 'Authentic Guaranteed',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      icon: Zap,
      value: '24/7',
      label: 'Customer Support',
      color: 'bg-purple-100 text-purple-600'
    }
  ];

  return (
    <section className="py-16 relative overflow-hidden" style={{
      backgroundImage: 'repeating-linear-gradient(90deg, #1c452a 0px, #1c452a 40px, #2a5a38 40px, #2a5a38 80px, #1c452a 80px, #1c452a 120px, #225033 120px, #225033 160px)',
      backgroundColor: '#1c452a'
    }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black mb-3 font-georgia" style={{ color: '#fff' }}>
            Why Collectors Trust GameDay Relics
          </h2>
          <p className="text-lg font-inter" style={{ color: '#fff', opacity: 0.9 }}>The most secure marketplace for authentic sports memorabilia</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border-2" style={{ backgroundColor: '#f2dec4', borderColor: '#f2dec4' }}>
                  <Icon className="h-8 w-8" style={{ color: '#1c452a' }} />
                </div>
                <h3 className="text-3xl font-black mb-2" style={{ color: '#f2dec4' }}>{stat.value}</h3>
                <p className="font-semibold text-base" style={{ color: '#f2dec4' }}>{stat.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
