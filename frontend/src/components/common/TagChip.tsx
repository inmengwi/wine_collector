import { clsx } from 'clsx';
import { X } from 'lucide-react';
import type { Tag } from '@/types';

export interface TagChipProps {
  name?: string;
  color?: string;
  size?: 'sm' | 'md';
  onRemove?: () => void;
  onClick?: () => void;
  selected?: boolean;
  tag?: Tag;
}

export function TagChip({
  name,
  color = '#6B7280',
  size = 'md',
  onRemove,
  onClick,
  selected = false,
  tag,
}: TagChipProps) {
  const displayName = tag?.name || name || '';
  const displayColor = tag?.color || color;
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full font-medium transition-all',
        sizes[size],
        onClick && 'cursor-pointer hover:opacity-80',
        selected && 'ring-2 ring-offset-1'
      )}
      style={{
        backgroundColor: `${displayColor}20`,
        color: displayColor,
        borderColor: selected ? displayColor : 'transparent',
      }}
      onClick={onClick}
    >
      <span
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: displayColor }}
      />
      {displayName}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 p-0.5 rounded-full hover:bg-black/10"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}
