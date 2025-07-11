import React, { useState, useRef } from 'react';
import QRCode from 'react-qr-code';
import html2canvas from 'html2canvas';
import { Download, Maximize2, X, Building2, Utensils, GraduationCap, Heart, ShoppingBag, Plane, Home, Star, Wifi, Smartphone, QrCode, MapPin, Phone, Globe, Mail } from 'lucide-react';

interface QRCodeCardProps {
  card: {
    id: string;
    businessName: string;
    category: string;
    type: string;
    description?: string;
    location?: string;
    logoUrl: string;
    slug: string;
  };
}

const categoryThemes = {
  'Professional Businesses': {
    gradient: 'from-blue-600 via-purple-600 to-indigo-700',
    accent: 'blue-500',
    icon: Building2,
    emoji: '💼',
    pattern: 'circuit',
    bgColor: 'bg-slate-900',
    textColor: 'text-blue-100',
    cardBg: 'bg-gradient-to-br from-blue-50 to-indigo-100',
    cardText: 'text-blue-900'
  },
  'Food & Beverage': {
    gradient: 'from-orange-500 via-red-500 to-pink-600',
    accent: 'orange-500',
    icon: Utensils,
    emoji: '🍽️',
    pattern: 'food',
    bgColor: 'bg-orange-900',
    textColor: 'text-orange-100',
    cardBg: 'bg-gradient-to-br from-orange-50 to-red-100',
    cardText: 'text-orange-900'
  },
  'Education': {
    gradient: 'from-blue-800 via-indigo-700 to-purple-800',
    accent: 'blue-700',
    icon: GraduationCap,
    emoji: '🎓',
    pattern: 'academic',
    bgColor: 'bg-blue-900',
    textColor: 'text-blue-100',
    cardBg: 'bg-gradient-to-br from-blue-50 to-purple-100',
    cardText: 'text-blue-900'
  },
  'Health & Medical': {
    gradient: 'from-green-500 via-emerald-500 to-teal-600',
    accent: 'green-500',
    icon: Heart,
    emoji: '⚕️',
    pattern: 'medical',
    bgColor: 'bg-green-900',
    textColor: 'text-green-100',
    cardBg: 'bg-gradient-to-br from-green-50 to-teal-100',
    cardText: 'text-green-900'
  },
  'Retail & Shopping': {
    gradient: 'from-pink-500 via-purple-500 to-indigo-600',
    accent: 'pink-500',
    icon: ShoppingBag,
    emoji: '🛍️',
    pattern: 'shopping',
    bgColor: 'bg-pink-900',
    textColor: 'text-pink-100',
    cardBg: 'bg-gradient-to-br from-pink-50 to-purple-100',
    cardText: 'text-pink-900'
  },
  'Hotels & Travel': {
    gradient: 'from-sky-400 via-blue-500 to-cyan-600',
    accent: 'sky-500',
    icon: Plane,
    emoji: '✈️',
    pattern: 'travel',
    bgColor: 'bg-sky-900',
    textColor: 'text-sky-100',
    cardBg: 'bg-gradient-to-br from-sky-50 to-cyan-100',
    cardText: 'text-sky-900'
  },
  'Services': {
    gradient: 'from-gray-600 via-slate-600 to-zinc-700',
    accent: 'gray-500',
    icon: Home,
    emoji: '🔧',
    pattern: 'service',
    bgColor: 'bg-gray-900',
    textColor: 'text-gray-100',
    cardBg: 'bg-gradient-to-br from-gray-50 to-slate-100',
    cardText: 'text-gray-900'
  },
  'Entertainment & Recreation': {
    gradient: 'from-purple-500 via-pink-500 to-red-500',
    accent: 'purple-500',
    icon: Star,
    emoji: '🎭',
    pattern: 'entertainment',
    bgColor: 'bg-purple-900',
    textColor: 'text-purple-100',
    cardBg: 'bg-gradient-to-br from-purple-50 to-pink-100',
    cardText: 'text-purple-900'
  }
};

export const QRCodeCard: React.FC<QRCodeCardProps> = ({ card }) => {
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const downloadCardRef = useRef<HTMLDivElement>(null);
  const qrUrl = `${window.location.origin}/${card.slug}`;
  
  const theme = categoryThemes[card.category as keyof typeof categoryThemes] || categoryThemes['Services'];
  const IconComponent = theme.icon;

  const downloadFullCard = async () => {
    if (!downloadCardRef.current) return;
    
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(downloadCardRef.current, {
        backgroundColor: '#ffffff',
        scale: 3,
        useCORS: true,
        allowTaint: true,
        width: 500,
        height: 800,
        logging: false
      });
      
      const link = document.createElement('a');
      link.download = `${card.businessName.replace(/[^a-zA-Z0-9]/g, '-')}-review-qr-card.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    } catch (error) {
      console.error('Error downloading card:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const PatternBackground = () => {
    switch (theme.pattern) {
      case 'circuit':
        return (
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <defs>
                <pattern id={`circuit-${card.id}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="10" cy="10" r="1" fill="currentColor"/>
                  <path d="M10,5 L10,15 M5,10 L15,10" stroke="currentColor" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100" height="100" fill={`url(#circuit-${card.id})`}/>
            </svg>
          </div>
        );
      case 'food':
        return (
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-2 left-2 text-2xl">🍽️</div>
            <div className="absolute top-4 right-4 text-xl">🍕</div>
            <div className="absolute bottom-4 left-4 text-xl">☕</div>
            <div className="absolute bottom-2 right-2 text-2xl">🥘</div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-lg">🍰</div>
          </div>
        );
      case 'academic':
        return (
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-2 left-2 text-2xl">📚</div>
            <div className="absolute top-4 right-4 text-xl">🎓</div>
            <div className="absolute bottom-4 left-4 text-xl">✏️</div>
            <div className="absolute bottom-2 right-2 text-2xl">🏫</div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-lg">📖</div>
          </div>
        );
      case 'medical':
        return (
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-2 left-2 text-2xl">⚕️</div>
            <div className="absolute top-4 right-4 text-xl">🏥</div>
            <div className="absolute bottom-4 left-4 text-xl">💊</div>
            <div className="absolute bottom-2 right-2 text-2xl">🩺</div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-lg">❤️</div>
          </div>
        );
      case 'shopping':
        return (
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-2 left-2 text-2xl">🛍️</div>
            <div className="absolute top-4 right-4 text-xl">🏪</div>
            <div className="absolute bottom-4 left-4 text-xl">💳</div>
            <div className="absolute bottom-2 right-2 text-2xl">🛒</div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-lg">🎁</div>
          </div>
        );
      case 'travel':
        return (
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-2 left-2 text-2xl">✈️</div>
            <div className="absolute top-4 right-4 text-xl">🏨</div>
            <div className="absolute bottom-4 left-4 text-xl">🧳</div>
            <div className="absolute bottom-2 right-2 text-2xl">🗺️</div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-lg">🌍</div>
          </div>
        );
      case 'entertainment':
        return (
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-2 left-2 text-2xl">🎭</div>
            <div className="absolute top-4 right-4 text-xl">🎪</div>
            <div className="absolute bottom-4 left-4 text-xl">🎮</div>
            <div className="absolute bottom-2 right-2 text-2xl">🎬</div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-lg">🎨</div>
          </div>
        );
      default:
        return (
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-2 left-2 text-2xl">🔧</div>
            <div className="absolute top-4 right-4 text-xl">⚙️</div>
            <div className="absolute bottom-4 left-4 text-xl">🛠️</div>
            <div className="absolute bottom-2 right-2 text-2xl">🏢</div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-lg">💼</div>
          </div>
        );
    }
  };

  return (
    <>
      {/* Enhanced QR Code Card */}
      <div className={`relative ${theme.bgColor} rounded-3xl p-6 shadow-2xl border border-white/10 overflow-hidden group hover:scale-105 transition-all duration-500 hover:shadow-3xl`}>
        {/* Background Pattern */}
        <PatternBackground />
        
        {/* Enhanced Gradient Overlay */}
        <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} opacity-30`}></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        
        {/* Content */}
        <div className="relative z-10">
          {/* Enhanced Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className={`w-12 h-12 bg-gradient-to-r ${theme.gradient} rounded-2xl flex items-center justify-center mr-4 shadow-xl border-2 border-white/20`}>
                <span className="text-3xl filter drop-shadow-lg">{theme.emoji}</span>
              </div>
              <div>
                <h3 className={`font-bold ${theme.textColor} text-base leading-tight`}>QR Review Card</h3>
                <p className={`text-sm ${theme.textColor} opacity-80 flex items-center mt-1`}>
                  <IconComponent className="w-3 h-3 mr-1" />
                  {card.category}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFullscreen(true)}
                className={`p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-300 group-hover:scale-110 backdrop-blur-sm border border-white/20`}
                title="View Fullscreen"
              >
                <Maximize2 className="w-4 h-4 text-white drop-shadow-lg" />
              </button>
              <button
                onClick={downloadFullCard}
                disabled={isDownloading}
                className={`p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-300 group-hover:scale-110 backdrop-blur-sm border border-white/20 ${isDownloading ? 'opacity-50' : ''}`}
                title="Download Full Card"
              >
                <Download className="w-4 h-4 text-white drop-shadow-lg" />
              </button>
            </div>
          </div>

          {/* Enhanced QR Code Container */}
          <div className="relative bg-white rounded-2xl p-6 mb-6 group-hover:shadow-2xl transition-all duration-500 border-4 border-white/20">
            <div className="relative">
              <QRCode
                id={`qr-${card.id}`}
                value={qrUrl}
                size={140}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                viewBox="0 0 256 256"
                fgColor="#000000"
                bgColor="#ffffff"
                level="H"
              />
              
              {/* Enhanced Logo Overlay */}
              {card.logoUrl && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-white rounded-full p-3 shadow-2xl border-4 border-gray-100 ring-2 ring-white">
                    <img
                      src={card.logoUrl}
                      alt={`${card.businessName} logo`}
                      className="w-full h-full object-contain rounded-full"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Business Info */}
          <div className="text-center">
            <h4 className={`font-bold ${theme.textColor} text-lg mb-2 leading-tight`}>
              {card.businessName}
            </h4>
            <p className={`text-sm ${theme.textColor} opacity-80 mb-1`}>
              {card.type}
            </p>
            {card.location && (
              <p className={`text-xs ${theme.textColor} opacity-70 mb-4 flex items-center justify-center`}>
                <MapPin className="w-3 h-3 mr-1" />
                {card.location}
              </p>
            )}
            
            {/* Enhanced Star Rating */}
            <div className="flex justify-center mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400 mx-0.5 drop-shadow-lg" />
              ))}
            </div>
            
            <div className={`inline-flex items-center px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm border border-white/20`}>
              <QrCode className="w-4 h-4 mr-2 text-white" />
              <span className={`text-sm ${theme.textColor} font-semibold`}>
                Scan to Review
              </span>
            </div>
          </div>
        </div>

        {/* Enhanced Decorative Elements */}
        <div className={`absolute -top-12 -right-12 w-24 h-24 bg-gradient-to-r ${theme.gradient} rounded-full opacity-40 blur-2xl animate-pulse`}></div>
        <div className={`absolute -bottom-12 -left-12 w-20 h-20 bg-gradient-to-r ${theme.gradient} rounded-full opacity-40 blur-2xl animate-pulse delay-1000`}></div>
      </div>

      {/* Hidden Enhanced Download Card */}
      <div className="fixed -top-[9999px] left-0 pointer-events-none">
        <div
          ref={downloadCardRef}
          className={`w-[500px] h-[800px] ${theme.cardBg} rounded-[2rem] p-10 shadow-2xl relative overflow-hidden`}
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          {/* Background Pattern for Download Card */}
          <div className="absolute inset-0 opacity-5">
            <PatternBackground />
          </div>
          
          {/* Header Section */}
          <div className="relative z-10 text-center mb-8">
            {/* Business Logo and Info Side by Side */}
            <div className="flex items-center justify-between mb-6">
              {/* Business Logo - Left Side */}
              {card.logoUrl && (
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 bg-white rounded-2xl p-4 shadow-xl border-4 border-gray-100">
                    <img
                      src={card.logoUrl}
                      alt={`${card.businessName} Logo`}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}
              
              {/* Business Info - Right Side */}
              <div className={`flex-1 ${card.logoUrl ? 'ml-6' : ''} text-left`}>
                <h1 className={`text-2xl font-bold ${theme.cardText} mb-2 leading-tight`}>
                  {card.businessName}
                </h1>
                <p className={`text-xl ${theme.cardText} opacity-80 mb-2`}>
                  {card.type}
                </p>
                {card.location && (
                  <p className={`text-lg ${theme.cardText} opacity-70 flex items-center`}>
                    <MapPin className="w-5 h-5 mr-2" />
                    {card.location}
                  </p>
                )}
              </div>
            </div>
            
            {/* Enhanced Star Rating */}
            <div className="flex justify-center mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-8 h-8 text-yellow-500 fill-yellow-500 mx-1 drop-shadow-lg" />
              ))}
            </div>
            
            <h2 className={`text-2xl font-bold ${theme.cardText} mb-4`}>
              Share Your Experience
            </h2>
          </div>

          {/* Enhanced QR Code Section */}
          <div className="relative z-10 flex justify-center mb-10">
            <div className="bg-white rounded-3xl p-8 shadow-2xl border-4 border-gray-100">
              <div className="relative">
                <QRCode
                  value={qrUrl}
                  size={240}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  viewBox="0 0 256 256"
                  fgColor="#000000"
                  bgColor="#ffffff"
                  level="H"
                />
                
                {/* Enhanced Logo for Download */}
                {card.logoUrl && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 bg-white rounded-full p-4 shadow-2xl border-4 border-gray-100 ring-4 ring-white">
                      <img
                        src={card.logoUrl}
                        alt={`${card.businessName} logo`}
                        className="w-full h-full object-contain rounded-full"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Enhanced Instructions */}
          <div className="relative z-10 text-center">
            
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <p className={`text-sm ${theme.cardText} font-semibold`}>Open Camera</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                  <QrCode className="w-6 h-6 text-white" />
                </div>
                <p className={`text-sm ${theme.cardText} font-semibold`}>Scan QR Code</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                  <Star className="w-6 h-6 text-white fill-white" />
                </div>
                <p className={`text-sm ${theme.cardText} font-semibold`}>Leave Review</p>
              </div>
            </div>
            
            <p className={`text-base ${theme.cardText} opacity-80 leading-relaxed mb-4`}>
              Point your phone camera at the QR code above<br />
              Tap the notification to open the review page
            </p>
            
            <div className={`inline-flex items-center px-6 py-3 bg-white/20 rounded-full backdrop-blur-sm border-2 border-white/30`}>
              <Globe className="w-5 h-5 mr-2 text-gray-600" />
              <span className={`text-sm ${theme.cardText} font-mono`}>
                {qrUrl}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Enhanced Fullscreen Modal */}
      {showFullscreen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <div className={`w-16 h-16 bg-gradient-to-r ${theme.gradient} rounded-2xl flex items-center justify-center mr-6 shadow-xl`}>
                  <span className="text-3xl">{theme.emoji}</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">{card.businessName}</h3>
                  <p className="text-gray-600 text-lg">{card.type}</p>
                  {card.location && (
                    <p className="text-gray-500 flex items-center mt-1">
                      <MapPin className="w-4 h-4 mr-1" />
                      {card.location}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowFullscreen(false)}
                className="p-3 hover:bg-gray-100 rounded-xl transition-colors duration-200"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="bg-gray-50 rounded-3xl p-8 mb-8">
              <div className="relative bg-white rounded-2xl p-8 shadow-xl">
                <QRCode
                  value={qrUrl}
                  size={350}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  viewBox="0 0 256 256"
                  fgColor="#000000"
                  bgColor="#ffffff"
                  level="H"
                />
                
                {/* Enhanced Logo Overlay for Fullscreen */}
                {card.logoUrl && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 bg-white rounded-full p-5 shadow-2xl border-4 border-gray-100 ring-4 ring-white">
                      <img
                        src={card.logoUrl}
                        alt={`${card.businessName} logo`}
                        className="w-full h-full object-contain rounded-full"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-8 h-8 text-yellow-400 fill-yellow-400 mx-1" />
                ))}
              </div>
              <p className="text-gray-600 mb-4 font-semibold text-lg">Scan this QR code to leave a review</p>
              <div className="bg-gray-100 px-6 py-4 rounded-xl">
                <p className="text-sm text-gray-500 font-mono break-all">
                  {qrUrl}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowFullscreen(false)}
                className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors duration-200 font-semibold"
              >
                Close
              </button>
              <button
                onClick={downloadFullCard}
                disabled={isDownloading}
                className={`flex-1 px-6 py-4 bg-gradient-to-r ${theme.gradient} text-white rounded-xl hover:opacity-90 transition-opacity duration-200 flex items-center justify-center gap-3 font-semibold ${isDownloading ? 'opacity-50' : ''}`}
              >
                <Download className="w-5 h-5" />
                {isDownloading ? 'Downloading...' : 'Download Card'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};