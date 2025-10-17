import { useState } from 'react';
import { X, ChevronRight, MessageSquare, Image, Clock, Phone, Users, Palette, Shield, Sparkles } from 'lucide-react';

const TOUR_STEPS = [
  {
    id: 1,
    title: 'Welcome to de_monax!',
    description: 'Connect, Share, Chat',
    icon: Sparkles,
    content: 'Your all-in-one platform for messaging, sharing moments, and staying connected with friends.',
  },
  {
    id: 2,
    title: 'Messaging',
    description: 'Send messages, photos, and videos',
    icon: MessageSquare,
    content: 'Chat with friends in real-time. All media is auto-compressed for faster sending and lower data usage.',
  },
  {
    id: 3,
    title: 'Traks',
    description: 'Share your moments',
    icon: Image,
    content: 'Create Traks with multiple photos and videos. Like Instagram - share your best moments with friends or publicly.',
  },
  {
    id: 4,
    title: 'Pulses',
    description: '24-hour stories',
    icon: Clock,
    content: 'Share temporary Pulses that disappear after 24 hours. Like WhatsApp Status - perfect for quick updates.',
  },
  {
    id: 5,
    title: 'Voice & Video Calls',
    description: 'Stay connected in real-time',
    icon: Phone,
    content: 'Make crystal-clear voice and video calls with your friends. Connect face-to-face anytime, anywhere.',
  },
  {
    id: 6,
    title: 'Friends & Groups',
    description: 'Build your community',
    icon: Users,
    content: 'Add friends, create groups, and see who\'s online. Stay connected with the people who matter most.',
  },
  {
    id: 7,
    title: 'Themes & Personalization',
    description: 'Make it yours',
    icon: Palette,
    content: 'Customize your experience with multiple themes and colors. Switch between dark and light modes instantly.',
  },
  {
    id: 8,
    title: 'Privacy Controls',
    description: 'You\'re in control',
    icon: Shield,
    content: 'Choose who sees your Traks and Pulses. Your privacy, your rules - share with everyone or just friends.',
  },
  {
    id: 9,
    title: 'You\'re All Set!',
    description: 'Ready to start?',
    icon: Sparkles,
    content: 'Start by adding your first friend or creating a Trak. Welcome to the de_monax community!',
  },
];

export default function WelcomeTour({ onComplete, onSkip }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const step = TOUR_STEPS[currentStep];
  const isLastStep = currentStep === TOUR_STEPS.length - 1;
  const Icon = step.icon;

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleSkip = () => {
    setIsVisible(false);
    setTimeout(() => {
      onSkip?.();
    }, 300);
  };

  const handleComplete = () => {
    setIsVisible(false);
    setTimeout(() => {
      onComplete?.();
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-md mx-4 bg-base-100 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Skip button */}
        {!isLastStep && (
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 btn btn-ghost btn-sm btn-circle"
            aria-label="Skip tour"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Content */}
        <div className="p-8 text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon className="w-10 h-10 text-primary" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-base-content mb-2">
            {step.title}
          </h2>

          {/* Description */}
          <p className="text-primary font-medium mb-4">
            {step.description}
          </p>

          {/* Content */}
          <p className="text-base-content/70 mb-8">
            {step.content}
          </p>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-6">
            {TOUR_STEPS.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? 'w-8 bg-primary'
                    : index < currentStep
                    ? 'w-2 bg-primary/50'
                    : 'w-2 bg-base-300'
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {!isLastStep ? (
              <>
                <button
                  onClick={handleSkip}
                  className="btn btn-ghost flex-1"
                >
                  Skip Tour
                </button>
                <button
                  onClick={handleNext}
                  className="btn btn-primary flex-1 gap-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={handleComplete}
                className="btn btn-primary w-full gap-2"
              >
                Get Started
                <Sparkles className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Step counter */}
          <p className="text-xs text-base-content/50 mt-4">
            Step {currentStep + 1} of {TOUR_STEPS.length}
          </p>
        </div>
      </div>
    </div>
  );
}
