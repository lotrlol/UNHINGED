import { useEffect, useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Button } from './ui/button';
import { Download, Check } from 'lucide-react';

export function PWAInstallButton() {
  const { install, isInstalled, canInstall } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show the button if the app can be installed and isn't already installed
    if (canInstall && !isInstalled) {
      // Small delay before showing the button for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [canInstall, isInstalled]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
      <Button
        onClick={install}
        className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
        size="lg"
      >
        {isInstalled ? (
          <>
            <Check className="h-5 w-5" />
            Installed
          </>
        ) : (
          <>
            <Download className="h-5 w-5" />
            Install App
          </>
        )}
      </Button>
    </div>
  );
}

// Add some global styles for the button animation
const styleElement = document.createElement('style');
styleElement.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in {
    animation: fadeIn 0.3s ease-out forwards;
  }
`;
document.head.appendChild(styleElement);
