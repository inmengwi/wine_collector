import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCircleIcon,
  TagIcon,
  BellIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon,
  ChevronRightIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import { Header } from '../components/layout';
import { Button, Modal, TagChip, ConfirmDialog } from '../components/common';
import { useAuthStore } from '../stores';
import { tagService } from '../services';

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);

  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagService.getTags(),
  });

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const menuItems = [
    {
      icon: UserCircleIcon,
      label: '프로필 설정',
      onClick: () => navigate('/settings/profile'),
    },
    {
      icon: TagIcon,
      label: '태그 관리',
      onClick: () => setShowTagModal(true),
      badge: tagsData?.summary ?
        `${tagsData.summary.cellar_count + tagsData.summary.location_count + tagsData.summary.custom_count}개` :
        undefined,
    },
    {
      icon: BellIcon,
      label: '알림 설정',
      onClick: () => navigate('/settings/notifications'),
    },
    {
      icon: QuestionMarkCircleIcon,
      label: '도움말 & 문의',
      onClick: () => navigate('/settings/help'),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="설정" showBack />

      <div className="p-4 space-y-4">
        {/* User Profile Card */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-wine-100 rounded-full flex items-center justify-center">
              <UserCircleIcon className="h-10 w-10 text-wine-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {user?.name || '사용자'}
              </h2>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="bg-white rounded-xl overflow-hidden shadow-sm">
          {menuItems.map((item, index) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className={`w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors ${
                index !== 0 ? 'border-t border-gray-100' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-5 w-5 text-gray-500" />
                <span className="text-gray-900">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {item.badge && (
                  <span className="text-sm text-gray-500">{item.badge}</span>
                )}
                <ChevronRightIcon className="h-5 w-5 text-gray-400" />
              </div>
            </button>
          ))}
        </div>

        {/* App Info */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-center text-sm text-gray-500">
            <p>Wine Collector v1.0.0</p>
            <p className="mt-1">© 2024 Wine Collector</p>
          </div>
        </div>

        {/* Logout */}
        <Button
          variant="outline"
          size="lg"
          className="w-full text-red-600 border-red-200 hover:bg-red-50"
          onClick={() => setShowLogoutConfirm(true)}
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
          로그아웃
        </Button>
      </div>

      {/* Tag Management Modal */}
      <Modal
        isOpen={showTagModal}
        onClose={() => setShowTagModal(false)}
        title="태그 관리"
        size="lg"
      >
        <div className="space-y-4 mt-4">
          {/* Cellar Tags */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">셀러</h3>
            <div className="flex flex-wrap gap-2">
              {tagsData?.tags
                .filter((t) => t.type === 'cellar')
                .map((tag) => (
                  <TagChip key={tag.id} tag={tag} />
                ))}
              <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-wine-600 border border-dashed border-wine-300 rounded-full hover:bg-wine-50">
                <PlusIcon className="h-4 w-4" />
                추가
              </button>
            </div>
          </div>

          {/* Location Tags */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">위치</h3>
            <div className="flex flex-wrap gap-2">
              {tagsData?.tags
                .filter((t) => t.type === 'location')
                .map((tag) => (
                  <TagChip key={tag.id} tag={tag} />
                ))}
              <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-wine-600 border border-dashed border-wine-300 rounded-full hover:bg-wine-50">
                <PlusIcon className="h-4 w-4" />
                추가
              </button>
            </div>
          </div>

          {/* Custom Tags */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">커스텀</h3>
            <div className="flex flex-wrap gap-2">
              {tagsData?.tags
                .filter((t) => t.type === 'custom')
                .map((tag) => (
                  <TagChip key={tag.id} tag={tag} />
                ))}
              <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-wine-600 border border-dashed border-wine-300 rounded-full hover:bg-wine-50">
                <PlusIcon className="h-4 w-4" />
                추가
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={() => setShowTagModal(false)}>닫기</Button>
        </div>
      </Modal>

      {/* Logout Confirm */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="로그아웃"
        message="정말 로그아웃 하시겠습니까?"
        confirmText="로그아웃"
        variant="danger"
      />
    </div>
  );
}
