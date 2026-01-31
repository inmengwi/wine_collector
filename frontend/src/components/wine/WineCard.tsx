import { Link } from 'react-router-dom';
import { WineTypeIcon, Badge, TagChip } from '../common';
import { formatVintage, formatPrice, getDrinkingStatusLabel, getDrinkingStatusColor } from '../../lib/utils';
import type { UserWineListItem } from '../../types';

interface WineCardProps {
  wine: UserWineListItem;
  showPrice?: boolean;
}

export function WineCard({ wine, showPrice = false }: WineCardProps) {
  const statusColor = getDrinkingStatusColor(wine.drinking_status);
  const statusVariant = statusColor === 'red' ? 'danger'
    : statusColor === 'yellow' ? 'warning'
    : statusColor === 'green' ? 'success'
    : 'default';

  return (
    <Link
      to={`/wine/${wine.id}`}
      className="block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="flex gap-3 p-3">
        {/* Wine Image */}
        <div className="flex-shrink-0 w-16 h-20 bg-gray-100 rounded overflow-hidden">
          {wine.wine.image_url ? (
            <img
              src={wine.wine.image_url}
              alt={wine.wine.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <WineTypeIcon type={wine.wine.type} size="lg" />
            </div>
          )}
        </div>

        {/* Wine Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate">
                {wine.wine.name}
              </h3>
              <p className="text-sm text-gray-500 truncate">
                {wine.wine.producer}
              </p>
            </div>
            <span className="flex-shrink-0 text-sm font-medium text-wine-700">
              {formatVintage(wine.wine.vintage)}
            </span>
          </div>

          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
            {wine.wine.region && <span>{wine.wine.region}</span>}
            {wine.wine.country && (
              <>
                <span className="text-gray-300">|</span>
                <span>{wine.wine.country}</span>
              </>
            )}
          </div>

          <div className="mt-2 flex items-center gap-2 flex-wrap">
            {wine.quantity > 1 && (
              <Badge size="sm" variant="wine">
                {wine.quantity}병
              </Badge>
            )}
            {wine.drinking_status && (
              <Badge size="sm" variant={statusVariant}>
                {getDrinkingStatusLabel(wine.drinking_status)}
              </Badge>
            )}
            {showPrice && wine.purchase_price && (
              <span className="text-xs text-gray-500">
                {formatPrice(wine.purchase_price)}
              </span>
            )}
          </div>

          {wine.tags.length > 0 && (
            <div className="mt-2 flex gap-1 flex-wrap">
              {wine.tags.slice(0, 2).map(tag => (
                <TagChip key={tag.id} tag={tag} size="sm" />
              ))}
              {wine.tags.length > 2 && (
                <span className="text-xs text-gray-400">+{wine.tags.length - 2}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
