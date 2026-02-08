import { Wine } from 'lucide-react';
import { clsx } from 'clsx';
import type { WineType } from '@/types';

interface WineColorCardProps {
  type: WineType;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const colorConfig: Record<WineType, { bg: string; iconColor: string; label: string }> = {
  red: { bg: 'from-[#722F37] to-[#4A1E24]', iconColor: '#F5D0D3', label: 'RED' },
  white: { bg: 'from-[#C9A962] to-[#8B7635]', iconColor: '#FFF8E7', label: 'WHITE' },
  rose: { bg: 'from-[#E57B8C] to-[#C4546A]', iconColor: '#FFF0F2', label: 'ROSE' },
  sparkling: { bg: 'from-[#C4A35A] to-[#8B7635]', iconColor: '#FFFEF0', label: 'SPARKLING' },
  dessert: { bg: 'from-[#DAA520] to-[#996B15]', iconColor: '#FFF8DC', label: 'DESSERT' },
  fortified: { bg: 'from-[#8B4513] to-[#5C2D0E]', iconColor: '#F5DEB3', label: 'FORTIFIED' },
  other: { bg: 'from-[#6B7280] to-[#4B5563]', iconColor: '#E5E7EB', label: 'WINE' },
};

const iconSizes = {
  sm: 'w-5 h-5',
  md: 'w-7 h-7',
  lg: 'w-10 h-10',
  xl: 'w-14 h-14',
};

const labelSizes = {
  sm: 'text-[6px]',
  md: 'text-[8px]',
  lg: 'text-xs',
  xl: 'text-sm',
};

export function WineColorCard({ type, size = 'md', className }: WineColorCardProps) {
  const config = colorConfig[type] || colorConfig.other;

  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center bg-gradient-to-br rounded',
        config.bg,
        className
      )}
    >
      <Wine className={iconSizes[size]} style={{ color: config.iconColor }} />
      <span
        className={clsx(
          'font-bold tracking-wider mt-0.5 opacity-70',
          labelSizes[size]
        )}
        style={{ color: config.iconColor }}
      >
        {config.label}
      </span>
    </div>
  );
}
