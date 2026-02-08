import { Component, useState } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { clsx } from 'clsx';
import { WineBottleIllustration } from './WineBottleIllustration';
import { WineColorCard } from './WineColorCard';
import type { WineType } from '@/types';

interface WineImageProps {
  imageUrl?: string | null;
  type: WineType;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  variant?: 'card' | 'hero';
}

const containerSizes = {
  sm: 'w-10 h-14',
  md: 'w-16 h-20',
  lg: 'w-24 h-32',
  xl: 'w-full h-64',
};

const illustrationBg: Record<WineType, string> = {
  red: 'from-rose-50 to-rose-100',
  white: 'from-amber-50 to-yellow-50',
  rose: 'from-pink-50 to-rose-50',
  sparkling: 'from-yellow-50 to-amber-50',
  dessert: 'from-orange-50 to-amber-50',
  fortified: 'from-amber-50 to-orange-50',
  other: 'from-gray-50 to-gray-100',
};

/** ErrorBoundary that falls back to WineColorCard (3rd priority) */
interface IllustrationBoundaryProps {
  type: WineType;
  size: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  children: ReactNode;
}

interface IllustrationBoundaryState {
  hasError: boolean;
}

class IllustrationBoundary extends Component<IllustrationBoundaryProps, IllustrationBoundaryState> {
  constructor(props: IllustrationBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): IllustrationBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // Silently fall through to color card
  }

  render() {
    if (this.state.hasError) {
      return (
        <WineColorCard
          type={this.props.type}
          size={this.props.size}
          className={this.props.className}
        />
      );
    }
    return this.props.children;
  }
}

/**
 * WineImage - Unified wine image component with 3-tier fallback:
 *   1st: User-captured photo (image_url)
 *   2nd: SVG wine bottle illustration by type
 *   3rd: Color card with type icon (when illustration can't render)
 */
export function WineImage({
  imageUrl,
  type,
  name,
  size = 'md',
  className,
  variant = 'card',
}: WineImageProps) {
  const [imageError, setImageError] = useState(false);

  const isHero = variant === 'hero';

  // Priority 1: User photo
  if (imageUrl && !imageError) {
    if (isHero) {
      return (
        <div className={clsx('relative bg-gradient-to-b from-wine-100 to-white', className)}>
          <img
            src={imageUrl}
            alt={name || 'Wine'}
            className="w-full h-full object-contain"
            onError={() => setImageError(true)}
          />
        </div>
      );
    }

    return (
      <div className={clsx('overflow-hidden rounded bg-gray-100', containerSizes[size], className)}>
        <img
          src={imageUrl}
          alt={name || 'Wine'}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  // Priority 2: SVG bottle illustration (wrapped in ErrorBoundary -> Priority 3: Color card)
  const illustrationSize = isHero ? 'xl' : size;
  const bgGradient = illustrationBg[type] || illustrationBg.other;
  const containerClass = isHero
    ? clsx('relative bg-gradient-to-b', bgGradient, className)
    : clsx(
        'overflow-hidden rounded bg-gradient-to-b flex items-center justify-center',
        bgGradient,
        containerSizes[size],
        className
      );

  return (
    <IllustrationBoundary
      type={type}
      size={isHero ? 'xl' : size}
      className={isHero ? clsx('w-full h-64', className) : clsx(containerSizes[size], className)}
    >
      <div className={containerClass}>
        {isHero ? (
          <div className="w-full h-full flex items-center justify-center py-4">
            <WineBottleIllustration type={type} size={illustrationSize} />
          </div>
        ) : (
          <WineBottleIllustration type={type} size={size} />
        )}
      </div>
    </IllustrationBoundary>
  );
}
