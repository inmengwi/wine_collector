import { clsx } from 'clsx';
import type { WineType } from '@/types';

interface WineBottleIllustrationProps {
  type: WineType;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const bottleColors: Record<WineType, { body: string; highlight: string; label: string; liquid: string }> = {
  red: { body: '#2D1B1E', highlight: '#4A2E33', label: '#722F37', liquid: '#5C1A24' },
  white: { body: '#3B4A2E', highlight: '#556B3A', label: '#C9A962', liquid: '#E8D89A' },
  rose: { body: '#4A3040', highlight: '#6B4458', label: '#E57B8C', liquid: '#F4A0AD' },
  sparkling: { body: '#2E3B2E', highlight: '#3F5040', label: '#FFD700', liquid: '#F5E6A3' },
  dessert: { body: '#3B2E1E', highlight: '#5A4530', label: '#DAA520', liquid: '#D4A040' },
  fortified: { body: '#1E1410', highlight: '#3A2820', label: '#8B4513', liquid: '#6B2A0E' },
  other: { body: '#2E3038', highlight: '#444850', label: '#6B7280', liquid: '#8B8F98' },
};

const sizes = {
  sm: { width: 32, height: 48 },
  md: { width: 48, height: 72 },
  lg: { width: 64, height: 96 },
  xl: { width: 96, height: 144 },
};

function RedWineBottle({ colors, w, h }: { colors: typeof bottleColors.red; w: number; h: number }) {
  return (
    <svg viewBox="0 0 60 100" width={w} height={h} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Bottle body - Bordeaux style */}
      <path d="M24 15 L24 30 Q14 38 14 50 L14 88 Q14 92 18 92 L42 92 Q46 92 46 88 L46 50 Q46 38 36 30 L36 15 Z" fill={colors.body} />
      <path d="M26 15 L26 30 Q18 38 18 50 L18 85 Q18 86 19 86 L26 86 L26 50 Q26 40 30 34 L30 15 Z" fill={colors.highlight} opacity="0.3" />
      {/* Neck */}
      <rect x="25" y="4" width="10" height="12" rx="1" fill={colors.body} />
      <rect x="26" y="4" width="3" height="12" rx="0.5" fill={colors.highlight} opacity="0.3" />
      {/* Foil cap */}
      <rect x="23" y="2" width="14" height="5" rx="2" fill={colors.label} />
      {/* Label */}
      <rect x="19" y="55" width="22" height="20" rx="1" fill="#F5F0E8" />
      <rect x="22" y="59" width="16" height="2" rx="0.5" fill={colors.label} />
      <rect x="24" y="63" width="12" height="1" rx="0.5" fill={colors.label} opacity="0.5" />
      <rect x="23" y="66" width="14" height="1" rx="0.5" fill={colors.label} opacity="0.3" />
      <rect x="25" y="69" width="10" height="1" rx="0.5" fill={colors.label} opacity="0.3" />
      {/* Liquid level hint */}
      <path d="M16 45 Q30 42 44 45 L44 88 Q44 91 42 92 L18 92 Q16 91 16 88 Z" fill={colors.liquid} opacity="0.2" />
    </svg>
  );
}

function WhiteWineBottle({ colors, w, h }: { colors: typeof bottleColors.white; w: number; h: number }) {
  return (
    <svg viewBox="0 0 60 100" width={w} height={h} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Bottle body - Burgundy/slender style */}
      <path d="M25 18 L25 34 Q16 42 16 52 L16 88 Q16 92 20 92 L40 92 Q44 92 44 88 L44 52 Q44 42 35 34 L35 18 Z" fill={colors.body} />
      <path d="M27 18 L27 34 Q20 42 20 52 L20 85 Q20 86 21 86 L27 86 L27 52 Q27 44 31 38 L31 18 Z" fill={colors.highlight} opacity="0.3" />
      {/* Neck - taller */}
      <rect x="26" y="4" width="8" height="15" rx="1" fill={colors.body} />
      <rect x="27" y="4" width="3" height="15" rx="0.5" fill={colors.highlight} opacity="0.3" />
      {/* Foil cap */}
      <rect x="24" y="2" width="12" height="5" rx="2" fill={colors.label} />
      {/* Label */}
      <rect x="20" y="54" width="20" height="22" rx="1" fill="#FFFDF5" />
      <rect x="23" y="58" width="14" height="2" rx="0.5" fill={colors.label} />
      <rect x="25" y="62" width="10" height="1" rx="0.5" fill={colors.label} opacity="0.5" />
      <rect x="24" y="65" width="12" height="1" rx="0.5" fill={colors.label} opacity="0.3" />
      <circle cx="30" cy="70" r="2.5" fill={colors.label} opacity="0.3" />
    </svg>
  );
}

function SparklingBottle({ colors, w, h }: { colors: typeof bottleColors.sparkling; w: number; h: number }) {
  return (
    <svg viewBox="0 0 60 100" width={w} height={h} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Bottle body - Champagne style (wider bottom, sloped shoulders) */}
      <path d="M24 22 L24 36 Q12 44 12 54 L13 88 Q13 92 18 92 L42 92 Q47 92 47 88 L48 54 Q48 44 36 36 L36 22 Z" fill={colors.body} />
      <path d="M26 22 L26 36 Q16 44 16 54 L16 85 Q16 86 17 86 L26 86 L26 54 Q26 46 30 40 L30 22 Z" fill={colors.highlight} opacity="0.3" />
      {/* Neck */}
      <rect x="26" y="8" width="8" height="15" rx="1" fill={colors.body} />
      {/* Mushroom cork + wire cage */}
      <path d="M25 4 Q25 0 30 0 Q35 0 35 4 L35 9 L25 9 Z" fill="#C4A35A" />
      <path d="M26 9 L34 9 L34 6 L26 6 Z" fill={colors.label} opacity="0.6" />
      {/* Foil */}
      <rect x="24" y="8" width="12" height="4" rx="1" fill={colors.label} />
      {/* Label */}
      <rect x="18" y="56" width="24" height="18" rx="1" fill="#FFFEF8" />
      <rect x="22" y="60" width="16" height="2" rx="0.5" fill={colors.label} />
      <rect x="24" y="64" width="12" height="1" rx="0.5" fill={colors.label} opacity="0.5" />
      {/* Star decoration */}
      <path d="M30 68 L31 70 L33 70 L31.5 71.5 L32 73.5 L30 72 L28 73.5 L28.5 71.5 L27 70 L29 70 Z" fill={colors.label} opacity="0.4" />
      {/* Bubbles */}
      <circle cx="22" cy="48" r="1" fill="white" opacity="0.3" />
      <circle cx="38" cy="50" r="0.8" fill="white" opacity="0.2" />
      <circle cx="25" cy="52" r="0.6" fill="white" opacity="0.25" />
    </svg>
  );
}

function DessertBottle({ colors, w, h }: { colors: typeof bottleColors.dessert; w: number; h: number }) {
  return (
    <svg viewBox="0 0 60 100" width={w} height={h} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Bottle body - smaller, rounder (375ml style) */}
      <path d="M22 20 L22 35 Q14 42 14 52 L14 82 Q14 88 20 88 L40 88 Q46 88 46 82 L46 52 Q46 42 38 35 L38 20 Z" fill={colors.body} />
      <path d="M24 20 L24 35 Q18 42 18 52 L18 80 Q18 82 19 82 L24 82 L24 52 Q24 44 28 38 L28 20 Z" fill={colors.highlight} opacity="0.3" />
      {/* Neck */}
      <rect x="25" y="6" width="10" height="15" rx="1" fill={colors.body} />
      {/* Cork */}
      <rect x="26" y="2" width="8" height="6" rx="2" fill="#C4A35A" />
      {/* Elegant label */}
      <rect x="18" y="50" width="24" height="22" rx="2" fill="#FFF8E7" />
      <rect x="18" y="50" width="24" height="5" rx="2" fill={colors.label} opacity="0.2" />
      <rect x="22" y="58" width="16" height="2" rx="0.5" fill={colors.label} />
      <rect x="24" y="62" width="12" height="1" rx="0.5" fill={colors.label} opacity="0.5" />
      <rect x="25" y="65" width="10" height="1" rx="0.5" fill={colors.label} opacity="0.3" />
    </svg>
  );
}

function FortifiedBottle({ colors, w, h }: { colors: typeof bottleColors.fortified; w: number; h: number }) {
  return (
    <svg viewBox="0 0 60 100" width={w} height={h} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Bottle body - Port style (wider, bulkier) */}
      <path d="M22 18 L22 30 Q10 40 10 52 L10 86 Q10 92 16 92 L44 92 Q50 92 50 86 L50 52 Q50 40 38 30 L38 18 Z" fill={colors.body} />
      <path d="M24 18 L24 30 Q14 40 14 52 L14 84 Q14 86 15 86 L24 86 L24 52 Q24 42 28 34 L28 18 Z" fill={colors.highlight} opacity="0.3" />
      {/* Neck - short and stout */}
      <rect x="25" y="6" width="10" height="13" rx="1" fill={colors.body} />
      {/* Cork + seal */}
      <rect x="24" y="2" width="12" height="6" rx="2" fill="#8B6914" />
      {/* Label - classic port style */}
      <rect x="15" y="52" width="30" height="26" rx="2" fill="#F5ECD8" />
      <rect x="15" y="52" width="30" height="7" rx="2" fill={colors.label} opacity="0.15" />
      <rect x="20" y="62" width="20" height="2.5" rx="0.5" fill={colors.label} />
      <rect x="22" y="66" width="16" height="1" rx="0.5" fill={colors.label} opacity="0.5" />
      <rect x="24" y="69" width="12" height="1" rx="0.5" fill={colors.label} opacity="0.3" />
      <rect x="25" y="72" width="10" height="1" rx="0.5" fill={colors.label} opacity="0.3" />
    </svg>
  );
}

function GenericBottle({ colors, w, h }: { colors: typeof bottleColors.other; w: number; h: number }) {
  return (
    <svg viewBox="0 0 60 100" width={w} height={h} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Generic wine bottle */}
      <path d="M24 16 L24 32 Q15 40 15 50 L15 88 Q15 92 19 92 L41 92 Q45 92 45 88 L45 50 Q45 40 36 32 L36 16 Z" fill={colors.body} />
      <path d="M26 16 L26 32 Q19 40 19 50 L19 85 Q19 86 20 86 L26 86 L26 50 Q26 42 30 36 L30 16 Z" fill={colors.highlight} opacity="0.3" />
      {/* Neck */}
      <rect x="26" y="4" width="8" height="13" rx="1" fill={colors.body} />
      {/* Cap */}
      <rect x="24" y="2" width="12" height="5" rx="2" fill={colors.label} />
      {/* Label */}
      <rect x="19" y="54" width="22" height="20" rx="1" fill="#F0F0F0" />
      <rect x="22" y="58" width="16" height="2" rx="0.5" fill={colors.label} />
      <rect x="24" y="62" width="12" height="1" rx="0.5" fill={colors.label} opacity="0.5" />
      <rect x="23" y="65" width="14" height="1" rx="0.5" fill={colors.label} opacity="0.3" />
    </svg>
  );
}

const bottleComponents: Record<WineType, React.FC<{ colors: typeof bottleColors.red; w: number; h: number }>> = {
  red: RedWineBottle,
  white: WhiteWineBottle,
  rose: GenericBottle,
  sparkling: SparklingBottle,
  dessert: DessertBottle,
  fortified: FortifiedBottle,
  other: GenericBottle,
};

export function WineBottleIllustration({ type, size = 'md', className }: WineBottleIllustrationProps) {
  const colors = bottleColors[type] || bottleColors.other;
  const { width, height } = sizes[size];
  const BottleComponent = bottleComponents[type] || GenericBottle;

  // Rosé uses the white bottle shape with rosé colors
  const RoseBottle = type === 'rose' ? WhiteWineBottle : BottleComponent;

  return (
    <div className={clsx('inline-flex items-center justify-center', className)}>
      <RoseBottle colors={colors} w={width} h={height} />
    </div>
  );
}
