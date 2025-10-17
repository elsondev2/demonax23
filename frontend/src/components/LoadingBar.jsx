import { useEffect, useState } from "react";

const FUN_FACTS = [
  "The first email was sent in 1971 by Ray Tomlinson to himself.",
  "Over 300 billion emails are sent every day worldwide.",
  "The '@' symbol in email addresses is called an 'at sign' or 'commercial at'.",
  "WhatsApp handles over 100 billion messages per day.",
  "The average person checks their phone 96 times a day.",
  "Emojis were invented in Japan in 1999 by Shigetaka Kurita.",
  "The most used emoji worldwide is the 'Face with Tears of Joy' 😂",
  "Video calls became 10x more popular during 2020.I think we all know why....:)",
  "The word 'emoji' comes from Japanese: e (picture) + moji (character).",
  "Group chats can reduce email volume by up to 48%.",
  "The first text message was sent in 1992 and said 'Merry Christmas'.",
  "Humans have been communicating for over 100,000 years.",
  "The average person spends 2 hours and 31 minutes on social media daily.",
  "Voice messages are 3x faster than typing the same message.",
  "Dark mode can reduce eye strain by up to 60%.",
];

function LoadingBar() {
  const [progress, setProgress] = useState(0);
  const [fact] = useState(() => FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)]);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress === 100) {
          return 0;
        }
        const diff = Math.random() * 30;
        return Math.min(oldProgress + diff, 100);
      });
    }, 500);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
      <div className="max-w-md w-full mx-4">
        {/* Card */}
        <div className="bg-base-100 rounded-2xl shadow-2xl p-8 space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          </div>

          {/* Loading text */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-base-content mb-2">
              Loading messages...
            </h3>
            <p className="text-sm text-base-content/60">
              Just a moment
            </p>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="h-2 bg-base-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary via-secondary to-accent transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="text-xs text-center text-base-content/50">
              {Math.round(progress)}%
            </div>
          </div>

          {/* Fun fact */}
          <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-primary mb-1">Did you know?</p>
                <p className="text-sm text-base-content/70 leading-relaxed">
                  {fact}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoadingBar;
