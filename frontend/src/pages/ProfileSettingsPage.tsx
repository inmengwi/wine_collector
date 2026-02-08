import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckIcon } from '@heroicons/react/24/outline';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Header } from '../components/layout';
import { Button } from '../components/common';
import { useAuthStore } from '../stores';
import { authService } from '../services';
import type { ProfileUpdateRequest } from '../types';

const LANGUAGE_OPTIONS = [
  { value: 'ko', label: '한국어' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'zh', label: '中文' },
  { value: 'fr', label: 'Français' },
  { value: 'es', label: 'Español' },
  { value: 'it', label: 'Italiano' },
  { value: 'de', label: 'Deutsch' },
];

const GENDER_OPTIONS = [
  { value: 'male', label: '남성' },
  { value: 'female', label: '여성' },
  { value: 'other', label: '기타' },
  { value: 'prefer_not_to_say', label: '선택 안 함' },
];

const BIRTH_YEAR_OPTIONS = (() => {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear - 15; y >= 1940; y--) {
    years.push(y);
  }
  return years;
})();

export function ProfileSettingsPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();

  const [name, setName] = useState(user?.name || '');
  const [birthYear, setBirthYear] = useState<number | null>(user?.birth_year || null);
  const [language, setLanguage] = useState(user?.language || '');
  const [nationality, setNationality] = useState(user?.nationality || '');
  const [gender, setGender] = useState(user?.gender || '');
  const [winePreferences, setWinePreferences] = useState(user?.wine_preferences || '');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setBirthYear(user.birth_year || null);
      setLanguage(user.language || '');
      setNationality(user.nationality || '');
      setGender(user.gender || '');
      setWinePreferences(user.wine_preferences || '');
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: (data: ProfileUpdateRequest) => authService.updateProfile(data),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      toast.success('프로필이 저장되었습니다.');
      navigate('/settings');
    },
    onError: () => {
      toast.error('프로필 저장에 실패했습니다.');
    },
  });

  const handleSave = () => {
    const data: ProfileUpdateRequest = {
      name: name.trim() || undefined,
      birth_year: birthYear,
      language: language || null,
      nationality: nationality.trim() || null,
      gender: gender || null,
      wine_preferences: winePreferences.trim() || null,
    };
    updateMutation.mutate(data);
  };

  const selectClass =
    'block w-full rounded-lg border border-gray-300 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-wine-500 focus:border-transparent px-4 py-2.5 bg-white text-gray-900 appearance-none';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="프로필 설정"
        showBack
        rightAction={
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending || !name.trim()}
            className="text-wine-600 font-medium disabled:text-gray-400"
          >
            <CheckIcon className="h-6 w-6" />
          </button>
        }
      />

      <div className="p-4 space-y-5">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            이름
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-wine-500 focus:border-transparent px-4 py-2.5"
            placeholder="이름을 입력하세요"
          />
        </div>

        {/* Birth Year */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            태어난 해
          </label>
          <select
            value={birthYear ?? ''}
            onChange={(e) => setBirthYear(e.target.value ? Number(e.target.value) : null)}
            className={selectClass}
          >
            <option value="">선택하세요</option>
            {BIRTH_YEAR_OPTIONS.map((year) => (
              <option key={year} value={year}>
                {year}년
              </option>
            ))}
          </select>
        </div>

        {/* Language */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            언어
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className={selectClass}
          >
            <option value="">선택하세요</option>
            {LANGUAGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Nationality */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            국적
          </label>
          <input
            type="text"
            value={nationality}
            onChange={(e) => setNationality(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-wine-500 focus:border-transparent px-4 py-2.5"
            placeholder="예: 대한민국"
          />
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            성별
          </label>
          <div className="grid grid-cols-2 gap-2">
            {GENDER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setGender(gender === opt.value ? '' : opt.value)}
                className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  gender === opt.value
                    ? 'border-wine-500 bg-wine-50 text-wine-700'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Wine Preferences */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            와인 취향
          </label>
          <textarea
            value={winePreferences}
            onChange={(e) => setWinePreferences(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-wine-500 focus:border-transparent px-4 py-2.5 resize-none"
            rows={4}
            maxLength={500}
            placeholder="선호하는 와인 스타일이나 취향을 자유롭게 적어주세요.&#10;예: 풀바디 레드 와인을 좋아하고, 탄닌이 강한 와인을 선호합니다."
          />
          <p className="mt-1 text-xs text-gray-400 text-right">
            {winePreferences.length}/500
          </p>
        </div>

        {/* Save Button */}
        <div className="pt-2">
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleSave}
            isLoading={updateMutation.isPending}
            disabled={!name.trim()}
          >
            저장
          </Button>
        </div>
      </div>
    </div>
  );
}
