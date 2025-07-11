import React, { useState, useEffect } from 'react';
import { Star, Copy, CheckCircle, ExternalLink, RotateCcw, ArrowLeft } from 'lucide-react';
import { ReviewCard } from '../types';
import { ReviewGenerator } from '../utils/reviewGenerator';
import { Link } from 'react-router-dom';

interface ReviewCardViewProps {
  card: ReviewCard;
}

export const ReviewCardView: React.FC<ReviewCardViewProps> = ({ card }) => {
  const [currentReview, setCurrentReview] = useState('');
  const [copied, setCopied] = useState(false);
  const [showLogo, setShowLogo] = useState(true);
  const [reviewGenerator] = useState(() => new ReviewGenerator());

  useEffect(() => {
    generateNewReview();

    // Alternate between logo and company name every 3 seconds
    const logoInterval = setInterval(() => {
      setShowLogo((prev) => !prev);
    }, 3000);

    return () => clearInterval(logoInterval);
  }, [card.businessName]);

  const generateNewReview = () => {
    const newReview = reviewGenerator.generateUniqueReview(card.businessName);
    setCurrentReview(newReview);
  };

  const handleCopyAndRedirect = async () => {
    try {
      await navigator.clipboard.writeText(currentReview);
      setCopied(true);

      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);

      // Open Google Maps review page
      window.location.href = card.googleMapsUrl;
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleNewReview = () => {
    generateNewReview();
    setCopied(false);
  };

  const colorMap = {
    blue: "bg-blue-500",
    purple: "bg-purple-500",
    green: "bg-green-500",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden flex items-center justify-center">
      {/* Enhanced Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-[5%] left-[5%] w-32 h-32 sm:w-48 sm:h-48 lg:w-72 lg:h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse animate-float"></div>
        <div className="absolute bottom-[5%] right-[5%] w-40 h-40 sm:w-60 sm:h-60 lg:w-96 lg:h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000 animate-float-reverse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-36 h-36 sm:w-56 sm:h-56 lg:w-80 lg:h-80 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-500 animate-float-slow"></div>

        {/* Additional floating elements */}
        <div className="absolute top-[20%] right-[20%] w-20 h-20 sm:w-32 sm:h-32 bg-cyan-400/10 rounded-full blur-2xl animate-bounce-slow"></div>
        <div className="absolute bottom-[30%] left-[15%] w-24 h-24 sm:w-40 sm:h-40 bg-yellow-400/10 rounded-full blur-2xl animate-bounce-slow delay-700"></div>
      </div>


      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 py-4 flex flex-col justify-center min-h-screen">
        {/* Enhanced Rotating Company Logo with Alternating Display */}
        <div className="text-center mb-4 sm:mb-6">
          <div className="inline-block relative">
            <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mx-auto mb-3 sm:mb-4 relative perspective-1000">
              {/* 3D Rotating Ring */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-full animate-spin-continuous opacity-30 transform-gpu"></div>
              <div className="absolute inset-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-full animate-spin-reverse opacity-20 transform-gpu"></div>

              {/* Main Logo Container with 3D Effect */}
              <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center shadow-3d transform hover:scale-110 transition-all duration-500 animate-float-gentle">
                <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-full">
                  {/* Logo Display */}
                  <div
                    className={`absolute inset-0 flex items-center justify-center transition-all duration-1000 transform ${
                      showLogo
                        ? "opacity-100 scale-100 rotate-0"
                        : "opacity-0 scale-75 rotate-180"
                    }`}
                  >
                    {card.logoUrl ? (
                      <img
                        src={card.logoUrl}
                        alt={`${card.businessName} Logo`}
                        className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 animate-pulse-gentle transform-gpu object-contain"
                      />
                    ) : (
                      <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-xs sm:text-sm lg:text-base">
                          {card.businessName.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Company Name Display */}
                  <div
                    className={`absolute inset-0 flex items-center justify-center transition-all duration-1000 transform ${
                      !showLogo
                        ? "opacity-100 scale-100 rotate-0"
                        : "opacity-0 scale-75 rotate-180"
                    }`}
                  >
                    {card.logoUrl ? (
                      <img
                        src={card.logoUrl}
                        alt={`${card.businessName} Logo`}
                        className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 animate-pulse-gentle transform-gpu object-contain"
                      />
                    ) : (
                      <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-xs sm:text-sm lg:text-base">
                          {card.businessName.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Orbiting particles */}
              <div className="absolute inset-0 animate-spin-slow">
                <div className="absolute -top-1 left-1/2 w-2 h-2 bg-blue-400 rounded-full opacity-60 animate-pulse"></div>
                <div className="absolute top-1/2 -right-1 w-1.5 h-1.5 bg-purple-400 rounded-full opacity-60 animate-pulse delay-300"></div>
                <div className="absolute -bottom-1 left-1/2 w-2 h-2 bg-pink-400 rounded-full opacity-60 animate-pulse delay-600"></div>
                <div className="absolute top-1/2 -left-1 w-1.5 h-1.5 bg-cyan-400 rounded-full opacity-60 animate-pulse delay-900"></div>
              </div>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-1 sm:mb-2 tracking-tight bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient-shift">
            {card.businessName}
          </h1>
          <p className="text-blue-200 text-sm sm:text-base lg:text-lg font-medium animate-fade-in-up">
            Review Automation System
          </p>
        </div>

        {/* Enhanced 3D Main Card */}
        <div className="relative mb-4 sm:mb-6 perspective-1000">
          {/* Multiple shadow layers for enhanced 3D effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl sm:rounded-3xl blur-xl opacity-40 transform rotate-1 scale-105"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl sm:rounded-3xl blur-lg opacity-20 transform -rotate-1 scale-102"></div>

          <div className="relative bg-white/95 rounded-2xl sm:rounded-3xl shadow-3d-enhanced p-4 sm:p-6 lg:p-8 border border-white/40 transform hover:scale-[1.02] hover:rotateX-2 hover:rotateY-2 transition-all duration-700 hover:shadow-3d-mega card-3d">
            {/* Enhanced 3D Stars with individual animations */}
            <div className="flex justify-center mb-4 sm:mb-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="relative mx-1 sm:mx-2 perspective-500">
                  <Star
                    className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-yellow-400 fill-current transform hover:scale-125 hover:rotateY-180 transition-all duration-500 hover:rotate-12 star-3d"
                    style={{
                      filter:
                        "drop-shadow(0 8px 16px rgba(255, 193, 7, 0.4)) drop-shadow(0 0 20px rgba(255, 193, 7, 0.2))",
                      animationDelay: `${i * 0.2}s`,
                    }}
                  />
                  {/* Star glow effect */}
                  <div
                    className="absolute inset-0 bg-yellow-400/20 rounded-full blur-md animate-pulse"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  ></div>
                </div>
              ))}
            </div>

            {/* Enhanced 3D Review Text Container */}
            <div className="mb-6 sm:mb-8 relative perspective-1000">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl sm:rounded-2xl transform rotate-1 opacity-60 blur-sm"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl sm:rounded-2xl transform -rotate-1 opacity-40 blur-sm"></div>

              <div className="relative bg-gradient-to-r from-gray-50 via-blue-50 to-purple-50 p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl border border-gray-200 shadow-inner-3d transform hover:rotateX-1 transition-all duration-500">
                <blockquote className="text-gray-800 text-sm sm:text-base lg:text-lg xl:text-xl leading-relaxed text-center font-medium relative">
                  <span className="text-4xl sm:text-5xl lg:text-7xl text-blue-300/60 absolute -top-4 sm:-top-6 -left-4 sm:-left-6 opacity-80 animate-float-gentle">
                    "
                  </span>
                  <span className="relative z-10 animate-fade-in">
                    {currentReview}
                  </span>
                  <span className="text-4xl sm:text-5xl lg:text-7xl text-blue-300/60 absolute -bottom-8 sm:-bottom-12 -right-4 sm:-right-6 opacity-80 animate-float-gentle-reverse">
                    "
                  </span>
                </blockquote>
              </div>
            </div>

            {/* Enhanced 3D Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-6 justify-center mb-4 sm:mb-6">
              <button
                onClick={handleCopyAndRedirect}
                className={`group relative overflow-hidden px-6 sm:px-8 lg:px-10 py-3 sm:py-4 lg:py-5 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base lg:text-xl transition-all duration-700 transform hover:scale-105 hover:rotateX-5 hover:rotateY-5 shadow-3d-button perspective-1000 ${
                  copied
                    ? "bg-gradient-to-r from-green-500 via-emerald-600 to-green-700 text-white animate-success-pulse"
                    : "bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 text-white hover:from-blue-700 hover:via-purple-700 hover:to-blue-800"
                }`}
              >
                {/* Enhanced button glow effects */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl sm:rounded-2xl"></div>
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl sm:rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>

                <div className="relative flex items-center justify-center">
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-7 lg:h-7 mr-2 sm:mr-3 animate-bounce-gentle" />
                      <span className="whitespace-nowrap">
                        Copied! Redirecting...
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 sm:w-5 sm:h-5 lg:w-7 lg:h-7 mr-2 sm:mr-3 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-500" />
                      <span className="whitespace-nowrap">Copy & Review</span>
                    </>
                  )}
                </div>
              </button>

              <button
                onClick={handleNewReview}
                className="group relative overflow-hidden px-6 sm:px-8 lg:px-10 py-3 sm:py-4 lg:py-5 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base lg:text-xl bg-gradient-to-r from-gray-100 via-white to-gray-200 text-gray-800 hover:from-gray-200 hover:via-gray-100 hover:to-gray-300 transition-all duration-700 transform hover:scale-105 hover:rotateX-5 hover:rotateY-5 shadow-3d-button-light perspective-1000"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl sm:rounded-2xl"></div>
                <div className="absolute -inset-1 bg-gradient-to-r from-gray-300 to-gray-400 rounded-xl sm:rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>

                <div className="relative flex items-center justify-center">
                  <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 lg:w-7 lg:h-7 mr-2 sm:mr-3 group-hover:rotate-180 group-hover:scale-110 transition-transform duration-700" />
                  <span className="whitespace-nowrap">New Review</span>
                </div>
              </button>
            </div>

            {/* Enhanced 3D Visual Instructions */}
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 border border-blue-200 shadow-inner-3d transform hover:rotateX-1 transition-all duration-500">
              <div className="text-center mb-2 sm:mb-3">
                <h3 className="text-sm sm:text-base lg:text-lg font-bold text-blue-900 mb-1 sm:mb-2 animate-fade-in">
                  📱 How It Works
                </h3>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4 text-xs sm:text-sm">
                {/* Enhanced Step Cards with 3D effects */}
                {[
                  {
                    num: 1,
                    icon: Copy,
                    color: "blue",
                    title: 'Click "Copy & Review"',
                    desc: "Review copied to clipboard",
                  },
                  {
                    num: 2,
                    icon: ExternalLink,
                    color: "purple",
                    title: "Auto-redirect to Maps",
                    desc: "Opens Google Maps review",
                  },
                  {
                    num: 3,
                    icon: Star,
                    color: "green",
                    title: "Paste & Submit",
                    desc: "Paste review and rate 5 stars",
                  },
                ].map((step, index) => (
                  <div
                    key={step.num}
                    className={`bg-white rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-4 shadow-3d-card border border-${step.color}-100 transform hover:scale-105 hover:rotateY-5 transition-all duration-500 perspective-500`}
                  >
                    <div className="text-center">
                      <div
                        className={`w-6 h-6 sm:w-8 sm:h-8 lg:w-12 lg:h-12 ${colorMap[step.color]} rounded-full flex items-center justify-center mx-auto mb-1 sm:mb-2 shadow-3d-small animate-bounce-gentle`}
                        style={{ animationDelay: `${index * 0.2}s` }}
                      >
                        <span className="text-white font-bold text-xs sm:text-sm lg:text-lg">
                          {step.num}
                        </span>
                      </div>
                      <div className="mb-1 sm:mb-2">
                        <step.icon
                          className={`w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-${
                            step.color
                          }-600 mx-auto ${
                            step.icon === Star ? "fill-current" : ""
                          } animate-float-gentle`}
                          style={{ animationDelay: `${index * 0.3}s` }}
                        />
                      </div>
                      <p
                        className={`text-${step.color}-800 font-semibold text-xs sm:text-sm`}
                      >
                        {step.title}
                      </p>
                      <p className="text-gray-600 text-xs mt-1 hidden sm:block">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-2 sm:mt-3 lg:mt-4 p-2 sm:p-3 bg-blue-100 rounded-lg border border-blue-200 shadow-inner transform hover:scale-[1.01] transition-all duration-300">
                <p className="text-blue-900 text-center font-medium text-xs sm:text-sm animate-pulse-gentle">
                  💡 <strong>Pro Tip:</strong> Review is auto-copied! Just paste
                  (Ctrl+V) in Google Maps.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced 3D Footer */}
        <div className="text-center">
          <div className="flex items-center justify-center">
            <div className="relative mr-2 sm:mr-3 perspective-500">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-600 rounded-full blur-lg opacity-60 animate-pulse-gentle"></div>
              {card.logoUrl ? (
                <img
                  src={card.logoUrl}
                  alt={`${card.businessName} Logo`}
                  className="relative w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-white rounded-full p-1 sm:p-2 shadow-3d-small transform hover:rotate-12 hover:scale-110 transition-all duration-500 animate-float-gentle object-contain"
                />
              ) : (
                <div className="relative w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-white rounded-full p-1 sm:p-2 shadow-3d-small transform hover:rotate-12 hover:scale-110 transition-all duration-500 animate-float-gentle flex items-center justify-center">
                  <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xs">
                      {card.businessName.charAt(0)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <span className="text-white font-bold text-sm sm:text-base lg:text-xl bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient-shift">
                Powered by {card.businessName}
              </span>
              <p className="text-blue-200 text-xs sm:text-sm mt-1 animate-fade-in-up">
                🚀 Streamlining customer feedback with intelligent automation
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};