import { clsx } from 'clsx';

interface TasteProfileBarProps {
  label: string;
  value: number | null;
  maxValue?: number;
  color?: string;
}

function TasteProfileBar({
  label,
  value,
  maxValue = 5,
  color = '#722F37',
}: TasteProfileBarProps) {
  const normalizedValue = value ? Math.min(value, maxValue) : 0;
  const percentage = (normalizedValue / maxValue) * 100;

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-12">{label}</span>
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <div className="flex gap-0.5">
        {Array.from({ length: maxValue }).map((_, i) => (
          <div
            key={i}
            className={clsx(
              'w-2 h-2 rounded-full',
              i < normalizedValue ? 'opacity-100' : 'opacity-20'
            )}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </div>
  );
}

interface TasteProfileProps {
  body?: number | null;
  tannin?: number | null;
  acidity?: number | null;
  sweetness?: number | null;
}

export function TasteProfile({ body, tannin, acidity, sweetness }: TasteProfileProps) {
  const profiles = [
    { label: '바디', value: body, color: '#722F37' },
    { label: '탄닌', value: tannin, color: '#8B4513' },
    { label: '산도', value: acidity, color: '#DAA520' },
    { label: '당도', value: sweetness, color: '#E57B8C' },
  ].filter((p) => p.value !== null && p.value !== undefined);

  if (profiles.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {profiles.map((profile) => (
        <TasteProfileBar
          key={profile.label}
          label={profile.label}
          value={profile.value}
          color={profile.color}
        />
      ))}
    </div>
  );
}
