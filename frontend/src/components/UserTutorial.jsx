import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';

const TUTORIAL_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to de_monax! 👋',
    description: 'Let\'s take a quick tour to help you get started. This will only take a minute!',
    target: null,
    position: 'center',
    action: null,
  },
  {
    id: 'sidebar',
    title: 'Your Chats',
    description: 'This is where all your conversations appear. Click on any chat to start messaging!',
    target: '[data-tutorial="sidebar"]',
    position: 'right',
    highlight: true,
  },
  {
    id: 'search',
    title: 'Find People',
    description: 'Use the search bar to find friends and start new conversations.',
    target: '[data-tutorial="search"]',
    position: 'bottom',
    highlight: true,
  },
  {
    id: 'tabs',
    title: 'Navigate Features',
    description: 'Switch between Chats, Groups, Status (stories), Posts (feed), and more!',
    target: '[data-tutorial="tabs"]',
    position: 'bottom',
    highlight: true,
  },
  {
    id: 'groups',
    title: 'Create Groups',
    description: 'Click here to create group chats with multiple friends.',
    target: '[data-tutorial="create-group"]',
    position: 'bottom',
    highlight: true,
  },
  {
    id: 'status',
    title: 'Share Status',
    description: 'Post photos or videos that disappear after 24 hours, just like stories!',
    target: '[data-tutorial="add-status"]',
    position: 'bottom',
    highlight: true,
  },
  {
    id: 'message-input',
    title: 'Send Messages',
    description: 'Type your message here. You can format text, add emojis, attach files, and more!',
    target: '[data-tutorial="message-input"]',
    position: 'top',
    highlight: true,
  },
  {
    id: 'formatting',
    title: 'Rich Text Formatting',
    description: 'Make your messages stand out with bold, italic, lists, and links!',
    target: '[data-tutorial="formatting-toolbar"]',
    position: 'top',
    highlight: true,
  },
  {
    id: 'attachments',
    title: 'Share Media',
    description: 'Click the attachment icon to send photos, videos, or files.',
    target: '[data-tutorial="attach-button"]',
    position: 'top',
    highlight: true,
  },
  {
    id: 'profile',
    title: 'Your Profile',
    description: 'Click your avatar to update your profile, change themes, and adjust settings.',
    target: '[data-tutorial="profile-button"]',
    position: 'left',
    highlight: true,
  },
  {
    id: 'theme',
    title: 'Customize Appearance',
    description: 'Choose from multiple themes and customize your chat background!',
    target: '[data-tutorial="theme-button"]',
    position: 'left',
    highlight: true,
  },
  {
    id: 'complete',
    title: 'You\'re All Set! 🎉',
    description: 'You\'re ready to start chatting! You can replay this tutorial anytime from settings.',
    target: null,
    position: 'center',
    action: null,
  },
];

export default function UserTutorial({ onComplete, onSkip }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [highlightedElement, setHighlightedElement] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  const step = TUTORIAL_STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;
  const progress = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100;

  useEffect(() => {
    if (!step.target) {
      setHighlightedElement(null);
      return;
    }

    const element = document.querySelector(step.target);
    if (element) {
      setHighlightedElement(element);
      calculateTooltipPosition(element, step.position);
      
      // Scroll element into view
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentStep, step.target, step.position]);

  const calculateTooltipPosition = (element, position) => {
    const rect = element.getBoundingClientRect();
    const tooltipWidth = 320;
    const tooltipHeight = 200;
    const offset = 20;

    let top = 0;
    let left = 0;

    switch (position) {
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + offset;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - offset;
        break;
      case 'top':
        top = rect.top - tooltipHeight - offset;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'bottom':
        top = rect.bottom + offset;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      default:
        top = window.innerHeight / 2 - tooltipHeight / 2;
        left = window.innerWidth / 2 - tooltipWidth / 2;
    }

    // Keep tooltip within viewport
    top = Math.max(10, Math.min(top, window.innerHeight - tooltipHeight - 10));
    left = Math.max(10, Math.min(left, window.innerWidth - tooltipWidth - 10));

    setTooltipPosition({ top, left });
  };

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    setIsVisible(false);
    if (onSkip) onSkip();
  };

  const handleComplete = () => {
    setIsVisible(false);
    if (onComplete) onComplete();
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[9998] pointer-events-none">
        {/* Dark overlay with cutout for highlighted element */}
        <svg className="w-full h-full">
          <defs>
            <mask id="tutorial-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {highlightedElement && (
                <rect
                  x={highlightedElement.getBoundingClientRect().left - 8}
                  y={highlightedElement.getBoundingClientRect().top - 8}
                  width={highlightedElement.getBoundingClientRect().width + 16}
                  height={highlightedElement.getBoundingClientRect().height + 16}
                  rx="8"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.7)"
            mask="url(#tutorial-mask)"
          />
        </svg>

        {/* Animated highlight ring */}
        {highlightedElement && (
          <div
            className="absolute border-4 border-primary rounded-lg animate-pulse pointer-events-none"
            style={{
              top: highlightedElement.getBoundingClientRect().top - 8,
              left: highlightedElement.getBoundingClientRect().left - 8,
              width: highlightedElement.getBoundingClientRect().width + 16,
              height: highlightedElement.getBoundingClientRect().height + 16,
              boxShadow: '0 0 0 4px rgba(var(--p), 0.2)',
            }}
          />
        )}
      </div>

      {/* Tooltip */}
      <div
        className="fixed z-[9999] pointer-events-auto"
        style={{
          top: step.position === 'center' ? '50%' : `${tooltipPosition.top}px`,
          left: step.position === 'center' ? '50%' : `${tooltipPosition.left}px`,
          transform: step.position === 'center' ? 'translate(-50%, -50%)' : 'none',
        }}
      >
        <div className="bg-base-100 rounded-xl shadow-2xl border border-base-300 w-80 overflow-hidden animate-in fade-in zoom-in duration-300">
          {/* Progress bar */}
          <div className="h-1 bg-base-200">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-base-content mb-1">
                  {step.title}
                </h3>
                <p className="text-sm text-base-content/70">
                  Step {currentStep + 1} of {TUTORIAL_STEPS.length}
                </p>
              </div>
              <button
                onClick={handleSkip}
                className="btn btn-ghost btn-sm btn-circle"
                aria-label="Skip tutorial"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Description */}
            <p className="text-base-content/80 mb-6 leading-relaxed">
              {step.description}
            </p>

            {/* Navigation */}
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={handlePrevious}
                disabled={isFirstStep}
                className="btn btn-ghost btn-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <div className="flex gap-1">
                {TUTORIAL_STEPS.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentStep
                        ? 'bg-primary w-6'
                        : index < currentStep
                        ? 'bg-primary/50'
                        : 'bg-base-300'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={handleNext}
                className={`btn btn-sm ${isLastStep ? 'btn-primary' : 'btn-ghost'}`}
              >
                {isLastStep ? (
                  <>
                    Finish
                    <Check className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Arrow pointer */}
        {step.position !== 'center' && highlightedElement && (
          <div
            className="absolute w-4 h-4 bg-base-100 border-base-300 rotate-45"
            style={{
              ...(step.position === 'right' && {
                left: -8,
                top: '50%',
                transform: 'translateY(-50%) rotate(45deg)',
                borderLeft: '1px solid',
                borderBottom: '1px solid',
              }),
              ...(step.position === 'left' && {
                right: -8,
                top: '50%',
                transform: 'translateY(-50%) rotate(45deg)',
                borderRight: '1px solid',
                borderTop: '1px solid',
              }),
              ...(step.position === 'top' && {
                bottom: -8,
                left: '50%',
                transform: 'translateX(-50%) rotate(45deg)',
                borderBottom: '1px solid',
                borderRight: '1px solid',
              }),
              ...(step.position === 'bottom' && {
                top: -8,
                left: '50%',
                transform: 'translateX(-50%) rotate(45deg)',
                borderTop: '1px solid',
                borderLeft: '1px solid',
              }),
            }}
          />
        )}
      </div>
    </>
  );
}
