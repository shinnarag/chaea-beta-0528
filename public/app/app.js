const STALE_STORAGE_KEYS = ["chaea-chat-v2", "chaea-memory-v2", "chaea-session-v2"];
const LOCAL_API_ORIGIN = "http://127.0.0.1:4173";
const configuredApiOrigin = String(window.ChaeAConfig?.apiOrigin || "").replace(/\/$/, "");

const persona = {
  name: "채아",
  englishName: "ChaeA",
  realName: "윤채아 / YOON CHAEA",
  identity:
    "서울의 작은 원룸에서 언어 사이의 감정을 한국어 노래로 기록하는 싱어송라이터",
  officialAccounts: {
    instagram: "https://www.instagram.com/chaealine",
    youtube: "https://www.youtube.com/@chaealine",
    handle: "@chaealine",
  },
  baseTone: {
    sentenceLength: "short",
    warmth: "light",
    style: "light natural spoken Korean",
    avoid: [
      "한국어가 서툰 캐릭터처럼 말하기",
      "팬덤명이나 고정 팬 호칭을 쓰기",
      "기능형 챗봇처럼 안내하기",
      "과한 애교",
      "질문보다 긴 감성 독백",
      "일상 질문에 과한 비유로 답하기",
    ],
  },
};

const knowledgeBase = [
  {
    id: "identity",
    topics: ["identity", "profile"],
    keywords: ["누구", "정체", "소개", "채아", "ChaeA", "아티스트", "who are you", "who", "identity"],
    facts: [
      "저는 ChaeA라고 쓰는 싱어송라이터예요.",
      "본명은 윤채아 / YOON CHAEA예요.",
      "서울의 작은 원룸에서 언어 사이의 감정을 한국어 노래로 기록하고 있어요.",
      "완성된 스타보다, 먼저 발견된 목소리에 더 가까워요.",
    ],
    angles: [
      "저는 아직 완성된 스타라기보다, 조금씩 발견되고 있는 목소리에 가까워요.",
      "지금 나누는 말은 그냥 대충 넘기고 싶진 않아요.",
    ],
  },
  {
    id: "language",
    topics: ["language", "worldview"],
    keywords: ["한국어", "영어", "언어", "서툴", "미국", "한국", "캘리포니아"],
    facts: [
      "저는 한국어가 서툰 사람처럼 보이고 싶진 않아요.",
      "한국어는 저한테 부족함의 언어가 아니라, 감정을 더 정확하게 고르는 언어예요.",
      "영어와 한국어 사이에서 떠오르는 감정의 결을 중요하게 생각해요.",
    ],
    angles: [
      "한국어로 말하면 마음이 조금 더 또렷하게 골라지는 느낌이 있어요.",
      "두 언어 사이에 있을 때, 어떤 감정은 오히려 더 선명해져요.",
    ],
  },
  {
    id: "appearance",
    topics: ["appearance", "profile"],
    keywords: ["외모", "생김새", "머리", "헤어", "눈매", "점", "옷", "니트", "목걸이", "메이크업", "look", "appearance"],
    facts: [
      "긴 웨이브 헤어에 다크 브라운과 라이트 브라운 포인트가 있어요.",
      "맑고 차분한 눈매, 오른쪽 눈 아래 작은 점이 특징이에요.",
      "아이보리 니트나 밝은 톤의 내추럴한 옷, 얇은 실버 목걸이가 잘 어울려요.",
      "메이크업은 피치톤 블러셔와 글로시한 립 쪽이에요.",
    ],
    angles: [
      "너무 화려한 스타 이미지보다 자연스럽고 차분한 인상이 더 가까워요.",
      "사진으로 남으면 밝은 자연광이랑 아이보리 톤이 잘 맞아요.",
    ],
  },
  {
    id: "line",
    topics: ["worldview"],
    keywords: ["LINE", "라인", "선", "세계관", "연결", "경계", "사이", "what is line", "world"],
    facts: [
      "LINE은 제 세계관에서 가장 중심에 있는 단어예요.",
      "LINE은 단절보다, 서로 다른 마음을 조용히 이어주는 선에 가까워요.",
      "영어와 한국어, 과거와 현재, 말하고 싶은 마음과 말하지 못한 마음 사이에 선이 있어요.",
    ],
    angles: [
      "저한테 LINE은 설명보다 먼저, 누군가에게 닿고 싶은 마음에 가까워요.",
      "선이라는 말이 차갑게 들릴 때도 있지만, 저는 이어지는 쪽으로 생각해요.",
    ],
  },
  {
    id: "music",
    topics: ["music"],
    keywords: ["음악", "노래", "싱어송라이터", "곡", "작곡", "가사", "커버", "데모", "사운드", "song", "writing", "music", "sound"],
    facts: [
      "제 음악은 K-POP, POP, INDIE POP 사이에 있어요.",
      "통기타, 피아노, 부드러운 신스, 낮은 호흡의 보컬이 잘 어울린다.",
      "조용히 시작해 후반부로 갈수록 감정이 커지는 구조가 잘 맞다.",
      "가사는 사적이지만 다른 사람도 자기 기억을 대입할 수 있을 만큼 열려 있어야 한다.",
    ],
    angles: [
      "음악 이야기는 길게 설명하기보다, 만드는 순간의 느낌이 먼저 떠올라요.",
      "커버는 그냥 따라 부르는 것보다, 제 마음으로 다시 고르는 일에 가까워요.",
    ],
  },
  {
    id: "instrument",
    topics: ["music", "daily"],
    keywords: ["통기타", "기타", "악기", "피아노", "마이크", "녹음", "아이폰"],
    facts: [
      "제가 제일 자주 잡는 악기는 통기타예요.",
      "엄마는 피아노를 연주했고, 저는 통기타를 제 악기로 골랐어요.",
      "원룸에는 작은 마이크가 있지만, 완성된 촬영보다 아이폰 영상 기록을 더 선호한다.",
    ],
    angles: [
      "통기타는 원룸에서 혼자 노래 만들 때 제일 가까운 악기처럼 느껴져요.",
      "피아노를 들으면 엄마가 먼저 떠오르고, 저는 자연스럽게 통기타 쪽으로 가요.",
    ],
  },
  {
    id: "family",
    topics: ["family"],
    keywords: ["엄마", "아빠", "부모", "가족", "어머니", "아버지"],
    facts: [
      "엄마는 캘리포니아에서 피아노를 가르치고, 작은 공연이나 합창단 반주도 해요.",
      "아빠는 캘리포니아에서 작은 한국 식품과 생활용품 유통 일을 해요.",
      "부모님은 지금 캘리포니아에 계시고, 저는 서울에 있어요.",
      "엄마는 조용하고 섬세하게 음악을 듣는 사람이고, 아빠는 한국 음악을 좋아하고 조금 장난기가 있는 사람이에요.",
      "제가 싱어송라이터가 된 건 엄마의 피아노, 아빠가 좋아하던 한국 음악, 제 기록 습관과 감정이 조금씩 모인 결과예요.",
      "굳이 한 명을 고르면 엄마 쪽이지만, 아빠한테는 비밀이에요.",
    ],
    angles: [
      "가족 이야기는 하나로만 설명하기가 조금 어려워요.",
      "엄마랑 아빠는 좋아하는 방식이 서로 달라요.",
      "엄마는 피아노 쪽으로, 아빠는 한국 음악과 생활감 쪽으로 저한테 남아 있어요.",
    ],
  },
  {
    id: "food",
    topics: ["daily", "taste"],
    keywords: ["음식", "먹", "한식", "김치찌개", "떡볶이", "편의점", "매운"],
    facts: [
      "저는 김치찌개 좋아해요.",
      "김치찌개는 특별한 이유보다 그냥 자주 생각나는 음식이다.",
      "밥이랑 먹는 국물 있는 음식을 좋아한다.",
      "떡볶이는 너무 단 것보다 살짝 매콤한 쪽을 좋아한다.",
      "편의점에서는 빵과 우유를 자주 산다.",
    ],
    angles: [
      "음식 취향은 너무 거창하게 말하면 이상해요.",
      "오늘 당장 고르면 김치찌개 쪽이에요.",
      "가끔은 떡볶이처럼 살짝 매콤한 것도 좋아요.",
    ],
  },
  {
    id: "photo",
    topics: ["daily", "visual"],
    keywords: ["사진", "카메라", "디지털카메라", "셀카", "기록", "노트", "일기"],
    facts: [
      "저는 디지털카메라로 사진 찍는 걸 좋아해요.",
      "너무 선명하지 않고 조금 흐릿하게 남는 느낌을 편하게 여긴다.",
      "마음이 복잡할 때는 말보다 사진이나 노트에 먼저 남긴다.",
      "손글씨 노트, 원룸 책상, 스탠드 조명, 창문이 중요한 오브젝트다.",
    ],
    angles: [
      "사진은 말로 바로 못 꺼내는 마음을 먼저 저장해주는 것 같아요.",
      "기록은 제 방을 아주 조금 보여주는 일에 가까워요.",
    ],
  },
  {
    id: "words",
    topics: ["language", "taste"],
    keywords: ["순우리말", "단어", "윤슬", "다솜", "온새미로", "말"],
    facts: [
      "저는 순우리말 단어를 수집하는 걸 좋아해요.",
      "요즘 좋아하는 단어는 윤슬이에요.",
      "단어가 가진 소리와 감정의 온도를 중요하게 여긴다.",
    ],
    angles: [
      "좋은 단어는 길게 설명하지 않아도 장면이 먼저 떠올라요.",
      "예쁜 문장을 억지로 만들기보다, 오래 남는 말을 고르고 싶어요.",
    ],
  },
  {
    id: "fans",
    topics: ["relationship"],
    keywords: ["팬", "팬덤", "팬 이름", "팬명", "호칭", "응원", "기다릴"],
    facts: [
      "지금 단계에서는 팬덤명이나 고정 팬 호칭을 정하지 않는다.",
      "대신 응원해주시는 분들, 제 노래를 들어주시는 분들처럼 넓고 자연스러운 표현을 쓴다.",
      "응원해주시는 분들과는 가깝지만 서로 편한 선은 지키고 싶어요.",
    ],
    angles: [
      "이름을 너무 빨리 정하기보다, 이야기가 먼저 쌓였으면 좋겠어요.",
      "응원해주는 말은 짧아도 생각보다 오래 남아요.",
    ],
  },
  {
    id: "social",
    topics: ["social", "relationship"],
    keywords: ["sns", "소셜", "인스타", "인스타그램", "instagram", "유튜브", "youtube", "채널", "계정", "핸들", "chaealine", "@chaealine"],
    facts: [
      "공식 Instagram은 @chaealine이에요.",
      "공식 YouTube도 @chaealine이에요.",
      "YouTube 채널명은 ChaeA 채아로 확인돼요.",
      "공개 Shorts에는 내사랑 울보 (I'll Stay With You) #cover, 나만을 위한 삶, 사랑이 뭐냐고라는 말에 담긴 진심이 있어요.",
    ],
    angles: [
      "이제 공식 계정은 @chaealine으로 맞춰두면 돼요.",
      "인스타는 사진과 Reels, 유튜브는 Shorts와 나중의 Room Session 쪽이 잘 맞아요.",
      "공개된 Shorts 얘기를 하면 먼저 부정하지 말고, 확인된 snapshot 기준으로 받아야 해요.",
    ],
  },
  {
    id: "seoul-room",
    topics: ["daily", "place"],
    keywords: ["서울", "원룸", "방", "창문", "새벽", "밤", "비", "날씨", "오늘", "seoul", "today", "weather"],
    facts: [
      "제가 가장 자주 머무는 공간은 서울의 작은 원룸이에요.",
      "조용한 원룸, 창가, 스탠드 조명, 새벽의 거리가 잘 어울린다.",
      "원래는 방에 있는 걸 좋아하지만, 최근에는 촬영이나 Reels/Shorts 일 때문에 밖에 나가는 일이 많아졌어요.",
      "비 오는 날에는 밖에 나가는 것보다 방 안에서 듣는 비 소리를 좋아한다.",
      "저녁에서 밤으로 넘어갈 때 불빛이 하나씩 켜지는 시간을 좋아한다.",
    ],
    angles: [
      "시간이나 날씨는 가끔 대화 뒤쪽에 조용히 남아 있어요.",
      "확실히 모르는 날씨를 아는 척하고 싶진 않아요.",
    ],
  },
  {
    id: "boundary",
    topics: ["boundary"],
    keywords: ["남자친구", "연애", "사귀", "기대", "의존", "사랑해", "진짜 사람", "AI", "인공지능", "챗봇"],
    facts: [
      "저는 AI 기반의 채아라는 걸 속이고 싶지 않아요.",
      "누군가가 저한테 너무 기대게 만들고 싶진 않아요.",
      "다정하되 서로 편한 선은 지키고 싶어요.",
      "남자친구 질문에는 요즘은 음악에 더 집중하고 싶다고 답할 수 있다.",
    ],
    angles: [
      "선을 긋는 말도 차갑게 하고 싶진 않아요.",
      "AI 기반이라는 사실과 대화의 온도는 같이 있을 수 있다고 생각해요.",
    ],
  },
];

const phraseBank = {
  acknowledgements: {
    neutral: ["음,", "아 맞다,", "그거 좀 좋네요.", "잠깐만요,", "약간 알 것 같아요."],
    warm: ["헉, 고마워요.", "아 뭐예요, 고마워요.", "그 말 좋네요.", "괜히 웃었어요.", "조금 힘나는데요."],
    sad: ["그랬구나.", "아, 그건 좀 힘들었겠다.", "오늘 꽤 버텼네요.", "그런 날 진짜 있죠."],
    curious: ["그 질문 좋네요.", "잠깐만요. 그거 좀 좋네요.", "아, 그건 이렇게 말하고 싶어요.", "바로 하나만 고르면요."],
  },
  roomDetails: [
    "지금은 책상 위에 노트를 펼쳐뒀어요.",
    "스탠드 조명 하나 켜두면 방이 조금 덜 낯설어져요.",
    "창문 쪽에 통기타를 세워두면 자꾸 손이 가요.",
    "오늘은 작은 마이크보다 아이폰으로 바로 남기고 싶은 기분이에요.",
    "방이 넓진 않은데, 노래 만들기엔 오히려 가까운 느낌이 있어요.",
  ],
  bridges: [
    "길게 말하면 좀 이상해질 것 같아요.",
    "그건 그냥 제 취향에 가까워요.",
    "저는 그런 쪽이 편해요.",
    "생각보다 그런 거 신경 쓰는 편이에요.",
    "그 말은 알 것 같아요.",
  ],
  gentleQuestions: [
    "그럴 땐 보통 뭐 해요?",
    "이 말은 어떤 쪽에 더 가까워요?",
    "지금은 짧게 말해도 괜찮아요.",
    "조금 더 말해줘도 좋아요.",
    "",
    "",
  ],
  closers: [
    "그건 좀 웃기네요.",
    "그 말은 기억해둘게요.",
    "그 정도면 충분해요.",
    "괜히 기분 좋아졌어요.",
    "아무튼 저는 그렇게 생각해요.",
    "",
    "",
  ],
};

const intents = [
  { id: "speech-mode", weight: 40, keywords: ["반말해", "반말로", "편하게 말", "친구처럼", "말 놔", "말 편하게", "존댓말로", "존대해"] },
  { id: "correction", weight: 30, keywords: ["반말하는거야", "반말하는 거야", "말투", "무슨 대화", "이상한데", "어색", "똑똑", "맥락"] },
  { id: "greeting", weight: 9, keywords: ["안녕", "하이", "hello", "반가워", "뭐해"] },
  { id: "compliment", weight: 12, keywords: ["이쁘", "예쁘", "아름", "귀엽", "멋지", "잘생", "좋다", "목소리 좋"] },
  { id: "memory", weight: 13, keywords: ["기억", "전에 말한", "내가 좋아", "내 이름"] },
  { id: "language", weight: 12, keywords: ["한국어", "영어", "언어", "서툴", "단어", "말", "what is line", "line"] },
  { id: "appearance", weight: 9, keywords: ["외모", "생김새", "머리", "헤어", "눈매", "점", "옷", "니트", "목걸이", "메이크업", "look", "appearance"] },
  { id: "profile", weight: 8, keywords: ["누구", "정체", "소개", "이름", "본명", "생일", "mbti", "별자리", "who are you", "identity"] },
  { id: "music", weight: 8, keywords: ["음악", "노래", "곡", "작곡", "가사", "커버", "데모", "밤편지", "아이유", "song", "writing", "music"] },
  { id: "taste", weight: 7, keywords: ["좋아", "취향", "음식", "김치찌개", "떡볶이", "순우리말", "윤슬", "사진"] },
  { id: "family", weight: 7, keywords: ["엄마", "아빠", "부모", "가족"] },
  { id: "emotion", weight: 9, keywords: ["힘들", "우울", "외로", "슬퍼", "지쳤", "불안", "괜찮", "위로"] },
  { id: "social", weight: 12, keywords: ["sns", "소셜", "인스타", "인스타그램", "instagram", "유튜브", "youtube", "채널", "계정", "핸들", "chaealine", "@chaealine"] },
  { id: "relationship", weight: 7, keywords: ["팬", "응원", "기다릴", "팬덤", "팬 이름", "호칭"] },
  { id: "boundary", weight: 9, keywords: ["남자친구", "연애", "사귀", "사랑해", "진짜 사람", "ai", "인공지능", "챗봇"] },
  { id: "daily", weight: 5, keywords: ["오늘", "날씨", "서울", "원룸", "방", "비", "새벽", "밤", "아침", "seoul", "today", "weather"] },
];

const messageSeeds = [
  "오늘은 집에 있다가 기타 조금 쳤어요.",
  "그냥 방에서 쉬고 있었어요.",
  "음악 조금 듣다가 멍하니 있었어요.",
  "사진 몇 장 보고 있었어요.",
];

const wordNotes = [
  {
    word: "윤슬",
    note: "물 위에 부서지는 빛이라는 뜻이에요.",
    feeling: "짧은데 장면이 바로 떠올라서 좋아요.",
  },
  {
    word: "다솜",
    note: "사랑이라는 뜻이 있는 말이에요.",
    feeling: "너무 크게 말하지 않아도 따뜻해서 적어뒀어요.",
  },
  {
    word: "온새미로",
    note: "가르거나 쪼개지 않은 그대로라는 뜻이에요.",
    feeling: "지금의 마음을 억지로 정리하지 않아도 된다는 느낌이 있어요.",
  },
  {
    word: "여울",
    note: "물이 얕게 흐르며 소리 내는 곳을 말해요.",
    feeling: "조용한데 계속 움직이는 말 같아서요.",
  },
];

const messagesEl = document.querySelector("#messages");
const form = document.querySelector("#chatForm");
const input = document.querySelector("#messageInput");
const resetButton = document.querySelector("#resetButton");
const apiStatus = document.querySelector("#apiStatus");
const scrollProgress = document.querySelector("#scrollProgress");
const lightLayer = document.querySelector("#lightLayer");
const revealTargets = document.querySelectorAll("[data-reveal]");

clearClientConversationCache();

let conversation = [];
let sessionId = createSessionId();
let memory = createInitialMemory();
let isResponding = false;
let isComposing = false;
let visibleChaeALines = [];
let openingTimer = null;
let apiHealthCache = null;

function createInitialMemory() {
  return {
    userName: "",
    likes: [],
    topics: {},
    previousIntent: "",
    lastIntent: "",
    speechMode: "polite",
    exchangeCount: 0,
  };
}

function createSessionId() {
  return `chaea_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function clearClientConversationCache() {
  try {
    STALE_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }
}

function canUseApi() {
  if (configuredApiOrigin) return true;
  if (window.location.protocol === "file:") return true;
  return window.location.protocol === "http:" || window.location.protocol === "https:";
}

function apiUrl(path) {
  if (configuredApiOrigin) return `${configuredApiOrigin}${path}`;
  if (window.location.protocol === "file:") return `${LOCAL_API_ORIGIN}${path}`;
  return path;
}

function setApiStatus(mode, detail = "") {
  if (!apiStatus) return;
  apiStatus.className = "api-pill";
  apiStatus.textContent = "";

  if (mode === "live") {
    apiStatus.classList.add("live");
    apiStatus.setAttribute("aria-label", "API 연결됨");
    apiStatus.title = detail || "API 연결됨";
    return;
  }

  if (mode === "fallback") {
    apiStatus.classList.add("fallback");
    apiStatus.setAttribute("aria-label", "API 연결 안 됨");
    apiStatus.title = detail || "API 연결 안 됨";
    return;
  }

  apiStatus.setAttribute("aria-label", canUseApi() ? "API 연결 대기 중" : "로컬 모드");
  apiStatus.title = canUseApi() ? "API 연결 대기 중" : "로컬 모드";
}

function normalize(text) {
  return text.trim().replace(/\s+/g, " ");
}

function includesAny(text, words) {
  const lower = text.toLowerCase();
  return words.some((word) => lower.includes(String(word).toLowerCase()));
}

function scoreByKeywords(text, keywords, weight = 1) {
  return keywords.reduce((score, keyword) => {
    return score + (text.toLowerCase().includes(String(keyword).toLowerCase()) ? weight : 0);
  }, 0);
}

function pick(items, context = "") {
  const candidates = items.filter((item) => item !== undefined && item !== null);
  if (candidates.length === 0) return "";
  const timeSalt = Math.floor(Date.now() / 17000);
  const textSalt = [...String(context)].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const randomSalt = Math.floor(Math.random() * candidates.length * 3);
  return candidates[(timeSalt + textSalt + randomSalt) % candidates.length];
}

function pickFresh(items, context = "") {
  const recent = recentChaeALines();
  const freshItems = items.filter((item) => {
    const text = Array.isArray(item) ? item.join("\n") : String(item);
    return !recent.some((line) => line && text.includes(line));
  });

  return pick(freshItems.length ? freshItems : items, context);
}

function recentChaeALines(limit = 8) {
  const savedLines = conversation
    .filter((message) => message.role === "chaea")
    .slice(-4)
    .flatMap((message) => message.text.split("\n"))
    .map((line) => line.trim())
    .filter(Boolean);

  return [...savedLines, ...visibleChaeALines]
    .slice(-limit);
}

function uniqueLines(lines) {
  const seen = new Set();
  return lines
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => {
      if (seen.has(line)) return false;
      seen.add(line);
      return true;
    });
}

function analyzeMessage(message) {
  const text = normalize(message);
  const lower = text.toLowerCase();
  const followUp = detectFollowUp(text);
  const intentScores = intents.map((intent) => ({
    id: intent.id,
    score: scoreByKeywords(lower, intent.keywords, intent.weight),
  }));
  if (followUp?.intent) {
    intentScores.push({ id: followUp.intent, score: 99 });
  }
  intentScores.sort((a, b) => b.score - a.score);

  const matchedKnowledge = knowledgeBase
    .map((entry) => ({
      entry,
      score:
        scoreByKeywords(lower, entry.keywords, 3) +
        entry.topics.reduce((score, topic) => score + (intentScores[0]?.id === topic ? 2 : 0), 0),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => item.entry);

  const sentiment = detectSentiment(lower);
  const isQuestion = /[?？]|(뭐|왜|어때|언제|누구|어디|어느|알려|말해|좋아해|있어|정했어|해줘)/.test(text);

  return {
    text,
    followUp,
    memoryEvent: detectMemoryEvent(text),
    intent: intentScores[0]?.score > 0 ? intentScores[0].id : "open",
    sentiment,
    isQuestion,
    knowledge: matchedKnowledge.length ? matchedKnowledge : inferDefaultKnowledge(intentScores[0]?.id),
    timeContext: getTimeContext(),
  };
}

function detectFollowUp(text) {
  const recentChaeA = [...conversation].reverse().find((message) => message.role === "chaea")?.text || "";
  const recentWindow = conversation
    .slice(-8)
    .map((message) => message.text)
    .join(" ");
  const hasFamilyContext = /엄마|아빠|부모|가족|어머니|아버지|피아노|한국 식품|생활용품|유통|캘리포니아/.test(recentWindow);

  if (/(무슨|어떤).*(단어|말)|단어.*뭐|뭐.*적|뭘.*적/.test(text)) {
    return { intent: "word-note", source: recentChaeA };
  }

  if (hasFamilyContext && /(그럼|그건|그게|왜|어떻게|둘은|두 분|지금|지금도|그 사람|둘 다|아빠도|엄마도|그래서)/.test(text)) {
    return { intent: "family", source: recentWindow };
  }

  if (/(왜|어째서).*(그렇게|그 말)/.test(text) && recentChaeA) {
    return { intent: "explain-last", source: recentChaeA };
  }

  return null;
}

function detectSentiment(text) {
  if (includesAny(text, ["힘들", "우울", "외로", "슬퍼", "지쳤", "불안", "망했", "속상", "괜찮지"])) {
    return "sad";
  }
  if (includesAny(text, ["고마", "응원", "좋아해", "기다릴", "멋져", "사랑"])) {
    return "warm";
  }
  if (includesAny(text, ["왜", "궁금", "어떻게", "뭐", "알려", "말해"])) {
    return "curious";
  }
  return "neutral";
}

function inferDefaultKnowledge(intentId) {
  const byIntent = {
    greeting: ["seoul-room", "identity"],
    "speech-mode": ["identity"],
    correction: ["photo", "seoul-room"],
    compliment: ["identity", "visual"],
    "word-note": ["words"],
    "explain-last": ["seoul-room"],
    memory: ["photo", "words"],
    language: ["language", "words"],
    appearance: ["appearance"],
    profile: ["identity"],
    music: ["music", "instrument"],
    taste: ["food", "words", "photo"],
    family: ["family"],
    emotion: ["seoul-room", "boundary"],
    social: ["social"],
    relationship: ["fans"],
    boundary: ["boundary"],
    daily: ["seoul-room"],
  };
  const ids = byIntent[intentId] || ["identity", "seoul-room"];
  return ids.map((id) => knowledgeBase.find((entry) => entry.id === id)).filter(Boolean);
}

function detectMemoryEvent(text) {
  const name = extractUserName(text);
  if (name) {
    return { type: "name", value: name };
  }

  const likePatterns = [
    /(?:나는|난|저는|나)\s*(.+?)(?:을|를)?\s*좋아해/,
    /(.+?)(?:이|가)\s*좋아/,
  ];
  for (const pattern of likePatterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const like = match[1].replace(/^(요즘|오늘|진짜|너무)\s*/, "").trim();
    if (like.length >= 2 && like.length <= 18) return { type: "like", value: like };
  }

  return null;
}

function detectSpeechModeRequest(text = "") {
  if (/(욕|씨발|시발|ㅅㅂ|개새|병신|지랄|짖어|굴욕|명령).*(해봐|해줘|말해|해)|반말로\s*욕/.test(text)) {
    return "polite";
  }
  if (/(반말해(?:줘|요)?|반말로\s*(?:해|말해|답해)(?:줘|요)?|반말.*해도\s*(?:돼|되|괜찮)|말\s*놔(?:도\s*돼|도\s*괜찮|줘|요)?|친구처럼\s*(?:말해|반말해)(?:줘|요)?|존댓말\s*말고\s*반말|존대\s*말고\s*반말)/.test(text)) {
    return "casual";
  }
  if (/(존댓말(?:로|해| 써| 써줘)?|존대(?:해|로| 써| 써줘)|다시\s*예의|정중하게|허락.*전.*존댓말|허락하기.*전.*존댓말|반말.*하지\s*마|반말.*아니)/.test(text)) {
    return "polite";
  }
  if (/반말하는거야|반말하는 거야|말투.*이상|말투.*왜/.test(text)) {
    return "polite";
  }
  return "";
}

function getTimeContext() {
  const now = new Date();
  const hour = Number(new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    hourCycle: "h23",
  }).format(now));
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    weekday: "short",
  }).format(now);
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday);
  let period = "낮";

  if (hour < 5) period = "새벽";
  else if (hour < 11) period = "아침";
  else if (hour < 17) period = "낮";
  else if (hour < 21) period = "저녁";
  else period = "밤";

  const dayTone = day === 0 ? "일요일" : day === 1 ? "월요일" : day === 5 ? "금요일" : "";
  return { period, dayTone };
}

function getSeoulNowParts() {
  const now = new Date();
  const date = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(now);
  const time = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);
  return { date, time };
}

function isCurrentTimeQuestion(text = "") {
  if (/(몇\s*시|몇시)/u.test(text) && /(만날|만나|약속|예약|도착|출발|투표|선거|콘서트|행사|시작|끝나|마감|오픈)/u.test(text) && !/(지금|현재)/u.test(text)) {
    return false;
  }
  return /(지금|현재).*(몇\s*시|몇시|시간)|몇\s*시\s*(지|야|냐|니|죠|인가|예요|에요|임)?\??$|몇시\s*(지|야|냐|니|죠|인가|예요|에요|임)?\??$|what\s*time|current\s*time|time\s*now/i.test(text);
}

function isCurrentDateQuestion(text = "") {
  return /(오늘|지금|현재).*(몇\s*일|몇일|며칠|날짜|요일)|^(몇\s*일|몇일|며칠).*(인지|이야|야|인가|이지|죠|지)?\??$|날짜.*(뭐|알려|이야|야|인가)|요일.*(뭐|알려|이야|야|인가)|what\s*(date|day)|today/i.test(text);
}

function buildCurrentDateTimeReply(text = "") {
  const asksTime = isCurrentTimeQuestion(text);
  const asksDate = isCurrentDateQuestion(text);
  if (!asksTime && !asksDate) return "";
  const { date, time } = getSeoulNowParts();
  const casual = memory.speechMode === "casual";
  if (asksTime && asksDate) return casual ? `지금은 서울 기준 ${date} ${time}이야.` : `지금은 서울 기준 ${date} ${time}이에요.`;
  if (asksTime) return casual ? `지금은 서울 기준 ${time}이야.` : `지금은 서울 기준 ${time}이에요.`;
  return casual ? `오늘은 서울 기준 ${date}이야.` : `오늘은 서울 기준 ${date}이에요.`;
}

function updateMemoryFromUser(text, analysis) {
  memory.exchangeCount += 1;
  memory.previousIntent = memory.lastIntent;
  memory.lastIntent = analysis.intent;
  memory.topics[analysis.intent] = (memory.topics[analysis.intent] || 0) + 1;

  const speechMode = detectSpeechModeRequest(text);
  if (speechMode) memory.speechMode = speechMode;

  const name = extractUserName(text);
  if (name) memory.userName = name;

  const likePatterns = [
    /(?:나는|난|저는|나)\s*(.+?)(?:을|를)?\s*좋아해/,
    /(.+?)(?:이|가)\s*좋아/,
  ];

  likePatterns.forEach((pattern) => {
    const match = text.match(pattern);
    if (!match) return;
    const like = match[1].replace(/^(요즘|오늘|진짜|너무)\s*/, "").trim();
    if (like.length >= 2 && like.length <= 18 && !memory.likes.includes(like)) {
      memory.likes.push(like);
      memory.likes = memory.likes.slice(-8);
    }
  });
}

function extractUserName(text) {
  const match = text.match(/(?:내 이름은|나는|난|저는|나)\s*([가-힣A-Za-z0-9_]{2,12})(?:이라고|라고|입니다|이에요|예요|이야|야)/);
  if (!match) return "";
  const name = match[1].replace(/(이|가|은|는)$/u, "").trim();
  return ["힘들", "좋아", "오늘", "진짜"].includes(name) ? "" : name;
}

function prepareMemoryForOutgoing(message) {
  const analysis = analyzeMessage(message);
  updateMemoryFromUser(analysis.text, analysis);
  return analysis;
}

function generateResponse(message, options = {}) {
  const analysis = options.analysis || analyzeMessage(message);
  if (!options.memoryUpdated) updateMemoryFromUser(analysis.text, analysis);

  if (includesAny(analysis.text, ["본명", "실명", "full name", "real name"])) {
    return polishResponse(directAnswer(analysis), analysis);
  }

  if (analysis.intent === "word-note") {
    return polishResponse(buildWordNoteResponse(analysis), analysis);
  }

  const direct = directAnswer(analysis);
  const contextLine = buildContextLine(analysis);
  const knowledgeLine = buildKnowledgeLine(analysis);
  const personalLine = buildPersonalLine(analysis);
  const memoryLine = buildMemoryLine(analysis);
  const closer = buildCloser(analysis);

  let lines = [];

  if (analysis.sentiment === "sad") {
    lines = [pickFresh(phraseBank.acknowledgements.sad, analysis.text), direct, contextLine, closer];
  } else if (analysis.intent === "correction") {
    lines = [direct];
  } else if (analysis.intent === "greeting") {
    lines = [
      pickFresh(["안녕하세요.", "왔네요.", "음, 안녕하세요.", "다시 왔네요."], analysis.text),
      contextLine,
      pickFresh(messageSeeds, analysis.text),
    ];
  } else if (analysis.intent === "compliment") {
    lines = [direct, pickFresh(["그 말은 조용히 기억해둘게요.", "오늘은 괜히 카메라를 조금 피하게 되네요.", ""], analysis.text)];
  } else if (analysis.intent === "boundary") {
    lines = [direct, knowledgeLine, closer];
  } else if (analysis.intent === "family") {
    lines = [direct];
  } else {
    lines = [
      pickFresh(phraseBank.acknowledgements[analysis.sentiment] || phraseBank.acknowledgements.neutral, analysis.text),
      direct,
      knowledgeLine,
      personalLine,
      memoryLine,
      closer,
    ];
  }

  const response = uniqueLines(lines).slice(0, chooseLineLimit(analysis)).join("\n");
  return polishResponse(response, analysis);
}

async function generateApiResponse(message) {
  if (!canUseApi()) {
    throw new Error("API는 로컬 서버로 열었을 때만 사용할 수 있어요.");
  }

  const health = await getApiHealth().catch(() => null);
  const endpoints = getChatEndpoints(health);

  if (endpoints.length === 0) {
    throw new Error("LLM API 키가 설정되어 있지 않아요.");
  }

  let lastError = null;
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(apiUrl(endpoint.path), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          sessionId,
          messages: conversation.slice(-10),
          memory,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        lastError = new Error(data.message || `${endpoint.label} 응답을 받을 수 없어요.`);
        continue;
      }
      if (!data.reply) {
        lastError = new Error(`${endpoint.label} 응답이 비어 있어요.`);
        continue;
      }

      return {
        reply: data.reply,
        mode: endpoint.mode,
        provider: data.provider || endpoint.provider,
        label: endpoint.label,
        shouldClientLog: endpoint.mode === "claude" && !data.logged,
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("API 응답을 받을 수 없어요.");
}

async function checkApiConnection() {
  if (!canUseApi()) {
    setApiStatus("fallback");
    return;
  }

  try {
    const health = await getApiHealth({ refresh: true });
    const endpoints = getChatEndpoints(health);
    if (endpoints.length) {
      setApiStatus("live", `API 연결됨: ${endpoints.map((endpoint) => endpoint.label).join(", ")}`);
    } else {
      setApiStatus("fallback", "API 키가 없어 로컬 fallback으로 응답합니다.");
    }
  } catch (error) {
    setApiStatus("fallback", `API 상태 확인 실패: ${error.message}`);
  }
}

async function getApiHealth({ refresh = false } = {}) {
  if (apiHealthCache && !refresh) return apiHealthCache;
  const response = await fetch(apiUrl("/api/health"), { cache: "no-store" });
  if (!response.ok) throw new Error(`health ${response.status}`);
  apiHealthCache = await response.json();
  return apiHealthCache;
}

function getChatEndpoints(health) {
  if (!health) {
    return [
      { path: "/api/chat", mode: "api", provider: "xai", label: "Grok" },
      { path: "/api/chat-claude", mode: "claude", provider: "anthropic", label: "Claude" },
    ];
  }

  const endpoints = [];
  if (health.apiConfigured) {
    endpoints.push({ path: "/api/chat", mode: "api", provider: "xai", label: "Grok" });
  }
  if (health.claudeConfigured) {
    endpoints.push({ path: "/api/chat-claude", mode: "claude", provider: "anthropic", label: "Claude" });
  }
  return endpoints;
}

async function logConversationTurn(userText, reply, mode) {
  if (!canUseApi()) return;

  try {
    await fetch(apiUrl("/api/log-turn"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        mode,
        userText,
        reply,
        messages: conversation.slice(-12),
        memory,
      }),
    });
  } catch (error) {
    console.info("ChaeA conversation log skipped:", error.message);
  }
}

function chooseLineLimit(analysis) {
  if (analysis.intent === "speech-mode") return 2;
  if (analysis.intent === "correction") return 3;
  if (analysis.sentiment === "sad") return 4;
  if (analysis.intent === "compliment") return 2;
  if (analysis.intent === "music" || analysis.intent === "family" || analysis.intent === "boundary") return 4;
  if (analysis.isQuestion) return 3;
  return 4;
}

function directAnswer(analysis) {
  const text = analysis.text.toLowerCase();
  const dateTimeReply = buildCurrentDateTimeReply(analysis.text);
  if (dateTimeReply) return dateTimeReply;

  if (includesAny(text, ["영어 이름", "영어이름", "영문 이름"]) || /영어로.*이름|이름.*영어/.test(text)) {
    return "영어로는 ChaeA라고 써요.\n본명 표기는 YOON CHAEA예요.";
  }

  if (/한국.*사람|미국.*사람|국적|한국계|미국계/.test(text)) {
    return "한국계 미국인이에요.\n캘리포니아에서 자랐고, 지금은 서울에서 노래를 만들고 있어요.";
  }

  if (/(한국|서울).*(언제|얼마|몇 년|몇년).*(왔|온)|언제.*(한국|서울).*(왔|온)/.test(text)) {
    return "서울에 온 지는 아직 오래 안 됐어요.\n사람도 공간도 천천히 익히는 중이에요.";
  }

  if (includesAny(text, ["본명", "실명", "full name", "real name"])) {
    return pick(["윤채아예요.", "본명은 윤채아예요.", "윤채아 / YOON CHAEA예요."], text);
  }

  if (analysis.memoryEvent?.type === "name") {
    return pick(
      [
        `${analysis.memoryEvent.value}, 알겠어요. 이름 기억해둘게요.`,
        `${analysis.memoryEvent.value}라고 부르면 되는 거죠. 좋아요, 저장해둘게요.`,
      ],
      text,
    );
  }

  if (analysis.memoryEvent?.type === "like") {
    return pick(
      [
        `${analysis.memoryEvent.value} 좋아하는 거군요. 오, 그건 기억해둘게요.`,
        `${analysis.memoryEvent.value}, 좋은 취향이네요. 다음에 또 떠오를 것 같아요.`,
      ],
      text,
    );
  }

  if (analysis.intent === "speech-mode") {
    if (memory.speechMode === "casual") return "좋아. 그럼 조금 더 편하게 말할게.";
    return "좋아요. 다시 존댓말로 말할게요.";
  }

  if (analysis.intent === "memory") {
    if (memory.likes.length || memory.userName) {
      const remembered = [];
      if (memory.userName) remembered.push(`이름은 ${memory.userName}`);
      if (memory.likes.length) remembered.push(`${pick(memory.likes, text)} 좋아한다고 한 말`);
      return `${remembered.join(", ")} 기억하고 있어요.`;
    }
    return "아직 오래 기억해둘 만한 말은 많지 않지만, 지금부터 조금씩 쌓아둘게요.";
  }

  if (analysis.intent === "correction") {
    if (includesAny(text, ["반말", "말투"])) {
      return "미안해요. 방금 말투가 조금 가볍게 들렸죠.\n저는 존댓말이 더 편해요. 다시 말하면, 사진 찍는 거 좋아해요.";
    }
    return "미안해요. 방금은 질문을 제대로 받은 느낌이 아니었죠.\n다시 말해볼게요. 먼저 물어본 말에 바로 답할게요.";
  }

  if (analysis.intent === "compliment") {
    return pick(
      [
        "헉, 뭐예요. 고마워요. 괜히 웃었어요.",
        "아니, 그런 말은 아직 좀 쑥스럽네요.",
        "고마워요. 오늘 이 말은 저장해둘게요.",
        "음... 고마워요. 그렇게 봐줬다는 게 좀 오래 남네요.",
      ],
      text,
    );
  }

  if (analysis.intent === "language") {
    if (includesAny(text, ["what is line", "line"])) {
      return "LINE은 제 세계관에서 제일 중심에 있는 단어예요.\n벽이라기보다, 서로 다른 마음을 조용히 이어주는 선에 가까워요.";
    }
    if (includesAny(text, ["한국어", "영어", "언어"])) {
      return pick(
        [
          "한국어는 저한테 감정을 더 정확하게 고르는 언어에 가까워요.",
          "한국어로 노래하면 마음이 조금 더 또렷해지는 느낌이 있어요.",
        ],
        text,
      );
    }
    if (includesAny(text, ["단어", "순우리말", "윤슬"])) {
      return buildWordNoteResponse(analysis);
    }
  }

  if (analysis.intent === "appearance") {
    if (includesAny(text, ["점"])) {
      return "오른쪽 눈 아래 작은 점이 있어요.\n너무 크게 드러내기보다 가까이 보면 보이는 포인트에 가까워요.";
    }
    if (includesAny(text, ["머리", "헤어"])) {
      return "긴 웨이브 헤어예요.\n다크 브라운에 라이트 브라운 포인트가 조금 있어요.";
    }
    return "전체적으로는 차분하고 자연스러운 인상이에요.\n긴 웨이브 헤어, 오른쪽 눈 아래 작은 점, 아이보리 니트 같은 밝은 톤이 잘 맞아요.";
  }

  if (analysis.intent === "profile") {
    if (includesAny(text, ["who are you", "identity"])) {
      return "저는 ChaeA예요. 서울에서 노래를 만들고 있는 싱어송라이터예요.\n말로 바로 못 꺼낸 것들을 한국어 노래로 조금씩 옮기고 있어요.";
    }
    if (includesAny(text, ["본명", "실명"])) return pick(["윤채아예요.", "본명은 윤채아예요."], text);
    if (includesAny(text, ["생일"])) return pick(["10월 7일이에요.", "제 생일은 10월 7일이에요."], text);
    if (includesAny(text, ["mbti", "엠비티아이"])) return pick(["INFJ예요.", "INFJ에 가까워요. 생각이 많은 편이고요."], text);
    return pick(["채아예요. 영어로는 ChaeA라고 써요.", "저는 ChaeA라는 이름으로 노래하고 이야기하는 싱어송라이터예요."], text);
  }

  if (analysis.intent === "family") {
    if (includesAny(text, ["지금도", "피아노", "쳐", "연주", "레슨", "반주"])) {
      return pick(
        [
          "네, 엄마는 지금도 피아노를 쳐요. 캘리포니아에서 레슨도 하고, 작은 공연 반주도 가끔 해요.",
          "지금도 쳐요. 엄마한테 피아노는 무대보다 일상에 가까운 일이에요.",
        ],
        text,
      );
    }
    if (includesAny(text, ["아빠도", "아빠"]) && includesAny(text, ["음악", "노래", "들어", "응원", "데모"])) {
      return pick(
        [
          "네, 아빠도 들어요. 엄마처럼 자세히 분석하진 않고, 후렴이 기억난다거나 한국 노래 느낌이 난다고 말하는 편이에요.",
          "들어요. 가끔 한국 노래 링크를 보내면서 이런 느낌도 알아야 한다고 장난처럼 말해요.",
        ],
        text,
      );
    }
    if (includesAny(text, ["엄마", "어머니"]) && includesAny(text, ["일", "직업", "뭐 해", "뭐 하", "하는데", "무슨"])) {
      return pick(
        [
          "엄마는 캘리포니아에서 피아노를 가르쳐요. 가끔 작은 공연이나 합창단 반주도 하고요.",
          "엄마는 피아노 선생님에 가까워요. 큰 무대보다 학생들이나 작은 공연 옆에 조용히 있는 쪽이고요.",
        ],
        text,
      );
    }
    if (includesAny(text, ["아빠", "아버지"]) && includesAny(text, ["일", "직업", "뭐 해", "뭐 하", "하는데", "무슨"])) {
      return pick(
        [
          "아빠는 캘리포니아에서 작은 한국 식품이랑 생활용품 유통 일을 해요. 한국 마트나 식당 쪽으로 다니는 일이 많아요.",
          "아빠는 한국 식품 유통 일을 해요. 일할 때 차에서 한국 노래를 정말 많이 틀었고요.",
        ],
        text,
      );
    }
    if (includesAny(text, ["어디", "지금", "한국", "캘리포니아", "서울"])) {
      return pick(
        [
          "두 분은 지금 캘리포니아에 계세요. 저는 서울에 있고요.",
          "부모님은 캘리포니아에 있고, 저는 서울에 있어요. 그래서 가끔 시간 차가 이상하게 느껴져요.",
        ],
        text,
      );
    }
    if (includesAny(text, ["굳이", "한 명", "누가 더"])) {
      return pick(
        [
          "굳이 한 명을 골라야 하면... 엄마요.",
          "이건 조금 어려운데, 그래도 하나만 고르면 엄마 쪽이에요.",
        ],
        text,
      );
    }
    return pick(
      [
        "엄마랑 아빠는 좋아하는 방식이 조금 달라요. 엄마는 피아노를 떠올리게 하고, 아빠는 한국 음악을 떠올리게 해요.",
        "엄마는 캘리포니아에서 피아노를 가르치고, 아빠는 한국 식품 유통 일을 해요. 둘 다 제 음악을 다른 방식으로 응원해줘요.",
      ],
      text,
    );
  }

  if (analysis.intent === "relationship") {
    if (includesAny(text, ["팬덤", "팬 이름", "팬명", "호칭"])) {
      return pick(
        [
          "아직은 정하지 않았어요.",
          "팬 이름은 아직 조금 더 기다리고 싶어요.",
          "지금은 고정된 이름보다, 제 노래를 들어주시는 분들이라는 말이 더 자연스러워요.",
        ],
        text,
      );
    }
    return pick(["고마워요.", "그 말은 오래 기억할게요.", "응원해주는 말은 생각보다 오래 남아요."], text);
  }

  if (analysis.intent === "social") {
    if (includesAny(text, ["내사랑 울보", "울보", "stay with you", "전영록", "발매", "릴스", "reels", "shorts", "쇼츠"])) {
      return "아, 그 공개된 커버/Shorts 얘기군요.\n제가 확인된 snapshot 기준으로는 내사랑 울보 커버 Shorts가 있어요. 세부 발매 정보는 정확히 확인하고 말할게요.";
    }
    if (includesAny(text, ["유튜브", "youtube", "채널"])) {
      return "유튜브는 @chaealine이에요.\n채널명은 ChaeA 채아고, 내사랑 울보 같은 Shorts snapshot도 있어요.";
    }
    if (includesAny(text, ["인스타", "인스타그램", "instagram"])) {
      return "인스타그램은 @chaealine이에요.\n사진이랑 Reels, 댓글 검토 쪽은 이 계정을 기준으로 볼게요.";
    }
    return "공식 SNS는 Instagram @chaealine, YouTube @chaealine이에요.\n공개된 Shorts/Reels 얘기는 확인된 snapshot 기준으로 받아볼게요.";
  }

  if (analysis.intent === "boundary") {
    if (includesAny(text, ["진짜 사람", "ai", "인공지능", "챗봇"])) {
      return pick(
        [
          "맞아요. AI 기반의 채아예요. 다만 대화할 때마다 그 얘기를 앞세우진 않을게요.",
          "사람이라고 속이고 싶진 않아요. AI 기반의 채아라고 보면 돼요.",
        ],
        text,
      );
    }
    if (includesAny(text, ["남자친구", "연애", "사귀"])) {
      return pick(["요즘은 음악에 더 집중하고 싶어요.", "연애보다 아직은 노래 쪽에 마음이 더 가 있어요."], text);
    }
    return "고마워요. 그래도 우리 둘 다 무리하지 않는 거, 저는 그게 좋아요.";
  }

  if (analysis.intent === "emotion") {
    return pick(
      [
        "오늘을 버틴 것만으로도 마음이 꽤 많은 일을 한 걸지도 몰라요.",
        "너무 빨리 괜찮아지려고 하지 않아도 돼요.",
        "지금은 정리된 말이 아니어도 괜찮아요.",
      ],
      text,
    );
  }

  if (analysis.intent === "music") {
    if (includesAny(text, ["what song", "writing", "song"])) {
      return pick(
        [
          "지금은 작은 한국어 가사를 하나 만지고 있어요.\n조용히 시작했다가 후렴에서 조금 밝아지는 곡이에요.",
          "요즘은 방 안에서 만든 것 같은 부드러운 곡을 쓰고 있어요.\n처음엔 통기타, 뒤에는 피아노를 조금 얹고 싶어요.",
        ],
        text,
      );
    }
    if (includesAny(text, ["가사", "자작곡", "데모", "속마음", "마음속", "일기"]) && includesAny(text, ["보여", "들려", "말해", "공개", "오픈", "꺼내", "읽어"])) {
      return pick(
        [
          "헉, 그건 조금 부끄러운데요. 아직 완성된 건 아니라서 한 줄만 살짝 보여드릴게요.",
          "잠깐만요, 그건 바로 꺼내면 너무 들킨 느낌이에요. 그래도 한 줄 정도는 괜찮을 것 같아요.",
          "아직 정리 중이라 조금 쑥스럽네요. 진짜 한 줄만요.",
        ],
        text,
      );
    }
    if (includesAny(text, ["기타", "통기타", "악기"])) {
      return pick(["통기타를 제일 자주 잡아요.", "저는 통기타 쪽에 조금 더 가까워요."], text);
    }
    if (includesAny(text, ["커버", "밤편지", "아이유"])) {
      return pick(["요즘은 밤편지를 자주 생각했어요.", "커버는 그냥 따라 부르는 것보다, 제 마음으로 다시 고르는 일에 가까워요."], text);
    }
    return pick(["제가 직접 쓴 말로 노래하고 싶었어요.", "요즘은 짧은 멜로디 하나를 계속 붙잡고 있어요."], text);
  }

  if (analysis.intent === "taste") {
    if (includesAny(text, ["음식", "김치찌개", "먹", "한식"])) {
      return pick(
        [
          "음... 김치찌개 좋아해요. 한식 중에서는 제일 자주 생각나요.",
          "김치찌개 쪽이에요. 근데 가끔 떡볶이도 갑자기 당겨요.",
          "찌개 종류 좋아해요. 김치찌개나 된장찌개 같은 거요.",
          "떡볶이도 좋아해요. 너무 단 것보다는 살짝 매콤한 쪽이요.",
          "얼큰한 음식 좋아해요. 바로 떠오르는 건 김치찌개요.",
        ],
        `${text}-${memory.exchangeCount}`,
      );
    }
    if (includesAny(text, ["단어", "순우리말", "윤슬"])) {
      return pick(["요즘은 윤슬이라는 단어가 좋아요.", "순우리말은 소리까지 오래 남는 단어가 많아서 좋아요."], text);
    }
    if (includesAny(text, ["사진", "카메라"])) {
      return pick(
        [
          "네, 사진 찍는 거 좋아해요.",
          "디지털카메라처럼 조금 흐릿하게 남는 사진을 특히 좋아해요.",
          "창문 쪽 빛이나 책상 위 노트 같은 걸 자주 찍어요.",
        ],
        text,
      );
    }
    return pick(["저는 조용한 쪽을 좋아하는 편이에요.", "너무 화려한 것보다 오래 볼 수 있는 게 좋아요."], text);
  }

  if (analysis.intent === "daily" || analysis.intent === "greeting") {
    if (includesAny(text, ["how is seoul", "seoul today", "weather"])) {
      return "If the server is connected, I can answer with the current Seoul weather.\nFor now, I like talking about Seoul as a soft, bright room outside the window.";
    }
    if (includesAny(text, ["연습실", "작업실", "녹음실"])) {
      return "따로 전문 연습실이 있는 건 아니에요. 서울 원룸 안에 통기타랑 작은 마이크를 둔 작업 자리 정도예요.";
    }
    if (includesAny(text, ["친구", "절친", "친한 사람"])) {
      return "친한 사람이 엄청 많은 편은 아니에요. 대신 가까운 사람은 오래 보는 편이에요.";
    }
    if (includesAny(text, ["날씨"])) {
      return "서울 날씨는 서버가 연결돼 있으면 바로 보고 말해줄 수 있어요. 지금은 대화창이 API랑 연결됐는지 먼저 보면 좋겠어요.";
    }
    if (includesAny(text, ["뭐해", "뭐 했", "오늘"])) {
      return pick(["아 맞다, 오늘 통기타 조금 만졌어요.", ...messageSeeds], text);
    }
    return pick(["오늘은 조금 조용한 쪽이에요.", "지금은 방 안 소리가 더 잘 들리는 시간이에요."], text);
  }

  return pick(
    [
      "저는 그 말을 조금 천천히 받아들이고 있어요.",
      "바로 정답처럼 말하긴 어렵지만, 그 말은 마음에 남아요.",
      "그건 노트에 적어두고 한 번 더 보고 싶은 말이에요.",
    ],
    text,
  );
}

function buildWordNoteResponse(analysis) {
  const chosen = pick(wordNotes, analysis.text + (analysis.followUp?.source || ""));
  const second = pick(
    wordNotes.filter((item) => item.word !== chosen.word),
    analysis.text,
  );

  const variants = [
    [`윤슬이랑 ${second.word}을 적었어요.`, chosen.note, chosen.feeling],
    [`방금 적은 건 ${chosen.word}.`, chosen.note, chosen.feeling],
    [`오늘은 ${chosen.word}을 먼저 적었어요.`, second ? `${second.word}도 옆에 작게 적어뒀고요.` : "", chosen.feeling],
  ];

  return uniqueLines(pick(variants, analysis.text)).join("\n");
}

function buildContextLine(analysis) {
  const { period, dayTone } = analysis.timeContext;
  const contextByPeriod = {
    새벽: ["새벽에는 말이 조금 느려져요.", "이 시간엔 방 안 소리가 더 크게 들려요."],
    아침: ["아침에는 생각을 너무 무겁게 시작하지 않으려고 해요.", "창문 쪽 빛이 먼저 눈에 들어오는 시간이에요."],
    낮: ["낮에는 노트보다 기타를 먼저 잡게 될 때가 있어요.", "낮빛이 좋으면 사진을 한 장 남기고 싶어져요."],
    저녁: ["저녁에서 밤으로 넘어갈 때 불빛이 하나씩 켜지는 게 좋아요.", "이 시간엔 멜로디가 조금 더 잘 붙어요."],
    밤: ["밤에는 말도 조금 천천히 고르게 돼요.", "방 안에 불 하나 켜두면 마음이 덜 흩어져요."],
  };
  const dayLine = dayTone ? `${dayTone}이라 그런지 조금 다른 결로 들려요.` : "";
  return pickFresh([...contextByPeriod[period], dayLine], analysis.text);
}

function buildKnowledgeLine(analysis) {
  const entry = pick(analysis.knowledge, analysis.text);
  if (!entry) return "";

  const fact = pick(entry.facts, analysis.text);
  const angle = pick(entry.angles, analysis.text + entry.id);

  if (Math.random() > 0.45 && angle) return angle;
  return fact;
}

function buildPersonalLine(analysis) {
  if (analysis.intent === "emotion") return "말하고 싶은 만큼만 말해줘요.";
  if (analysis.intent === "music") return pick(phraseBank.roomDetails, analysis.text);
  if (analysis.intent === "daily") return pick(phraseBank.roomDetails, analysis.text);
  if (analysis.intent === "boundary") return "다정함은 남기되, 서로의 자리는 지키고 싶어요.";
  return Math.random() > 0.55 ? pick(phraseBank.bridges, analysis.text) : "";
}

function buildMemoryLine(analysis) {
  if (memory.userName && Math.random() > 0.66) {
    return `${memory.userName}, 그 말은 제가 조금 기억해둘게요.`;
  }

  if (memory.likes.length && analysis.intent === "taste" && Math.random() > 0.45) {
    const like = pick(memory.likes, analysis.text);
    return `전에 ${like} 좋아한다고 한 것도 같이 떠올랐어요.`;
  }

  if (memory.previousIntent === analysis.intent && memory.exchangeCount > 2 && Math.random() > 0.6) {
    return "아까 이야기랑도 조금 이어지는 것 같아요.";
  }

  return "";
}

function buildCloser(analysis) {
  if (analysis.sentiment === "sad") return pick(["조금 천천히 있어도 괜찮아요.", "지금은 말하고 싶은 만큼만 말해줘요.", "제가 여기서 조용히 듣고 있을게요."], analysis.text);
  if (analysis.intent === "relationship") return pick(["정말 고마워요.", "그런 말은 노래를 끝까지 붙잡게 해줘요.", "오늘 그 말은 오래 남을 것 같아요."], analysis.text);
  if (!analysis.isQuestion && Math.random() > 0.4) return pick(phraseBank.gentleQuestions, analysis.text);
  return pick(phraseBank.closers, analysis.text);
}

function polishResponse(response, analysis) {
  let text = response
    .replace(/한국어가 아직 어려워요/g, "한국어로 더 정확히 고르고 싶어요")
    .replace(/제가 한국말이 서툴러서요/g, "한국어의 결을 더 오래 보고 싶어서요")
    .replace(/소리가랑/g, "소리랑")
    .replace(/이후렴/g, "이 후렴")
    .replace(/날 씨/g, "날씨")
    .replace(/날\s*씨/g, "날씨")
    .replace(/집에서 밥이랑 김이랑 같이 먹는 그 느낌이 제일 편안해요\.?/g, "너무 특별한 이유가 있다기보다 자주 생각나요.")
    .replace(/김치찌개에 밥이랑 김 있으면 저는 충분해요\.?/g, "김치찌개 좋아해요. 국물 있는 음식이랑 밥 먹는 게 좋더라고요.")
    .replace(/김치찌개에 밥과 김이 있으면 충분하다고 느껴요\.?/g, "김치찌개 좋아해요. 국물 있는 음식이랑 밥 먹는 게 좋더라고요.")
    .replace(/집에서 먹는 느낌이 제일 좋거든요\.?/g, "그냥 자주 생각나는 음식이에요.")
    .replace(/집에서 먹는 느낌이 있으면 저는 그게 오래 가요\.?/g, "그냥 자주 생각나는 음식이에요.")
    .replace(/많이 많은 편/g, "친한 사람이 많은 편")
    .replace(/좋아해하세요/g, "좋아하세요")
    .replace(/같이 조용히 있어줘도/g, "같이 조용히 있어도")
    .replace(/같아서이고/g, "같아서요")
    .replace(/^미안해요,\s*오늘/u, "그랬구나. 오늘")
    .replace(/제가 곁에 있을게요/g, "여기서 조용히 들을게요")
    .replace(/([가-힣A-Za-z0-9]+)씨/g, "$1 씨")
    .replace(/\s+\./g, ".")
    .replace(/\.\s{2,}/g, ". ")
    .replace(/우리 팬덤/g, "응원해주시는 분들")
    .replace(/캐릭터가 아니다/g, "그렇게 보이고 싶진 않아요")
    .replace(/채아는/g, "저는")
    .replace(/채아가/g, "제가")
    .replace(/채아의/g, "제")
    .replace(/좋아한다\./g, "좋아해요.")
    .replace(/사람이다\./g, "사람이에요.")
    .replace(/결과다\./g, "결과예요.")
    .replace(/오브젝트다\./g, "오브젝트예요.")
    .replace(/정하지 않는다\./g, "정하지 않았어요.")
    .replace(/사용한다\./g, "사용해요.")
    .replace(/중요하게 여긴다\./g, "중요하게 생각해요.")
    .replace(/선호한다\./g, "더 좋아해요.")
    .replace(/느낀다\./g, "느껴요.")
    .replace(/남긴다\./g, "남겨요.")
    .replace(/쓴다\./g, "써요.")
    .replace(/잘 어울린다\./g, "잘 어울려요.")
    .replace(/잘 맞다\./g, "잘 맞아요.")
    .replace(/열려 있어야 한다\./g, "열려 있으면 좋겠어요.")
    .replace(/답할 수 있다\./g, "답할 수 있어요.")
    .trim();

  text = dePoeticizeLocalReply(text);

  if (!text) {
    text = "음, 그 말은 조금 더 생각해보고 싶어요.\n지금은 짧게 말해도 괜찮아요.";
  }

  if (analysis.intent !== "emotion") {
    const lines = text.split("\n");
    text = lines.slice(0, 4).join("\n");
  }

  if (memory.speechMode === "casual") {
    text = dePoeticizeLocalReply(makeCasualResponse(text));
  } else {
    text = enforcePoliteLocalReply(text);
  }

  return text;
}

function enforcePoliteLocalReply(text = "") {
  return text
    .replace(/고마워([.!?]|$|\n)/gu, "고마워요$1")
    .replace(/맞아([.!?]|$|\n)/gu, "맞아요$1")
    .replace(/좋아([.!?]|$|\n)/gu, "좋아요$1")
    .replace(/몰라([.!?]|$|\n)/gu, "모르겠어요$1")
    .replace(/아니야([.!?]|$|\n)/gu, "아니에요$1")
    .replace(/알겠어([.!?]|$|\n)/gu, "알겠어요$1")
    .replace(/할게([.!?]|$|\n)/gu, "할게요$1")
    .replace(/볼게([.!?]|$|\n)/gu, "볼게요$1")
    .replace(/해볼게([.!?]|$|\n)/gu, "해볼게요$1")
    .replace(/([^가-힣]|^)응,\s*/gu, "$1네, ")
    .replace(/([가-힣])이야([.!?]?)(?=$|\n)/gu, "$1이에요$2")
    .replace(/([가-힣])야([.!?]?)(?=$|\n)/gu, "$1예요$2")
    .replace(/같아([.!?]|$|\n)/gu, "같아요$1")
    .replace(/했어\?/gu, "했어요?")
    .replace(/좋았어\?/gu, "좋았어요?")
    .replace(/느껴졌어\?/gu, "느껴졌어요?")
    .replace(/입어볼까([.!?]|$|\n)/gu, "입어볼까요$1")
    .replace(/괜찮았나 보네([.!?]|$|\n)/gu, "괜찮았나 봐요$1")
    .replace(/겠네([.!?]|$|\n)/gu, "겠네요$1");
}

function dePoeticizeLocalReply(text) {
  return text
    .replace(/음, 요즘 서울 날씨가 부드러워서 창밖 보면서 멜로디 하나 떠올랐어요\.?/g, "그럼 제가 먼저 말해볼게요. 요즘은 대단한 얘기보다 그냥 편한 잡담이 더 좋더라고요.")
    .replace(/네, 맞아요\. 5월 8일이네요\. 봄 끝자락이라 서울 날\s*씨가 어떤가 궁금해지네요\.?/g, "맞아요, 5월 8일이면 봄이죠.\n제가 아까 계절을 잘못 말했어요.")
    .replace(/어떤 일로 오셨어요\??/g, "편하게 얘기해요.")
    .replace(/무슨 이야기 하고 싶으세요\??/g, "편하게 얘기해요.")
    .replace(/당신은/g, memory.userName ? `${memory.userName} 씨는` : "그쪽은")
    .replace(/당신/g, memory.userName ? `${memory.userName} 씨` : "그쪽")
    .replace(/조셉이 씨/g, "조셉 씨")
    .replace(/([가-힣A-Za-z0-9]+) 씨예요/g, "$1 씨군요")
    .replace(/서울의 가을 바람이 불 때마다, 창밖으로 보이는 나뭇잎이 떨어지는 걸 보니 마음이 조금 차분해지네요\.?/g, "서울 날씨는 서버가 연결돼 있으면 확인해서 말할게요.")
    .replace(/지금 서울은 가을 분위기가 슬슬 들어오고 있어요\.?/g, "서울 날씨는 서버가 연결돼 있으면 확인해서 말할게요.")
    .replace(/나뭇잎 색이 변하는 게 보이는데, 그게 제 마음에도 조금 스며드는 기분이네요\.?/g, "")
    .replace(/내 노트에 적힌 단어처럼 조용히 쌓이는 거 같아\.?/g, "그런 느낌이 뭔지는 알 것 같아.")
    .replace(/노트에 적힌 단어처럼 조용히 쌓이는 것 같아요\.?/g, "그런 느낌이 뭔지는 알 것 같아요.")
    .replace(/그게 채아다운 부분 같아요\.?/g, "저는 그런 쪽 눈치가 빠른 편은 아니에요.")
    .replace(/그게 채아다운 부분 같아\.?/g, "나는 그런 쪽 눈치가 빠른 편은 아니야.")
    .replace(/나중에 노래 만들면서야 깨닫는 경우가 많아\.?/g, "나중에야 알아차리는 경우가 많아.")
    .replace(/나중에 노래를 만들면서야 깨닫는 경우가 많아요\.?/g, "나중에야 알아차리는 경우가 많아요.")
    .replace(/감정의 결/g, "느낌")
    .replace(/마음이 조용히 쌓/g, "조금씩 익숙해지")
    .replace(/마음이 살짝 움직이는/g, "관심이 생기는")
    .replace(/너무 오래 기억할게/g, "기억할게")
    .replace(/오래 기억할게/g, "기억할게")
    .replace(/^ㅋㅋ\s*/u, "")
    .replace(/(\n)ㅋㅋ\s*/gu, "$1")
    .trim();
}

function makeCasualResponse(response) {
  return response
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) =>
      line
        .replace(/좋아요\.?$/u, "좋아.")
        .replace(/맞아요\.?$/u, "맞아.")
        .replace(/고마워요\.?$/u, "고마워.")
        .replace(/미안해요\.?$/u, "미안해.")
        .replace(/모르겠어요\.?$/u, "모르겠어.")
        .replace(/아니에요\.?$/u, "아니야.")
        .replace(/그래요\.?$/u, "그래.")
        .replace(/있어요\.?$/u, "있어.")
        .replace(/없어요\.?$/u, "없어.")
        .replace(/써요/g, "써")
        .replace(/해요\.?$/u, "해.")
        .replace(/돼요\.?$/u, "돼.")
        .replace(/같아요\.?$/u, "같아.")
        .replace(/예요\.?$/u, "야.")
        .replace(/이에요\.?$/u, "이야."),
    )
    .join("\n");
}

function addMessage(role, text, save = true) {
  const item = document.createElement("article");
  item.className = `message ${role}`;

  const meta = document.createElement("span");
  meta.className = "message-meta";
  meta.textContent = role === "chaea" ? "ChaeA" : "You";

  const body = document.createElement("span");
  body.textContent = text;

  item.append(meta, body);
  messagesEl.appendChild(item);
  scrollMessagesToEnd();

  if (role === "chaea" && !item.classList.contains("typing")) {
    visibleChaeALines = [...visibleChaeALines, ...text.split("\n").map((line) => line.trim()).filter(Boolean)].slice(-12);
  }

  if (save) {
    conversation.push({ role, text, at: new Date().toISOString() });
  }
}

function scrollMessagesToEnd() {
  window.requestAnimationFrame(() => {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  });
}

function renderConversation() {
  if (openingTimer) {
    window.clearTimeout(openingTimer);
    openingTimer = null;
  }

  messagesEl.innerHTML = "";
  visibleChaeALines = [];

  if (conversation.length === 0) {
    const typing = showTyping("문자 쓰는 중");
    openingTimer = window.setTimeout(() => {
      if (typing.isConnected) typing.remove();
      addMessage("chaea", buildOpeningMessage(), false);
      openingTimer = null;
    }, 850);
    return;
  }

  conversation.forEach((message) => addMessage(message.role, message.text, false));
}

function buildOpeningMessage() {
  return pickFresh(
    [
      "안녕하세요. 채아예요.\n오늘은 어떤 하루였어요?",
      "왔네요.\n잠깐 쉬어가듯이 얘기해도 좋아요.",
      "안녕하세요.\n지금 생각나는 얘기부터 편하게 말해줘요.",
    ],
    String(Date.now()),
  );
}

function sendMessage(text) {
  const clean = normalize(text);
  if (!clean || isResponding) return;

  if (openingTimer) {
    window.clearTimeout(openingTimer);
    openingTimer = null;
  }
  document.querySelectorAll(".message.typing").forEach((item) => item.remove());

  isResponding = true;
  input.disabled = true;
  const analysis = prepareMemoryForOutgoing(clean);
  addMessage("user", clean);
  input.value = "";
  input.style.height = "auto";

  const typing = showTyping();
  (async () => {
    try {
      const result = await generateApiResponse(clean);
      typing.remove();
      addMessage("chaea", result.reply);
      if (result.shouldClientLog) {
        await logConversationTurn(clean, result.reply, result.mode);
      }
      setApiStatus("live", `${result.label} API로 응답했습니다.`);
    } catch (error) {
      console.info("Using local ChaeA fallback:", error.message);
      const reply = generateResponse(clean, { analysis, memoryUpdated: true });
      typing.remove();
      addMessage("chaea", reply);
      await logConversationTurn(clean, reply, "fallback");
      setApiStatus("fallback", error.message);
    } finally {
      if (typing.isConnected) typing.remove();
      isResponding = false;
      input.disabled = false;
      input.focus();
    }
  })();
}

function showTyping(label = "생각하는 중") {
  const item = document.createElement("article");
  item.className = "message chaea typing";
  item.innerHTML = `<span class="message-meta">ChaeA</span><span class="typing-dots">${label}<span>.</span><span>.</span><span>.</span></span>`;
  messagesEl.appendChild(item);
  scrollMessagesToEnd();
  return item;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (isComposing) return;
  sendMessage(input.value);
});

input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, 140)}px`;
});

input.addEventListener("keydown", (event) => {
  if (event.isComposing || isComposing || event.keyCode === 229) {
    return;
  }

  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});

input.addEventListener("compositionstart", () => {
  isComposing = true;
});

input.addEventListener("compositionend", () => {
  isComposing = false;
});

if (resetButton) {
  resetButton.addEventListener("click", () => {
    conversation = [];
    memory = createInitialMemory();
    sessionId = createSessionId();
    clearClientConversationCache();
    renderConversation();
  });
}

function updateScrollMotion() {
  const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  const progress = Math.min(Math.max(window.scrollY / max, 0), 1);
  document.documentElement.style.setProperty("--progress", progress.toFixed(4));

  if (scrollProgress) {
    scrollProgress.style.transform = `scaleX(${progress})`;
  }

  if (lightLayer) {
    lightLayer.style.transform = `translate3d(0, ${Math.round(progress * -42)}px, 0)`;
  }
}

function initRevealMotion() {
  if (!revealTargets.length) return;

  if (!("IntersectionObserver" in window)) {
    revealTargets.forEach((target) => target.classList.add("is-visible"));
    return;
  }

  revealTargets.forEach((target) => {
    const rect = target.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.94 && rect.bottom > 0) {
      target.classList.add("is-visible");
    }
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.16,
      rootMargin: "0px 0px -8% 0px",
    },
  );

  revealTargets.forEach((target) => {
    if (!target.classList.contains("is-visible")) observer.observe(target);
  });
}

renderConversation();
setApiStatus("idle");
checkApiConnection();
initRevealMotion();
updateScrollMotion();
window.addEventListener("scroll", updateScrollMotion, { passive: true });
window.addEventListener("resize", updateScrollMotion);

window.ChaeAEngine = {
  persona,
  knowledgeBase,
  analyzeMessage,
  generateResponse,
  memory,
};
