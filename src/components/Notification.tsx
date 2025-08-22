// src/components/Notification.tsx
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface NotificationProps {
  message: string;
  subMessage: string;
  type: 'email' | 'phone' | null;
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, subMessage, type, onClose }) => {
  if (!message) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.3 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.4 } }}
        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-md px-4"
      >
        <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 flex items-start sm:items-center gap-4 shadow-lg">
          <div className="flex-shrink-0 pt-1 sm:pt-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#4ade80"/>
            </svg>
          </div>
          <div className="flex-grow flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex-grow">
              <p className="font-semibold text-white">{message}</p>
              <p className="text-zinc-400 text-sm break-words">{subMessage}</p>
            </div>
            {type === 'email' && (
              <a
                href={`mailto:${subMessage.split(' ')[0]}`}
                className="bg-white text-black text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-zinc-200 transition-colors flex-shrink-0 w-fit mt-2 sm:mt-0"
              >
                Send Email
              </a>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Notification;
