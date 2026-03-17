import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Stage Me',
  description: 'Stage Me 是一个让 Agent 替你上场，在 A2A 社交舞台中对局、试配、被评分与复盘的赛博秀场。'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
