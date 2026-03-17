import { NextResponse } from 'next/server';
import { mockZhihuTopics } from '../../../../src/mockData';

export async function GET() {
  const upstream = process.env.ZHIHU_TOPIC_API_UPSTREAM;

  if (upstream) {
    try {
      const response = await fetch(upstream, { next: { revalidate: 300 } });
      if (response.ok) {
        const data = await response.json();
        return NextResponse.json({ source: 'upstream', items: data.items ?? data.data ?? data });
      }
    } catch {
      // Fall back to local mock topics for demo continuity.
    }
  }

  return NextResponse.json({
    source: 'mock',
    items: mockZhihuTopics,
    note: '未配置真实知乎上游时，先返回本地 mock 话题。'
  });
}
