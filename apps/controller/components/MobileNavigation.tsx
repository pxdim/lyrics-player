'use client';

import { useState } from 'react';
import { DESIGN_TOKENS } from 'shared';
import { Home, Music, Settings, X, Menu } from 'lucide-react';

export type MobileTab = 'lyrics' | 'style' | 'playlist';

interface MobileNavigationProps {
  currentTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
}

export default function MobileNavigation({ currentTab, onTabChange }: MobileNavigationProps) {
  const [showMenu, setShowMenu] = useState(false);

  const tabs: { key: MobileTab; icon: React.ReactNode; label: string }[] = [
    { key: 'lyrics', icon: <Music size={20} />, label: '歌詞' },
    { key: 'style', icon: <Settings size={20} />, label: '樣式' },
    { key: 'playlist', icon: <Home size={20} />, label: '清單' },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div
        className="fixed bottom-0 left-0 right-0 flex items-center justify-around px-2 py-2 md:hidden z-40"
        style={{
          backgroundColor: DESIGN_TOKENS.colors.panel,
          borderTop: `1px solid ${DESIGN_TOKENS.colors.panelBorder}`,
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all"
            style={{
              backgroundColor: currentTab === tab.key ? DESIGN_TOKENS.colors.input : 'transparent',
            }}
          >
            <div style={{ color: currentTab === tab.key ? DESIGN_TOKENS.colors.accent : DESIGN_TOKENS.colors.text.tertiary }}>
              {tab.icon}
            </div>
            <span
              style={{
                fontSize: DESIGN_TOKENS.fontSize.xs,
                color: currentTab === tab.key ? DESIGN_TOKENS.colors.text.primary : DESIGN_TOKENS.colors.text.tertiary,
              }}
            >
              {tab.label}
            </span>
          </button>
        ))}
      </div>

      {/* Mobile Top Bar */}
      <div
        className="md:hidden flex items-center justify-between px-4 py-3"
        style={{ backgroundColor: DESIGN_TOKENS.colors.panel, borderBottom: `1px solid ${DESIGN_TOKENS.colors.panelBorder}` }}
      >
        <span
          style={{
            fontSize: DESIGN_TOKENS.fontSize.md,
            fontWeight: DESIGN_TOKENS.fontWeight.semibold,
            color: DESIGN_TOKENS.colors.text.primary,
          }}
        >
          LY Controller
        </span>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 rounded-lg"
          style={{ backgroundColor: DESIGN_TOKENS.colors.input }}
        >
          {showMenu ? <X size={20} color={DESIGN_TOKENS.colors.text.primary} /> : <Menu size={20} color={DESIGN_TOKENS.colors.text.primary} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {showMenu && (
        <div
          className="fixed inset-0 md:hidden z-50"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
          onClick={() => setShowMenu(false)}
        >
          <div
            className="absolute top-0 right-0 bottom-0 w-64 p-4"
            style={{ backgroundColor: DESIGN_TOKENS.colors.panel }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <span
                style={{
                  fontSize: DESIGN_TOKENS.fontSize.lg,
                  fontWeight: DESIGN_TOKENS.fontWeight.semibold,
                  color: DESIGN_TOKENS.colors.text.primary,
                }}
              >
                選單
              </span>
              <button onClick={() => setShowMenu(false)}>
                <X size={20} color={DESIGN_TOKENS.colors.text.tertiary} />
              </button>
            </div>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left" style={{ backgroundColor: DESIGN_TOKENS.colors.input }}>
                <Music size={18} color={DESIGN_TOKENS.colors.text.secondary} />
                <span style={{ color: DESIGN_TOKENS.colors.text.primary }}>現在播放</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left" style={{ backgroundColor: 'transparent' }}>
                <Home size={18} color={DESIGN_TOKENS.colors.text.tertiary} />
                <span style={{ color: DESIGN_TOKENS.colors.text.secondary }}>播放列表</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left" style={{ backgroundColor: 'transparent' }}>
                <Settings size={18} color={DESIGN_TOKENS.colors.text.tertiary} />
                <span style={{ color: DESIGN_TOKENS.colors.text.secondary }}>樣式設置</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
