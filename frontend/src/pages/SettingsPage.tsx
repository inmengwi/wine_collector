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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Header } from '../components/layout';
import { Button, Modal, TagChip, ConfirmDialog } from '../components/common';
import { useAuthStore } from '../stores';
import { tagService } from '../services';
import type { TagType, TagCreateRequest } from '../types';

interface TagFormData {
  name: string;
  type: TagType;
  color: string;
  abbreviation: string;
}

const DEFAULT_COLORS = ['#DC2626', '#EA580C', '#D97706', '#65A30D', '#0891B2', '#2563EB', '#7C3AED', '#DB2777'];

export function SettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout } = useAuthStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showCreateTagModal, setShowCreateTagModal] = useState(false);
  const [tagFormData, setTagFormData] = useState<TagFormData>({
    name: '',
    type: 'cellar',
    color: DEFAULT_COLORS[0],
    abbreviation: '',
  });

  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagService.getTags(),
  });

  const createTagMutation = useMutation({
    mutationFn: (data: TagCreateRequest) => tagService.createTag(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      setShowCreateTagModal(false);
      setTagFormData({ name: '', type: 'cellar', color: DEFAULT_COLORS[0], abbreviation: '' });
    },
  });

  const handleOpenCreateTag = (type: TagType) => {
    setTagFormData({ name: '', type, color: DEFAULT_COLORS[0], abbreviation: '' });
    setShowCreateTagModal(true);
  };

  const handleCreateTag = () => {
    if (!tagFormData.name.trim()) return;
    const request: TagCreateRequest = {
      name: tagFormData.name.trim(),
      type: tagFormData.type,
      color: tagFormData.color,
    };
    if (tagFormData.type === 'cellar' && tagFormData.abbreviation.trim()) {
      request.abbreviation = tagFormData.abbreviation.trim().toUpperCase();
    }
    createTagMutation.mutate(request);
  };

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
                  <div key={tag.id} className="flex items-center gap-1">
                    <TagChip tag={tag} />
                    {tag.abbreviation && (
                      <span className="text-xs text-gray-500 font-mono">({tag.abbreviation})</span>
                    )}
                  </div>
                ))}
              <button
                onClick={() => handleOpenCreateTag('cellar')}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-wine-600 border border-dashed border-wine-300 rounded-full hover:bg-wine-50"
              >
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
              <button
                onClick={() => handleOpenCreateTag('location')}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-wine-600 border border-dashed border-wine-300 rounded-full hover:bg-wine-50"
              >
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
              <button
                onClick={() => handleOpenCreateTag('custom')}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-wine-600 border border-dashed border-wine-300 rounded-full hover:bg-wine-50"
              >
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

      {/* Create Tag Modal */}
      <Modal
        isOpen={showCreateTagModal}
        onClose={() => setShowCreateTagModal(false)}
        title={`${tagFormData.type === 'cellar' ? '셀러' : tagFormData.type === 'location' ? '위치' : '커스텀'} 태그 추가`}
      >
        <div className="space-y-4 mt-4">
          {/* Tag Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              태그 이름
            </label>
            <input
              type="text"
              value={tagFormData.name}
              onChange={(e) => setTagFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-500 focus:border-wine-500"
              placeholder="예: 거실 셀러"
            />
          </div>

          {/* Abbreviation (only for cellar type) */}
          {tagFormData.type === 'cellar' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                약자 (견출지용)
              </label>
              <input
                type="text"
                value={tagFormData.abbreviation}
                onChange={(e) => setTagFormData(prev => ({ ...prev, abbreviation: e.target.value.toUpperCase() }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-500 focus:border-wine-500 font-mono"
                placeholder="예: WC, MC"
                maxLength={10}
              />
              <p className="mt-1 text-xs text-gray-500">
                와인 등록 시 자동으로 견출지 번호가 생성됩니다 (예: WC-001, WC-002)
              </p>
            </div>
          )}

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              색상
            </label>
            <div className="flex gap-2 flex-wrap">
              {DEFAULT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setTagFormData(prev => ({ ...prev, color }))}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    tagFormData.color === color ? 'border-gray-900 scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          {tagFormData.name && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                미리보기
              </label>
              <div className="flex items-center gap-2">
                <span
                  className="px-3 py-1.5 rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: tagFormData.color }}
                >
                  {tagFormData.name}
                </span>
                {tagFormData.type === 'cellar' && tagFormData.abbreviation && (
                  <span className="px-2 py-1 bg-wine-100 text-wine-800 text-xs font-mono font-semibold rounded">
                    {tagFormData.abbreviation}-001
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowCreateTagModal(false)}
            >
              취소
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleCreateTag}
              isLoading={createTagMutation.isPending}
              disabled={!tagFormData.name.trim()}
            >
              추가
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
