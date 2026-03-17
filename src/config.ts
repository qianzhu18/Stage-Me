const LIVE_REQUIRED_VARS = [
  'NEXT_PUBLIC_SECOND_ME_AUTH_URL',
  'NEXT_PUBLIC_SECOND_ME_CLIENT_ID',
  'NEXT_PUBLIC_SECOND_ME_REDIRECT_URI'
] as const;

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (value === undefined || value === '') {
    return fallback;
  }
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

function cleanValue(value: string | undefined) {
  return value?.trim() ?? '';
}

const envValues = {
  appName: cleanValue(process.env.NEXT_PUBLIC_APP_NAME) || 'Stage Me',
  mode: cleanValue(process.env.NEXT_PUBLIC_STAGE_MODE) || 'auto',
  apiBaseUrl: cleanValue(process.env.NEXT_PUBLIC_STAGE_API_BASE_URL) || '/api',
  secondMeAuthUrl: cleanValue(process.env.NEXT_PUBLIC_SECOND_ME_AUTH_URL),
  secondMeClientId: cleanValue(process.env.NEXT_PUBLIC_SECOND_ME_CLIENT_ID),
  secondMeRedirectUri: cleanValue(process.env.NEXT_PUBLIC_SECOND_ME_REDIRECT_URI),
  zhihuTopicApiUrl: cleanValue(process.env.NEXT_PUBLIC_ZHIHU_TOPIC_API_URL) || '/api/topics/zhihu',
  enableLocalReports: parseBoolean(process.env.NEXT_PUBLIC_ENABLE_LOCAL_REPORTS, true),
  enableDebugPanel: parseBoolean(process.env.NEXT_PUBLIC_ENABLE_DEBUG_PANEL, true)
};

const missingLiveEnv = LIVE_REQUIRED_VARS.filter((key) => !cleanValue(process.env[key]));
const requestedMode = envValues.mode === 'demo' || envValues.mode === 'live' ? envValues.mode : 'auto';
const runtimeMode = requestedMode === 'auto' ? (missingLiveEnv.length === 0 ? 'live' : 'demo') : requestedMode;

export const appConfig = {
  appName: envValues.appName,
  requestedMode,
  runtimeMode,
  integrations: {
    api: {
      baseUrl: envValues.apiBaseUrl,
      enabled: Boolean(envValues.apiBaseUrl)
    },
    secondMe: {
      authUrl: envValues.secondMeAuthUrl,
      clientId: envValues.secondMeClientId,
      redirectUri: envValues.secondMeRedirectUri,
      enabled:
        Boolean(envValues.secondMeAuthUrl) &&
        Boolean(envValues.secondMeClientId) &&
        Boolean(envValues.secondMeRedirectUri)
    },
    zhihu: {
      topicApiUrl: envValues.zhihuTopicApiUrl,
      enabled: Boolean(envValues.zhihuTopicApiUrl)
    }
  },
  features: {
    localReports: envValues.enableLocalReports,
    debugPanel: envValues.enableDebugPanel
  },
  missingLiveEnv,
  liveRequiredVars: [...LIVE_REQUIRED_VARS]
} as const;

export type AppConfig = typeof appConfig;
