import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';

export const metadata = {
  title: '歌詞播放器控制器',
  description: '歌詞播放器控制器',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
