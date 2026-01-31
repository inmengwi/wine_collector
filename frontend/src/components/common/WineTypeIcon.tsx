import { Wine } from 'lucide-react';
import { clsx } from 'clsx';
import type { WineType } from '@/types';

interface WineTypeIconProps {
  type: WineType;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const wineTypeConfig: Record<WineType, { color: string; bgColor: string; label: string }> = {
  red: { color: '#722F37', bgColor: '#722F3720', label: '레드' },
  white: { color: '#C9A962', bgColor: '#F5E6C8', label: '화이트' },
  rose: { color: '#E57B8C', bgColor: '#FFE4E8', label: '로제' },
  sparkling: { color: '#FFD700', bgColor: '#FFFACD', label: '스파클링' },
  dessert: { color: '#DAA520', bgColor: '#FFF8DC', label: '디저트' },
  fortified: { color: '#8B4513', bgColor: '#F5DEB3', label: '주정강화' },
  other: { color: '#6B7280', bgColor: '#F3F4F6', label: '기타' },
};

export function WineTypeIcon({ type, size = 'md', showLabel = false }: WineTypeIconProps) {
  const config = wineTypeConfig[type] || wineTypeConfig.other;

  const sizes = {
    sm: { icon: 'w-4 h-4', container: 'w-6 h-6', text: 'text-xs' },
    md: { icon: 'w-5 h-5', container: 'w-8 h-8', text: 'text-sm' },
    lg: { icon: 'w-6 h-6', container: 'w-10 h-10', text: 'text-base' },
  };

  return (
    <div className="inline-flex items-center gap-1.5">
      <div
        className={clsx(
          'flex items-center justify-center rounded-full',
          sizes[size].container
        )}
        style={{ backgroundColor: config.bgColor }}
      >
        <Wine className={sizes[size].icon} style={{ color: config.color }} />
      </div>
      {showLabel && (
        <span className={clsx('font-medium', sizes[size].text)} style={{ color: config.color }}>
          {config.label}
        </span>
      )}
    </div>
  );
}
