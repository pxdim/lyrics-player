'use client';

import { useState, useEffect } from 'react';
import {
  StyleConfig,
  ThemePreset,
  THEME_PRESETS,
  COLOR_CATEGORIES,
  DESIGN_TOKENS,
  getCustomThemes,
  saveCustomTheme,
  deleteCustomTheme,
  getAllThemes,
  CustomTheme
} from 'shared';
import { Edit3, Minus, Plus, Save, Trash2 } from 'lucide-react';
import { AnimationSettings } from './AnimationSettings';

interface StylePanelProps {
  style: StyleConfig;
  currentThemeId: string;
  onStyleChange: (style: Partial<StyleConfig>) => void;
  onThemeSelect: (themeId: string) => void;
  isEditing: boolean;
  onToggleEdit: () => void;
  transpose: number;
  onTransposeChange: (semitones: number) => void;
  showChords: boolean;
  onToggleChords: () => void;
}

export default function StylePanel({
  style,
  currentThemeId,
  onStyleChange,
  onThemeSelect,
  isEditing,
  onToggleEdit,
  transpose,
  onTransposeChange,
  showChords,
  onToggleChords,
}: StylePanelProps) {
  const [customThemes, setCustomThemes] = useState<CustomTheme[]>([]);
  const [allThemes, setAllThemes] = useState<ThemePreset[]>(THEME_PRESETS);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [themeName, setThemeName] = useState('');
  const [themeDisplayName, setThemeDisplayName] = useState('');

  useEffect(() => {
    const custom = getCustomThemes();
    setCustomThemes(custom);
    setAllThemes([...THEME_PRESETS, ...custom]);
  }, []);

  const handleSaveTheme = () => {
    if (!themeName.trim() || !themeDisplayName.trim()) return;

    const newTheme = saveCustomTheme({
      name: themeName,
      displayName: themeDisplayName,
      style: { ...style },
      previewColor: style.color,
    });

    const updatedCustom = getCustomThemes();
    setCustomThemes(updatedCustom);
    setAllThemes([...THEME_PRESETS, ...updatedCustom]);
    onThemeSelect(newTheme.id);

    setShowSaveDialog(false);
    setThemeName('');
    setThemeDisplayName('');
  };

  const handleDeleteTheme = (id: string) => {
    deleteCustomTheme(id);
    const updatedCustom = getCustomThemes();
    setCustomThemes(updatedCustom);
    setAllThemes([...THEME_PRESETS, ...updatedCustom]);
    if (currentThemeId === id) {
      onThemeSelect('worship-warm');
    }
  };

  return (
    <div
      className="flex flex-col"
      style={{
        width: DESIGN_TOKENS.layout.stylePanelWidth,
        backgroundColor: DESIGN_TOKENS.colors.panel,
        borderLeft: `1px solid ${DESIGN_TOKENS.colors.panelBorder}`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-4">
        <span
          style={{
            fontSize: DESIGN_TOKENS.fontSize.lg,
            fontWeight: DESIGN_TOKENS.fontWeight.semibold,
            color: DESIGN_TOKENS.colors.text.primary,
          }}
        >
          Display Settings
        </span>
        <button
          className="p-2 rounded-lg"
          style={{ backgroundColor: DESIGN_TOKENS.colors.input }}
          onClick={onToggleEdit}
          aria-label="編輯樣式"
        >
          <Edit3 size={16} color={DESIGN_TOKENS.colors.text.tertiary} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Theme Presets */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <p
              style={{
                fontSize: DESIGN_TOKENS.fontSize.xs,
                color: DESIGN_TOKENS.colors.text.tertiary,
                fontWeight: DESIGN_TOKENS.fontWeight.medium,
                letterSpacing: '1px',
              }}
            >
              THEME PRESETS
            </p>
            <button
              onClick={() => setShowSaveDialog(true)}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-all hover:opacity-80"
              style={{ backgroundColor: DESIGN_TOKENS.colors.feature, color: DESIGN_TOKENS.colors.text.primary }}
            >
              <Save size={12} />
              保存当前样式
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {allThemes.map((theme) => {
              const isCustom = 'isCustom' in theme;
              return (
                <div
                  key={theme.id}
                  className="relative"
                >
                  <button
                    onClick={() => onThemeSelect(theme.id)}
                    className="flex flex-col items-center justify-center p-2 rounded-lg transition-all hover:opacity-80 w-full"
                    style={{
                      backgroundColor:
                        currentThemeId === theme.id ? DESIGN_TOKENS.colors.background : DESIGN_TOKENS.colors.input,
                      border: currentThemeId === theme.id ? `2px solid ${DESIGN_TOKENS.colors.accent}` : 'none',
                    }}
                  >
                    <div
                      className="w-6 h-6 rounded-full mb-1"
                      style={{ backgroundColor: theme.previewColor }}
                    />
                    <span
                      style={{
                        fontSize: DESIGN_TOKENS.fontSize.xs,
                        color: DESIGN_TOKENS.colors.text.secondary,
                      }}
                    >
                      {theme.displayName}
                    </span>
                  </button>
                  {isCustom && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTheme(theme.id);
                      }}
                      className="absolute -top-1 -right-1 p-1 rounded-full bg-red-500 hover:bg-red-600 transition-all"
                      style={{ width: '16px', height: '16px' }}
                    >
                      <Trash2 size={10} color="white" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Divider */}
        <div style={{ height: '1px', backgroundColor: DESIGN_TOKENS.colors.panelBorder }} />

        {/* Text Color */}
        <section>
          <p
            style={{
              fontSize: DESIGN_TOKENS.fontSize.xs,
              color: DESIGN_TOKENS.colors.text.tertiary,
              fontWeight: DESIGN_TOKENS.fontWeight.medium,
              letterSpacing: '1px',
              marginBottom: DESIGN_TOKENS.spacing.md,
            }}
          >
            TEXT COLOR
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {COLOR_CATEGORIES[0].colors.map((color) => (
              <button
                key={color}
                onClick={() => onStyleChange({ color })}
                className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                style={{
                  backgroundColor: color,
                  border: style.color === color ? `2px solid ${DESIGN_TOKENS.colors.accent}` : 'none',
                }}
              />
            ))}
            <button
              className="w-7 h-7 rounded border border-gray-600 flex items-center justify-center"
              style={{ backgroundColor: DESIGN_TOKENS.colors.input }}
            >
              <span style={{ fontSize: '10px', color: DESIGN_TOKENS.colors.text.tertiary }}>+</span>
            </button>
          </div>
        </section>

        {/* Divider */}
        <div style={{ height: '1px', backgroundColor: DESIGN_TOKENS.colors.panelBorder }} />

        {/* Font Size */}
        <section>
          <p
            style={{
              fontSize: DESIGN_TOKENS.fontSize.xs,
              color: DESIGN_TOKENS.colors.text.tertiary,
              fontWeight: DESIGN_TOKENS.fontWeight.medium,
              letterSpacing: '1px',
              marginBottom: DESIGN_TOKENS.spacing.md,
            }}
          >
            FONT SIZE
          </p>
          <div className="flex items-center gap-3">
            <span style={{ fontSize: '12px', color: DESIGN_TOKENS.colors.text.tertiary }}>A</span>
            <input
              type="range"
              min="24"
              max="96"
              value={style.fontSize}
              onChange={(e) => onStyleChange({ fontSize: Number(e.target.value) })}
              className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
              style={{
                background: DESIGN_TOKENS.colors.input,
                accentColor: DESIGN_TOKENS.colors.accent,
              }}
            />
            <span style={{ fontSize: '18px', color: DESIGN_TOKENS.colors.text.tertiary }}>A</span>
            <span
              style={{
                fontSize: DESIGN_TOKENS.fontSize.base,
                fontWeight: DESIGN_TOKENS.fontWeight.medium,
                color: DESIGN_TOKENS.colors.text.primary,
                minWidth: '50px',
                textAlign: 'right',
              }}
            >
              {style.fontSize}px
            </span>
          </div>
        </section>

        {/* Divider */}
        <div style={{ height: '1px', backgroundColor: DESIGN_TOKENS.colors.panelBorder }} />

        {/* Background */}
        <section>
          <p
            style={{
              fontSize: DESIGN_TOKENS.fontSize.xs,
              color: DESIGN_TOKENS.colors.text.tertiary,
              fontWeight: DESIGN_TOKENS.fontWeight.medium,
              letterSpacing: '1px',
              marginBottom: DESIGN_TOKENS.spacing.md,
            }}
          >
            BACKGROUND
          </p>
          <div className="flex gap-2">
            {['#000000', '#1A1A2E', '#16213E', '#0F3460', '#2D1B3D'].map((bg) => (
              <button
                key={bg}
                onClick={() => onStyleChange({ background: { type: 'solid', value: bg } })}
                className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                style={{
                  backgroundColor: bg,
                  border: style.background.value === bg ? `2px solid ${DESIGN_TOKENS.colors.accent}` : 'none',
                }}
              />
            ))}
          </div>
        </section>

        {/* Divider */}
        <div style={{ height: '1px', backgroundColor: DESIGN_TOKENS.colors.panelBorder }} />

        {/* Transpose */}
        <section>
          <p
            style={{
              fontSize: DESIGN_TOKENS.fontSize.xs,
              color: DESIGN_TOKENS.colors.text.tertiary,
              fontWeight: DESIGN_TOKENS.fontWeight.medium,
              letterSpacing: '1px',
              marginBottom: DESIGN_TOKENS.spacing.md,
            }}
          >
            TRANSPOSE KEY
          </p>
          <div className="flex items-center gap-2" role="group" aria-label="移調控制">
            <button
              onClick={() => onTransposeChange(Math.max(-11, transpose - 1))}
              className="flex-1 py-3 rounded-lg transition-all hover:opacity-80"
              style={{ backgroundColor: DESIGN_TOKENS.colors.input }}
              aria-label="降低半音"
            >
              <Minus size={16} color={DESIGN_TOKENS.colors.text.secondary} />
            </button>
            <div
              className="flex-1 py-3 rounded-lg text-center"
              style={{ backgroundColor: DESIGN_TOKENS.colors.background }}
              aria-live="polite"
              aria-atomic="true"
            >
              <span
                style={{
                  fontSize: DESIGN_TOKENS.fontSize.md,
                  fontWeight: DESIGN_TOKENS.fontWeight.semibold,
                  color: DESIGN_TOKENS.colors.text.primary,
                }}
              >
                {transpose > 0 ? `+${transpose}` : transpose}
              </span>
            </div>
            <button
              onClick={() => onTransposeChange(Math.min(11, transpose + 1))}
              className="flex-1 py-3 rounded-lg transition-all hover:opacity-80"
              style={{ backgroundColor: DESIGN_TOKENS.colors.input }}
              aria-label="升高半音"
            >
              <Plus size={16} color={DESIGN_TOKENS.colors.text.secondary} />
            </button>
          </div>
        </section>

        {/* Divider */}
        <div style={{ height: '1px', backgroundColor: DESIGN_TOKENS.colors.panelBorder }} />

        {/* Animation Settings */}
        <section>
          <p
            style={{
              fontSize: DESIGN_TOKENS.fontSize.xs,
              color: DESIGN_TOKENS.colors.text.tertiary,
              fontWeight: DESIGN_TOKENS.fontWeight.medium,
              letterSpacing: '1px',
              marginBottom: DESIGN_TOKENS.spacing.md,
            }}
          >
            ANIMATION
          </p>
          <AnimationSettings
            config={style.animation}
            onChange={(updates) => onStyleChange({ animation: { ...style.animation, ...updates } })}
          />
        </section>
      </div>

      {/* Footer Info */}
      <div className="p-6 pt-0">
        <div className="flex items-center justify-between" style={{ fontSize: DESIGN_TOKENS.fontSize.xs }}>
          <span style={{ color: DESIGN_TOKENS.colors.text.disabled }}>Lyrics Player v2.0</span>
          <div className="flex items-center gap-1">
            <div
              style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: DESIGN_TOKENS.colors.success }}
            />
            <span style={{ color: DESIGN_TOKENS.colors.text.disabled }}>Synced</span>
          </div>
        </div>
      </div>

      {/* Save Theme Dialog */}
      {showSaveDialog && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
          onClick={() => setShowSaveDialog(false)}
        >
          <div
            className="w-80 rounded-xl p-6"
            style={{ backgroundColor: DESIGN_TOKENS.colors.panel, border: `1px solid ${DESIGN_TOKENS.colors.panelBorder}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              className="text-lg font-semibold mb-4"
              style={{ color: DESIGN_TOKENS.colors.text.primary }}
            >
              保存自定义主题
            </h3>
            <div className="space-y-4">
              <div>
                <label
                  className="block text-xs mb-1"
                  style={{ color: DESIGN_TOKENS.colors.text.tertiary }}
                >
                  主题名称 (英文)
                </label>
                <input
                  type="text"
                  value={themeName}
                  onChange={(e) => setThemeName(e.target.value)}
                  placeholder="my-theme"
                  className="w-full px-3 py-2 rounded-lg outline-none"
                  style={{
                    backgroundColor: DESIGN_TOKENS.colors.background,
                    color: DESIGN_TOKENS.colors.text.primary,
                  }}
                />
              </div>
              <div>
                <label
                  className="block text-xs mb-1"
                  style={{ color: DESIGN_TOKENS.colors.text.tertiary }}
                >
                  显示名称 (中文)
                </label>
                <input
                  type="text"
                  value={themeDisplayName}
                  onChange={(e) => setThemeDisplayName(e.target.value)}
                  placeholder="我的主题"
                  className="w-full px-3 py-2 rounded-lg outline-none"
                  style={{
                    backgroundColor: DESIGN_TOKENS.colors.background,
                    color: DESIGN_TOKENS.colors.text.primary,
                  }}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="flex-1 py-2 rounded-lg"
                  style={{ backgroundColor: DESIGN_TOKENS.colors.input, color: DESIGN_TOKENS.colors.text.secondary }}
                >
                  取消
                </button>
                <button
                  onClick={handleSaveTheme}
                  disabled={!themeName.trim() || !themeDisplayName.trim()}
                  className="flex-1 py-2 rounded-lg disabled:opacity-50"
                  style={{ backgroundColor: DESIGN_TOKENS.colors.accent, color: DESIGN_TOKENS.colors.text.primary }}
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
