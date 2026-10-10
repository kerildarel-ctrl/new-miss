'use client';

import React, { useState, useEffect } from 'react';

interface CountdownProps {
  targetDate: string;
  size?: 'sm' | 'md' | 'lg';
  compact?: boolean;
}

export const Countdown: React.FC<CountdownProps> = ({ targetDate, compact = false }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    const calculateTime = () => {
      const difference = new Date(targetDate).getTime() - new Date().getTime();

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (timeLeft.isExpired) {
    return <span className="chip te" style={{ marginBottom: 0 }}>Terminé</span>;
  }

  if (compact) {
    return (
      <span>
        {timeLeft.days}j {String(timeLeft.hours).padStart(2, '0')}h{' '}
        {String(timeLeft.minutes).padStart(2, '0')}m
      </span>
    );
  }

  return (
    <span style={{ fontWeight: 700, color: 'var(--p)' }}>
      {timeLeft.days}j {String(timeLeft.hours).padStart(2, '0')}h{' '}
      {String(timeLeft.minutes).padStart(2, '0')}m {String(timeLeft.seconds).padStart(2, '0')}s
    </span>
  );
};
