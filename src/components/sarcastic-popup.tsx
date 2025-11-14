'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import { Button } from './ui/button';

type PopupType = 'success' | 'error' | 'warning';

interface SarcasticPopupProps {
  type: PopupType;
  onClose: () => void;
  customMessage?: string;
}

const SARCASTIC_MESSAGES = {
  success: [
    "Wow! You actually did it! I'm genuinely shocked. Your payment went through!",
    "Well, well, well... look who figured out how to make a payment! Congrats, genius!",
    "Holy guacamole! Your payment succeeded! Someone call the Nobel committee!",
    "Breaking news: You managed to complete a payment! Scientists are baffled!",
    "Achievement unlocked: Basic Financial Transaction! You're basically a banker now!",
    "Stop the presses! Your payment actually worked! This is not a drill!",
    "Ladies and gentlemen, we have a payment confirmation! Alert the media!",
    "Congratulations! You've successfully proven you can follow instructions!",
    "Your payment went through! Quick, buy a lottery ticket while you're on a roll!",
    "Success! Your payment is confirmed! Even a broken clock is right twice a day!"
  ],
  error: [
    "Oops! Something went wrong. But hey, at least you tried, right?",
    "Error alert! Don't worry, even the best of us fail... frequently.",
    "Well, this is awkward. Your request failed. Maybe try turning it off and on again?",
    "Houston, we have a problem! And by 'we', I mean 'you'.",
    "Congratulations! You've discovered a new way to break things!",
    "Error 404: Success not found. Better luck next time, champ!",
    "Uh oh! Looks like the digital gremlins got to your request!",
    "Plot twist: It didn't work! Shocking, I know.",
    "Failed successfully! At least you're consistent!",
    "Yikes! That didn't go as planned. But what did you expect? Perfection?"
  ],
  warning: [
    "Hmm... something's fishy here. Not sure if good or bad yet.",
    "Warning! Proceed with caution. Or don't. I'm just a popup, not a cop.",
    "Hold up! Before you continue, you might want to reconsider... or not. Your call!",
    "Red flag alert! But you'll probably ignore this anyway, won't you?",
    "Just so you know, this might not be the best idea. But who am I to judge?",
    "Caution: You're about to do something. Make sure it's the right something!",
    "PSA: This is your friendly warning message. Feel free to ignore it!",
    "Attention! Something requires your attention. How meta is that?",
    "Yellow alert! Not as serious as red, but more than green. Science!",
    "Heads up! You're being warned about... something. Stay vigilant!"
  ]
};

const VERIFICATION_MESSAGES = [
  "Congrats! Your payment is verified! You're officially less broke than you were 5 minutes ago!",
  "Payment verified! Now you can finally stop refreshing this page like a maniac!",
  "Verification complete! Your textbook is now officially yours. Time to actually read it... maybe?",
  "Success! Your payment checks out! Even we're surprised it worked on the first try!",
  "Verified! You're now part of the elite club of people who pay for things! Welcome!",
  "Payment confirmed! Quick, screenshot this before something goes wrong!",
  "Verification successful! You've mastered the ancient art of clicking 'Submit'!",
  "Boom! Verified! Your payment is more real than your attendance record!",
  "Target acquired and verified! Your money has successfully left your account!",
  "Verification achieved! One small step for you, one giant leap for your GPA!"
];

export function SarcasticPopup({ type, onClose, customMessage }: SarcasticPopupProps) {
  const [message, setMessage] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const autoCloseMs = 10000; // Auto-close after 10s to avoid blocking interactions

  useEffect(() => {
    // Random message selection
    if (customMessage) {
      setMessage(customMessage);
    } else {
      const messages = SARCASTIC_MESSAGES[type];
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      setMessage(randomMessage);
    }
    
    // Trigger animation
    setTimeout(() => setIsVisible(true), 10);
    // Auto-dismiss after a short delay
    const t = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, autoCloseMs);

    return () => clearTimeout(t);
  }, [type, customMessage]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-12 w-12 text-green-500" />;
      case 'error':
        return <XCircle className="h-12 w-12 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-12 w-12 text-yellow-500" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return 'from-green-50 to-green-100 border-green-300';
      case 'error':
        return 'from-red-50 to-red-100 border-red-300';
      case 'warning':
        return 'from-yellow-50 to-yellow-100 border-yellow-300';
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleClose}
    >
      <div 
        className={`relative max-w-md w-full mx-4 bg-gradient-to-br ${getColors()} border-2 rounded-2xl shadow-2xl transform transition-all duration-300 ${
          isVisible ? 'scale-100 rotate-0' : 'scale-50 rotate-12'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/50 transition-colors"
        >
          <X className="h-5 w-5 text-gray-600" />
        </button>

        {/* Content */}
        <div className="p-8 text-center">
          {/* Icon */}
          <div className="mb-6 flex justify-center animate-bounce">
            {getIcon()}
          </div>

          {/* Message */}
          <p className="text-lg font-medium text-gray-800 leading-relaxed mb-6">
            {message}
          </p>

          {/* Action button */}
          <Button
            onClick={handleClose}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            Got it!
          </Button>
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-2 -left-2 w-4 h-4 bg-green-400 rounded-full animate-ping"></div>
        <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-green-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
      </div>
    </div>
  );
}

// Hook for using sarcastic popups
export function useSarcasticPopup() {
  const [popup, setPopup] = useState<{ type: PopupType; message?: string } | null>(null);

  const showPopup = (type: PopupType, customMessage?: string) => {
    setPopup({ type, message: customMessage });
  };

  const showVerificationPopup = () => {
    const randomMessage = VERIFICATION_MESSAGES[Math.floor(Math.random() * VERIFICATION_MESSAGES.length)];
    setPopup({ type: 'success', message: randomMessage });
  };

  const closePopup = () => {
    setPopup(null);
  };

  const PopupComponent = popup ? (
    <SarcasticPopup 
      type={popup.type} 
      customMessage={popup.message}
      onClose={closePopup} 
    />
  ) : null;

  return {
    showSuccess: (message?: string) => showPopup('success', message),
    showError: (message?: string) => showPopup('error', message),
    showWarning: (message?: string) => showPopup('warning', message),
    showVerification: showVerificationPopup,
    PopupComponent
  };
}
