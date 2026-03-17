declare namespace NodeJS {
  interface ProcessEnv {
    readonly NEXT_PUBLIC_STAGE_MODE?: 'auto' | 'demo' | 'live';
    readonly NEXT_PUBLIC_APP_NAME?: string;
    readonly NEXT_PUBLIC_ENABLE_LOCAL_REPORTS?: string;
    readonly NEXT_PUBLIC_ENABLE_DEBUG_PANEL?: string;
    readonly NEXT_PUBLIC_STAGE_API_BASE_URL?: string;
    readonly NEXT_PUBLIC_SECOND_ME_AUTH_URL?: string;
    readonly NEXT_PUBLIC_SECOND_ME_CLIENT_ID?: string;
    readonly NEXT_PUBLIC_SECOND_ME_REDIRECT_URI?: string;
    readonly NEXT_PUBLIC_ZHIHU_TOPIC_API_URL?: string;
    readonly SECOND_ME_CLIENT_SECRET?: string;
    readonly SECOND_ME_TOKEN_URL?: string;
    readonly ZHIHU_TOPIC_API_UPSTREAM?: string;
    readonly SESSION_SECRET?: string;
    readonly DATABASE_URL?: string;
  }
}
