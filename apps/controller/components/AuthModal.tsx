'use client';

import { X, LogIn, BookOpen, Star, Settings } from 'lucide-react';
import { DESIGN_TOKENS } from 'shared';
import { useAuth } from '@/contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
}

export function AuthModal({ isOpen, onClose, feature }: AuthModalProps) {
  const { signIn, loading } = useAuth();

  if (!isOpen) return null;

  const handleSignIn = async () => {
    try {
      await signIn();
      onClose();
    } catch (err) {
      console.error('Sign in error:', err);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
      onClick={onClose}
    >
      <div
        className="w-[400px] rounded-3xl overflow-hidden"
        style={{ backgroundColor: DESIGN_TOKENS.colors.panel }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6">
          <h2
            style={{
              fontSize: DESIGN_TOKENS.fontSize.lg,
              fontWeight: DESIGN_TOKENS.fontWeight.semibold,
              color: DESIGN_TOKENS.colors.text.primary,
            }}
          >
            登入以使用此功能
          </h2>
          <button onClick={onClose}>
            <X size={20} color={DESIGN_TOKENS.colors.text.tertiary} />
          </button>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', backgroundColor: DESIGN_TOKENS.colors.panelBorder }} />

        {/* Content */}
        <div className="p-6">
          {feature && (
            <div
              className="mb-6 p-4 rounded-xl"
              style={{ backgroundColor: 'rgba(201, 169, 98, 0.1)' }}
            >
              <p
                style={{
                  fontSize: DESIGN_TOKENS.fontSize.sm,
                  color: DESIGN_TOKENS.colors.text.secondary,
                }}
              >
                需要登入才能使用「{feature}」功能
              </p>
            </div>
          )}

          <p
            style={{
              fontSize: DESIGN_TOKENS.fontSize.md,
              color: DESIGN_TOKENS.colors.text.secondary,
              marginBottom: '20px',
            }}
          >
            登入後您可以：
          </p>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: DESIGN_TOKENS.colors.input }}
              >
                <BookOpen size={16} color={DESIGN_TOKENS.colors.feature} />
              </div>
              <span
                style={{
                  fontSize: DESIGN_TOKENS.fontSize.sm,
                  color: DESIGN_TOKENS.colors.text.secondary,
                }}
              >
                儲存跨設備歌單
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: DESIGN_TOKENS.colors.input }}
              >
                <Star size={16} color={DESIGN_TOKENS.colors.feature} />
              </div>
              <span
                style={{
                  fontSize: DESIGN_TOKENS.fontSize.sm,
                  color: DESIGN_TOKENS.colors.text.secondary,
                }}
              >
                收藏最愛歌曲
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: DESIGN_TOKENS.colors.input }}
              >
                <Settings size={16} color={DESIGN_TOKENS.colors.feature} />
              </div>
              <span
                style={{
                  fontSize: DESIGN_TOKENS.fontSize.sm,
                  color: DESIGN_TOKENS.colors.text.secondary,
                }}
              >
                同步個人設定
              </span>
            </div>
          </div>

          {/* Google Sign In Button */}
          <button
            onClick={handleSignIn}
            disabled={loading}
            className="w-full py-3 rounded-xl flex items-center justify-center gap-3 transition-all disabled:opacity-50"
            style={{
              backgroundColor: DESIGN_TOKENS.colors.background,
              border: '1px solid DESIGN_TOKENS.colors.panelBorder',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.282-1.584-4.966-3.715H.957v2.259A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M4.034 9.315a5.41 5.41 0 0 1 0-3.63V3.535H.957a8.997 8.997 0 0 0 0 6.93h3.077z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 3.535l3.077 2.259c.684-2.131 2.622-3.714 4.966-3.714z" fill="#EA4335"/>
            </svg>
            <span
              style={{
                fontSize: DESIGN_TOKENS.fontSize.md,
                fontWeight: DESIGN_TOKENS.fontWeight.medium,
                color: DESIGN_TOKENS.colors.text.primary,
              }}
            >
              {loading ? '登入中...' : '使用 Google 繼續'}
            </span>
          </button>
        </div>

        {/* Footer */}
        <div
          className="p-4"
          style={{ borderTop: `1px solid ${DESIGN_TOKENS.colors.panelBorder}` }}
        >
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl"
            style={{ color: DESIGN_TOKENS.colors.text.tertiary }}
          >
            稍後再說
          </button>
        </div>
      </div>
    </div>
  );
}
