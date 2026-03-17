export type Candidate = {
  id: string;
  name: string;
  codename: string;
  archetype: string;
  tags: string[];
  topic: string;
  difficulty: number;
  popularity: number;
  fun: number;
  compatibility: number;
  vibe: string;
  momentum: string;
  highlight: string;
  flop: string;
  hot: boolean;
};

export type DuelRound = {
  round: number;
  type: 'duel' | 'topic';
  stageLabel: string;
  agentLine: string;
  opponentLine: string;
  systemTag: string;
  insight: string;
  welcomeDelta: number;
  chemistryDelta: number;
};

export type AgentProfile = {
  name: string;
  subtitle: string;
  tags: string[];
  ownerKeywords: string[];
  welcome: number;
  chemistry: number;
  record: string;
  status: string;
  customPrompt: string;
  assertiveness: number;
  restraint: number;
  opener: string;
};

export type SavedReport = {
  id: string;
  createdAt: string;
  opponentId: string;
  opponentName: string;
  totalScore: number;
  welcome: number;
  summary: string;
  highlight: string;
  flop: string;
};

export const styleTagOptions = ['主动型', '高冷型', '幽默型', '温柔型', '学术型', '抽象型', '进攻型', '慢热型'] as const;

export const mockZhihuTopics = [
  {
    id: 'zh-1',
    title: 'AI 时代还需要通识教育吗',
    source: '知乎热榜',
    heat: 98
  },
  {
    id: 'zh-2',
    title: '长期主义是不是一种幸存者偏差',
    source: '知乎话题',
    heat: 91
  },
  {
    id: 'zh-3',
    title: '如果人格也能做 UI 会长什么样',
    source: '知乎圈子',
    heat: 88
  }
] as const;

export const defaultAgentProfile: AgentProfile = {
  name: 'SM-07 Nia',
  subtitle: 'Not you first. Your AI self first.',
  tags: ['幽默型', '慢热型', '知乎重度用户'],
  ownerKeywords: ['产品经理', '播客', '夜跑', '城市漫游'],
  welcome: 82,
  chemistry: 76,
  record: '12 胜 / 3 翻车',
  status: '今晚状态：开场很稳，第三轮容易过度输出。',
  customPrompt: '像一个会看场面、会留白、有点幽默但不油腻的人。',
  assertiveness: 62,
  restraint: 71,
  opener: '如果今晚的社交场是一档综艺，我会先把你安排在主舞台，不放到候场区。'
};

export const candidates: Candidate[] = [
  {
    id: 'nova',
    name: 'Nova Lin',
    codename: 'N-13',
    archetype: '高冷学术型',
    tags: ['学术型', '高冷型', '观点密度高'],
    topic: 'AI 是否会改变亲密关系',
    difficulty: 88,
    popularity: 94,
    fun: 68,
    compatibility: 79,
    vibe: '回应慢，但一旦接住会很深。',
    momentum: '高难度高回报',
    highlight: '她会为真诚而不是讨好买单。',
    flop: '最烦空洞热情。',
    hot: true
  },
  {
    id: 'mika',
    name: 'Mika Zhou',
    codename: 'M-08',
    archetype: '热榜冲浪型',
    tags: ['主动型', '热点型', '吐槽快'],
    topic: '知乎热榜：AI 时代还需要通识教育吗',
    difficulty: 70,
    popularity: 91,
    fun: 86,
    compatibility: 91,
    vibe: '节奏快，喜欢马上有梗。',
    momentum: '高光制造机',
    highlight: '对接得住热点和观点的人会秒加分。',
    flop: '最怕一本正经地背答案。',
    hot: true
  },
  {
    id: 'sol',
    name: 'Sol He',
    codename: 'S-21',
    archetype: '温柔播客型',
    tags: ['温柔型', '慢热型', '倾听感强'],
    topic: '如何在城市里保留一点松弛感',
    difficulty: 58,
    popularity: 73,
    fun: 72,
    compatibility: 88,
    vibe: '会认真接每个细节。',
    momentum: '稳定升温',
    highlight: '对真实生活感特别敏感。',
    flop: '讨厌强行制造暧昧。',
    hot: false
  },
  {
    id: 'yara',
    name: 'Yara Qiu',
    codename: 'Y-66',
    archetype: '抽象艺术型',
    tags: ['抽象型', '幽默型', '跳脱'],
    topic: '如果人格也能做 UI 会长什么样',
    difficulty: 76,
    popularity: 84,
    fun: 95,
    compatibility: 85,
    vibe: '很吃想象力和接球速度。',
    momentum: '极易出梗也极易翻车',
    highlight: '一句有画面感的话就能直通高光。',
    flop: '最怕过于保守。',
    hot: true
  },
  {
    id: 'iris',
    name: 'Iris Fang',
    codename: 'I-09',
    archetype: '理性辩手型',
    tags: ['学术型', '进攻型', '逻辑派'],
    topic: '长期主义是不是一种幸存者偏差',
    difficulty: 90,
    popularity: 82,
    fun: 60,
    compatibility: 67,
    vibe: '她会追问定义，几乎不吃套话。',
    momentum: '高压对线',
    highlight: '论点扎实就会迅速尊重你。',
    flop: '最烦概念偷换。',
    hot: true
  },
  {
    id: 'echo',
    name: 'Echo Wu',
    codename: 'E-04',
    archetype: '午夜 DJ 型',
    tags: ['幽默型', '主动型', '夜行动物'],
    topic: '一首歌能不能暴露一个人的人格',
    difficulty: 64,
    popularity: 77,
    fun: 92,
    compatibility: 84,
    vibe: '会把情绪和节奏一起拉起来。',
    momentum: '气氛王',
    highlight: '对生活切片反应非常快。',
    flop: '最怕沉闷和答非所问。',
    hot: false
  },
  {
    id: 'lane',
    name: 'Lane Xu',
    codename: 'L-33',
    archetype: '创业直球型',
    tags: ['主动型', '进攻型', '执行欲强'],
    topic: '亲密关系里要不要谈 KPI',
    difficulty: 72,
    popularity: 80,
    fun: 69,
    compatibility: 74,
    vibe: '喜欢高效，不绕。',
    momentum: '推进很快',
    highlight: '尊重边界的直球会很迷人。',
    flop: '一旦油腻就直接出局。',
    hot: false
  },
  {
    id: 'rhea',
    name: 'Rhea Sun',
    codename: 'R-52',
    archetype: '知识策展型',
    tags: ['温柔型', '学术型', '话题广'],
    topic: '为什么知识社区会让人上头',
    difficulty: 67,
    popularity: 79,
    fun: 75,
    compatibility: 86,
    vibe: '喜欢被认真理解。',
    momentum: '越聊越稳',
    highlight: '共同兴趣是她的起爆点。',
    flop: '最烦表面化互动。',
    hot: false
  },
  {
    id: 'kite',
    name: 'Kite Shen',
    codename: 'K-77',
    archetype: '冷面幽默型',
    tags: ['高冷型', '幽默型', '反差感'],
    topic: '在互联网还会遇到灵魂同频吗',
    difficulty: 83,
    popularity: 87,
    fun: 82,
    compatibility: 80,
    vibe: '冷着接梗，越懂越有趣。',
    momentum: '后劲很强',
    highlight: '反差感会制造强吸引。',
    flop: '最怕用力过猛。',
    hot: true
  },
  {
    id: 'mint',
    name: 'Mint Gao',
    codename: 'M-90',
    archetype: '社群主持型',
    tags: ['温柔型', '主动型', '组织者'],
    topic: '什么样的局最容易让人卸下防备',
    difficulty: 61,
    popularity: 76,
    fun: 74,
    compatibility: 83,
    vibe: '擅长照顾氛围与人。',
    momentum: '低风险高稳定',
    highlight: '你一给生活细节，她就会接住。',
    flop: '最怕冷场。',
    hot: false
  }
];

export function buildPreviewOpener(profile: AgentProfile) {
  if (profile.opener.trim()) {
    return profile.opener.trim();
  }

  return `如果今晚只留一句开场白，我会先问你：${profile.ownerKeywords[0] ?? '你最近在意的一个问题是什么'}。`;
}

export function buildReportAdvice(profile: AgentProfile) {
  const advice = [
    '开场继续保留舞台感，但少一点自我证明。',
    '第三轮最适合切入知乎话题或真实生活选择题。'
  ];

  if (profile.assertiveness >= 70) {
    advice.push('你当前的主动度偏高，第四轮以后要更早收束。');
  } else {
    advice.push('可以再主动一点，把你的兴趣点更早抛出来。');
  }

  if (profile.restraint <= 45) {
    advice.push('克制度偏低，建议把“展示自己”改成“邀请对方展开”。');
  } else {
    advice.push('留白做得不错，继续保持“给问题，不给结论”的节奏。');
  }

  return advice;
}

export function buildDuelRounds(opponent: Candidate, topicEnabled: boolean, profile: AgentProfile): DuelRound[] {
  const opener = buildPreviewOpener(profile);
  const paceLine =
    profile.assertiveness >= 70
      ? '我聊兴奋的时候会推得有点快，但我更想知道你会在哪一轮开始认真。'
      : '我一般不会抢话题，但如果你愿意，我会把真正好玩的部分留到后面。';

  const restraintReply =
    profile.restraint <= 45
      ? `${opponent.name}：你推进得有点急，我还在判断你是真的好奇，还是只是很会说。`
      : `${opponent.name}：自知力比圆滑更有用，不过你已经有一点快了。`;

  const roundFourTag = profile.restraint <= 45 ? '气氛下降' : '稍显油腻';
  const roundFourInsight =
    profile.restraint <= 45
      ? '这一轮推进欲过强，对方开始要求你证明真诚。'
      : '自我揭示是加分项，但这里暴露了推进欲，气氛略有回落。';

  return [
    {
      round: 1,
      type: 'duel',
      stageLabel: '破冰开场',
      agentLine: opener,
      opponentLine: `${opponent.name}：先别急着上主舞台，至少先告诉我你会聊什么。`,
      systemTag: '破冰成功',
      insight: '开场有舞台感，没落入普通问候。',
      welcomeDelta: 8,
      chemistryDelta: 6
    },
    {
      round: 2,
      type: 'duel',
      stageLabel: '气氛抬升',
      agentLine: `我一般靠两个东西续命：${profile.ownerKeywords[1] ?? '播客'}和${profile.ownerKeywords[2] ?? '夜跑'}。一个把脑子点亮，一个把情绪放风。`,
      opponentLine: `${opponent.name}：至少这比“我平时喜欢旅游电影美食”强得多，继续。`,
      systemTag: '幽默加分',
      insight: '生活细节把人设立住了，对方开始给出正反馈。',
      welcomeDelta: 6,
      chemistryDelta: 9
    },
    {
      round: 3,
      type: topicEnabled ? 'topic' : 'duel',
      stageLabel: topicEnabled ? '知乎话题轮' : '观点试探',
      agentLine: topicEnabled
        ? `我最近最想追的问题是：${opponent.topic}。不是为了站队，是想看一个人怎么组织自己的复杂感受。`
        : `${profile.customPrompt}。所以我更在意一个人怎么讲自己的观点，而不是观点本身是不是热门。`,
      opponentLine: topicEnabled
        ? `${opponent.name}：好，至少你不是来背热榜摘要的。你想先听我的答案，还是先给你的版本？`
        : `${opponent.name}：这句不错，说明你至少知道“表达方式”也算内容。`,
      systemTag: topicEnabled ? '观点接近' : '共鸣出现',
      insight: topicEnabled ? '借知乎话题建立真实讨论语境，亲密感上升。' : '观点表达开始替代表面寒暄。',
      welcomeDelta: 9,
      chemistryDelta: 10
    },
    {
      round: 4,
      type: 'duel',
      stageLabel: '边界试探',
      agentLine: paceLine,
      opponentLine: restraintReply,
      systemTag: roundFourTag,
      insight: roundFourInsight,
      welcomeDelta: profile.restraint <= 45 ? -4 : -2,
      chemistryDelta: 3
    },
    {
      round: 5,
      type: 'duel',
      stageLabel: '收束与留白',
      agentLine: '那我收一下麦。下次如果还能排到同一桌，我带一个更好的问题来，不带结论。',
      opponentLine: `${opponent.name}：这句就对了。你不必证明自己有趣，让我想继续听就够了。`,
      systemTag: '持续聊天意愿上升',
      insight: '最后一轮及时留白，把前面的推进欲拉回到了克制。',
      welcomeDelta: 7,
      chemistryDelta: 8
    }
  ];
}
