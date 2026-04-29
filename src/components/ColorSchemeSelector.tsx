import { useState } from 'react';
import { useAppStore } from '../store';
import { t } from '../i18n';
import { Palette, Check } from '@phosphor-icons/react';

const PREDEFINED_PALETTES = [
  {
    id: 'minimal-noir',
    name: 'Minimal Noir',
    colors: {
      bg: '#000000',
      surface: '#0A0A0A',
      border: '#222222',
      textMain: '#FFFFFF',
      textMuted: '#888888',
      accentRed: '#FFFFFF',
      bgRed: '#111111',
    }
  },
  {
    id: 'minimal-blanc',
    name: 'Minimal Blanc',
    colors: {
      bg: '#FFFFFF',
      surface: '#FAFAFA',
      border: '#EAEAEA',
      textMain: '#000000',
      textMuted: '#888888',
      accentRed: '#000000',
      bgRed: '#F5F5F5',
    }
  },
  {
    id: 'default',
    name: 'Default',
    colors: {
      bg: '#FBFBFA',
      surface: '#FFFFFF',
      border: '#EAEAEA',
      textMain: '#2F3437',
      textMuted: '#787774',
      accentRed: '#9F2F2D',
      bgRed: '#FDEBEC',
    }
  },
  {
    id: 'warm-sepia',
    name: 'Warm Sepia',
    colors: {
      bg: '#F5EFE6',
      surface: '#FAF6F0',
      border: '#E6DCCB',
      textMain: '#4A3B32',
      textMuted: '#8C7A6B',
      accentRed: '#8C5A35',
      bgRed: '#F5EFE6',
    }
  },
  {
    id: 'cool-grays',
    name: 'Cool Grays',
    colors: {
      bg: '#F0F2F5',
      surface: '#FFFFFF',
      border: '#DDE1E6',
      textMain: '#121619',
      textMuted: '#525C67',
      accentRed: '#344054',
      bgRed: '#F0F2F5',
    }
  },
  {
    id: 'deep-indigo',
    name: 'Deep Indigo',
    colors: {
      bg: '#F5F6FA',
      surface: '#FFFFFF',
      border: '#E2E6F0',
      textMain: '#1E1B4B',
      textMuted: '#4F46E5',
      accentRed: '#312E81',
      bgRed: '#E0E7FF',
    }
  }
];

export function ColorSchemeSelector() {
  const { language } = useAppStore();
  const [activePalette, setActivePalette] = useState('default');
  const [customColors, setCustomColors] = useState({
    bg: '#FBFBFA',
    surface: '#FFFFFF',
    textMain: '#2F3437',
    accentRed: '#9F2F2D',
  });

  const applyColors = (colors: Record<string, string>) => {
    const root = document.documentElement;
    Object.entries(colors).forEach(([key, value]) => {
      // Map JS keys to CSS variables
      const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      root.style.setProperty(cssVar, value);
    });
  };

  const handlePaletteSelect = (paletteId: string) => {
    setActivePalette(paletteId);
    const palette = PREDEFINED_PALETTES.find(p => p.id === paletteId);
    if (palette) {
      applyColors(palette.colors);
    }
  };

  const handleCustomColorChange = (key: string, value: string) => {
    setActivePalette('custom');
    const newColors = { ...customColors, [key]: value };
    setCustomColors(newColors);
    applyColors(newColors);
  };

  return (
    <section className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
      <div className="flex items-center gap-3 mb-6">
        <Palette size={24} className="text-[var(--text-muted)]" />
        <h2 className="text-lg font-semibold text-[var(--text-main)]">
          {language === 'fr' ? 'Thème de couleur' : 'Color Theme'}
        </h2>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-[var(--text-main)] mb-3">
            {language === 'fr' ? 'Palettes prédéfinies' : 'Pre-defined Palettes'}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PREDEFINED_PALETTES.map((palette) => (
              <button
                key={palette.id}
                onClick={() => handlePaletteSelect(palette.id)}
                className={`relative flex flex-col items-center p-3 rounded-lg border transition-all ${
                  activePalette === palette.id
                    ? 'border-[var(--text-main)] bg-gray-50/50'
                    : 'border-[var(--border)] hover:border-gray-300'
                }`}
              >
                <div className="flex w-full h-8 rounded-md overflow-hidden mb-2 border border-black/5">
                  <div className="flex-1" style={{ backgroundColor: palette.colors.bg }} />
                  <div className="flex-1" style={{ backgroundColor: palette.colors.surface }} />
                  <div className="flex-1" style={{ backgroundColor: palette.colors.accentRed }} />
                </div>
                <span className="text-xs font-medium text-[var(--text-main)]">{palette.name}</span>
                {activePalette === palette.id && (
                  <div className="absolute top-1.5 right-1.5 bg-[var(--text-main)] text-white rounded-full p-0.5">
                    <Check size={10} weight="bold" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-6 border-t border-[var(--border)]">
          <h3 className="text-sm font-medium text-[var(--text-main)] mb-3">
            {language === 'fr' ? 'Couleurs personnalisées' : 'Custom Colors'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1.5">
                {language === 'fr' ? 'Arrière-plan' : 'Background'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={activePalette === 'custom' ? customColors.bg : PREDEFINED_PALETTES.find(p => p.id === activePalette)?.colors.bg || customColors.bg}
                  onChange={(e) => handleCustomColorChange('bg', e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                />
                <input
                  type="text"
                  value={activePalette === 'custom' ? customColors.bg : PREDEFINED_PALETTES.find(p => p.id === activePalette)?.colors.bg || customColors.bg}
                  onChange={(e) => handleCustomColorChange('bg', e.target.value)}
                  className="flex-1 px-2 py-1.5 text-xs font-mono border border-[var(--border)] rounded bg-[var(--surface)] uppercase"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1.5">
                {language === 'fr' ? 'Surface' : 'Surface'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={activePalette === 'custom' ? customColors.surface : PREDEFINED_PALETTES.find(p => p.id === activePalette)?.colors.surface || customColors.surface}
                  onChange={(e) => handleCustomColorChange('surface', e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                />
                <input
                  type="text"
                  value={activePalette === 'custom' ? customColors.surface : PREDEFINED_PALETTES.find(p => p.id === activePalette)?.colors.surface || customColors.surface}
                  onChange={(e) => handleCustomColorChange('surface', e.target.value)}
                  className="flex-1 px-2 py-1.5 text-xs font-mono border border-[var(--border)] rounded bg-[var(--surface)] uppercase"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1.5">
                {language === 'fr' ? 'Texte principal' : 'Main Text'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={activePalette === 'custom' ? customColors.textMain : PREDEFINED_PALETTES.find(p => p.id === activePalette)?.colors.textMain || customColors.textMain}
                  onChange={(e) => handleCustomColorChange('textMain', e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                />
                <input
                  type="text"
                  value={activePalette === 'custom' ? customColors.textMain : PREDEFINED_PALETTES.find(p => p.id === activePalette)?.colors.textMain || customColors.textMain}
                  onChange={(e) => handleCustomColorChange('textMain', e.target.value)}
                  className="flex-1 px-2 py-1.5 text-xs font-mono border border-[var(--border)] rounded bg-[var(--surface)] uppercase"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1.5">
                {language === 'fr' ? 'Couleur d\'accent' : 'Accent Color'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={activePalette === 'custom' ? customColors.accentRed : PREDEFINED_PALETTES.find(p => p.id === activePalette)?.colors.accentRed || customColors.accentRed}
                  onChange={(e) => handleCustomColorChange('accentRed', e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                />
                <input
                  type="text"
                  value={activePalette === 'custom' ? customColors.accentRed : PREDEFINED_PALETTES.find(p => p.id === activePalette)?.colors.accentRed || customColors.accentRed}
                  onChange={(e) => handleCustomColorChange('accentRed', e.target.value)}
                  className="flex-1 px-2 py-1.5 text-xs font-mono border border-[var(--border)] rounded bg-[var(--surface)] uppercase"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
