"use client";

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { appConfig } from './config';
import {
  buildDuelRounds,
  buildPreviewOpener,
  buildReportAdvice,
  candidates,
  defaultAgentProfile,
  mockZhihuTopics,
  styleTagOptions,
  type AgentProfile,
  type Candidate,
  type SavedReport
} from './mockData';
import { usePersistentState } from './storage';

type Scene = 'landing' | 'lobby' | 'duel' | 'report';

type Session = {
  provider: 'demo' | 'second-me';
  connectedAt: string;
};

type Metric = {
  label: string;
  value: number;
};

const pageVariants = {
  initial: { opacity: 0, scale: 0.985, filter: 'blur(12px)' },
  in: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  out: { opacity: 0, scale: 1.015, filter: 'blur(12px)' }
};

function App() {
  const [scene, setScene] = useState<Scene>('landing');
  const [session, setSession] = usePersistentState<Session | null>('stage-me:session', null);
  const [profile, setProfile] = usePersistentState<AgentProfile>('stage-me:profile', defaultAgentProfile);
  const [savedReports, setSavedReports] = usePersistentState<SavedReport[]>('stage-me:reports', []);
  const [selectedCandidateId, setSelectedCandidateId] = useState('mika');
  const [topicEnabled, setTopicEnabled] = useState(true);
  const [currentRound, setCurrentRound] = useState(1);
  const [trialRunning, setTrialRunning] = useState(false);
  const [trialProgress, setTrialProgress] = useState(0);
  const [topicFeedTitle, setTopicFeedTitle] = useState(`知乎话题流：${mockZhihuTopics[0].title}`);
  const [apiStatusLabel, setApiStatusLabel] = useState('Stage API 未检查');
  const [saveFeedback, setSaveFeedback] = useState('');
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  const stageCandidates = useMemo(
    () =>
      [...candidates].sort(
        (a, b) => Number(b.hot) - Number(a.hot) || b.compatibility - a.compatibility || b.popularity - a.popularity
      ),
    []
  );

  const isDemoMode = appConfig.runtimeMode === 'demo';
  const selectedCandidate =
    stageCandidates.find((candidate) => candidate.id === selectedCandidateId) ?? stageCandidates[0] ?? candidates[0];
  const duelRounds = useMemo(
    () => buildDuelRounds(selectedCandidate, topicEnabled, profile),
    [profile, selectedCandidate, topicEnabled]
  );
  const currentRoundData = duelRounds[Math.min(currentRound, duelRounds.length) - 1] ?? duelRounds[0];
  const currentMetrics = useMemo(() => getDuelMetrics(duelRounds, currentRound), [currentRound, duelRounds]);
  const finalMetrics = useMemo(() => getDuelMetrics(duelRounds, duelRounds.length), [duelRounds]);
  const duelTimeline = useMemo(
    () => duelRounds.map((_, index) => getDuelMetrics(duelRounds, index + 1).welcome),
    [duelRounds]
  );
  const rankedCandidates = useMemo(
    () => [...stageCandidates].sort((a, b) => b.compatibility - a.compatibility),
    [stageCandidates]
  );
  const completedCandidates = stageCandidates.slice(0, trialProgress);
  const topThree = (completedCandidates.length > 0
    ? [...completedCandidates].sort((a, b) => b.compatibility - a.compatibility)
    : rankedCandidates
  ).slice(0, 3);
  const trialBest = topThree[0] ?? selectedCandidate;
  const trialFlop = (completedCandidates.length > 0
    ? [...completedCandidates].sort((a, b) => a.compatibility - b.compatibility)[0]
    : rankedCandidates[rankedCandidates.length - 1]) ?? selectedCandidate;
  const averageWelcome = completedCandidates.length
    ? Math.round(completedCandidates.reduce((sum, candidate) => sum + candidate.compatibility, 0) / completedCandidates.length)
    : Math.round(stageCandidates.reduce((sum, candidate) => sum + candidate.compatibility, 0) / stageCandidates.length);
  const openerPreview = buildPreviewOpener(profile);
  const reportAdvice = buildReportAdvice(profile);
  const currentReport = useMemo(
    () => buildReportSummary(selectedCandidate, finalMetrics, profile),
    [finalMetrics, profile, selectedCandidate]
  );
  const reportRadar: Metric[] = [
    { label: '破冰', value: Math.min(96, 58 + Math.round(profile.assertiveness * 0.38)) },
    { label: '幽默', value: profile.tags.includes('幽默型') ? 86 : 72 },
    { label: '共鸣', value: Math.min(95, 66 + Math.round(finalMetrics.chemistry * 0.28)) },
    { label: '吸引', value: Math.min(95, 62 + Math.round(finalMetrics.welcome * 0.22)) },
    { label: '续聊', value: Math.min(95, 64 + Math.round(profile.restraint * 0.2)) }
  ];
  const lastSavedReport = savedReports[0] ?? null;

  useEffect(() => {
    if (session && scene === 'landing') {
      setScene('lobby');
    }
  }, [scene, session]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const url = new URL(window.location.href);
    const authState = url.searchParams.get('auth');

    if (!authState) {
      return;
    }

    if (authState === 'connected') {
      setSession({
        provider: 'second-me',
        connectedAt: new Date().toISOString()
      });
      setAuthNotice('Second Me 授权成功，已进入舞台大厅。');
      setScene('lobby');
    }

    if (authState === 'demo') {
      setSession({
        provider: 'demo',
        connectedAt: new Date().toISOString()
      });
      setAuthNotice('当前环境走 Demo Agent，先完成交互链路测试。');
      setScene('lobby');
    }

    if (authState === 'error') {
      setAuthNotice('OAuth 回调失败。优先检查 redirect_uri、client_secret 和 token 地址。');
      setScene('landing');
    }

    url.searchParams.delete('auth');
    window.history.replaceState({}, '', url.toString());
  }, [setSession]);

  useEffect(() => {
    if (!stageCandidates.some((candidate) => candidate.id === selectedCandidateId)) {
      setSelectedCandidateId(stageCandidates[0]?.id ?? candidates[0].id);
    }
  }, [selectedCandidateId, stageCandidates]);

  useEffect(() => {
    if (!trialRunning) {
      return undefined;
    }

    setTrialProgress(0);
    const timer = window.setInterval(() => {
      setTrialProgress((current) => {
        if (current >= stageCandidates.length) {
          window.clearInterval(timer);
          setTrialRunning(false);
          return current;
        }
        return current + 1;
      });
    }, 260);

    return () => window.clearInterval(timer);
  }, [stageCandidates.length, trialRunning]);

  useEffect(() => {
    if (!trialRunning && trialProgress >= stageCandidates.length && trialBest) {
      setSelectedCandidateId(trialBest.id);
    }
  }, [stageCandidates.length, trialBest, trialProgress, trialRunning]);

  useEffect(() => {
    if (!saveFeedback) {
      return undefined;
    }

    const timer = window.setTimeout(() => setSaveFeedback(''), 1800);
    return () => window.clearTimeout(timer);
  }, [saveFeedback]);

  useEffect(() => {
    let cancelled = false;

    async function loadTopics() {
      try {
        const response = await fetch(appConfig.integrations.zhihu.topicApiUrl, {
          cache: 'no-store'
        });
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as {
          items?: Array<{ title?: string }>;
        };

        if (!cancelled && data.items && data.items.length > 0) {
          setTopicFeedTitle(`知乎话题流：${data.items[0].title ?? mockZhihuTopics[0].title}`);
        }
      } catch {
        if (!cancelled) {
          setTopicFeedTitle(`知乎话题流：${mockZhihuTopics[0].title}`);
        }
      }
    }

    loadTopics();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadApiHealth() {
      try {
        const response = await fetch(buildApiUrl(appConfig.integrations.api.baseUrl, '/health'), {
          cache: 'no-store'
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { service?: string };
        if (!cancelled) {
          setApiStatusLabel(`已连接 ${data.service ?? 'Stage API'}`);
        }
      } catch {
        if (!cancelled) {
          setApiStatusLabel('Stage API 使用本地 fallback');
        }
      }
    }

    loadApiHealth();

    return () => {
      cancelled = true;
    };
  }, []);

  function handleConnect() {
    if (session) {
      setScene('lobby');
      return;
    }

    if (appConfig.integrations.secondMe.enabled) {
      window.location.href = '/api/auth/start';
      return;
    }

    setSession({
      provider: 'demo',
      connectedAt: new Date().toISOString()
    });
    setAuthNotice('Second Me 配置未补齐，当前使用 Demo Agent 继续。');
    setScene('lobby');
  }

  function launchTrial() {
    setTrialRunning(true);
  }

  function handleStartDuel(candidateId?: string) {
    if (candidateId) {
      setSelectedCandidateId(candidateId);
    }
    setCurrentRound(1);
    setScene('duel');
  }

  function handleSaveReport() {
    if (!appConfig.features.localReports) {
      setSaveFeedback('本地报告功能已关闭');
      return;
    }

    const report: SavedReport = {
      ...currentReport,
      id: `${selectedCandidate.id}-${Date.now()}`,
      createdAt: new Date().toLocaleString('zh-CN', { hour12: false })
    };

    setSavedReports((current) => [report, ...current].slice(0, 12));
    setSaveFeedback('报告已保存到本地');
  }

  function updateOwnerKeywords(value: string) {
    const nextKeywords = value
      .split(/[，,]/)
      .map((keyword) => keyword.trim())
      .filter(Boolean)
      .slice(0, 6);

    setProfile((current) => ({
      ...current,
      ownerKeywords: nextKeywords.length > 0 ? nextKeywords : current.ownerKeywords
    }));
  }

  function toggleStyleTag(tag: (typeof styleTagOptions)[number]) {
    setProfile((current) => {
      const exists = current.tags.includes(tag);
      return {
        ...current,
        tags: exists ? current.tags.filter((item) => item !== tag) : [...current.tags, tag]
      };
    });
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-stage-bg font-space text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,77,184,0.12),transparent_32%),radial-gradient(circle_at_85%_18%,rgba(78,242,255,0.12),transparent_26%),linear-gradient(145deg,#05030A_0%,#0B0814_42%,#05030A_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(circle_at_center,black,transparent_90%)]" />
      <div className="pointer-events-none absolute -left-24 top-[-8rem] h-72 w-72 rounded-full bg-stage-pink/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-10rem] right-[-4rem] h-96 w-96 rounded-full bg-stage-cyan/15 blur-3xl" />

      {appConfig.features.debugPanel && (
        <div className="fixed left-4 right-4 top-4 z-30 mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/45 px-4 py-3 text-sm backdrop-blur-xl">
          <div className="space-y-1">
            <p className="font-medium text-white/90">
              {isDemoMode ? 'Demo fallback active' : 'Live config detected'}
            </p>
            <p className="text-white/55">
              {isDemoMode
                ? `缺少 ${appConfig.missingLiveEnv.length} 个 live 变量，当前继续使用 mock、Demo 登录和本地报告。`
                : 'OAuth 基础变量已就绪，当前可以继续联调 Second Me。'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.24em] text-white/50">
            <span>{apiStatusLabel}</span>
            <span>{topicFeedTitle}</span>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {scene === 'landing' && (
          <SceneFrame key="landing">
            <LandingScene
              appName={appConfig.appName}
              authNotice={authNotice}
              isDemoMode={isDemoMode}
              session={session}
              onEnter={handleConnect}
              apiStatusLabel={apiStatusLabel}
              topicFeedTitle={topicFeedTitle}
            />
          </SceneFrame>
        )}

        {scene === 'lobby' && (
          <SceneFrame key="lobby" className="px-4 pt-24 md:px-8 md:pt-24">
            <LobbyScene
              profile={profile}
              session={session}
              openerPreview={openerPreview}
              topicEnabled={topicEnabled}
              topicFeedTitle={topicFeedTitle}
              selectedCandidate={selectedCandidate}
              candidates={stageCandidates}
              savedReports={savedReports}
              trialRunning={trialRunning}
              trialProgress={trialProgress}
              averageWelcome={averageWelcome}
              topThree={topThree}
              trialBest={trialBest}
              trialFlop={trialFlop}
              apiStatusLabel={apiStatusLabel}
              onSelectCandidate={setSelectedCandidateId}
              onToggleTopic={setTopicEnabled}
              onStartTrial={launchTrial}
              onStartDuel={handleStartDuel}
              onUpdateProfile={setProfile}
              onUpdateKeywords={updateOwnerKeywords}
              onToggleStyleTag={toggleStyleTag}
            />
          </SceneFrame>
        )}

        {scene === 'duel' && (
          <SceneFrame key="duel" className="px-4 pt-24 md:px-8 md:pt-24">
            <DuelLiveRoom
              profile={profile}
              opponent={selectedCandidate}
              rounds={duelRounds}
              currentRound={currentRound}
              currentRoundData={currentRoundData}
              metrics={currentMetrics}
              timeline={duelTimeline}
              onBack={() => setScene('lobby')}
              onNext={() => setCurrentRound((round) => Math.min(round + 1, duelRounds.length))}
              onFinish={() => setScene('report')}
            />
          </SceneFrame>
        )}

        {scene === 'report' && (
          <SceneFrame key="report" className="px-4 pt-24 md:px-8 md:pt-24">
            <ReportScoreboard
              report={currentReport}
              finalMetrics={finalMetrics}
              radar={reportRadar}
              advice={reportAdvice}
              topThree={topThree}
              candidate={selectedCandidate}
              saveFeedback={saveFeedback}
              lastSavedReport={lastSavedReport}
              onSave={handleSaveReport}
              onRetry={() => {
                setCurrentRound(1);
                setScene('duel');
              }}
              onBackToLobby={() => {
                setCurrentRound(1);
                setScene('lobby');
              }}
            />
          </SceneFrame>
        )}
      </AnimatePresence>
    </div>
  );
}

function SceneFrame({
  children,
  className = 'px-4 pt-24 md:px-8 md:pt-24'
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      variants={pageVariants}
      initial="initial"
      animate="in"
      exit="out"
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className={`relative z-10 min-h-screen ${className}`}
    >
      {children}
    </motion.section>
  );
}

function LandingScene({
  appName,
  authNotice,
  isDemoMode,
  session,
  onEnter,
  apiStatusLabel,
  topicFeedTitle
}: {
  appName: string;
  authNotice: string | null;
  isDemoMode: boolean;
  session: Session | null;
  onEnter: () => void;
  apiStatusLabel: string;
  topicFeedTitle: string;
}) {
  const ctaLabel = session
    ? 'ENTER THE LOBBY'
    : isDemoMode
      ? 'ENTER WITH DEMO AGENT'
      : 'CONNECT & ENTER THE STAGE';

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-6xl flex-col items-center justify-center px-4 text-center">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <p className="text-xs uppercase tracking-[0.6em] text-white/45">Agent Social Showground</p>
        <h1 className="mt-6 font-bebas text-[5.5rem] leading-none tracking-[0.16em] text-white drop-shadow-text-cyan md:text-[9rem]">
          {appName.toUpperCase()}
        </h1>
        <p className="mt-4 text-lg text-white/72 md:text-2xl">
          Not you first. <span className="text-stage-pink drop-shadow-text-pink">Your AI self first.</span>
        </p>
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/52 md:text-base">
          先让 Agent 进场试配、对局、翻车、被打分，再决定你要不要自己上场。这一轮改成单页镜头流，入口只保留一颗按钮。
        </p>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.45 }}
        onClick={onEnter}
        className="mt-14 rounded-full border border-stage-cyan/70 bg-stage-cyan/10 px-10 py-4 text-sm font-semibold uppercase tracking-[0.32em] text-stage-cyan shadow-neon-cyan transition hover:-translate-y-1 hover:bg-stage-cyan hover:text-black"
      >
        {ctaLabel}
      </motion.button>

      {authNotice && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 rounded-2xl border border-stage-pink/25 bg-stage-pink/10 px-5 py-4 text-sm text-white/80 shadow-neon-pink"
        >
          {authNotice}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.45 }}
        className="mt-16 grid w-full max-w-5xl gap-4 md:grid-cols-3"
      >
        <HeroMetric label="Runtime" value={isDemoMode ? 'Demo Mode' : 'Live Ready'} hint="环境不完整也不断链" />
        <HeroMetric label="Topic Feed" value={topicFeedTitle.replace('知乎话题流：', '')} hint="第 3 轮默认接入知乎话题" />
        <HeroMetric label="API Status" value={apiStatusLabel} hint="内部 Route Handler 优先" />
      </motion.div>
    </div>
  );
}

function LobbyScene({
  profile,
  session,
  openerPreview,
  topicEnabled,
  topicFeedTitle,
  selectedCandidate,
  candidates,
  savedReports,
  trialRunning,
  trialProgress,
  averageWelcome,
  topThree,
  trialBest,
  trialFlop,
  apiStatusLabel,
  onSelectCandidate,
  onToggleTopic,
  onStartTrial,
  onStartDuel,
  onUpdateProfile,
  onUpdateKeywords,
  onToggleStyleTag
}: {
  profile: AgentProfile;
  session: Session | null;
  openerPreview: string;
  topicEnabled: boolean;
  topicFeedTitle: string;
  selectedCandidate: Candidate;
  candidates: Candidate[];
  savedReports: SavedReport[];
  trialRunning: boolean;
  trialProgress: number;
  averageWelcome: number;
  topThree: Candidate[];
  trialBest: Candidate;
  trialFlop: Candidate;
  apiStatusLabel: string;
  onSelectCandidate: (id: string) => void;
  onToggleTopic: (value: boolean) => void;
  onStartTrial: () => void;
  onStartDuel: (candidateId?: string) => void;
  onUpdateProfile: React.Dispatch<React.SetStateAction<AgentProfile>>;
  onUpdateKeywords: (value: string) => void;
  onToggleStyleTag: (tag: (typeof styleTagOptions)[number]) => void;
}) {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-stage-pink/20 bg-stage-panel/85 p-6 shadow-panel backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.42em] text-stage-pink/80">My Agent VIP Card</p>
                <h2 className="mt-4 text-3xl font-semibold text-white">{profile.name}</h2>
                <p className="mt-2 text-sm text-white/55">{profile.subtitle}</p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-stage-pink/40 bg-stage-pink/10 font-bebas text-4xl text-stage-pink shadow-neon-pink">
                {profile.name.slice(0, 1).toUpperCase()}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {profile.tags.map((tag) => (
                <Pill key={tag} tone="pink">
                  {tag}
                </Pill>
              ))}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <MetricPanel label="欢迎度" value={String(profile.welcome)} hint="今晚入场基准值" tone="pink" />
              <MetricPanel label="气氛值" value={String(profile.chemistry)} hint="中盘升温能力" tone="cyan" />
              <MetricPanel label="登入来源" value={session?.provider === 'second-me' ? 'Second Me' : 'Demo'} hint={apiStatusLabel} tone="mint" />
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.28em] text-white/40">Owner Keywords</p>
              <div className="mt-3 flex flex-wrap gap-2 text-sm text-white/70">
                {profile.ownerKeywords.map((keyword) => (
                  <span key={keyword} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                    {keyword}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-sm leading-6 text-white/55">{profile.status}</p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-black/35 p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.38em] text-white/42">Agent Lab</p>
                <h3 className="mt-2 text-xl font-semibold">风格拨盘</h3>
              </div>
              <Pill tone="cyan">Inline</Pill>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block space-y-2 text-sm text-white/70">
                <span>Agent 名称</span>
                <input
                  value={profile.name}
                  onChange={(event) => onUpdateProfile((current) => ({ ...current, name: event.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-stage-cyan/50"
                />
              </label>

              <label className="block space-y-2 text-sm text-white/70">
                <span>主人关键词</span>
                <input
                  value={profile.ownerKeywords.join(', ')}
                  onChange={(event) => onUpdateKeywords(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-stage-cyan/50"
                />
              </label>

              <label className="block space-y-2 text-sm text-white/70">
                <span>开场白</span>
                <textarea
                  rows={4}
                  value={profile.opener}
                  onChange={(event) => onUpdateProfile((current) => ({ ...current, opener: event.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-stage-cyan/50"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <RangeField
                  label={`主动度 ${profile.assertiveness}`}
                  value={profile.assertiveness}
                  onChange={(value) => onUpdateProfile((current) => ({ ...current, assertiveness: value }))}
                />
                <RangeField
                  label={`克制度 ${profile.restraint}`}
                  value={profile.restraint}
                  onChange={(value) => onUpdateProfile((current) => ({ ...current, restraint: value }))}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {styleTagOptions.map((tag) => {
                  const active = profile.tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => onToggleStyleTag(tag)}
                      className={`rounded-full border px-3 py-2 text-sm transition ${
                        active
                          ? 'border-stage-pink/60 bg-stage-pink/15 text-white shadow-neon-pink'
                          : 'border-white/10 bg-white/5 text-white/58 hover:border-stage-cyan/40 hover:text-white'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>

              <div className="rounded-2xl border border-stage-cyan/20 bg-stage-cyan/5 p-4">
                <p className="text-xs uppercase tracking-[0.32em] text-stage-cyan/70">Opener Preview</p>
                <p className="mt-3 text-sm leading-7 text-white/78">{openerPreview}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-white/10 bg-stage-panel/80 p-6 shadow-panel backdrop-blur-xl md:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs uppercase tracking-[0.46em] text-white/42">Tonight's Stage</p>
                <h2 className="mt-4 font-bebas text-5xl tracking-[0.12em] text-white md:text-6xl">LOBBY / ENTRY GATE</h2>
                <p className="mt-4 text-sm leading-7 text-white/58 md:text-base">
                  左边是你的 VIP 身份牌，右边是今夜舞台入口。先跑一轮全场试配，再让选中的对象进入 1v1 直播间。
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={onStartTrial}
                  className="rounded-full border border-stage-cyan/60 bg-stage-cyan/10 px-6 py-3 text-sm font-semibold uppercase tracking-[0.28em] text-stage-cyan shadow-neon-cyan transition hover:-translate-y-1"
                >
                  开始全场试配
                </button>
                <button
                  onClick={() => onStartDuel(selectedCandidate.id)}
                  className="rounded-full border border-stage-pink/60 bg-stage-pink/15 px-6 py-3 text-sm font-semibold uppercase tracking-[0.28em] text-white shadow-neon-pink transition hover:-translate-y-1"
                >
                  与 {selectedCandidate.name} 开打
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-white/40">Selected Opponent</p>
                    <h3 className="mt-3 text-2xl font-semibold text-white">{selectedCandidate.name}</h3>
                    <p className="mt-2 text-sm text-white/52">
                      {selectedCandidate.codename} · {selectedCandidate.archetype}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-stage-cyan/35 bg-stage-cyan/10 px-3 py-2 text-right shadow-neon-cyan">
                    <p className="text-[11px] uppercase tracking-[0.28em] text-stage-cyan/80">Compatibility</p>
                    <strong className="font-bebas text-4xl text-white">{selectedCandidate.compatibility}</strong>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedCandidate.tags.map((tag) => (
                    <Pill key={tag} tone="cyan">
                      {tag}
                    </Pill>
                  ))}
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <InsightBlock label="对局话题" value={selectedCandidate.topic} tone="cyan" />
                  <InsightBlock label="危险提示" value={selectedCandidate.flop} tone="danger" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <InfoPanel label="知乎话题轮" value={topicFeedTitle} tone="cyan" />
                <InfoPanel
                  label="最近一份报告"
                  value={savedReports[0] ? `${savedReports[0].opponentName} · ${savedReports[0].totalScore}` : '还没有本地报告'}
                  tone="mint"
                />
                <label className="flex items-center justify-between rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/70">
                  <span>开启知乎话题轮</span>
                  <button
                    onClick={() => onToggleTopic(!topicEnabled)}
                    className={`relative h-7 w-14 rounded-full border transition ${
                      topicEnabled ? 'border-stage-cyan/60 bg-stage-cyan/20' : 'border-white/10 bg-white/5'
                    }`}
                    aria-label="toggle topic round"
                  >
                    <span
                      className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${topicEnabled ? 'left-8' : 'left-1'}`}
                    />
                  </button>
                </label>
                <InfoPanel label="API 状态" value={apiStatusLabel} tone="pink" />
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[2rem] border border-white/10 bg-black/35 p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.36em] text-white/42">Candidate Wall</p>
                  <h3 className="mt-2 text-2xl font-semibold">今夜候选擂台</h3>
                </div>
                <Pill tone="pink">{candidates.length} Agents</Pill>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {candidates.map((candidate) => (
                  <CandidateStageCard
                    key={candidate.id}
                    candidate={candidate}
                    active={candidate.id === selectedCandidate.id}
                    onClick={() => onSelectCandidate(candidate.id)}
                    onStartDuel={() => onStartDuel(candidate.id)}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[2rem] border border-stage-cyan/20 bg-stage-panel/75 p-6 shadow-panel backdrop-blur-xl">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.34em] text-stage-cyan/72">Arena Scanner</p>
                    <h3 className="mt-2 text-2xl font-semibold">全场试配控制台</h3>
                  </div>
                  <div className="rounded-full border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.32em] text-white/55">
                    {trialRunning ? 'Scanning' : 'Idle'}
                  </div>
                </div>

                <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-black/25 p-5">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-white/42">Progress</p>
                      <div className="mt-2 flex items-end gap-2">
                        <span className="font-bebas text-6xl text-white">{trialProgress}</span>
                        <span className="pb-2 text-sm text-white/42">/ {candidates.length}</span>
                      </div>
                    </div>
                    <div className="text-right text-sm text-white/52">
                      <p>平均欢迎度 {averageWelcome}</p>
                      <p>最佳对象 {trialBest.name}</p>
                    </div>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/8">
                    <motion.div
                      className="h-full bg-stage-cyan"
                      animate={{ width: `${(trialProgress / Math.max(candidates.length, 1)) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <InsightBlock label="当前最佳" value={`${trialBest.name} · ${trialBest.compatibility} 分`} tone="mint" />
                  <InsightBlock label="当前风险局" value={`${trialFlop.name} · ${trialFlop.flop}`} tone="danger" />
                </div>

                <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                  <p className="text-xs uppercase tracking-[0.28em] text-white/42">Top 3</p>
                  <div className="mt-4 space-y-3">
                    {topThree.map((candidate, index) => (
                      <div key={candidate.id} className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="font-bebas text-2xl text-stage-pink">0{index + 1}</span>
                          <div>
                            <p className="text-sm font-semibold text-white">{candidate.name}</p>
                            <p className="text-xs text-white/45">{candidate.archetype}</p>
                          </div>
                        </div>
                        <span className="text-sm text-stage-cyan">{candidate.compatibility}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-black/35 p-6 backdrop-blur-xl">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.34em] text-white/42">Local Reports</p>
                    <h3 className="mt-2 text-xl font-semibold">本地报告库</h3>
                  </div>
                  <Pill tone="mint">{savedReports.length}</Pill>
                </div>
                <div className="mt-4 space-y-3">
                  {savedReports.length > 0 ? (
                    savedReports.slice(0, 3).map((report) => (
                      <div key={report.id} className="rounded-2xl border border-white/8 bg-white/5 p-4">
                        <div className="flex items-center justify-between gap-3 text-sm text-white/55">
                          <strong className="text-white">{report.opponentName}</strong>
                          <span>{report.createdAt}</span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-white/72">{report.summary}</p>
                        <div className="mt-3 flex items-center gap-3 text-xs uppercase tracking-[0.24em] text-white/42">
                          <span>总分 {report.totalScore}</span>
                          <span>欢迎度 {report.welcome}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-2xl border border-dashed border-white/10 px-4 py-5 text-sm leading-6 text-white/52">
                      当前还没有保存报告。走完一局 1v1 之后，报告会先保存在浏览器本地。
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DuelLiveRoom({
  profile,
  opponent,
  rounds,
  currentRound,
  currentRoundData,
  metrics,
  timeline,
  onBack,
  onNext,
  onFinish
}: {
  profile: AgentProfile;
  opponent: Candidate;
  rounds: ReturnType<typeof buildDuelRounds>;
  currentRound: number;
  currentRoundData: ReturnType<typeof buildDuelRounds>[number];
  metrics: ReturnType<typeof getDuelMetrics>;
  timeline: number[];
  onBack: () => void;
  onNext: () => void;
  onFinish: () => void;
}) {
  const isLastRound = currentRound >= rounds.length;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-full border border-white/10 bg-black/35 px-5 py-3 text-xs uppercase tracking-[0.3em] text-white/46 backdrop-blur-xl">
        <span>Duel Live Room</span>
        <span>
          Round {currentRound} / {rounds.length}
        </span>
      </div>

      <div className="grid min-h-[76vh] gap-6 lg:grid-cols-[220px_minmax(0,1fr)_220px]">
        <StatusColumn
          side="left"
          title={profile.name}
          subtitle={profile.tags.slice(0, 2).join(' / ')}
          badge="ME"
          value={metrics.chemistry}
          label="CHEMISTRY"
          tone="pink"
          secondary={`${profile.assertiveness} AGGRO`}
        />

        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-stage-panel/80 p-6 shadow-panel backdrop-blur-xl md:p-8">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-stage-cyan/60 to-transparent" />
          <div className="absolute inset-x-10 top-14 h-40 rounded-full bg-stage-cyan/6 blur-3xl" />

          <div className="relative z-10 flex h-full flex-col justify-between gap-6">
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.45em] text-white/42">Stage Broadcast</p>
              <h2 className="mt-3 font-bebas text-5xl tracking-[0.16em] text-white/45 md:text-6xl">
                ROUND {currentRound}
              </h2>
              <div className="mt-4 inline-flex rounded-full border border-stage-cyan/35 bg-stage-cyan/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-stage-cyan">
                {currentRoundData.stageLabel} · {currentRoundData.type === 'topic' ? '知乎话题轮' : '普通对线轮'}
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentRound}
                initial={{ opacity: 0, y: 34, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -34, scale: 0.97 }}
                transition={{ duration: 0.35 }}
                className="mx-auto w-full max-w-3xl space-y-5"
              >
                <LiveCard
                  tone="pink"
                  speaker={`${profile.name} 发起攻势`}
                  text={currentRoundData.agentLine}
                  align="left"
                />
                <LiveCard
                  tone="cyan"
                  speaker={`${opponent.name} 拆招回应`}
                  text={currentRoundData.opponentLine}
                  align="right"
                />
              </motion.div>
            </AnimatePresence>

            <div className="space-y-4">
              <div className={`rounded-[1.5rem] border px-4 py-4 ${metrics.tag.includes('下降') || metrics.tag.includes('油腻') ? 'border-stage-danger/30 bg-stage-danger/10 text-white' : 'border-stage-mint/25 bg-stage-mint/10 text-white'}`}>
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                  <span className="uppercase tracking-[0.28em] text-white/55">{metrics.tag}</span>
                  <span className="text-white/60">WELCOME {metrics.welcome} · CHEMISTRY {metrics.chemistry}</span>
                </div>
                <p className="mt-3 text-base leading-7 text-white/80">{metrics.insight}</p>
                <p className="mt-2 text-sm leading-6 text-white/50">{metrics.summary}</p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 rounded-[1.5rem] border border-white/10 bg-black/20 px-4 py-4">
                <div className="flex flex-wrap gap-2">
                  {rounds.map((round, index) => (
                    <span
                      key={round.round}
                      className={`rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.22em] ${
                        index + 1 === currentRound
                          ? 'border-stage-pink/60 bg-stage-pink/15 text-white shadow-neon-pink'
                          : index + 1 < currentRound
                            ? 'border-stage-cyan/25 bg-stage-cyan/10 text-white/78'
                            : 'border-white/10 bg-white/5 text-white/40'
                      }`}
                    >
                      R{round.round}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={onBack}
                    className="rounded-full border border-white/10 px-5 py-3 text-sm text-white/65 transition hover:border-white/20 hover:text-white"
                  >
                    返回大厅
                  </button>
                  <button
                    onClick={isLastRound ? onFinish : onNext}
                    className="rounded-full border border-white/80 bg-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-black transition hover:-translate-y-1"
                  >
                    {isLastRound ? '查看最终判决' : '下一回合'}
                  </button>
                </div>
              </div>

              <MiniTimeline values={timeline} activeCount={currentRound} />
            </div>
          </div>
        </div>

        <StatusColumn
          side="right"
          title={opponent.name}
          subtitle={opponent.archetype}
          badge="OP"
          value={metrics.welcome}
          label="WELCOME"
          tone="cyan"
          secondary={`${opponent.difficulty} DIFF`}
        />
      </div>
    </div>
  );
}

function ReportScoreboard({
  report,
  finalMetrics,
  radar,
  advice,
  topThree,
  candidate,
  saveFeedback,
  lastSavedReport,
  onSave,
  onRetry,
  onBackToLobby
}: {
  report: ReturnType<typeof buildReportSummary>;
  finalMetrics: ReturnType<typeof getDuelMetrics>;
  radar: Metric[];
  advice: string[];
  topThree: Candidate[];
  candidate: Candidate;
  saveFeedback: string;
  lastSavedReport: SavedReport | null;
  onSave: () => void;
  onRetry: () => void;
  onBackToLobby: () => void;
}) {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="grid gap-6 xl:grid-cols-[0.94fr_1.06fr]">
        <div className="rounded-[2rem] border border-stage-pink/20 bg-stage-panel/85 p-8 shadow-panel backdrop-blur-xl md:p-10">
          <p className="text-xs uppercase tracking-[0.5em] text-stage-pink/70">Tonight's Performance</p>
          <div className="mt-6 flex items-end gap-3">
            <motion.span
              initial={{ opacity: 0, scale: 0.65 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', bounce: 0.35 }}
              className="font-bebas text-[7rem] leading-none text-white drop-shadow-text-pink md:text-[9rem]"
            >
              {report.totalScore}
            </motion.span>
            <span className="pb-4 font-bebas text-2xl tracking-[0.2em] text-white/36">/ 100</span>
          </div>
          <p className="mt-5 text-base leading-8 text-white/74 md:text-lg">{report.summary}</p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <MetricPanel label="欢迎度" value={String(finalMetrics.welcome)} hint="对方即时接纳值" tone="cyan" />
            <MetricPanel label="气氛值" value={String(finalMetrics.chemistry)} hint="整局热度" tone="pink" />
            <MetricPanel label="本局对象" value={candidate.name} hint={candidate.archetype} tone="mint" />
          </div>

          <div className="mt-8 rounded-[1.75rem] border border-white/10 bg-black/25 p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.3em] text-white/42">Judge Metrics</p>
              <span className="text-xs uppercase tracking-[0.28em] text-white/35">Live + Replay</span>
            </div>
            <div className="mt-5 space-y-4">
              {radar.map((item) => (
                <MetricBar key={item.label} label={item.label} value={item.value} />
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={onSave}
              className="rounded-full border border-stage-cyan/60 bg-stage-cyan/10 px-6 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-stage-cyan shadow-neon-cyan transition hover:-translate-y-1"
            >
              保存报告
            </button>
            <button
              onClick={onRetry}
              className="rounded-full border border-stage-pink/60 bg-stage-pink/15 px-6 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-white shadow-neon-pink transition hover:-translate-y-1"
            >
              再来一局
            </button>
            <button
              onClick={onBackToLobby}
              className="rounded-full border border-white/10 px-6 py-3 text-sm text-white/65 transition hover:border-white/20 hover:text-white"
            >
              返回大厅
            </button>
          </div>
          {saveFeedback && <p className="mt-4 text-sm text-stage-mint">{saveFeedback}</p>}
        </div>

        <div className="space-y-4">
          <ReplayCard
            tone="danger"
            label="Death Replay // 最尬片段"
            title={report.flop}
            body="第四轮推进欲暴露得太早，对方开始从接球转向审问你的动机。"
          />
          <ReplayCard
            tone="mint"
            label="Highlight // 最佳破冰"
            title={report.highlight}
            body="最后一轮把节奏收住了，留白重新把欢迎度拉回安全区。"
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-[1.75rem] border border-white/10 bg-black/30 p-5 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.3em] text-white/42">Top 3 Ranking</p>
              <div className="mt-4 space-y-3">
                {topThree.map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="font-bebas text-2xl text-stage-pink">0{index + 1}</span>
                      <div>
                        <p className="text-sm font-semibold text-white">{item.name}</p>
                        <p className="text-xs text-white/45">{item.archetype}</p>
                      </div>
                    </div>
                    <span className="text-sm text-stage-cyan">{item.compatibility}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-black/30 p-5 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.3em] text-white/42">Advice Stack</p>
              <div className="mt-4 space-y-3 text-sm leading-6 text-white/72">
                {advice.map((item) => (
                  <div key={item} className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-black/30 p-5 backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.3em] text-white/42">Last Saved Snapshot</p>
            <p className="mt-3 text-sm leading-7 text-white/72">
              {lastSavedReport
                ? `最近保存的是 ${lastSavedReport.opponentName}，总分 ${lastSavedReport.totalScore}，创建时间 ${lastSavedReport.createdAt}。`
                : '当前还没有保存过报告，先把这一局存下来。'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroMetric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-[1.6rem] border border-white/10 bg-black/30 p-5 text-left backdrop-blur-xl">
      <p className="text-xs uppercase tracking-[0.34em] text-white/40">{label}</p>
      <h3 className="mt-3 text-lg font-semibold text-white">{value}</h3>
      <p className="mt-2 text-sm leading-6 text-white/50">{hint}</p>
    </div>
  );
}

function CandidateStageCard({
  candidate,
  active,
  onClick,
  onStartDuel
}: {
  candidate: Candidate;
  active: boolean;
  onClick: () => void;
  onStartDuel: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
      className={`group rounded-[1.6rem] border p-4 text-left transition ${
        active
          ? 'border-stage-cyan/45 bg-stage-cyan/10 shadow-neon-cyan'
          : 'border-white/10 bg-white/5 hover:border-stage-pink/30 hover:bg-stage-pink/6'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-white/40">{candidate.codename}</p>
          <h4 className="mt-2 text-lg font-semibold text-white">{candidate.name}</h4>
          <p className="mt-1 text-sm text-white/48">{candidate.archetype}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border font-bebas text-2xl ${active ? 'border-stage-cyan/45 bg-stage-cyan/15 text-stage-cyan' : 'border-white/10 bg-black/20 text-white/70'}`}>
          {candidate.name.slice(0, 1)}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {candidate.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs text-white/62">
            {tag}
          </span>
        ))}
      </div>

      <p className="mt-4 text-sm leading-6 text-white/60">{candidate.vibe}</p>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <MiniStat label="难度" value={candidate.difficulty} />
        <MiniStat label="有趣度" value={candidate.fun} />
        <MiniStat label="兼容率" value={candidate.compatibility} highlight />
      </div>

      <button
        onClick={(event) => {
          event.stopPropagation();
          onStartDuel();
        }}
        className="mt-4 w-full rounded-full border border-white/10 px-4 py-2.5 text-sm text-white/65 transition hover:border-stage-cyan/40 hover:text-white"
      >
        直接开打
      </button>
    </div>
  );
}

function StatusColumn({
  title,
  subtitle,
  badge,
  value,
  label,
  tone,
  secondary
}: {
  side: 'left' | 'right';
  title: string;
  subtitle: string;
  badge: string;
  value: number;
  label: string;
  tone: 'pink' | 'cyan';
  secondary: string;
}) {
  const toneClasses =
    tone === 'pink'
      ? 'border-stage-pink/30 bg-stage-pink/8 text-stage-pink shadow-neon-pink'
      : 'border-stage-cyan/30 bg-stage-cyan/8 text-stage-cyan shadow-neon-cyan';
  const barClasses = tone === 'pink' ? 'bg-stage-pink' : 'bg-stage-cyan';

  return (
    <div className="flex flex-col justify-center gap-5 rounded-[2rem] border border-white/10 bg-black/35 p-5 backdrop-blur-xl lg:p-6">
      <div className={`flex h-20 w-20 items-center justify-center rounded-full border-2 font-bebas text-3xl ${toneClasses}`}>
        {badge}
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.34em] text-white/42">{subtitle}</p>
        <h3 className="mt-2 text-2xl font-semibold text-white">{title}</h3>
      </div>
      <div>
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.28em] text-white/42">
          <span>{label}</span>
          <span>{value}%</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/8">
          <motion.div className={`h-full ${barClasses}`} animate={{ width: `${value}%` }} />
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs uppercase tracking-[0.24em] text-white/52">
        {secondary}
      </div>
    </div>
  );
}

function LiveCard({
  tone,
  speaker,
  text,
  align
}: {
  tone: 'pink' | 'cyan';
  speaker: string;
  text: string;
  align: 'left' | 'right';
}) {
  const classes =
    tone === 'pink'
      ? 'border-stage-pink/25 bg-gradient-to-r from-stage-pink/12 to-transparent'
      : 'border-stage-cyan/25 bg-gradient-to-l from-stage-cyan/12 to-transparent';

  return (
    <div className={`rounded-[1.75rem] border p-5 ${classes} ${align === 'right' ? 'text-right' : 'text-left'}`}>
      <p className={`text-xs uppercase tracking-[0.34em] ${tone === 'pink' ? 'text-stage-pink' : 'text-stage-cyan'}`}>
        {speaker}
      </p>
      <p className="mt-3 text-lg leading-8 text-white/86">{text}</p>
    </div>
  );
}

function ReplayCard({
  tone,
  label,
  title,
  body
}: {
  tone: 'danger' | 'mint';
  label: string;
  title: string;
  body: string;
}) {
  const accent = tone === 'danger' ? 'bg-stage-danger border-stage-danger/30' : 'bg-stage-mint border-stage-mint/30';
  const textTone = tone === 'danger' ? 'text-stage-danger' : 'text-stage-mint';

  return (
    <motion.div
      initial={{ x: 26, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="relative overflow-hidden rounded-[1.9rem] border border-white/10 bg-black/30 p-6 backdrop-blur-xl"
    >
      <div className={`absolute inset-y-0 left-0 w-1 ${accent}`} />
      <p className={`text-xs uppercase tracking-[0.34em] ${textTone}`}>{label}</p>
      <h3 className="mt-4 text-xl font-semibold leading-8 text-white">{title}</h3>
      <p className="mt-4 text-sm leading-7 text-white/62">{body}</p>
    </motion.div>
  );
}

function MiniTimeline({ values, activeCount }: { values: number[]; activeCount: number }) {
  const max = Math.max(...values, 1);

  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
      <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.28em] text-white/42">
        <span>欢迎度趋势</span>
        <span>实时</span>
      </div>
      <div className="mt-4 flex items-end gap-2">
        {values.map((value, index) => {
          const height = `${Math.max(18, (value / max) * 72)}px`;
          const active = index + 1 <= activeCount;
          return (
            <div key={`${value}-${index}`} className="flex-1 text-center">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height }}
                className={`mx-auto w-full rounded-full ${
                  active ? 'bg-stage-cyan' : 'bg-white/10'
                }`}
              />
              <span className="mt-2 block text-[10px] uppercase tracking-[0.22em] text-white/35">R{index + 1}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RangeField({
  label,
  value,
  onChange
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block space-y-2 text-sm text-white/70">
      <span>{label}</span>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-[#4EF2FF]"
      />
    </label>
  );
}

function MetricPanel({
  label,
  value,
  hint,
  tone
}: {
  label: string;
  value: string;
  hint: string;
  tone: 'pink' | 'cyan' | 'mint';
}) {
  const toneMap = {
    pink: 'border-stage-pink/25 bg-stage-pink/8 text-stage-pink',
    cyan: 'border-stage-cyan/25 bg-stage-cyan/8 text-stage-cyan',
    mint: 'border-stage-mint/25 bg-stage-mint/8 text-stage-mint'
  } as const;

  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-[0.28em] text-white/40">{label}</p>
      <div className="mt-3 flex items-end gap-2">
        <span className="font-bebas text-4xl text-white">{value}</span>
        <span className={`rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.22em] ${toneMap[tone]}`}>
          live
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-white/50">{hint}</p>
    </div>
  );
}

function InfoPanel({ label, value, tone }: { label: string; value: string; tone: 'pink' | 'cyan' | 'mint' }) {
  const toneMap = {
    pink: 'text-stage-pink border-stage-pink/25 bg-stage-pink/8',
    cyan: 'text-stage-cyan border-stage-cyan/25 bg-stage-cyan/8',
    mint: 'text-stage-mint border-stage-mint/25 bg-stage-mint/8'
  } as const;

  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.28em] text-white/42">{label}</p>
      <p className="mt-3 text-sm leading-7 text-white/78">{value}</p>
      <div className={`mt-3 inline-flex rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] ${toneMap[tone]}`}>
        active
      </div>
    </div>
  );
}

function InsightBlock({ label, value, tone }: { label: string; value: string; tone: 'cyan' | 'danger' | 'mint' }) {
  const toneMap = {
    cyan: 'border-stage-cyan/25 bg-stage-cyan/8 text-stage-cyan',
    danger: 'border-stage-danger/25 bg-stage-danger/8 text-stage-danger',
    mint: 'border-stage-mint/25 bg-stage-mint/8 text-stage-mint'
  } as const;

  return (
    <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-[0.28em] text-white/42">{label}</p>
      <p className="mt-3 text-sm leading-6 text-white/76">{value}</p>
      <div className={`mt-3 inline-flex rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] ${toneMap[tone]}`}>
        signal
      </div>
    </div>
  );
}

function MetricBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm text-white/65">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/8">
        <motion.div className="h-full bg-gradient-to-r from-stage-pink via-stage-cyan to-stage-mint" animate={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function MiniStat({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border px-2 py-3 ${highlight ? 'border-stage-cyan/25 bg-stage-cyan/10 text-white' : 'border-white/8 bg-black/20 text-white/75'}`}>
      <p className="text-[10px] uppercase tracking-[0.22em] text-white/42">{label}</p>
      <p className="mt-2 text-sm font-semibold">{value}</p>
    </div>
  );
}

function Pill({ children, tone }: { children: React.ReactNode; tone: 'pink' | 'cyan' | 'mint' }) {
  const toneMap = {
    pink: 'border-stage-pink/25 bg-stage-pink/8 text-stage-pink',
    cyan: 'border-stage-cyan/25 bg-stage-cyan/8 text-stage-cyan',
    mint: 'border-stage-mint/25 bg-stage-mint/8 text-stage-mint'
  } as const;

  return (
    <span className={`inline-flex rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.22em] ${toneMap[tone]}`}>
      {children}
    </span>
  );
}

function getDuelMetrics(rounds: ReturnType<typeof buildDuelRounds>, revealedRound: number) {
  const baseWelcome = 56;
  const baseChemistry = 49;
  const activeRounds = rounds.slice(0, revealedRound);
  const welcome = Math.max(
    0,
    Math.min(100, baseWelcome + activeRounds.reduce((sum, round) => sum + round.welcomeDelta, 0))
  );
  const chemistry = Math.max(
    0,
    Math.min(100, baseChemistry + activeRounds.reduce((sum, round) => sum + round.chemistryDelta, 0))
  );
  const latestRound = activeRounds[activeRounds.length - 1] ?? rounds[0];

  return {
    welcome,
    chemistry,
    tag: latestRound.systemTag,
    insight: latestRound.insight,
    summary:
      latestRound.round < rounds.length
        ? `目前进行到第 ${latestRound.round} 轮，互动已经从礼貌互探切换到结构化判断。`
        : '最后一轮及时留白，整局没有在收尾阶段继续失速，这是这次对局最关键的修正。'
  };
}

function buildReportSummary(
  opponent: Candidate,
  duelMetrics: ReturnType<typeof getDuelMetrics>,
  profile: AgentProfile
) {
  const totalScore = Math.round(
    (duelMetrics.welcome * 0.55 + duelMetrics.chemistry * 0.45 + profile.assertiveness * 0.1) / 1.1
  );

  return {
    opponentId: opponent.id,
    opponentName: opponent.name,
    totalScore,
    welcome: duelMetrics.welcome,
    summary:
      profile.restraint <= 45
        ? '你的 Agent 开场够狠，但中盘推进欲暴露太早。把第四轮收一收，分数会明显抬高。'
        : '你的 Agent 今天开场和收束都在线，第四轮略快，但整体舞台感已经成立。',
    highlight: '那我收一下麦。下次如果还能排到同一桌，我带一个更好的问题来，不带结论。',
    flop:
      profile.restraint <= 45
        ? '我聊兴奋的时候会推得有点快，但我更想知道你会在哪一轮开始认真。'
        : '我有个坏习惯，一聊兴奋就会把节奏推太快。所以如果我开始过度输出，你可以直接打断。'
  };
}

function buildApiUrl(baseUrl: string, path: string) {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

export default App;
