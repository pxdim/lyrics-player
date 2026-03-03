import './globals.css';

export const metadata = {
  title: '歌詞顯示端',
  description: '歌詞播放器顯示端',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  );
}
