import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'stage-me-next',
    stageApiBaseUrl: process.env.NEXT_PUBLIC_STAGE_API_BASE_URL || '/api',
    zhihuTopicApiUrl: process.env.NEXT_PUBLIC_ZHIHU_TOPIC_API_URL || '/api/topics/zhihu',
    mode: process.env.NEXT_PUBLIC_STAGE_MODE || 'auto'
  });
}
