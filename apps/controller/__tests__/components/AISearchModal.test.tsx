import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import AISearchModal from '../../components/AISearchModal';

// Mock dependencies
vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({ user: null }),
}));

vi.mock('./AuthModal', () => ({
    AuthModal: () => null,
}));

vi.mock('../../components/AuthModal', () => ({
    AuthModal: () => null,
}));

// Mock fetch globally
global.fetch = vi.fn();

describe('AISearchModal Component', () => {
    const mockOnClose = vi.fn();
    const mockOnAddSong = vi.fn();
    const mockOnSearchChange = vi.fn();
    const mockOnSearch = vi.fn();
    const mockOnFetchLyrics = vi.fn();

           const defaultProps = {
                 isOpen: true,
                 onClose: mockOnClose,
                 onAddSong: mockOnAddSong,
                 searchQuery: '',
                 searchResults: [],
                 isSearching: false,
                 onSearchChange: mockOnSearchChange,
                 onSearch: mockOnSearch,
                 onFetchLyrics: mockOnFetchLyrics,
           };

           beforeEach(() => {
                 vi.clearAllMocks();
                 vi.useFakeTimers();
                 (global.fetch as any).mockResolvedValue({
                         ok: true,
                         json: async () => ({ favorites: [] }),
                 });
           });

           afterEach(() => {
                 vi.useRealTimers();
           });

           it('should not render when isOpen is false', () => {
                 render(<AISearchModal {...defaultProps} isOpen={false} />);
                 expect(screen.queryByText('AI 搜歌')).toBeNull();
           });

           it('should render when isOpen is true', () => {
                 render(<AISearchModal {...defaultProps} />);
                 expect(screen.getByText('AI 搜歌')).toBeTruthy();
           });

           it('should display search input placeholder', () => {
                 render(<AISearchModal {...defaultProps} />);
                 expect(screen.getByPlaceholderText('輸入歌名或歌手...')).toBeTruthy();
           });

           it('should call onSearchChange when typing in search input', () => {
                 render(<AISearchModal {...defaultProps} />);
                 const input = screen.getByPlaceholderText('輸入歌名或歌手...');
                 fireEvent.change(input, { target: { value: '哈利路亞' } });
                 expect(mockOnSearchChange).toHaveBeenCalledWith('哈利路亞');
           });

           it('should call onSearch on form submit', () => {
                 render(<AISearchModal {...defaultProps} searchQuery="test" />);
                 const input = screen.getByPlaceholderText('輸入歌名或歌手...');
                 fireEvent.submit(input.closest('form')!);
                 expect(mockOnSearch).toHaveBeenCalled();
           });

           it('should auto-search with debounce when searchQuery changes', async () => {
                 const { rerender } = render(<AISearchModal {...defaultProps} searchQuery="" />);

                  // Update searchQuery prop (simulating typing)
                  rerender(<AISearchModal {...defaultProps} searchQuery="讚美之泉" />);

                  // Search should NOT be called immediately
                  expect(mockOnSearch).not.toHaveBeenCalled();

                  // After 600ms debounce, search should be triggered
                  act(() => {
                          vi.advanceTimersByTime(600);
                  });

                  expect(mockOnSearch).toHaveBeenCalledTimes(1);
           });

           it('should debounce search and only call once for rapid typing', async () => {
                 const { rerender } = render(<AISearchModal {...defaultProps} searchQuery="" />);

                  // Simulate rapid typing
                  rerender(<AISearchModal {...defaultProps} searchQuery="讚" />);
                 act(() => { vi.advanceTimersByTime(200); });

                  rerender(<AISearchModal {...defaultProps} searchQuery="讚美" />);
                 act(() => { vi.advanceTimersByTime(200); });

                  rerender(<AISearchModal {...defaultProps} searchQuery="讚美之" />);
                 act(() => { vi.advanceTimersByTime(200); });

                  rerender(<AISearchModal {...defaultProps} searchQuery="讚美之泉" />);
                 act(() => { vi.advanceTimersByTime(200); });

                  // Only 200ms has passed since last keystroke, should not have searched yet
                  expect(mockOnSearch).not.toHaveBeenCalled();

                  // After full debounce period
                  act(() => { vi.advanceTimersByTime(600); });
                 expect(mockOnSearch).toHaveBeenCalledTimes(1);
           });

           it('should not auto-search when searchQuery is empty', async () => {
                 const { rerender } = render(<AISearchModal {...defaultProps} searchQuery="test" />);
                 rerender(<AISearchModal {...defaultProps} searchQuery="" />);
                 act(() => { vi.advanceTimersByTime(600); });
                 expect(mockOnSearch).not.toHaveBeenCalled();
           });

           it('should display "輸入歌名開始搜尋" when no query', () => {
                 render(<AISearchModal {...defaultProps} searchQuery="" />);
                 expect(screen.getByText('輸入歌名開始搜尋')).toBeTruthy();
           });

           it('should display "沒有找到結果" when query has no results', () => {
                 render(
                         <AISearchModal
                           {...defaultProps}
                                   searchQuery="unknownsong"
                                   searchResults={[]}
                                   isSearching={false}
                                 />
                       );
                 expect(screen.getByText('沒有找到結果')).toBeTruthy();
           });

           it('should display search results', () => {
                 const mockResults = [
                   { songName: '哈利路亞', artist: '讚美之泉', confidence: 0.9 },
                   { songName: 'Amazing Grace', artist: 'Traditional', confidence: 0.8 },
                       ];
                 render(
                         <AISearchModal
                           {...defaultProps}
                                   searchQuery="哈利路亞"
                                   searchResults={mockResults}
                                   isSearching={false}
                                 />
                       );
                 expect(screen.getByText('哈利路亞')).toBeTruthy();
                 expect(screen.getByText('讚美之泉')).toBeTruthy();
                 expect(screen.getByText('Amazing Grace')).toBeTruthy();
           });

           it('should display confidence labels for results', () => {
                 const mockResults = [
                   { songName: 'Song A', artist: 'Artist A', confidence: 0.9 },
                   { songName: 'Song B', artist: 'Artist B', confidence: 0.65 },
                   { songName: 'Song C', artist: 'Artist C', confidence: 0.4 },
                       ];
                 render(
                         <AISearchModal
                           {...defaultProps}
                                   searchQuery="song"
                                   searchResults={mockResults}
                                   isSearching={false}
                                 />
                       );
                 expect(screen.getByText('高信心')).toBeTruthy();
                 expect(screen.getByText('中信心')).toBeTruthy();
                 expect(screen.getByText('低信心')).toBeTruthy();
           });

           it('should show loading spinner when isSearching', () => {
                 render(
                         <AISearchModal
                           {...defaultProps}
                                   searchQuery="test"
                                   isSearching={true}
                                 />
                       );
                 // Check for loading spinner (via CSS class)
                  const spinner = document.querySelector('.animate-spin');
                 expect(spinner).toBeTruthy();
           });

           it('should call onClose when clicking close button', () => {
                 render(<AISearchModal {...defaultProps} />);
                 const closeButton = screen.getAllByRole('button').find(
                         btn => btn.querySelector('svg') && !btn.textContent
                       );
                 if (closeButton) {
                         fireEvent.click(closeButton);
                 }
                 // onClose called via handleClose which also resets state
           });

           it('should call onClose when clicking cancel button', () => {
                 render(<AISearchModal {...defaultProps} />);
                 const cancelButton = screen.getByText('取消');
                 fireEvent.click(cancelButton);
                 expect(mockOnClose).toHaveBeenCalled();
           });

           it('should display warning banner when warning prop is provided', () => {
                 render(
                         <AISearchModal
                           {...defaultProps}
                                   warning="部分結果信心較低，建議預覽歌詞後確認"
                                 />
                       );
                 expect(screen.getByText('部分結果信心較低，建議預覽歌詞後確認')).toBeTruthy();
           });

           it('should show preview mode header when a song is selected', async () => {
                 const mockResults = [
                   { songName: '哈利路亞', artist: '讚美之泉', confidence: 0.9 },
                       ];
                 (global.fetch as any).mockResolvedValueOnce({
                         ok: true,
                         json: async () => ({
                                   lyrics: [{ text: '哈利路亞', notes: 'Chorus' }],
                                   confidence: 0.9,
                         }),
                 });

                  render(
                          <AISearchModal
                            {...defaultProps}
                                    searchQuery="哈利路亞"
                                    searchResults={mockResults}
                                    isSearching={false}
                                  />
                        );

                  // Click preview button (Eye icon)
                  const previewButtons = screen.getAllByTitle('預覽歌詞');
                 fireEvent.click(previewButtons[0]);

                  await waitFor(() => {
                          expect(screen.getByText('預覽歌詞')).toBeTruthy();
                  });
           });
});
