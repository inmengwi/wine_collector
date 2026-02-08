import { Link } from 'react-router-dom';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { WineImage, Badge } from '../common';
import { formatVintage, getDrinkingStatusLabel, getDrinkingStatusColor } from '../../lib/utils';
import type { UserWineListItem } from '../../types';

interface WineListItemProps {
  wine: UserWineListItem;
  onClick?: () => void;
}

export function WineListItem({ wine, onClick }: WineListItemProps) {
  const statusColor = getDrinkingStatusColor(wine.drinking_status);
  const statusVariant = statusColor === 'red' ? 'danger'
    : statusColor === 'yellow' ? 'warning'
    : statusColor === 'green' ? 'success'
    : 'default';

  const content = (
    <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors">
      {/* Wine Image */}
      <div className="flex-shrink-0">
        <WineImage
          imageUrl={wine.wine.image_url}
          type={wine.wine.type}
          name={wine.wine.name}
          size="sm"
        />
      </div>

      {/* Wine Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {wine.label_number && (
            <span className="flex-shrink-0 px-1.5 py-0.5 bg-wine-100 text-wine-800 text-xs font-mono font-medium rounded">
              {wine.label_number}
            </span>
          )}
          <h3 className="font-medium text-gray-900 truncate">
            {wine.wine.name}
          </h3>
          <span className="flex-shrink-0 text-sm text-wine-700">
            {formatVintage(wine.wine.vintage)}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-sm text-gray-500 truncate">
            {wine.wine.producer || wine.wine.region || wine.wine.country}
          </p>
          {wine.drinking_status && (
            <Badge size="sm" variant={statusVariant}>
              {getDrinkingStatusLabel(wine.drinking_status)}
            </Badge>
          )}
        </div>
      </div>

      {/* Quantity & Arrow */}
      <div className="flex items-center gap-2">
        {wine.quantity > 1 && (
          <span className="text-sm font-medium text-wine-700">{wine.quantity}병</span>
        )}
        <ChevronRightIcon className="h-5 w-5 text-gray-400" />
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="w-full text-left">
        {content}
      </button>
    );
  }

  return (
    <Link to={`/wine/${wine.id}`} className="block">
      {content}
    </Link>
  );
}
