import React, { useState, useEffect } from 'react';

const Footer: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDateTime = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  };

  return (
    <div className="fixed bottom-2 right-2 text-[10px] text-gray-400 dark:text-gray-600 font-mono bg-white dark:bg-dark-bg-secondary px-2 py-1 rounded shadow-sm border border-gray-200 dark:border-dark-border">
      Atualizado: {formatDateTime(currentTime)}
    </div>
  );
};

export default Footer;
