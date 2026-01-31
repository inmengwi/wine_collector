import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { cn } from '../../lib/utils';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showSettings?: boolean;
  rightAction?: React.ReactNode;
  className?: string;
}

export function Header({
  title,
  showBack = false,
  showSettings = false,
  rightAction,
  className
}: HeaderProps) {
  const navigate = useNavigate();

  return (
    <header className={cn(
      'sticky top-0 z-40 bg-white border-b border-gray-200',
      className
    )}>
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="p-1 -ml-1 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="h-6 w-6" />
            </button>
          )}
          {title && (
            <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
          )}
        </div>

        <div className="flex items-center gap-2">
          {rightAction}
          {showSettings && (
            <button
              onClick={() => navigate('/settings')}
              className="p-2 text-gray-600 hover:text-gray-900"
            >
              <Cog6ToothIcon className="h-6 w-6" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
