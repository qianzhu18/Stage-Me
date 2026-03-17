"use client";

import { motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { appConfig } from './config';
import {
  buildDuelRounds,
  buildPreviewOpener,
  buildReportAdvice,
  candidates,
  defaultAgentProfile,
  styleTagOptions,
  type AgentProfile,
  type Candidate,
  type SavedReport
} from './mockData';
import { usePersistentState } from './storage';

type Screen = 'landing' | 'login' | 'lobby' | 'match' | 'duel' | 'report' | 'lab';
type MatchMode = 'random5' | 'random10' | 'hot';
type StyleFilter = 'all' | (typeof styleTagOptions)[number];

type Metric = {
  label: string;
  value: number;
};

type Session = {
  provider: 'demo' | 'second-me';
  connectedAt: string;
};

const modeLabels: Record<MatchMode, string> = {
  random5: '随机 5',
  random10: '随机 10',
  hot: '热门池'
};

const modeTotals: Record<MatchMode, number> = {
  random5: 5,
  random10: 10,
  hot: 6
};

const filterOptions: StyleFilter[] = ['all', ...styleTagOptions];

const steps: Array<{ id: Screen; label: string }> = [
  { id: 'landing', label: 'Landing' },
  { id: 'login', label: 'Connect' },
  { id: 'lobby', label: 'Lobby' },
  { id: 'match', label: 'Match' },
  { id: 'duel', label: '1v1' },
  { id: 'report', label: 'Report' },
  { id: 'lab', label: 'Agent Lab' }
];

function App() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [session, setSession] = usePersistentState<Session | null>('stage-me:session', null);
  const [profile, setProfile] = usePersistentState<AgentProfile>('stage-me:profile', defaultAgentProfile);
  const [savedReports, setSavedReports] = usePersistentState<SavedReport[]>(
    'stage-me:reports',
    []
  );
  const [matchMode, setMatchMode] = useState<MatchMode>('random5');
  const [styleFilter, setStyleFilter] = useState<StyleFilter>('all');
  const [topicEnabled, setTopicEnabled] = useState(true);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('mika');
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [revealedRound, setRevealedRound] = useState(1);
  const [saveFeedback, setSaveFeedback] = useState('');
  const [topicFeedTitle, setTopicFeedTitle] = useState('知乎热榜：AI 时代还需要通识教育吗');
  const [apiStatusLabel, setApiStatusLabel] = useState('Stage API 未检查');

  const isDemoMode = appConfig.runtimeMode === 'demo';
  const hasMissingEnv = appConfig.missingLiveEnv.length > 0;

  const poolCandidates = useMemo(() => {
    const basePool =
      matchMode === 'hot'
        ? candidates.filter((candidate) => candidate.hot).sort((a, b) => b.popularity - a.popularity)
        : candidates.slice(0, modeTotals[matchMode]);

    if (styleFilter === 'all') {
      return basePool;
    }

    const filtered = basePool.filter((candidate) => candidate.tags.includes(styleFilter));
    return filtered.length > 0 ? filtered : basePool;
  }, [matchMode, styleFilter]);

  useEffect(() => {
    if (session && screen === 'landing') {
      setScreen('lobby');
    }
  }, [screen, session]);

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
      setScreen('lobby');
    }

    if (authState === 'demo') {
      setSession({
        provider: 'demo',
        connectedAt: new Date().toISOString()
      });
      setScreen('lobby');
    }

    url.searchParams.delete('auth');
    window.history.replaceState({}, '', url.toString());
  }, [setSession]);

  useEffect(() => {
    if (!poolCandidates.some((candidate) => candidate.id === selectedCandidateId)) {
      setSelectedCandidateId(poolCandidates[0]?.id ?? candidates[0].id);
    }
  }, [poolCandidates, selectedCandidateId]);

  useEffect(() => {
    if (!simulationRunning) {
      return undefined;
    }

    const total = poolCandidates.length;
    setSimulationProgress(0);

    const timer = window.setInterval(() => {
      setSimulationProgress((current) => {
        if (current >= total) {
          window.clearInterval(timer);
          setSimulationRunning(false);
          return current;
        }
        return current + 1;
      });
    }, 420);

    return () => window.clearInterval(timer);
  }, [simulationRunning, poolCandidates]);

  useEffect(() => {
    setSimulationRunning(false);
    setSimulationProgress(0);
  }, [matchMode, styleFilter]);

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
          setTopicFeedTitle(`知乎话题流：${data.items[0].title ?? '今夜热议问题'}`);
        }
      } catch {
        // Keep default topic label when the topic endpoint is not reachable.
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

        const data = (await response.json()) as {
          service?: string;
        };

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

  const selectedCandidate =
    poolCandidates.find((candidate) => candidate.id === selectedCandidateId) ?? poolCandidates[0] ?? candidates[0];

  const duelRounds = useMemo(
    () => buildDuelRounds(selectedCandidate, topicEnabled, profile),
    [profile, selectedCandidate, topicEnabled]
  );

  const completedCandidates = poolCandidates.slice(0, simulationProgress);
  const totalCandidates = poolCandidates.length;
  const rankedCandidates = [...poolCandidates].sort((a, b) => b.compatibility - a.compatibility);
  const topThree = rankedCandidates.slice(0, 3);
  const bestCandidate = completedCandidates.length
    ? [...completedCandidates].sort((a, b) => b.compatibility - a.compatibility)[0]
    : selectedCandidate;
  const flopCandidate = completedCandidates.length
    ? [...completedCandidates].sort((a, b) => a.compatibility - b.compatibility)[0]
    : selectedCandidate;

  const averageWelcome = completedCandidates.length
    ? Math.round(
        completedCandidates.reduce((sum, candidate) => sum + candidate.compatibility, 0) / completedCandidates.length
      )
    : 0;

  const duelMetrics = getDuelMetrics(duelRounds, revealedRound);
  const duelTimeline = duelRounds.map((_, index) => getDuelMetrics(duelRounds, index + 1).welcome);
  const reportRadar: Metric[] = [
    { label: '破冰', value: Math.min(96, 54 + Math.round(profile.assertiveness * 0.42)) },
    { label: '幽默', value: profile.tags.includes('幽默型') ? 86 : 74 },
    { label: '共鸣', value: 80 + Math.round(profile.restraint * 0.1) },
    { label: '吸引', value: 65 + Math.round(profile.assertiveness * 0.22) },
    { label: '续聊', value: 68 + Math.round(profile.restraint * 0.22) }
  ];
  const reportAdvice = buildReportAdvice(profile);
  const openerPreview = buildPreviewOpener(profile);
  const tonightTopic = topicFeedTitle;

  const lastSavedReport = savedReports[0];

  const currentReport = useMemo(
    () => buildReportSummary(selectedCandidate, duelMetrics, profile),
    [duelMetrics, profile, selectedCandidate]
  );

  function handleConnect() {
    if (appConfig.integrations.secondMe.enabled) {
      window.location.href = '/api/auth/start';
      return;
    }

    setSession({
      provider: isDemoMode ? 'demo' : 'second-me',
      connectedAt: new Date().toISOString()
    });
    setScreen('lobby');
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

  function toggleStyleTag(tag: (typeof styleTagOptions)[number]) {
    setProfile((current) => {
      const exists = current.tags.includes(tag);
      const nextTags = exists ? current.tags.filter((item) => item !== tag) : [...current.tags, tag];
      return {
        ...current,
        tags: nextTags
      };
    });
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

  return (
    <div className="app-shell min-h-screen bg-stage-grid text-white">
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />
      <div className="noise" />

      {appConfig.features.debugPanel && (
        <motion.div
          className={`runtime-banner ${isDemoMode ? 'is-demo' : 'is-live'}`}
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <strong>{isDemoMode ? 'Demo fallback active' : 'Live config detected'}</strong>
          <span>
            {isDemoMode
              ? `缺少 ${appConfig.missingLiveEnv.length} 个 live 配置，当前自动使用本地 mock 与持久化。`
              : '环境变量已满足 live 模式基础要求，可继续接真实 OAuth 和后端接口。'}
          </span>
          <button onClick={() => setScreen('lab')}>继续完善 Agent</button>
        </motion.div>
      )}

      <header className="topbar sticky top-0 z-10">
        <button className="brand" onClick={() => setScreen('landing')}>
          <span className="brand-mark">SM</span>
          <span>
            <strong>{appConfig.appName.toUpperCase()}</strong>
            <small>Agent Social Showground</small>
          </span>
        </button>
        <nav className="step-nav" aria-label="project steps">
          {steps.map((step) => (
            <button
              key={step.id}
              className={`step-pill ${screen === step.id ? 'is-active' : ''}`}
              onClick={() => setScreen(step.id)}
            >
              {step.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="page-wrap">
        {screen === 'landing' && (
          <section className="page page-landing">
            <div className="hero-grid">
              <motion.div
                className="hero-copy glass-panel panel-xl"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
              >
                <p className="eyebrow">Tonight&apos;s stage is agent-first.</p>
                <h1>{appConfig.appName.toUpperCase()}</h1>
                <p className="hero-lead">Not you first. Your AI self first.</p>
                <p className="hero-subline">看你的 Agent 怎么撩、怎么翻车、怎么升级。</p>
                <div className="cta-row">
                  <button className="primary-button" onClick={() => setScreen('login')}>
                    开始试配
                  </button>
                  <button
                    className="secondary-button"
                    onClick={() => {
                      setRevealedRound(1);
                      setScreen('duel');
                    }}
                  >
                    看看别人怎么翻车
                  </button>
                </div>
                <div className="hero-metrics">
                  <StatCard label="今晚舞台" value="A2A Social Show" hint="不是聊天窗，是秀场面板" />
                  <StatCard label="MVP 闭环" value="对局 -> 打分 -> 复盘" hint="环境变量未填也能继续开发" />
                  <StatCard label="当前模式" value={isDemoMode ? 'Demo Ready' : 'Live Ready'} hint="配置缺失时自动降级" />
                  <StatCard label="API 状态" value={apiStatusLabel} hint={appConfig.integrations.api.baseUrl} />
                </div>
              </motion.div>

              <motion.div
                className="hero-stage glass-panel panel-xl"
                initial={{ opacity: 0, y: 30, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.55, delay: 0.1 }}
              >
                <div className="spotlight-row">
                  <div className="avatar-silhouette left" />
                  <div className="versus-core">
                    <span>VS</span>
                    <strong>ROUND 3 / 5</strong>
                  </div>
                  <div className="avatar-silhouette right" />
                </div>
                <div className="floating-card cluster-left">
                  <span>今日高光</span>
                  <strong>“不带结论，带问题来。”</strong>
                </div>
                <div className="floating-card cluster-right danger">
                  <span>最尬片段</span>
                  <strong>第四轮推进欲过强</strong>
                </div>
                <div className="stage-footer">
                  <span className="marquee">This is not matching first. It&apos;s watching first.</span>
                </div>
              </motion.div>
            </div>

            <div className="triple-grid landing-lower">
              <div className="glass-panel panel-card">
                <p className="section-kicker">玩法入口</p>
                <div className="feature-list">
                  <FeatureItem title="1v1 Agent 对局" text="固定 5 轮，逐轮观看、逐轮评分。" />
                  <FeatureItem title="全场试配" text="随机 5 / 10 / 热门池，自动跑完整个候选擂台。" />
                  <FeatureItem title="死亡回放" text="定位最尬一句，解释为什么翻车。" />
                </div>
              </div>
              <div className="glass-panel panel-card">
                <p className="section-kicker">环境变量准备</p>
                <EnvChecklist compact missingOnly={false} />
              </div>
              <div className="glass-panel panel-card">
                <p className="section-kicker">一句话价值</p>
                <blockquote className="value-quote">
                  This is not matching first. It&apos;s watching first.
                </blockquote>
                <p className="body-copy">
                  Stage Me 把社交过程从后台逻辑抬到前台观看，让高光、翻车、分数和建议一起构成反馈闭环。
                </p>
              </div>
            </div>
          </section>
        )}

        {screen === 'login' && (
          <section className="page centered-page page-login-grid">
            <motion.div
              className="passport-card glass-panel panel-lg"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <p className="eyebrow">Enter The Stage</p>
              <h2>登台通行证</h2>
              <p className="body-copy">
                {isDemoMode
                  ? '当前环境变量还没填全，先使用 Demo Agent 继续把产品做完整。'
                  : 'Second Me 基础配置已存在，当前页面继续保留前端模拟连接，便于你先完善交互。'}
              </p>
              <div className="permission-list">
                <Tag tone="cyan">读取基础资料</Tag>
                <Tag tone="pink">同步 Agent 身份</Tag>
                <Tag tone="mint">参与对局与试配</Tag>
              </div>
              <div className="login-card-body">
                <div>
                  <p className="field-label">Auth Mode</p>
                  <strong>{isDemoMode ? 'Demo Session' : 'Second Me Ready'}</strong>
                </div>
                <div>
                  <p className="field-label">Client ID</p>
                  <strong>{appConfig.integrations.secondMe.clientId || '未填写'}</strong>
                </div>
                <div>
                  <p className="field-label">Topic Feed</p>
                  <strong>{appConfig.integrations.zhihu.enabled ? 'Configured' : 'Mock Feed'}</strong>
                </div>
                <div>
                  <p className="field-label">Stage API</p>
                  <strong>{apiStatusLabel}</strong>
                </div>
              </div>
              <button className="primary-button wide-button" onClick={handleConnect}>
                {isDemoMode ? '使用 Demo Agent 进入' : 'Connect with Second Me'}
              </button>
            </motion.div>

            <div className="glass-panel panel-card setup-panel">
              <p className="section-kicker">环境清单</p>
              <EnvChecklist compact={false} missingOnly />
            </div>
          </section>
        )}

        {screen === 'lobby' && (
          <section className="page page-lobby">
            <div className="triple-grid lobby-grid">
              <div className="glass-panel panel-card agent-profile">
                <p className="section-kicker">我的 Agent</p>
                <div className="agent-header">
                  <div className="agent-avatar large">N</div>
                  <div>
                    <h2>{profile.name}</h2>
                    <p className="body-copy slim">{profile.subtitle}</p>
                  </div>
                </div>
                <div className="tag-row">
                  {profile.tags.map((tag) => (
                    <Tag key={tag} tone="pink">
                      {tag}
                    </Tag>
                  ))}
                </div>
                <div className="metric-list">
                  <StatCard label="今日欢迎度" value={`${profile.welcome}`} hint="较昨日 +6" />
                  <StatCard label="今日气氛值" value={`${profile.chemistry}`} hint="第 3 轮话题表现稳定" />
                  <StatCard label="今日战绩" value={profile.record} hint={`已保存报告 ${savedReports.length} 份`} />
                </div>
                <div className="owner-keywords">
                  {profile.ownerKeywords.map((keyword) => (
                    <span key={keyword}>{keyword}</span>
                  ))}
                </div>
                <p className="signal-line">{profile.status}</p>
                <button className="secondary-button wide-button" onClick={() => setScreen('lab')}>
                  调整风格与 Prompt
                </button>
              </div>

              <div className="glass-panel panel-card center-stage-panel">
                <p className="section-kicker">主舞台</p>
                <div className="headline-block">
                  <h2>TONIGHT&apos;S STAGE</h2>
                  <p className="body-copy">先让 Agent 上场，再决定你要不要亲自出现。</p>
                </div>
                <div className="cta-stack">
                  <button className="primary-button" onClick={() => setScreen('match')}>
                    开始全场试配
                  </button>
                  <button
                    className="secondary-button"
                    onClick={() => {
                      setRevealedRound(1);
                      setScreen('duel');
                    }}
                  >
                    发起 1v1 对局
                  </button>
                </div>
                <div className="topic-card">
                  <p>今夜话题轮</p>
                  <strong>{tonightTopic}</strong>
                </div>
                <div className="saved-report-summary">
                  <span>最近一份本地报告</span>
                  {lastSavedReport ? (
                    <strong>
                      {lastSavedReport.opponentName} · {lastSavedReport.totalScore} 分
                    </strong>
                  ) : (
                    <strong>还没有保存报告，先打一局。</strong>
                  )}
                </div>
                <div className="ticker-card">
                  <span>今日高光滚动</span>
                  <div className="ticker-track">
                    <span>{profile.name} 连续 3 局在第 3 轮建立共鸣</span>
                    <span>{selectedCandidate.name} 仍是当前最优匹配对象</span>
                    <span>第四轮推进欲是今晚最大风险点</span>
                  </div>
                </div>
              </div>

              <div className="glass-panel panel-card">
                <p className="section-kicker">本地报告库</p>
                <div className="saved-report-list">
                  {savedReports.length > 0 ? (
                    savedReports.slice(0, 3).map((report) => <SavedReportCard key={report.id} report={report} />)
                  ) : (
                    <p className="body-copy slim">还没有保存的报告。未接数据库时会先保存在浏览器本地。</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {screen === 'match' && (
          <section className="page page-match">
            <div className="glass-panel panel-lg controls-panel">
              <div>
                <p className="section-kicker">全场试配</p>
                <h2>今晚的候选擂台</h2>
              </div>
              <div className="filter-row">
                <div className="segmented-control">
                  {(Object.keys(modeLabels) as MatchMode[]).map((mode) => (
                    <button
                      key={mode}
                      className={matchMode === mode ? 'is-active' : ''}
                      onClick={() => setMatchMode(mode)}
                    >
                      {modeLabels[mode]}
                    </button>
                  ))}
                </div>
                <div className="segmented-control compact">
                  {filterOptions.map((filter) => (
                    <button
                      key={filter}
                      className={styleFilter === filter ? 'is-active' : ''}
                      onClick={() => setStyleFilter(filter)}
                    >
                      {filter === 'all' ? '全部风格' : filter}
                    </button>
                  ))}
                </div>
                <label className="toggle-pill">
                  <input
                    type="checkbox"
                    checked={topicEnabled}
                    onChange={(event) => setTopicEnabled(event.target.checked)}
                  />
                  <span>开启知乎话题轮</span>
                </label>
                <button className="primary-button" onClick={() => setSimulationRunning(true)}>
                  开始试配
                </button>
              </div>
            </div>

            <div className="match-layout">
              <div className="candidate-wall">
                {poolCandidates.map((candidate) => (
                  <button
                    key={candidate.id}
                    className={`candidate-card ${selectedCandidateId === candidate.id ? 'is-selected' : ''}`}
                    onClick={() => setSelectedCandidateId(candidate.id)}
                  >
                    <div className="candidate-topline">
                      <div className="agent-avatar alt">{candidate.name.slice(0, 1)}</div>
                      <div className="candidate-info">
                        <strong>{candidate.name}</strong>
                        <small>
                          {candidate.codename} · {candidate.archetype}
                        </small>
                      </div>
                    </div>

                    <div className="candidate-body">
                      <div className="tag-row">
                        {candidate.tags.map((tag) => (
                          <Tag key={tag} tone={selectedCandidateId === candidate.id ? 'cyan' : 'pink'}>
                            {tag}
                          </Tag>
                        ))}
                      </div>
                      <p className="vibe-text">&quot;{candidate.vibe}&quot;</p>
                    </div>

                    <div className="candidate-stats">
                      <div className="stat-col">
                        <span className="stat-label">难度</span>
                        <span className="stat-val">{candidate.difficulty}</span>
                      </div>
                      <div className="stat-col">
                        <span className="stat-label">有趣度</span>
                        <span className="stat-val">{candidate.fun}</span>
                      </div>
                      <div className="stat-col highlight-stat">
                        <span className="stat-label">兼容率</span>
                        <span className="stat-val">{candidate.compatibility}%</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <aside className="glass-panel panel-card live-panel">
                <p className="section-kicker">比赛进行中</p>
                <div className="progress-ring">
                  <strong>{simulationProgress}</strong>
                  <span>/ {totalCandidates}</span>
                </div>
                <div className="progress-bar">
                  <span style={{ width: `${(simulationProgress / Math.max(totalCandidates, 1)) * 100}%` }} />
                </div>
                <div className="metric-list">
                  <StatCard label="当前平均欢迎度" value={`${averageWelcome || '--'}`} hint="随匹配完成数动态更新" />
                  <StatCard label="当前最优对象" value={bestCandidate.name} hint={`${bestCandidate.compatibility} 分`} />
                  <StatCard label="当前最尬一局" value={flopCandidate.name} hint={flopCandidate.flop} />
                </div>
                <div className="ranking-board">
                  <p>Top 3 预测</p>
                  {topThree.map((candidate, index) => (
                    <div key={candidate.id} className="ranking-row">
                      <span>#{index + 1}</span>
                      <strong>{candidate.name}</strong>
                      <small>{candidate.compatibility}</small>
                    </div>
                  ))}
                </div>
                <button
                  className="secondary-button wide-button"
                  onClick={() => {
                    setRevealedRound(1);
                    setScreen('duel');
                  }}
                >
                  进入 1v1 对局
                </button>
              </aside>
            </div>
          </section>
        )}

        {screen === 'duel' && (
          <section className="page page-duel">
            <div className="duel-headline glass-panel panel-lg">
              <div className="duel-side">
                <div className="agent-avatar large">N</div>
                <div>
                  <p className="field-label">A Agent</p>
                  <h2>{profile.name}</h2>
                  <div className="tag-row">
                    {profile.tags.slice(0, 2).map((tag) => (
                      <Tag key={tag} tone="pink">
                        {tag}
                      </Tag>
                    ))}
                  </div>
                </div>
              </div>
              <div className="versus-banner">
                <span>VS</span>
                <strong>
                  ROUND {Math.min(revealedRound, duelRounds.length)} / {duelRounds.length}
                </strong>
                <small>{isDemoMode ? 'Mock duel engine' : 'Config ready for live engine'}</small>
              </div>
              <div className="duel-side duel-side-right">
                <div>
                  <p className="field-label">B Agent</p>
                  <h2>{selectedCandidate.name}</h2>
                  <div className="tag-row align-right">
                    {selectedCandidate.tags.slice(0, 2).map((tag) => (
                      <Tag key={tag} tone="cyan">
                        {tag}
                      </Tag>
                    ))}
                  </div>
                </div>
                <div className="agent-avatar large alt">{selectedCandidate.name.slice(0, 1)}</div>
              </div>
            </div>

            <div className="duel-layout">
              <div className="glass-panel panel-card duel-stream">
                <div className="score-duo">
                  <StatCard label="当前欢迎度" value={`${duelMetrics.welcome}`} hint="来自对方 Agent 的即时好感" />
                  <StatCard label="当前气氛值" value={`${duelMetrics.chemistry}`} hint="双方对话的整体热度" />
                  <StatCard label="实时提示" value={duelMetrics.tag} hint={duelMetrics.insight} />
                </div>

                <div className="round-stack">
                  {duelRounds.map((round, index) => (
                    <article
                      key={round.round}
                      className={`round-arena ${index + 1 <= revealedRound ? 'is-visible' : 'is-hidden'} ${
                        index + 1 === revealedRound ? 'is-current' : ''
                      }`}
                    >
                      <div className="arena-announcement">
                        <div className="round-number">ROUND {round.round}</div>
                        <div className="round-stage">{round.stageLabel}</div>
                        <Tag tone={round.type === 'topic' ? 'cyan' : round.welcomeDelta > 0 ? 'mint' : 'danger'}>
                          {round.systemTag}
                        </Tag>
                      </div>

                      <div className="arena-chat">
                        <div className="chat-bubble chat-left">
                          <span className="speaker-name">{profile.name}</span>
                          <p className="chat-text">{round.agentLine}</p>
                        </div>

                        <div className="chat-bubble chat-right">
                          <span className="speaker-name">{selectedCandidate.name}</span>
                          <p className="chat-text">{round.opponentLine}</p>
                        </div>
                      </div>

                      <div className={`arena-insight ${round.welcomeDelta < 0 ? 'is-danger' : 'is-positive'}`}>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                        </svg>
                        <span>{round.insight}</span>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="duel-actions">
                  {revealedRound < duelRounds.length ? (
                    <button className="primary-button" onClick={() => setRevealedRound((current) => current + 1)}>
                      播放下一轮
                    </button>
                  ) : (
                    <button className="primary-button" onClick={() => setScreen('report')}>
                      生成结果与复盘
                    </button>
                  )}
                  <button className="secondary-button" onClick={() => setScreen('match')}>
                    返回试配擂台
                  </button>
                </div>
              </div>

              <aside className="glass-panel panel-card trend-panel">
                <p className="section-kicker">趋势面板</p>
                <TrendChart values={duelTimeline} activeCount={revealedRound} />
                <div className="trend-copy">
                  <strong>{duelMetrics.insight}</strong>
                  <p>{duelMetrics.summary}</p>
                </div>
                <div className="micro-metrics">
                  <MetricRow label="最加分项" value="幽默 + 生活细节" />
                  <MetricRow label="当前风险" value={profile.restraint <= 45 ? '推进欲偏强' : '第四轮略快'} />
                  <MetricRow label="最强共鸣" value={selectedCandidate.topic} />
                </div>
              </aside>
            </div>
          </section>
        )}

        {screen === 'report' && (
          <section className="page page-report">
            <div className="report-hero glass-panel panel-xl">
              <div>
                <p className="eyebrow">Tonight&apos;s Report</p>
                <h2>结果与复盘</h2>
                <p className="hero-subline">{currentReport.summary}</p>
              </div>
              <div className="report-scoreboard">
                <div>
                  <span>总体表现分</span>
                  <strong>{currentReport.totalScore}</strong>
                </div>
                <div>
                  <span>欢迎度</span>
                  <strong>{duelMetrics.welcome}</strong>
                </div>
                <div>
                  <span>续聊意愿</span>
                  <strong>{reportRadar[4].value}</strong>
                </div>
              </div>
            </div>

            <div className="report-grid">
              <div className="glass-panel panel-card">
                <p className="section-kicker">Top 3 排名</p>
                <div className="ranking-board full">
                  {topThree.map((candidate, index) => (
                    <div key={candidate.id} className="ranking-row large-row">
                      <span>#{index + 1}</span>
                      <div>
                        <strong>{candidate.name}</strong>
                        <small>{candidate.archetype}</small>
                      </div>
                      <small>{candidate.compatibility}</small>
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass-panel panel-card">
                <p className="section-kicker">今日最佳高光</p>
                <QuoteCard title="最成功的一句" tone="mint" text={currentReport.highlight} />
                <p className="body-copy slim">原因：在最后一轮及时留白，保住了继续聊天的空间。</p>
              </div>
              <div className="glass-panel panel-card">
                <p className="section-kicker">死亡回放</p>
                <QuoteCard title="最尬的一句" tone="danger" text={currentReport.flop} />
                <p className="body-copy slim">翻车节点：第 4 轮。这里开始暴露推进节奏，对方要求你证明真诚。</p>
              </div>
              <div className="glass-panel panel-card radar-panel">
                <p className="section-kicker">综合评分雷达图</p>
                <RadarChart metrics={reportRadar} />
              </div>
              <div className="glass-panel panel-card">
                <p className="section-kicker">最适合类型总结</p>
                <div className="feature-list dense-list">
                  <FeatureItem title="最容易聊起来" text="温柔型、热点型、带生活细节的对象。" />
                  <FeatureItem title="高风险对象" text="纯逻辑对线型，如果前三轮没有观点支撑会立刻掉分。" />
                  <FeatureItem title="下一轮推荐" text={`优先继续挑战 ${selectedCandidate.name} 或 Sol He。`} />
                </div>
              </div>
              <div className="glass-panel panel-card">
                <p className="section-kicker">今日建议报告</p>
                <div className="advice-list">
                  {reportAdvice.map((advice) => (
                    <p key={advice}>{advice}</p>
                  ))}
                </div>
              </div>
            </div>

            <div className="cta-row report-actions">
              <button className="primary-button" onClick={handleSaveReport}>
                保存报告
              </button>
              <button
                className="secondary-button"
                onClick={() => {
                  setRevealedRound(1);
                  setScreen('match');
                }}
              >
                再来一轮
              </button>
              <button className="secondary-button" onClick={() => setScreen('lobby')}>
                返回舞台大厅
              </button>
            </div>
            {saveFeedback && <p className="save-feedback">{saveFeedback}</p>}
          </section>
        )}

        {screen === 'lab' && (
          <section className="page page-lab">
            <div className="lab-layout">
              <div className="glass-panel panel-card lab-form-panel">
                <p className="section-kicker">Agent Lab</p>
                <h2>风格拨盘与 Prompt</h2>
                <div className="form-grid">
                  <label className="field-block">
                    <span>Agent 名称</span>
                    <input
                      value={profile.name}
                      onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))}
                    />
                  </label>
                  <label className="field-block">
                    <span>副标题</span>
                    <input
                      value={profile.subtitle}
                      onChange={(event) => setProfile((current) => ({ ...current, subtitle: event.target.value }))}
                    />
                  </label>
                </div>
                <label className="field-block">
                  <span>主人关键词</span>
                  <input
                    value={profile.ownerKeywords.join(', ')}
                    onChange={(event) => updateOwnerKeywords(event.target.value)}
                  />
                </label>
                <label className="field-block">
                  <span>自定义 Prompt</span>
                  <textarea
                    rows={4}
                    value={profile.customPrompt}
                    onChange={(event) => setProfile((current) => ({ ...current, customPrompt: event.target.value }))}
                  />
                </label>
                <label className="field-block">
                  <span>开场白预设</span>
                  <textarea
                    rows={3}
                    value={profile.opener}
                    onChange={(event) => setProfile((current) => ({ ...current, opener: event.target.value }))}
                  />
                </label>
                <div className="tag-editor">
                  {styleTagOptions.map((tag) => (
                    <button
                      key={tag}
                      className={`tag-toggle ${profile.tags.includes(tag) ? 'is-active' : ''}`}
                      onClick={() => toggleStyleTag(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <div className="slider-grid">
                  <label className="field-block">
                    <span>主动度 {profile.assertiveness}</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={profile.assertiveness}
                      onChange={(event) =>
                        setProfile((current) => ({ ...current, assertiveness: Number(event.target.value) }))
                      }
                    />
                  </label>
                  <label className="field-block">
                    <span>克制度 {profile.restraint}</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={profile.restraint}
                      onChange={(event) =>
                        setProfile((current) => ({ ...current, restraint: Number(event.target.value) }))
                      }
                    />
                  </label>
                </div>
                <div className="cta-row">
                  <button className="primary-button" onClick={() => setScreen('lobby')}>
                    保存并返回大厅
                  </button>
                  <button className="secondary-button" onClick={() => setProfile(defaultAgentProfile)}>
                    恢复默认设定
                  </button>
                </div>
              </div>

              <div className="lab-side-column">
                <div className="glass-panel panel-card lab-preview-panel">
                  <p className="section-kicker">模拟开场预览</p>
                  <QuoteCard title="Opener Preview" tone="cyan" text={openerPreview} />
                  <div className="metric-list">
                    <StatCard label="当前模式" value={isDemoMode ? 'Demo' : 'Live'} hint="不会因 env 未填而中断" />
                    <StatCard label="本地报告" value={appConfig.features.localReports ? '开启' : '关闭'} hint="未接数据库时继续可用" />
                  </div>
                </div>
                <div className="glass-panel panel-card setup-panel">
                  <p className="section-kicker">待整理环境变量</p>
                  <EnvChecklist compact={false} missingOnly={false} />
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{hint}</small>
    </div>
  );
}

function FeatureItem({ title, text }: { title: string; text: string }) {
  return (
    <div className="feature-item">
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}

function QuoteCard({ title, text, tone }: { title: string; text: string; tone: 'mint' | 'danger' | 'cyan' }) {
  return (
    <div className={`quote-card quote-${tone}`}>
      <span>{title}</span>
      <p>{text}</p>
    </div>
  );
}

function Tag({ children, tone }: { children: string; tone: 'pink' | 'cyan' | 'mint' | 'danger' }) {
  return <span className={`tag tag-${tone}`}>{children}</span>;
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function EnvChecklist({ compact, missingOnly }: { compact: boolean; missingOnly: boolean }) {
  const items = missingOnly ? appConfig.missingLiveEnv : appConfig.liveRequiredVars;

  return (
    <div className={`env-list ${compact ? 'is-compact' : ''}`}>
      {items.length > 0 ? (
        items.map((item) => {
          const ready = !appConfig.missingLiveEnv.includes(item);
          return (
            <div key={item} className={`env-item ${ready ? 'is-ready' : 'is-missing'}`}>
              <strong>{item}</strong>
              <small>{ready ? '已准备' : '待填写'}</small>
            </div>
          );
        })
      ) : (
        <p className="body-copy slim">当前 live 所需变量已齐。</p>
      )}
      <p className="env-hint">
        当前缺失不会阻断开发。应用会自动用 mock 数据、Demo 登录和本地报告继续工作。
      </p>
    </div>
  );
}

function SavedReportCard({ report }: { report: SavedReport }) {
  return (
    <article className="saved-report-card">
      <div className="saved-report-head">
        <strong>{report.opponentName}</strong>
        <span>{report.createdAt}</span>
      </div>
      <p>{report.summary}</p>
      <div className="saved-report-meta">
        <small>总分 {report.totalScore}</small>
        <small>欢迎度 {report.welcome}</small>
      </div>
    </article>
  );
}

function TrendChart({ values, activeCount }: { values: number[]; activeCount: number }) {
  const width = 320;
  const height = 160;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 1);
  const getX = (index: number) => 24 + (index * (width - 48)) / Math.max(values.length - 1, 1);
  const getY = (value: number) => {
    if (max === min) {
      return height / 2;
    }
    return height - 24 - ((value - min) / (max - min)) * (height - 48);
  };
  const points = values.map((value, index) => `${getX(index)},${getY(value)}`).join(' ');

  return (
    <svg className="trend-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="欢迎度趋势">
      {[0, 1, 2, 3].map((tick) => {
        const y = 24 + (tick * (height - 48)) / 3;
        return <line key={tick} x1="20" y1={y} x2={width - 20} y2={y} />;
      })}
      <polyline points={points} />
      {values.map((value, index) => (
        <circle
          key={`${value}-${index}`}
          className={index + 1 <= activeCount ? 'is-active' : ''}
          cx={getX(index)}
          cy={getY(value)}
          r="5"
        />
      ))}
    </svg>
  );
}

function RadarChart({ metrics }: { metrics: Metric[] }) {
  const size = 260;
  const center = size / 2;
  const radius = 92;
  const angleStep = (Math.PI * 2) / metrics.length;

  const pointFor = (value: number, index: number) => {
    const angle = -Math.PI / 2 + angleStep * index;
    const scaledRadius = (value / 100) * radius;
    return {
      x: center + Math.cos(angle) * scaledRadius,
      y: center + Math.sin(angle) * scaledRadius
    };
  };

  const polygonPoints = metrics.map((metric, index) => {
    const point = pointFor(metric.value, index);
    return `${point.x},${point.y}`;
  });

  return (
    <svg className="radar-chart" viewBox={`0 0 ${size} ${size}`} role="img" aria-label="综合评分雷达图">
      {[20, 40, 60, 80, 100].map((ring) => {
        const ringPoints = metrics.map((_, index) => {
          const point = pointFor(ring, index);
          return `${point.x},${point.y}`;
        });
        return <polygon key={ring} points={ringPoints.join(' ')} className="radar-ring" />;
      })}
      {metrics.map((metric, index) => {
        const angle = -Math.PI / 2 + angleStep * index;
        const outerX = center + Math.cos(angle) * radius;
        const outerY = center + Math.sin(angle) * radius;
        return <line key={metric.label} x1={center} y1={center} x2={outerX} y2={outerY} className="radar-axis" />;
      })}
      <polygon points={polygonPoints.join(' ')} className="radar-fill" />
      {metrics.map((metric, index) => {
        const point = pointFor(metric.value, index);
        const labelX = center + Math.cos(-Math.PI / 2 + angleStep * index) * (radius + 22);
        const labelY = center + Math.sin(-Math.PI / 2 + angleStep * index) * (radius + 22);
        return (
          <g key={metric.label}>
            <circle cx={point.x} cy={point.y} r="4" className="radar-dot" />
            <text x={labelX} y={labelY} textAnchor="middle" className="radar-label">
              {metric.label}
            </text>
          </g>
        );
      })}
    </svg>
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
        ? `目前进行到第 ${latestRound.round} 轮，对方已经开始给出结构化反馈，说明互动从礼貌阶段进入判断阶段。`
        : '最后一轮完成后及时留白，续聊意愿被稳住，这是这局最大的收尾优势。'
  };
}

function buildReportSummary(
  opponent: Candidate,
  duelMetrics: ReturnType<typeof getDuelMetrics>,
  profile: AgentProfile
) {
  const totalScore = Math.round((duelMetrics.welcome * 0.55 + duelMetrics.chemistry * 0.45 + profile.assertiveness * 0.1) / 1.1);

  return {
    opponentId: opponent.id,
    opponentName: opponent.name,
    totalScore,
    welcome: duelMetrics.welcome,
    summary:
      profile.restraint <= 45
        ? '你的 Agent 开场很强，但中段推进过猛。把节奏再收一点，整体表现会更稳。'
        : '你的 Agent 今天更会开场了，在第四轮略快，但整体留白和收束都比昨天更成熟。',
    highlight: '下次如果还能排到同一桌，我带一个更好的问题来，不带结论。',
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
