import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';

interface LayoutProps {
  showNav?: boolean;
}

export function Layout({ showNav = true }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className={showNav ? 'pb-20' : ''}>
        <Outlet />
      </main>
      {showNav && <BottomNav />}
    </div>
  );
}
