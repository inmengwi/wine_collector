import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatPrice(price: number | null): string {
  if (price === null) return '-';
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(price);
}

export function formatVintage(vintage: number | null): string {
  if (!vintage) return 'NV';
  return vintage.toString();
}

export function getWineTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    red: '레드',
    white: '화이트',
    rose: '로제',
    sparkling: '스파클링',
    dessert: '디저트',
    fortified: '주정강화',
    other: '기타',
  };
  return labels[type] || type;
}

export function getDrinkingStatusLabel(status: string | null): string {
  if (!status) return '-';
  const labels: Record<string, string> = {
    aging: '숙성 중',
    optimal: '마시기 좋음',
    drink_soon: '곧 마시기',
    urgent: '빨리 마시기',
  };
  return labels[status] || status;
}

export function getDrinkingStatusColor(status: string | null): string {
  if (!status) return 'gray';
  const colors: Record<string, string> = {
    aging: 'blue',
    optimal: 'green',
    drink_soon: 'yellow',
    urgent: 'red',
  };
  return colors[status] || 'gray';
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}
