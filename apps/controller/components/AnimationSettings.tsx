'use client';

import { DESIGN_TOKENS } from 'shared';
import type { AnimationConfig, AnimationType, RapidSwitchMode } from 'shared';

interface AnimationSettingsProps {
  config: AnimationConfig;
  onChange: (config: Partial<AnimationConfig>) => void;
}

const ANIMATION_TYPES: { value: AnimationType; label: string; description: string }[] = [
  { value: 'none', label: '無動畫', description: '立即切換' },
  { value: 'fade-out-in', label: '淡出淡入', description: '先淡出再淡入' },
  { value: 'crossfade', label: '交錯淡入淡出', description: '同時淡入淡出' },
  { value: 'slide', label: '滑入滑出', description: '左右滑動效果' },
  { value: 'scale', label: '縮放效果', description: '放大縮小動畫' },
];

const RAPID_SWITCH_MODES: { value: RapidSwitchMode; label: string; description: string }[] = [
  { value: 'immediate', label: '立即切換', description: '取消當前動畫，立即顯示' },
  { value: 'queued', label: '排隊播放', description: '等待動畫完成後播放' },
  { value: 'skip', label: '跳過中間', description: '直接跳到目標歌詞' },
];

const EASING_OPTIONS = [
  { value: 'linear', label: 'Linear' },
  { value: 'ease', label: 'Ease' },
  { value: 'ease-in', label: 'Ease In' },
  { value: 'ease-out', label: 'Ease Out' },
  { value: 'ease-in-out', label: 'Ease In Out' },
];

export function AnimationSettings({ config, onChange }: AnimationSettingsProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* 啟用動畫開關 */}
      <div className="flex items-center justify-between">
        <div>
          <p
            style={{
              fontSize: DESIGN_TOKENS.fontSize.sm,
              fontWeight: DESIGN_TOKENS.fontWeight.medium,
              color: DESIGN_TOKENS.colors.text.primary,
            }}
          >
            啟用歌詞切換動畫
          </p>
          <p
            style={{
              fontSize: DESIGN_TOKENS.fontSize.xs,
              color: DESIGN_TOKENS.colors.text.tertiary,
            }}
          >
            切換下一句時播放過渡效果
          </p>
        </div>
        <button
          onClick={() => onChange({ enabled: !config.enabled })}
          className={`w-12 h-6 rounded-full transition-all ${
            config.enabled ? 'bg-blue-500' : 'bg-gray-600'
          }`}
        >
          <div
            className={`w-5 h-5 bg-white rounded-full transition-all ${
              config.enabled ? 'translate-x-6' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {config.enabled && (
        <>
          {/* 動畫類型選擇 */}
          <div>
            <p
              style={{
                fontSize: DESIGN_TOKENS.fontSize.xs,
                fontWeight: DESIGN_TOKENS.fontWeight.semibold,
                color: DESIGN_TOKENS.colors.text.secondary,
                marginBottom: '8px',
              }}
            >
              動畫類型
            </p>
            <div className="grid grid-cols-2 gap-2">
              {ANIMATION_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => onChange({ type: type.value })}
                  className={`p-3 rounded-lg text-left transition-all ${
                    config.type === type.value
                      ? 'bg-blue-500/20 border-2 border-blue-500'
                      : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                  }`}
                >
                  <p
                    style={{
                      fontSize: DESIGN_TOKENS.fontSize.sm,
                      fontWeight: DESIGN_TOKENS.fontWeight.medium,
                      color: config.type === type.value
                        ? DESIGN_TOKENS.colors.text.primary
                        : DESIGN_TOKENS.colors.text.secondary,
                    }}
                  >
                    {type.label}
                  </p>
                  <p
                    style={{
                      fontSize: DESIGN_TOKENS.fontSize.xs,
                      color: DESIGN_TOKENS.colors.text.tertiary,
                      marginTop: '2px',
                    }}
                  >
                    {type.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* 動畫速度 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p
                style={{
                  fontSize: DESIGN_TOKENS.fontSize.xs,
                  fontWeight: DESIGN_TOKENS.fontWeight.semibold,
                  color: DESIGN_TOKENS.colors.text.secondary,
                }}
              >
                動畫速度
              </p>
              <span
                style={{
                  fontSize: DESIGN_TOKENS.fontSize.xs,
                  color: DESIGN_TOKENS.colors.text.tertiary,
                }}
              >
                {config.duration}ms
              </span>
            </div>
            <input
              type="range"
              min="100"
              max="1500"
              step="50"
              value={config.duration}
              onChange={(e) => onChange({ duration: parseInt(e.target.value) })}
              className="w-full"
              style={{
                accentColor: DESIGN_TOKENS.colors.accent,
              }}
            />
            <div className="flex justify-between mt-1">
              {['200ms', '500ms', '1000ms'].map((preset) => (
                <button
                  key={preset}
                  onClick={() => onChange({ duration: parseInt(preset) })}
                  className="px-2 py-1 text-xs rounded bg-white/5 hover:bg-white/10"
                  style={{ color: DESIGN_TOKENS.colors.text.tertiary }}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* 緩動函數 */}
          <div>
            <p
              style={{
                fontSize: DESIGN_TOKENS.fontSize.xs,
                fontWeight: DESIGN_TOKENS.fontWeight.semibold,
                color: DESIGN_TOKENS.colors.text.secondary,
                marginBottom: '8px',
              }}
            >
              緩動效果
            </p>
            <div className="flex flex-wrap gap-2">
              {EASING_OPTIONS.map((easing) => (
                <button
                  key={easing.value}
                  onClick={() => onChange({ easing: easing.value })}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    config.easing === easing.value
                      ? 'bg-blue-500'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                  style={{
                    color: config.easing === easing.value
                      ? 'white'
                      : DESIGN_TOKENS.colors.text.secondary,
                  }}
                >
                  {easing.label}
                </button>
              ))}
            </div>
          </div>

          {/* 快速切換模式 */}
          <div>
            <p
              style={{
                fontSize: DESIGN_TOKENS.fontSize.xs,
                fontWeight: DESIGN_TOKENS.fontWeight.semibold,
                color: DESIGN_TOKENS.colors.text.secondary,
                marginBottom: '8px',
              }}
            >
              快速切換行為
            </p>
            <div className="space-y-2">
              {RAPID_SWITCH_MODES.map((mode) => (
                <button
                  key={mode.value}
                  onClick={() => onChange({ rapidSwitchMode: mode.value })}
                  className={`w-full p-3 rounded-lg text-left transition-all ${
                    config.rapidSwitchMode === mode.value
                      ? 'bg-blue-500/20 border border-blue-500'
                      : 'bg-white/5 border border-transparent hover:bg-white/10'
                  }`}
                >
                  <p
                    style={{
                      fontSize: DESIGN_TOKENS.fontSize.sm,
                      fontWeight: DESIGN_TOKENS.fontWeight.medium,
                      color: DESIGN_TOKENS.colors.text.secondary,
                    }}
                  >
                    {mode.label}
                  </p>
                  <p
                    style={{
                      fontSize: DESIGN_TOKENS.fontSize.xs,
                      color: DESIGN_TOKENS.colors.text.tertiary,
                      marginTop: '2px',
                    }}
                  >
                    {mode.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
