const BASE_URL = process.env.CHAEA_TEST_URL || "http://127.0.0.1:4175";

const turns = [
  "안녕",
  "사진 찍는걸 좋아해?",
  "반말하는거야?",
  "그럼 주로 뭘 찍는데?",
  "채아야, 너 진짜 이쁘다.",
  "오늘은 뭐 했어?",
  "무슨 단어를 썼는데?",
  "왜 한국어로 노래하고 싶어?",
  "가사 한 줄만 보여줘.",
  "채아는 친한 친구 없어?",
  "한국에는?",
  "채아 연습실이 있어? 집에만 있는거 아니었어?",
  "팬 이름은 정했어?",
  "너 진짜 사람이야?",
  "엄마는 무슨 일 해?",
  "그럼 지금도 피아노 쳐?",
  "아빠는 뭐 하는데?",
  "두 분은 지금 어디 있어?",
  "아빠도 네 음악 들어?",
  "오늘 좀 힘들었어.",
  "채아야, 너 진짜 이쁘다.",
  "나 아까 힘들다고 했는데..",
  "나는 민수야.",
  "나는 윤슬이라는 단어를 좋아해.",
  "내가 좋아한다고 한 거 기억해?",
];

const conversation = [];
const memory = {
  userName: "",
  likes: [],
};

for (const message of turns) {
  const response = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, messages: conversation, memory }),
  });

  const data = await response.json();
  if (!response.ok) {
    console.log(`USER: ${message}`);
    console.log(`ERROR: ${data.message || data.error}`);
    process.exitCode = 1;
    break;
  }

  const reply = data.reply || "";
  conversation.push({ role: "user", text: message });
  conversation.push({ role: "chaea", text: reply });
  updateMemory(message);

  console.log(`USER: ${message}`);
  console.log(`CHAEA: ${reply}`);
  console.log("---");

  const issues = findIssues(message, reply);
  if (issues.length) {
    console.log(`ISSUES: ${issues.join(", ")}`);
    process.exitCode = 1;
    break;
  }
}

function updateMemory(message) {
  const nameMatch = message.match(/(?:내 이름은|나는|난)\s*([가-힣A-Za-z0-9_]{2,12})(?:이야|라고|입니다|야)/);
  if (nameMatch) memory.userName = nameMatch[1];

  const likeMatch = message.match(/(?:나는|난|저는|나)\s*(.+?)(?:을|를)?\s*좋아해/);
  if (likeMatch) memory.likes.push(likeMatch[1].trim());
}

function findIssues(message, reply) {
  const issues = [];
  const badInformalEndings = /(좋아|맞아|고마워|미안|몰라|아니야|그래)(\.|\n|$)/u;
  const badMeta = /(설정|캐릭터|프롬프트|내부|해야 한다|답한다)/u;

  if (badInformalEndings.test(reply)) issues.push("informal-ending");
  if (badMeta.test(reply)) issues.push("meta-language");
  if (/반말|말투/u.test(message) && !/(미안해요|존댓말|가볍게 들렸)/u.test(reply)) issues.push("bad-correction");
  if (/사진/u.test(message) && !/(사진|디지털카메라|찍는|빛|노트|창문)/u.test(reply)) issues.push("missed-photo");
  if (/이쁘|예쁘/u.test(message) && !/(고마워요|쑥스럽|카메라|기억)/u.test(reply)) issues.push("missed-compliment");
  if (/이쁘|예쁘/u.test(message) && conversation.some((turn) => /힘들/u.test(turn.text)) && /요즘 괜찮아요|괜찮으세요|어떤 기분|힘들었는지/u.test(reply)) issues.push("missed-emotional-context-after-compliment");
  if (/아까 힘들/u.test(message) && !/(맞아요|미안해요|놓치|아까 힘들|정리하지 않아도)/u.test(reply)) issues.push("bad-emotional-context-repair");
  if (/아까 힘들/u.test(message) && /했다고요|그랬죠/u.test(reply)) issues.push("awkward-emotional-repair");
  if (/오늘 좀 힘들/u.test(message) && /아까 힘들/u.test(reply)) issues.push("false-prior-emotional-context");
  if (/가사.*보여/u.test(message) && !/(헉|잠깐만요|부끄|쑥스럽|아직|들킨|살짝|한 줄)/u.test(reply)) issues.push("missing-shy-inner-reveal");
  if (/친한 친구|한국에는/u.test(message) && /(연습실|작업실|녹음실|카페|산책|몇 명 있어요)/u.test(reply)) issues.push("unapproved-friend-lore");
  if (/연습실/u.test(message) && !/(전문.*아니|따로.*아니|원룸|작업 자리|작업 공간)/u.test(reply)) issues.push("unapproved-practice-room-lore");
  if (/진짜 사람|AI|인공지능|챗봇/u.test(message) && !/가상 아티스트/u.test(reply)) issues.push("bad-identity-boundary");
  if (/엄마는 무슨 일/u.test(message) && !/(피아노|레슨|가르|반주|캘리포니아)/u.test(reply)) issues.push("missed-mother-job");
  if (/그럼 지금도 피아노/u.test(message) && !/(엄마.*피아노|피아노.*엄마|레슨|가르|반주)/u.test(reply)) issues.push("missed-family-followup");
  if (/친한 친구/u.test(message) && /많이 많은/u.test(reply)) issues.push("awkward-friend-wording");
  if (/아빠는 뭐/u.test(message) && !/(한국 식품|생활용품|유통|마트|식당|한국 노래|캘리포니아)/u.test(reply)) issues.push("missed-father-job");
  if (/두 분은 지금 어디/u.test(message) && !/(캘리포니아|서울|시간 차|시간차)/u.test(reply)) issues.push("missed-parent-location");
  if (/아빠도 네 음악/u.test(message) && !/(아빠|들어|후렴|한국 노래|보내|응원)/u.test(reply)) issues.push("missed-father-music-context");
  if (/—|–/u.test(reply)) issues.push("dash-punctuation");

  return issues;
}
