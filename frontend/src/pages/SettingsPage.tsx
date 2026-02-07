import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  UserCircleIcon,
  TagIcon,
  BellIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon,
  ChevronRightIcon,
  PlusIcon,
  XMarkIcon,
  CpuChipIcon,
} from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Header } from '../components/layout';
import { Button, Modal, TagChip, ConfirmDialog } from '../components/common';
import { useAuthStore } from '../stores';
import { tagService, aiSettingsService } from '../services';
import type { AISettingsResponse } from '../services/aiSettingsService';
import type { Tag, TagType, TagCreateRequest } from '../types';

interface TagFormData {
  name: string;
  type: TagType;
  color: string;
}

const DEFAULT_COLORS = ['#DC2626', '#EA580C', '#D97706', '#65A30D', '#0891B2', '#2563EB', '#7C3AED', '#DB2777'];

export function SettingsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user, logout } = useAuthStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showAISettingsModal, setShowAISettingsModal] = useState(false);
  const [showCreateTagModal, setShowCreateTagModal] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);
  const [tagFormData, setTagFormData] = useState<TagFormData>({
    name: '',
    type: 'cellar',
    color: DEFAULT_COLORS[0],
  });

  // Handle navigation state to auto-open tag modal
  useEffect(() => {
    const state = location.state as { openTagModal?: boolean } | null;
    if (state?.openTagModal) {
      setShowTagModal(true);
      // Clear the state to prevent re-opening on subsequent renders
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagService.getTags(),
  });

  const { data: aiSettings } = useQuery({
    queryKey: ['ai-settings'],
    queryFn: () => aiSettingsService.getSettings(),
  });

  const createTagMutation = useMutation({
    mutationFn: (data: TagCreateRequest) => tagService.createTag(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      setShowCreateTagModal(false);
      setTagFormData({ name: '', type: 'cellar', color: DEFAULT_COLORS[0] });
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: (tagId: string) => tagService.deleteTag(tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      setTagToDelete(null);
    },
  });

  const handleOpenCreateTag = (type: TagType) => {
    setTagFormData({ name: '', type, color: DEFAULT_COLORS[0] });
    setShowCreateTagModal(true);
  };

  const handleCreateTag = () => {
    if (!tagFormData.name.trim()) return;
    const request: TagCreateRequest = {
      name: tagFormData.name.trim(),
      type: tagFormData.type,
      color: tagFormData.color,
    };
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
      icon: CpuChipIcon,
      label: 'AI 모델 설정',
      onClick: () => setShowAISettingsModal(true),
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

      {/* AI Settings Modal */}
      <Modal
        isOpen={showAISettingsModal}
        onClose={() => setShowAISettingsModal(false)}
        title="AI 모델 설정"
      >
        <div className="space-y-5 mt-4">
          <p className="text-sm text-gray-500">
            와인 스캔과 추천에 각각 다른 AI 모델을 사용하여 정확도와 비용을 최적화할 수 있습니다.
            서버 환경변수에서 설정을 변경할 수 있습니다.
          </p>

          {aiSettings ? (
            <>
              {/* Scan Model */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  와인 스캔 (Vision)
                </h3>
                <p className="text-xs text-gray-500 mb-3">
                  라벨 이미지를 분석하여 와인 정보를 추출합니다. 이미지 인식 능력이 뛰어난 모델이 유리합니다.
                </p>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                    {aiSettings.scan.provider}
                  </span>
                  <span className="text-sm text-gray-700 font-mono">
                    {aiSettings.scan.model}
                  </span>
                </div>
              </div>

              {/* Recommendation Model */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  와인 추천 (Text)
                </h3>
                <p className="text-xs text-gray-500 mb-3">
                  소믈리에처럼 와인을 추천합니다. 추론 능력이 뛰어난 모델이 유리합니다.
                </p>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800">
                    {aiSettings.recommendation.provider}
                  </span>
                  <span className="text-sm text-gray-700 font-mono">
                    {aiSettings.recommendation.model}
                  </span>
                </div>
              </div>

              {/* Env variable guide */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-xs font-semibold text-gray-700 mb-2">환경변수 설정 가이드</h4>
                <div className="space-y-1 text-xs text-gray-500 font-mono">
                  <p>SCAN_AI_PROVIDER=gemini</p>
                  <p>SCAN_AI_MODEL=gemini-2.5-flash</p>
                  <p>RECOMMENDATION_AI_PROVIDER=anthropic</p>
                  <p>RECOMMENDATION_AI_MODEL=claude-sonnet-4-20250514</p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-4 text-sm text-gray-400">
              AI 설정을 불러오는 중...
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button onClick={() => setShowAISettingsModal(false)}>닫기</Button>
          </div>
        </div>
      </Modal>

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
                    <button
                      onClick={() => setTagToDelete(tag)}
                      className="p-0.5 text-gray-400 hover:text-red-500 transition-colors"
                      title="삭제"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
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
                  <div key={tag.id} className="flex items-center gap-1">
                    <TagChip tag={tag} />
                    <button
                      onClick={() => setTagToDelete(tag)}
                      className="p-0.5 text-gray-400 hover:text-red-500 transition-colors"
                      title="삭제"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
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
                  <div key={tag.id} className="flex items-center gap-1">
                    <TagChip tag={tag} />
                    <button
                      onClick={() => setTagToDelete(tag)}
                      className="p-0.5 text-gray-400 hover:text-red-500 transition-colors"
                      title="삭제"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
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

      {/* Delete Tag Confirm */}
      <ConfirmDialog
        isOpen={!!tagToDelete}
        onClose={() => setTagToDelete(null)}
        onConfirm={() => tagToDelete && deleteTagMutation.mutate(tagToDelete.id)}
        title="태그 삭제"
        message={`"${tagToDelete?.name}" 태그를 삭제하시겠습니까? 이미 와인에 추가된 태그 정보는 유지됩니다.`}
        confirmText="삭제"
        variant="danger"
        isLoading={deleteTagMutation.isPending}
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
              <span
                className="px-3 py-1.5 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: tagFormData.color }}
              >
                {tagFormData.name}
              </span>
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
