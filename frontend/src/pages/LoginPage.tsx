import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Button, Input } from '../components/common';
import { useAuthStore } from '../stores';
import { authService } from '../services';

export function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [rememberEmail, setRememberEmail] = useState(false);

  useEffect(() => {
    const savedEmail = window.localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberEmail(true);
    }
  }, []);

  const loginMutation = useMutation({
    mutationFn: () => authService.login({ email, password }),
    onSuccess: (data) => {
      setAuth(data.user, data.access_token, data.refresh_token);
      if (rememberEmail) {
        window.localStorage.setItem('rememberedEmail', email);
      } else {
        window.localStorage.removeItem('rememberedEmail');
      }
      navigate('/', { replace: true });
    },
    onError: () => {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    loginMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-wine-900 to-wine-800 flex flex-col">
      {/* Logo Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-12 h-12 text-wine-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-white">Wine Collector</h1>
        <p className="text-wine-200 mt-2 text-center">
          나만의 와인 셀러를 관리하세요
        </p>
      </div>

      {/* Login Form */}
      <div className="bg-white rounded-t-3xl px-6 py-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">로그인</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="이메일"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            autoComplete="email"
          />

          <Input
            label="비밀번호"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호 입력"
            autoComplete="current-password"
          />

          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-wine-600 focus:ring-wine-500"
              checked={rememberEmail}
              onChange={(e) => {
                setRememberEmail(e.target.checked);
                if (!e.target.checked) {
                  window.localStorage.removeItem('rememberedEmail');
                }
              }}
            />
            아이디 기억하기
          </label>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            isLoading={loginMutation.isPending}
          >
            로그인
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            계정이 없으신가요?{' '}
            <Link to="/register" className="text-wine-600 font-medium hover:text-wine-700">
              회원가입
            </Link>
          </p>
        </div>

        {/* Social Login Divider */}
        <div className="mt-6 flex items-center">
          <div className="flex-1 border-t border-gray-200" />
          <span className="px-4 text-sm text-gray-400">또는</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        {/* Social Login Buttons */}
        <div className="mt-6 space-y-3">
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => {/* TODO: Google login */}}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google로 계속하기
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => {/* TODO: Apple login */}}
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            Apple로 계속하기
          </Button>
        </div>
      </div>
    </div>
  );
}
