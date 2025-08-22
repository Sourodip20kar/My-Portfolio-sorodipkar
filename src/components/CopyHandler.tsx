// src/components/CopyHandler.tsx
import { useState, useEffect } from 'react';
import Celebration from './Celebration';
import Notification from './Notification';

interface NotificationState {
  message: string;
  subMessage: string;
  type: 'email' | 'phone' | null;
}

export default function CopyHandler() {
  const [isExploding, setIsExploding] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({ 
    message: '', 
    subMessage: '', 
    type: null 
  });

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setIsExploding(true);
      const isEmail = text.includes('@');
      setNotification({
        message: 'Copied to clipboard!',
        subMessage: isEmail ? `${text} copied successfully.` : 'Text copied successfully.',
        type: isEmail ? 'email' : 'phone',
      });
      setTimeout(() => setNotification({ message: '', subMessage: '', type: null }), 4000);
    });
  };

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const copyable = target.closest('.copyable');
      if (copyable) {
        event.preventDefault();
        const textToCopy = copyable.getAttribute('data-copy') || copyable.textContent?.trim() || '';
        handleCopyToClipboard(textToCopy);
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <>
      <Celebration 
        isExploding={isExploding} 
        onComplete={() => setIsExploding(false)} 
      />
      <Notification 
        {...notification} 
        onClose={() => setNotification({ message: '', subMessage: '', type: null })} 
      />
    </>
  );
}
