'use client';

import { useState, useEffect, FormEvent } from 'react';

interface Font {
  name: string;
  url: string;
  path: string;
  size: number;
  createdAt: string;
}

interface FontManagerProps {
  selectedFont: string;
  onFontChange: (fontUrl: string, fontName: string) => void;
}

export default function FontManager({ selectedFont, onFontChange }: FontManagerProps) {
  const [fonts, setFonts] = useState<Font[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // Fetch fonts on mount
  useEffect(() => {
    fetchFonts();
  }, []);

  const fetchFonts = async () => {
    try {
      const response = await fetch('/api/fonts/list');
      if (response.ok) {
        const data = await response.json();
        setFonts(data.fonts || []);
      }
    } catch (error) {
      console.error('Error fetching fonts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (e: FormEvent) => {
    e.preventDefault();

    if (!uploadFile) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('font', uploadFile);

      const response = await fetch('/api/fonts/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();

      // Refresh the font list
      await fetchFonts();

      // Select the newly uploaded font
      onFontChange(data.font.url, data.font.name);

      // Close modal
      setShowUploadModal(false);
      setUploadFile(null);
    } catch (error) {
      console.error('Error uploading font:', error);
      alert(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (fontPath: string) => {
    if (!confirm('確定要刪除這個字型嗎？')) return;

    try {
      const response = await fetch('/api/fonts/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path: fontPath }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Delete failed');
      }

      // Refresh the font list
      await fetchFonts();
    } catch (error) {
      console.error('Error deleting font:', error);
      alert(error instanceof Error ? error.message : 'Delete failed');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Predefined common fonts
  const systemFonts = [
    { name: 'System UI', value: 'system-ui, sans-serif' },
    { name: 'Serif', value: 'serif' },
    { name: 'Monospace', value: 'monospace' },
    { name: 'Arial', value: 'Arial, sans-serif' },
    { name: 'Georgia', value: 'Georgia, serif' },
    { name: 'Times New Roman', value: 'Times New Roman, serif' },
    { name: 'Courier New', value: 'Courier New, monospace' },
    { name: 'Verdana', value: 'Verdana, sans-serif' },
  ];

  return (
    <div className="space-y-4">
      {/* Font selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          字型選擇
        </label>
        <select
          value={selectedFont}
          onChange={(e) => {
            const fontName = e.target.options[e.target.selectedIndex].text;
            onFontChange(e.target.value, fontName);
          }}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
        >
          <optgroup label="系統字型">
            {systemFonts.map(font => (
              <option key={font.value} value={font.value}>
                {font.name}
              </option>
            ))}
          </optgroup>
          {fonts.length > 0 && (
            <optgroup label="已上傳字型">
              {fonts.map(font => (
                <option key={font.path} value={font.url}>
                  {font.name.replace(/-\d+\.(ttf|otf|woff2?)/i, '')}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </div>

      {/* Upload button */}
      <button
        onClick={() => setShowUploadModal(true)}
        className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        上傳新字型
      </button>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-800 mb-4">上傳字型</h3>
            <p className="text-sm text-gray-500 mb-4">
              支援格式: .ttf, .otf, .woff2, .woff (最大 5MB)
            </p>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  選擇檔案
                </label>
                <input
                  type="file"
                  accept=".ttf,.otf,.woff2,.woff"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                />
                {uploadFile && (
                  <p className="text-sm text-gray-500 mt-1">
                    已選擇: {uploadFile.name} ({formatFileSize(uploadFile.size)})
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isUploading || !uploadFile}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isUploading ? '上傳中...' : '上傳'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadFile(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all"
                  disabled={isUploading}
                >
                  取消
                </button>
              </div>
            </form>

            {/* List of uploaded fonts in modal */}
            {fonts.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">已上傳的字型</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {fonts.map(font => (
                    <div
                      key={font.path}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm"
                    >
                      <span className="truncate flex-1">{font.name}</span>
                      <button
                        onClick={() => handleDelete(font.path)}
                        className="ml-2 text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50"
                      >
                        刪除
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Font preview */}
      <div className="p-4 bg-gray-100 rounded-lg">
        <p className="text-sm text-gray-500 mb-1">預覽</p>
        <p style={{ fontFamily: selectedFont }} className="text-2xl font-bold text-gray-800">
          歌詞預覽 Lyrics Preview
        </p>
      </div>
    </div>
  );
}
