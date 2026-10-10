'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatisticsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtitle?: string;
  change?: string;
  isPositive?: boolean;
}

export const StatisticsCard: React.FC<StatisticsCardProps> = ({
  title,
  value,
  icon: Icon,
  subtitle,
  change,
  isPositive = true,
}) => {
  return (
    <div
      style={{
        background: 'var(--bg)',
        border: '1px solid var(--line)',
        borderRadius: '20px',
        padding: '22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        boxShadow: 'var(--shadow)',
      }}
    >
      <div>
        <p
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--mute)',
            marginBottom: '4px',
          }}
        >
          {title}
        </p>
        <h3
          style={{
            fontSize: '1.9rem',
            fontWeight: 800,
            color: 'var(--ink)',
            letterSpacing: '-0.02em',
          }}
        >
          {value}
        </h3>
        {subtitle && (
          <p className="mute" style={{ fontSize: '0.8rem', marginTop: '4px' }}>
            {subtitle}
          </p>
        )}
        {change && (
          <p
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              marginTop: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: isPositive ? '#10b981' : 'var(--a)',
            }}
          >
            <span>{isPositive ? '↑' : '↓'}</span> {change}
          </p>
        )}
      </div>

      <div
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '16px',
          background: 'var(--soft)',
          color: 'var(--p)',
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
        }}
      >
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
};
