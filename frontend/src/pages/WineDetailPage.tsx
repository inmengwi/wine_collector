import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PencilIcon,
  TrashIcon,
  MinusIcon,
  PlusIcon,
  GiftIcon,
  CheckIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { Header } from '../components/layout';
import {
  Loading,
  EmptyState,
  Button,
  Modal,
  Badge,
  TasteProfile,
  TagChip,
  ConfirmDialog,
  WineTypeIcon,
} from '../components/common';
import { wineService, tagService } from '../services';
import {
  formatDate,
  formatPrice,
  formatVintage,
  getWineTypeLabel,
  getDrinkingStatusLabel,
  getDrinkingStatusColor,
} from '../lib/utils';
import type { UserWineUpdateRequest, Tag } from '../types';

interface EditFormData {
  purchase_date: string;
  purchase_price: string;
  purchase_place: string;
  personal_note: string;
  tag_ids: string[];
}

export function WineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showConsumeModal, setShowConsumeModal] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    purchase_date: '',
    purchase_price: '',
    purchase_place: '',
    personal_note: '',
    tag_ids: [],
  });

  const invalidateWineQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['user-wine', id] });
    queryClient.invalidateQueries({ queryKey: ['user-wines'] });
  };

  const { data: userWine, isLoading, error } = useQuery({
    queryKey: ['user-wine', id],
    queryFn: () => wineService.getWine(id!),
    enabled: !!id,
  });

  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagService.getTags(),
  });

  const updateQuantityMutation = useMutation({
    mutationFn: ({ action, amount }: { action: 'increase' | 'decrease'; amount: number }) =>
      wineService.updateWineQuantity(id!, { action, amount }),
    onSuccess: () => {
      invalidateWineQueries();
    },
  });

  const consumeMutation = useMutation({
    mutationFn: (data: { rating?: number; tasting_note?: string }) =>
      wineService.updateWineStatus(id!, { status: 'consumed', ...data }),
    onSuccess: () => {
      invalidateWineQueries();
      setShowConsumeModal(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => wineService.deleteWine(id!),
    onSuccess: () => {
      navigate('/cellar', { replace: true });
    },
  });

  const updateWineMutation = useMutation({
    mutationFn: (data: UserWineUpdateRequest) => wineService.updateWine(id!, data),
    onSuccess: () => {
      invalidateWineQueries();
      setShowEditModal(false);
    },
  });

  const handleOpenEditModal = () => {
    if (userWine) {
      setEditFormData({
        purchase_date: userWine.purchase_date || '',
        purchase_price: userWine.purchase_price?.toString() || '',
        purchase_place: userWine.purchase_place || '',
        personal_note: userWine.personal_note || '',
        tag_ids: userWine.tags.map((t: Tag) => t.id),
      });
      setShowEditModal(true);
    }
  };

  const handleSaveEdit = () => {
    const updateData: UserWineUpdateRequest = {};

    if (editFormData.purchase_date) {
      updateData.purchase_date = editFormData.purchase_date;
    }
    if (editFormData.purchase_price) {
      updateData.purchase_price = parseFloat(editFormData.purchase_price);
    }
    if (editFormData.purchase_place) {
      updateData.purchase_place = editFormData.purchase_place;
    }
    if (editFormData.personal_note) {
      updateData.personal_note = editFormData.personal_note;
    }
    updateData.tag_ids = editFormData.tag_ids;

    updateWineMutation.mutate(updateData);
  };

  const handleTagToggle = (tagId: string) => {
    setEditFormData(prev => ({
      ...prev,
      tag_ids: prev.tag_ids.includes(tagId)
        ? prev.tag_ids.filter(id => id !== tagId)
        : [...prev.tag_ids, tagId],
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" text="와인 정보를 불러오는 중..." />
      </div>
    );
  }

  if (error || !userWine) {
    return (
      <div className="min-h-screen">
        <Header title="와인 상세" showBack />
        <EmptyState
          title="와인을 찾을 수 없습니다"
          description="요청하신 와인 정보가 존재하지 않습니다"
          action={
            <Button onClick={() => navigate('/cellar')}>셀러로 돌아가기</Button>
          }
          className="mt-20"
        />
      </div>
    );
  }

  const { wine, quantity, tags, drinking_status } = userWine;
  const statusColor = getDrinkingStatusColor(drinking_status);
  const statusVariant = statusColor === 'red' ? 'danger'
    : statusColor === 'yellow' ? 'warning'
    : statusColor === 'green' ? 'success'
    : 'default';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        showBack
        rightAction={
          <button
            onClick={handleOpenEditModal}
            className="p-2 text-gray-600 hover:text-gray-900"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
        }
      />

      {/* Hero Image */}
      <div className="relative h-64 bg-gradient-to-b from-wine-100 to-white">
        {wine.image_url ? (
          <img
            src={wine.image_url}
            alt={wine.name}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <WineTypeIcon type={wine.type} size="lg" className="h-24 w-24 text-wine-300" />
          </div>
        )}
      </div>

      {/* Wine Info */}
      <div className="px-4 -mt-4 relative">
        <div className="bg-white rounded-xl shadow-lg p-4">
          {/* Basic Info */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                {userWine.label_number && (
                  <span className="px-2 py-1 bg-wine-100 text-wine-800 text-sm font-mono font-semibold rounded">
                    {userWine.label_number}
                  </span>
                )}
                <Badge variant="wine">{getWineTypeLabel(wine.type)}</Badge>
                {drinking_status && (
                  <Badge variant={statusVariant}>
                    {getDrinkingStatusLabel(drinking_status)}
                  </Badge>
                )}
              </div>
              <h1 className="text-xl font-bold text-gray-900 mt-2">{wine.name}</h1>
              {wine.producer && (
                <p className="text-gray-600">{wine.producer}</p>
              )}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-wine-700">
                {formatVintage(wine.vintage)}
              </div>
            </div>
          </div>

          {/* Region */}
          {(wine.region || wine.country || wine.appellation) && (
            <div className="mt-3 text-sm text-gray-500">
              {[wine.appellation, wine.region, wine.country].filter(Boolean).join(' · ')}
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="mt-3 flex gap-2 flex-wrap">
              {tags.map((tag) => (
                <TagChip key={tag.id} tag={tag} />
              ))}
            </div>
          )}

          {/* Quantity Control */}
          <div className="mt-4 flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">보유 수량</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => updateQuantityMutation.mutate({ action: 'decrease', amount: 1 })}
                disabled={quantity <= 1 || updateQuantityMutation.isPending}
                className="p-1.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                <MinusIcon className="h-4 w-4" />
              </button>
              <span className="text-lg font-semibold text-wine-700 min-w-[3rem] text-center">
                {quantity}병
              </span>
              <button
                onClick={() => updateQuantityMutation.mutate({ action: 'increase', amount: 1 })}
                disabled={updateQuantityMutation.isPending}
                className="p-1.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Details Sections */}
        <div className="mt-4 space-y-4">
          {/* Taste Profile */}
          {wine.taste_profile && (
            <div className="bg-white rounded-xl p-4">
              <h2 className="text-sm font-medium text-gray-500 mb-3">맛 프로필</h2>
              <TasteProfile {...wine.taste_profile} />
            </div>
          )}

          {/* Wine Details */}
          <div className="bg-white rounded-xl p-4">
            <h2 className="text-sm font-medium text-gray-500 mb-3">와인 정보</h2>
            <dl className="space-y-2">
              {wine.grape_variety && wine.grape_variety.length > 0 && (
                <div className="flex justify-between">
                  <dt className="text-gray-600">품종</dt>
                  <dd className="text-gray-900">{wine.grape_variety.join(', ')}</dd>
                </div>
              )}
              {wine.abv && (
                <div className="flex justify-between">
                  <dt className="text-gray-600">알코올 도수</dt>
                  <dd className="text-gray-900">{wine.abv}%</dd>
                </div>
              )}
              {(wine.serving_temp_min || wine.serving_temp_max) && (
                <div className="flex justify-between">
                  <dt className="text-gray-600">적정 온도</dt>
                  <dd className="text-gray-900">
                    {wine.serving_temp_min}-{wine.serving_temp_max}°C
                  </dd>
                </div>
              )}
              {(wine.drinking_window_start || wine.drinking_window_end) && (
                <div className="flex justify-between">
                  <dt className="text-gray-600">음용 시기</dt>
                  <dd className="text-gray-900">
                    {wine.drinking_window_start}-{wine.drinking_window_end}년
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Food Pairing */}
          {wine.food_pairing && wine.food_pairing.length > 0 && (
            <div className="bg-white rounded-xl p-4">
              <h2 className="text-sm font-medium text-gray-500 mb-3">음식 페어링</h2>
              <div className="flex flex-wrap gap-2">
                {wine.food_pairing.map((food: string, idx: number) => (
                  <Badge key={idx} variant="default">{food}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Flavor Notes */}
          {wine.flavor_notes && wine.flavor_notes.length > 0 && (
            <div className="bg-white rounded-xl p-4">
              <h2 className="text-sm font-medium text-gray-500 mb-3">향과 맛</h2>
              <div className="flex flex-wrap gap-2">
                {wine.flavor_notes.map((note: string, idx: number) => (
                  <Badge key={idx} variant="wine">{note}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Purchase Info */}
          <div className="bg-white rounded-xl p-4">
            <h2 className="text-sm font-medium text-gray-500 mb-3">구매 정보</h2>
            <dl className="space-y-2">
              {userWine.purchase_date && (
                <div className="flex justify-between">
                  <dt className="text-gray-600">구매일</dt>
                  <dd className="text-gray-900">{formatDate(userWine.purchase_date)}</dd>
                </div>
              )}
              {userWine.purchase_price && (
                <div className="flex justify-between">
                  <dt className="text-gray-600">구매가</dt>
                  <dd className="text-gray-900">{formatPrice(userWine.purchase_price)}</dd>
                </div>
              )}
              {userWine.purchase_place && (
                <div className="flex justify-between">
                  <dt className="text-gray-600">구매처</dt>
                  <dd className="text-gray-900">{userWine.purchase_place}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Personal Note */}
          {userWine.personal_note && (
            <div className="bg-white rounded-xl p-4">
              <h2 className="text-sm font-medium text-gray-500 mb-3">메모</h2>
              <p className="text-gray-700">{userWine.personal_note}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pb-6">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowGiftModal(true)}
            >
              <GiftIcon className="h-4 w-4 mr-2" />
              선물
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={() => setShowConsumeModal(true)}
            >
              <CheckIcon className="h-4 w-4 mr-2" />
              마셨어요
            </Button>
          </div>

          {/* Delete */}
          <div className="pb-8">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full text-center text-sm text-red-600 hover:text-red-700"
            >
              <TrashIcon className="h-4 w-4 inline mr-1" />
              와인 삭제
            </button>
          </div>
        </div>
      </div>

      {/* Consume Modal */}
      <Modal
        isOpen={showConsumeModal}
        onClose={() => setShowConsumeModal(false)}
        title="와인 마시기"
      >
        <p className="text-gray-600 mb-4">이 와인을 마셨습니다로 기록할까요?</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setShowConsumeModal(false)} className="flex-1">
            취소
          </Button>
          <Button
            variant="primary"
            onClick={() => consumeMutation.mutate({})}
            isLoading={consumeMutation.isPending}
            className="flex-1"
          >
            확인
          </Button>
        </div>
      </Modal>

      {/* Gift Modal */}
      <Modal
        isOpen={showGiftModal}
        onClose={() => setShowGiftModal(false)}
        title="와인 선물하기"
      >
        <p className="text-gray-600 mb-4">이 와인을 선물했습니다로 기록할까요?</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setShowGiftModal(false)} className="flex-1">
            취소
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              wineService.updateWineStatus(id!, { status: 'gifted' }).then(() => {
                invalidateWineQueries();
                setShowGiftModal(false);
              });
            }}
            className="flex-1"
          >
            확인
          </Button>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="와인 삭제"
        message="이 와인을 셀러에서 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmText="삭제"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="와인 정보 수정"
        size="lg"
      >
        <div className="space-y-4">
          {/* Purchase Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              구매일
            </label>
            <input
              type="date"
              value={editFormData.purchase_date}
              onChange={(e) => setEditFormData(prev => ({ ...prev, purchase_date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-500 focus:border-wine-500"
            />
          </div>

          {/* Purchase Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              구매가 (원)
            </label>
            <input
              type="number"
              value={editFormData.purchase_price}
              onChange={(e) => setEditFormData(prev => ({ ...prev, purchase_price: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-500 focus:border-wine-500"
              placeholder="예: 50000"
              min="0"
            />
          </div>

          {/* Purchase Place */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              구매처
            </label>
            <input
              type="text"
              value={editFormData.purchase_place}
              onChange={(e) => setEditFormData(prev => ({ ...prev, purchase_place: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-500 focus:border-wine-500"
              placeholder="예: 와인샵, 이마트"
            />
          </div>

          {/* Tags */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                태그
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  navigate('/settings', { state: { openTagModal: true } });
                }}
                className="flex items-center gap-1 text-xs text-wine-600 hover:text-wine-700"
              >
                <Cog6ToothIcon className="h-3.5 w-3.5" />
                관리
              </button>
            </div>
            {tagsData && tagsData.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {tagsData.tags.map((tag: Tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleTagToggle(tag.id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      editFormData.tag_ids.includes(tag.id)
                        ? 'bg-wine-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    style={editFormData.tag_ids.includes(tag.id) ? { backgroundColor: tag.color } : undefined}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                등록된 태그가 없습니다.{' '}
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    navigate('/settings', { state: { openTagModal: true } });
                  }}
                  className="text-wine-600 hover:text-wine-700 underline"
                >
                  태그 추가하기
                </button>
              </p>
            )}
          </div>

          {/* Personal Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              메모
            </label>
            <textarea
              value={editFormData.personal_note}
              onChange={(e) => setEditFormData(prev => ({ ...prev, personal_note: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-500 focus:border-wine-500 resize-none"
              rows={3}
              placeholder="와인에 대한 메모를 남겨보세요"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowEditModal(false)}
            >
              취소
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleSaveEdit}
              isLoading={updateWineMutation.isPending}
            >
              저장
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
