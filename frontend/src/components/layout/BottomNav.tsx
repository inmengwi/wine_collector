import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  CameraIcon,
  ArchiveBoxIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  CameraIcon as CameraIconSolid,
  ArchiveBoxIcon as ArchiveBoxIconSolid,
  SparklesIcon as SparklesIconSolid,
} from '@heroicons/react/24/solid';
import { cn } from '../../lib/utils';

const navItems = [
  { path: '/', label: '홈', icon: HomeIcon, activeIcon: HomeIconSolid },
  { path: '/scan', label: '스캔', icon: CameraIcon, activeIcon: CameraIconSolid },
  { path: '/cellar', label: '셀러', icon: ArchiveBoxIcon, activeIcon: ArchiveBoxIconSolid },
  { path: '/recommend', label: '추천', icon: SparklesIcon, activeIcon: SparklesIconSolid },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 pb-safe">
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ path, label, icon: Icon, activeIcon: ActiveIcon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center w-full h-full gap-1',
                'text-xs font-medium transition-colors',
                isActive ? 'text-wine-700' : 'text-gray-500 hover:text-gray-700'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive ? (
                  <ActiveIcon className="h-6 w-6" />
                ) : (
                  <Icon className="h-6 w-6" />
                )}
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
