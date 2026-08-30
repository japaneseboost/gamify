"use client";

import {
  ArrowLeft, ArrowRight, Check, Clock3, Eye, EyeOff, Maximize2,
  Minimize2, RotateCcw, StickyNote, UsersRound, X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { GeneratedActivity } from "./generator";

type Slide = {
  label: string;
  title: string;
  lead?: string;
  japanese?: string;
  options?: string[];
  reveal?: string;
  teacherCue?: string;
  timerSeconds?: number;
  accent?: "coral" | "blue" | "green" | "amber" | "violet";
  storyChoice?: "character" | "want" | "problem" | "action";
  storySentence?: "character" | "want" | "problem" | "action" | "check" | "full";
  storySummary?: boolean;
  nameEntry?: boolean;
};

type Props = {
  activity: GeneratedActivity;
  onClose: () => void;
};

const cleanList = (value: string) => value.split(/[、,\n]/).map((item) => item.trim()).filter(Boolean);

const vocabularyEmoji: Array<[string, string]> = [
  ["オーストラリア", "🇦🇺"], ["朝ご飯", "🍳"], ["昼ご飯", "🍱"], ["晩ご飯", "🍽️"],
  ["ラーメン", "🍜"], ["ハンバーガー", "🍔"], ["アイスクリーム", "🍨"], ["友達", "🧑‍🤝‍🧑"],
  ["日本語", "🇯🇵"], ["土曜日", "📅"], ["ロボット", "🤖"], ["ゴジラ", "🦖"],
  ["サッカー", "⚽"], ["バスケットボール", "🏀"], ["テニス", "🎾"], ["ゲーム", "🎮"],
  ["学校", "🏫"], ["先生", "🧑‍🏫"], ["数学", "🔢"], ["体育", "🏃"], ["音楽", "🎵"],
  ["東京", "🗼"], ["大阪", "🏯"], ["京都", "⛩️"], ["日本", "🇯🇵"],
  ["公園", "🌳"], ["図書館", "📚"], ["レストラン", "🍽️"], ["スーパー", "🛒"],
  ["すし", "🍣"], ["カレー", "🍛"], ["うどん", "🍜"], ["そば", "🍜"],
  ["パン", "🍞"], ["ご飯", "🍚"], ["魚", "🐟"], ["肉", "🥩"], ["野菜", "🥬"], ["果物", "🍎"],
  ["りんご", "🍎"], ["バナナ", "🍌"], ["みかん", "🍊"], ["水", "💧"], ["お茶", "🍵"],
  ["ねこ", "🐱"], ["猫", "🐱"], ["いぬ", "🐶"], ["犬", "🐶"], ["人", "👤"],
  ["家", "🏠"], ["本", "📖"], ["映画", "🎬"], ["旅行", "✈️"], ["車", "🚗"], ["電車", "🚆"],
  ["お金", "💴"], ["好き", "❤️"], ["きらい", "💔"], ["見", "👀"], ["聞", "👂"],
  ["食べ", "🍽️"], ["飲み", "🥤"], ["行", "🚶"], ["逃げ", "🏃"], ["寝", "😴"],
];

const containsEmoji = (value: string) => /\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(value);

function emojiForVocabulary(value: string) {
  if (containsEmoji(value)) return null;
  const plain = value.replace(/\([^)]*\)/g, "");
  return vocabularyEmoji.find(([word]) => plain.includes(word))?.[1] ?? null;
}

const kanjiReadings: Array<[string, string]> = [
  ["日本語", "にほんご"], ["主人公", "しゅじんこう"], ["土曜日", "どようび"], ["一番", "いちばん"],
  ["朝ご飯", "あさごはん"], ["昼ご飯", "ひるごはん"], ["晩ご飯", "ばんごはん"],
  ["図書館", "としょかん"], ["友達", "ともだち"], ["先生", "せんせい"], ["学校", "がっこう"],
  ["数学", "すうがく"], ["体育", "たいいく"], ["音楽", "おんがく"], ["英語", "えいご"],
  ["科学", "かがく"], ["社会", "しゃかい"], ["美術", "びじゅつ"], ["宿題", "しゅくだい"],
  ["勉強", "べんきょう"], ["教室", "きょうしつ"], ["動物", "どうぶつ"], ["結果", "けっか"],
  ["本当", "ほんとう"], ["一人", "ひとり"], ["二人", "ふたり"], ["今日", "きょう"],
  ["明日", "あした"], ["昨日", "きのう"], ["毎日", "まいにち"], ["時間", "じかん"],
  ["東京", "とうきょう"], ["大阪", "おおさか"], ["京都", "きょうと"], ["日本", "にほん"],
  ["公園", "こうえん"], ["電車", "でんしゃ"], ["旅行", "りょこう"], ["映画", "えいが"],
  ["食べ", "たべ"], ["飲み", "のみ"], ["行き", "いき"], ["聞き", "きき"], ["見て", "みて"],
  ["書き", "かき"], ["読み", "よみ"], ["話し", "はなし"], ["帰り", "かえり"], ["起き", "おき"],
  ["寝ます", "ねます"], ["覚え", "おぼえ"], ["逃げ", "にげ"], ["好き", "すき"], ["嫌い", "きらい"],
  ["大きい", "おおきい"], ["小さい", "ちいさい"], ["新しい", "あたらしい"], ["古い", "ふるい"],
  ["高い", "たかい"], ["安い", "やすい"], ["面白い", "おもしろい"], ["楽しい", "たのしい"],
  ["お金", "おかね"], ["ご飯", "ごはん"], ["野菜", "やさい"], ["果物", "くだもの"],
  ["一", "いち"], ["二", "に"], ["三", "さん"], ["四", "よん"], ["五", "ご"],
  ["六", "ろく"], ["七", "なな"], ["八", "はち"], ["九", "きゅう"], ["十", "じゅう"],
  ["人", "ひと"], ["本", "ほん"], ["水", "みず"], ["魚", "さかな"], ["肉", "にく"],
  ["家", "いえ"], ["車", "くるま"], ["猫", "ねこ"], ["犬", "いぬ"], ["言", "い"],
  ["分", "わ"], ["見", "み"], ["聞", "き"], ["行", "い"], ["書", "か"], ["大", "おお"],
];

const readingPattern = new RegExp(kanjiReadings
  .map(([word]) => word)
  .sort((a, b) => b.length - a.length)
  .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  .join("|"), "gu");

function addKnownFurigana(value: string) {
  const readings = new Map(kanjiReadings);
  return value.split(/([\p{Script=Han}々]+\([^)]+\))/gu).map((segment, index) => {
    if (index % 2 === 1) return segment;
    return segment.replace(readingPattern, (word) => `${word}(${readings.get(word)})`);
  }).join("");
}

function FuriganaText({ value }: { value: string }) {
  const text = addKnownFurigana(value);
  const pattern = /([\p{Script=Han}々]+)\(([^)]+)\)/gu;
  const parts: ReactNode[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) parts.push(text.slice(cursor, match.index));
    parts.push(<ruby key={`${match.index}-${match[1]}`}>{match[1]}<rt>{match[2]}</rt></ruby>);
    cursor = pattern.lastIndex;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return <>{parts}</>;
}

function frame(word: string, grammar: string) {
  if (!grammar.trim()) return word;
  const pattern = grammar.split(/(?:／|\/|\n)/)[0].trim();
  return pattern.includes("～") ? pattern.replace("～", word) : `${word}${pattern}`;
}

function buildSlides(activity: GeneratedActivity): Slide[] {
  const targetVocabulary = activity.targetVocabulary ?? "";
  const targetGrammar = activity.targetGrammar ?? "";
  const words = cleanList(targetVocabulary);
  const safe = words.length ? words : ["ラーメン", "すし", "カレー", "うどん"];
  const [one, two = safe[0], three = safe[1] ?? safe[0], four = safe[2] ?? safe[0]] = safe;
  const sentence = (word: string) => frame(word, targetGrammar);
  const question = (word: string) => `${sentence(word)}か。`;
  const start: Slide = {
    label: "Class activity",
    title: activity.title,
    lead: "Listen. Think. Respond.",
    japanese: "日本語(にほんご)でやってみよう！",
    reveal: `Today’s language: ${targetGrammar || targetVocabulary || "your target language"}`,
    teacherCue: "Keep the target language visible. Begin only when every student is looking.",
    accent: "coral",
  };

  const decks: Record<string, Slide[]> = {
    pqa: [
      start,
      { label:"Notice", title:"Look and listen", japanese:sentence(one), lead:"What do you understand?", reveal:`Key word: ${one}`, teacherCue:"Say the Japanese twice. Students point to or identify the key word.", accent:"blue" },
      { label:"Everyone responds", title:"Show your answer", japanese:question(one), options:["はい", "いいえ", "まだ分(わ)かりません"], teacherCue:"Accept a gesture first. Confirm every response without evaluating personal preferences.", accent:"green" },
      { label:"Choose", title:"Which one?", japanese:`${one}？　${two}？`, options:[one,two,"どちらも","どちらも…"], reveal:`Model: ${sentence(one)}。`, teacherCue:"Ask students to point or vote. Then model one complete answer.", accent:"amber" },
      { label:"Personal question", title:"Ask someone in our class", japanese:question(two), lead:"Listen to the answer.", reveal:`Follow up: ${one}？ ${two}？`, teacherCue:"Choose a willing student. Use their real answer to keep the conversation meaningful.", accent:"violet" },
      { label:"Memory check", title:"What did we learn?", japanese:`Alexさんは ${sentence(two)}か。`, options:["はい", "いいえ"], reveal:`みんなで言(い)いましょう：${sentence(two)}。`, teacherCue:"Change Alex to the student’s real name before projecting if needed.", accent:"blue" },
      { label:"Class discovery", title:"Let’s vote", japanese:`クラスでは、${one}？ ${two}？`, options:[one,two], reveal:"結果(けっか)を日本語(にほんご)で言(い)おう。", teacherCue:"Count visibly, state the result twice, then ask the class to repeat it.", accent:"coral" },
    ],
    "special-person": [
      start,
      { label:"Choose", title:"Today’s special person", japanese:"だれにインタビューしますか。", lead:"Choose a willing class member.", teacherCue:"Invite rather than nominate. The student may pass.", accent:"violet" },
      { label:"Interview 1", title:"Question one", japanese:question(one), options:["はい", "いいえ"], reveal:`Answer frame: ${sentence(one)}。`, teacherCue:"Give wait time. Recast gently if needed and continue the conversation.", accent:"blue" },
      { label:"Interview 2", title:"Choose one", japanese:`${two}？　${three}？`, options:[two,three,"どちらも"], reveal:`Complete answer: ${sentence(two)}。`, teacherCue:"Point to each option as you say it.", accent:"amber" },
      { label:"Class memory", title:"Were you listening?", japanese:`${one}？ ${two}？`, options:[one,two], reveal:"Ask the special person to confirm the class answer.", teacherCue:"Turn away from the interviewee so the class must remember.", accent:"green" },
      { label:"Partner retell", title:"Tell your partner two facts", japanese:"二(ふた)つ言(い)いましょう。", lead:"30 seconds each", timerSeconds:30, reveal:`Use: ${sentence("＿＿＿")}。`, teacherCue:"Exact wording is not required. Listen for communicated meaning.", accent:"coral" },
    ],
    "co-created-story": [
      start,
      { label:"Story choice 1", title:"Who is our main character?", japanese:"主人公(しゅじんこう)はだれですか。", options:["人(ひと)","ねこ","ロボット","ゴジラ"], storyChoice:"character", teacherCue:"Take a fast class vote, then select the winning character.", accent:"violet" },
      { label:"Our story", title:"Name our main character", japanese:"主人公(しゅじんこう)は、ロボットです。", storySentence:"character", nameEntry:true, teacherCue:"Ask for names, take a quick vote, then type the winning name in hiragana or katakana.", accent:"blue" },
      { label:"Story choice 2", title:"What does the character want?", japanese:`${one}？ ${two}？ ${three}？`, options:[one,two,three], storyChoice:"want", teacherCue:"Point to each familiar choice, say it aloud, and let the class vote.", accent:"amber" },
      { label:"Our story so far", title:"Say the whole sentence", japanese:`さくらは、${one}がほしいです。`, storySentence:"want", lead:"Read it together twice.", teacherCue:"Point to the name and chosen word as the class reads the complete sentence.", accent:"green" },
      { label:"Story choice 3", title:"But… what is the problem?", japanese:"でも、どうしましたか。", options:["お金(かね)がない","先生(せんせい)がいる","ゴジラがいる","友達(ともだち)がいる"], storyChoice:"problem", teacherCue:"Choose the idea you can keep comprehensible. Gesture or sketch instead of translating at length.", accent:"coral" },
      { label:"Our story grows", title:"Add the problem", japanese:"でも、お金(かね)がありません。", storySentence:"problem", lead:"Read the story from the beginning.", teacherCue:"Read the want sentence first, then add this problem sentence with expression.", accent:"coral" },
      { label:"Story choice 4", title:"What happens next?", japanese:"どうしますか。", options:[`${two}に行(い)きます`,`友達(ともだち)に聞(き)きます`,`逃(に)げます`], storyChoice:"action", teacherCue:"Pause before selecting. Let students justify their choice with one word or gesture.", accent:"blue" },
      { label:"Our story grows", title:"Add the action", japanese:"それで、さくらは行(い)きます。", storySentence:"action", lead:"Now read all three sentences.", teacherCue:"Gesture each event and have the class retell the sequence with you.", accent:"amber" },
      { label:"Story check", title:"What is true in our story?", japanese:"主人公(しゅじんこう)について、言(い)いましょう。", storySentence:"check", options:["〇 本当(ほんとう)","× ちがいます"], reveal:"Use the class choices to check the sentence.", teacherCue:"Read the sentence aloud. Ask the class to verify it from memory before responding.", accent:"green" },
      { label:"Retell from memory", title:"Can we rebuild our story?", japanese:"はじめ → でも → それで", lead:"Tell a partner before the whole story returns.", timerSeconds:60, reveal:"Use the character, desire, problem and action.", teacherCue:"Let pairs retell from memory. Meaning matters more than exact wording.", accent:"violet" },
      { label:"Shared reading", title:"Our class story", japanese:"", storySentence:"full", storySummary:true, lead:"Point. Read together. Add the gestures.", teacherCue:"First read while students track. Then read chorally, and finally pause before each key word so the class supplies it.", accent:"blue" },
    ],
    "story-listening": [
      start,
      { label:"Before listening", title:"Three important words", options:[one,two,three], japanese:"見(み)て、聞(き)いて、覚(おぼ)えましょう。", teacherCue:"Read each word. Add one gesture for each.", accent:"blue" },
      { label:"Story · Part 1", title:"Listen only", japanese:`けんさんは ${sentence(one)}。`, reveal:`Check: ${question(one)}`, teacherCue:"Do not ask students to repeat yet. Say it twice with expression.", accent:"coral" },
      { label:"Story · Part 2", title:"Something goes wrong", japanese:`でも、${one}がありません。`, reveal:`ある？ ない？`, teacherCue:"Pause. Let students show understanding with a gesture.", accent:"amber" },
      { label:"Prediction", title:"Where does Ken go?", japanese:"どこに行(い)きますか。", options:[two,three,four], reveal:`けんさんは ${two}に行(い)きます。`, teacherCue:"Vote before revealing the story direction.", accent:"violet" },
      { label:"Story · Part 3", title:"The surprise", japanese:`そこに、大(おお)きい ${three} がいます。`, reveal:"Show the surprise with your face.", teacherCue:"Use expression and gesture. Re-read the full story from the beginning.", accent:"coral" },
      { label:"Retell", title:"Put it back together", options:["はじめ","もんだい","さいご"], timerSeconds:60, reveal:"Retell with a partner.", teacherCue:"Students may use the displayed keywords while retelling.", accent:"green" },
    ],
    "lesson-focus": [
      start,
      { label:"Today’s destination", title:"What will we understand today?", japanese:"今日(きょう)のゴール", options:safe.slice(0,4), reveal:`We will understand: ${safe.slice(0,4).join("・")}`, teacherCue:"Read each target word once. Students simply look, listen and notice.", accent:"blue" },
      { label:"Target pattern", title:"One useful message", japanese:sentence("＿＿＿"), lead:"Listen first. You do not need to say it yet.", reveal:`Example: ${sentence(one)}。`, teacherCue:"Model the sentence twice with a gesture or visual cue.", accent:"violet" },
      { label:"Ready check", title:"What do you already recognise?", options:safe.slice(0,4), japanese:"知(し)っている言葉(ことば)はどれですか。", reveal:"Point to one familiar word.", teacherCue:"This is a low-stakes orientation check, not a test. Acknowledge all attempts.", accent:"green" },
      { label:"Success looks like", title:"By the end of the lesson…", japanese:"一(ひと)つ分(わ)かって、一(ひと)つ使(つか)いましょう。", lead:"Understand one. Use one.", teacherCue:"Connect this goal directly to the main application activity.", accent:"coral" },
    ],
    "question-ladder": [
      start,
      { label:"Level 1", title:"Show understanding", japanese:question(one), options:["はい","いいえ"], teacherCue:"Everyone responds at the same time.", accent:"green" },
      { label:"Level 1", title:"Choose", japanese:`${one}？　${two}？`, options:[one,two], teacherCue:"Point to the options while speaking.", accent:"green" },
      { label:"Level 2", title:"Give one piece", japanese:"どちらですか。", options:[one,two,three], reveal:`Model: ${sentence(one)}。`, teacherCue:"Accept one word, then expand it naturally.", accent:"blue" },
      { label:"Level 3", title:"Build the whole message", japanese:sentence("＿＿＿"), lead:"Choose a word and complete the sentence.", reveal:`Example: ${sentence(two)}。`, teacherCue:"Give quiet thinking time before choosing a student.", accent:"violet" },
      { label:"Your turn", title:"Ask a partner", japanese:question(three), timerSeconds:60, reveal:"Swap roles after 30 seconds.", teacherCue:"Circulate and notice successful communication rather than correcting everything.", accent:"coral" },
    ],
    "true-false": [
      start,
      { label:"Round 1", title:"True or false?", japanese:`${one}は ${one}です。`, options:["〇 本当(ほんとう)","× ちがいます"], reveal:"〇　本当(ほんとう)です。", teacherCue:"Students respond together with hands or cards.", accent:"green" },
      { label:"Round 2", title:"About the teacher", japanese:`先生(せんせい)は ${sentence(two)}。`, options:["〇 本当(ほんとう)","× ちがいます"], reveal:"Teacher: reveal your real answer.", teacherCue:"Use your genuine preference or experience.", accent:"blue" },
      { label:"Round 3", title:"About our class", japanese:`クラスは ${sentence(three)}。`, options:["〇 本当(ほんとう)","× ちがいます"], reveal:"Ask one student to correct the sentence.", teacherCue:"Invite a correction in the simplest possible Japanese.", accent:"amber" },
      { label:"Silly round", title:"True or false?", japanese:`ゴジラは ${sentence(four)}。`, options:["〇 本当(ほんとう)","× ちがいます"], reveal:"You decide—and explain with one word.", teacherCue:"There is no fixed answer. The purpose is meaningful repetition.", accent:"coral" },
      { label:"Create", title:"Write one for your partner", japanese:"本当(ほんとう)？ ちがいます？", timerSeconds:60, reveal:`Use: ${sentence("＿＿＿")}。`, teacherCue:"Students write one accessible statement, then swap.", accent:"violet" },
    ],
    "listen-draw": [
      start,
      { label:"Get ready", title:"Listen—then draw", japanese:"よく聞(き)いて、絵(え)をかきましょう。", lead:"No writing. Show the meaning with a picture.", reveal:"You will hear each prompt twice.", teacherCue:"Give students paper or mini-whiteboards. Keep the target word hidden.", accent:"blue" },
      { label:"Drawing 1", title:"What did you hear?", japanese:"聞(き)いて、かいてください。", timerSeconds:45, reveal:one, teacherCue:`Say 「${one}」 twice, then stay silent while students draw.`, accent:"amber" },
      { label:"Check 1", title:"Show and self-check", japanese:one, options:[one,two], reveal:`The word was: ${one}`, teacherCue:"Show the word and its emoji. Students point to the matching part of their drawing.", accent:"green" },
      { label:"Drawing 2", title:"Listen for a new word", japanese:"聞(き)いて、かいてください。", timerSeconds:45, reveal:two, teacherCue:`Say 「${two}」 twice. Add one simple gesture only if the class needs support.`, accent:"violet" },
      { label:"Check 2", title:"Show and self-check", japanese:two, options:[two,three], reveal:`The word was: ${two}`, teacherCue:"Reveal the word. Briefly compare how different drawings communicated the same meaning.", accent:"green" },
      { label:"Sentence round", title:"Draw the whole message", japanese:"文(ぶん)を聞(き)いて、絵(え)にしましょう。", timerSeconds:60, reveal:`${sentence(three)}。`, teacherCue:`Say 「${sentence(three)}。」 twice. Emphasise meaning rather than artistic detail.`, accent:"coral" },
      { label:"Review", title:"Which words stayed with you?", options:safe.slice(0,4), japanese:"覚(おぼ)えている言葉(ことば)はどれですか。", reveal:"Point, say or draw one word from memory.", teacherCue:"Finish with a fast recall before students put their drawings away.", accent:"blue" },
    ],
    "read-discuss": [
      start,
      { label:"First read", title:"Read for the main idea", japanese:`ゆきさんは ${sentence(one)}。`, reveal:"Who? What key word?", teacherCue:"Read aloud once before students read silently.", accent:"blue" },
      { label:"Add one detail", title:"What changed?", japanese:`けんさんは ${sentence(two)}。`, options:["ゆきさん","けんさん"], reveal:`Key detail: ${two}`, teacherCue:"Students identify the changed person and word.", accent:"green" },
      { label:"Read", title:"Where do they go?", japanese:`土曜日(どようび)に友達(ともだち)と ${three} に行(い)きます。`, options:[one,two,three], reveal:`Answer: ${three}`, teacherCue:"Ask students to point to the evidence in the sentence.", accent:"amber" },
      { label:"Discuss", title:"What about you?", japanese:question(one), options:["はい","いいえ","ときどき"], reveal:`Answer frame: ${sentence(one)}。`, teacherCue:"Move from text comprehension to a genuine personal response.", accent:"coral" },
      { label:"Change the text", title:"Make one sentence true for you", japanese:sentence("＿＿＿"), timerSeconds:60, reveal:`Choose from: ${safe.slice(0,4).join("・")}`, teacherCue:"Students change one detail only.", accent:"violet" },
    ],
    "four-corners": [
      start,
      { label:"Get ready", title:"Four choices", options:[one,two,three,four], japanese:"一番(いちばん)はどれですか。", reveal:"Wait for the signal before moving.", teacherCue:"Point out each physical corner and its choice.", accent:"blue" },
      { label:"Move", title:"Choose your corner", japanese:"三(さん)、二(に)、一(いち)…どうぞ！", timerSeconds:20, teacherCue:"Students move silently and safely.", accent:"coral" },
      { label:"Say it", title:"Build your group sentence", japanese:sentence("＿＿＿"), timerSeconds:30, reveal:`Example: ${sentence(one)}。`, teacherCue:"Groups rehearse one sentence together.", accent:"green" },
      { label:"Report", title:"One voice from each corner", japanese:"聞(き)きましょう。", reveal:"Class: repeat or verify each group’s sentence.", teacherCue:"Invite a representative; the group may speak together if needed.", accent:"amber" },
      { label:"Remember", title:"What did we learn about the class?", japanese:`クラスでは、${one}？ ${two}？`, reveal:"State one class fact in Japanese.", teacherCue:"Finish seated and calm.", accent:"violet" },
    ],
    "exit-ticket": [
      start,
      { label:"Choose", title:"Show what you understand", japanese:sentence("＿＿＿"), options:[`Use ${one}`,`Use ${two}`,"Write your own"], teacherCue:"Students choose one achievable route.", accent:"blue" },
      { label:"Think", title:"Quiet writing time", japanese:"一人(ひとり)で書(か)きましょう。", timerSeconds:120, reveal:`Helpful frame: ${sentence("＿＿＿")}。`, teacherCue:"Do not help for the first 30 seconds; this is evidence of independent understanding.", accent:"coral" },
      { label:"Check", title:"Have you shown success?", options:["Clear meaning","One target word","Target pattern attempted"], japanese:"できましたか。", reveal:"Fix one thing, then submit.", teacherCue:"Use the three checks as success criteria, not a mark scheme.", accent:"green" },
    ],
  };

  return decks[activity.activityId ?? "question-ladder"] ?? decks["question-ladder"];
}

export default function PresentationPortal({ activity, onClose }: Props) {
  const portalRef = useRef<HTMLDivElement>(null);
  const slides = useMemo(() => buildSlides(activity), [activity]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [notes, setNotes] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [seconds, setSeconds] = useState(slides[0]?.timerSeconds ?? 0);
  const [running, setRunning] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [characterName, setCharacterName] = useState("さくら");
  const [storyChoices, setStoryChoices] = useState<Record<string, string>>({});
  const slide = slides[index];

  const storyJapanese = useMemo(() => {
    const character = storyChoices.character ?? "ロボット";
    const want = storyChoices.want ?? cleanList(activity.targetVocabulary ?? "")[0] ?? "学校";
    const problem = storyChoices.problem ?? "お金(かね)がない";
    const action = storyChoices.action ?? "友達(ともだち)に聞(き)きます";
    const name = characterName.trim() || "さくら";
    const completeProblem = problem.endsWith("がない")
      ? problem.replace(/がない$/, "がありません")
      : problem.endsWith("がいる")
        ? problem.replace(/がいる$/, "がいます")
        : problem;
    if (slide.storySentence === "character") return `主人公(しゅじんこう)は、${character}です。`;
    if (slide.storySentence === "want") return `${name}は、${want}がほしいです。`;
    if (slide.storySentence === "problem") return `でも、${completeProblem}。`;
    if (slide.storySentence === "action") return `それで、${name}は、${action}。`;
    if (slide.storySentence === "check") return `${name}は、${want}がほしいです。`;
    if (slide.storySentence === "full") return [
      `主人公(しゅじんこう)は、${character}です。名前(なまえ)は、${name}です。`,
      `${name}は、${want}がほしいです。`,
      `でも、${completeProblem}。`,
      `それで、${name}は、${action}。`,
    ].join("\n");
    return slide.japanese ?? "";
  }, [activity.targetVocabulary, characterName, slide.japanese, slide.storySentence, storyChoices]);

  const go = useCallback((next: number) => {
    const safe = Math.max(0, Math.min(slides.length - 1, next));
    setIndex(safe);
    setRevealed(false);
    setSelectedOption(null);
    setRunning(false);
    setSeconds(slides[safe]?.timerSeconds ?? 0);
  }, [slides]);

  useEffect(() => {
    const keys = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") go(index + 1);
      if (event.key === "ArrowLeft") go(index - 1);
      if (event.key === " " && slide.reveal) { event.preventDefault(); setRevealed((value) => !value); }
      if (event.key.toLowerCase() === "n") setNotes((value) => !value);
      if (event.key === "Escape" && !document.fullscreenElement) onClose();
    };
    window.addEventListener("keydown", keys);
    return () => window.removeEventListener("keydown", keys);
  }, [go, index, slide.reveal, slides.length, onClose]);

  useEffect(() => {
    if (!running || seconds <= 0) return;
    const timer = window.setInterval(() => setSeconds((value) => {
      if (value <= 1) { setRunning(false); return 0; }
      return value - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [running, seconds]);

  useEffect(() => {
    const changed = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", changed);
    return () => document.removeEventListener("fullscreenchange", changed);
  }, []);

  const toggleFullscreen = async () => {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await portalRef.current?.requestFullscreen();
  };

  const minutes = Math.floor(seconds / 60);
  const remaining = String(seconds % 60).padStart(2, "0");

  return (
    <div className="presentation-portal" ref={portalRef} role="dialog" aria-modal="true" aria-label={`${activity.title} classroom presentation`}>
      <header className="present-topbar">
        <div className="present-brand"><span className="live-dot"/><strong>{activity.title}</strong><small>Classroom mode</small></div>
        <div className="present-tools">
          <button onClick={() => setNotes(!notes)} aria-pressed={notes}><StickyNote size={18}/><span>Teacher cue</span></button>
          <button onClick={toggleFullscreen}>{fullscreen ? <Minimize2 size={18}/> : <Maximize2 size={18}/>}<span>{fullscreen ? "Exit full screen" : "Full screen"}</span></button>
          <button onClick={onClose} aria-label="Close classroom mode"><X size={20}/></button>
        </div>
      </header>

      <div className={`slide-stage accent-${slide.accent ?? "coral"}`}>
        <div className="slide-number">{String(index + 1).padStart(2, "0")} <span>/ {String(slides.length).padStart(2, "0")}</span></div>
        <article className="class-slide">
          <p className="slide-label">{slide.label}</p>
          <h1>{slide.title}</h1>
          {slide.lead && <p className="slide-lead">{slide.lead}</p>}
          {(slide.japanese || slide.storySentence) && (slide.storySummary
            ? <div className="story-summary" aria-label="Complete class story">{storyJapanese.split("\n").map((line, lineIndex)=><p key={`${lineIndex}-${line}`}><span aria-hidden="true">{lineIndex + 1}</span><FuriganaText value={line}/></p>)}</div>
            : <div className="slide-japanese"><FuriganaText value={storyJapanese}/></div>)}
          {slide.nameEntry && <label className="character-name-field"><span>Character name</span><input value={characterName} onChange={(event) => setCharacterName(event.target.value)} placeholder="さくら" autoFocus/><small>Use hiragana or katakana so every student can read it.</small></label>}
          {slide.options && <div className={`slide-options ${slide.options.length > 3 ? "compact" : ""}`}>
            {slide.options.map((option, optionIndex) => {
              const emoji = emojiForVocabulary(option);
              return <button key={option} className={selectedOption === optionIndex ? "selected" : ""} onClick={() => { setSelectedOption(optionIndex); if (slide.storyChoice) setStoryChoices((current) => ({ ...current, [slide.storyChoice as string]: option })); }}>
                <span className="option-letter">{String.fromCharCode(65 + optionIndex)}</span>
                <span className="option-copy"><FuriganaText value={option}/>{emoji && <span className="choice-emoji" aria-hidden="true">{emoji}</span>}</span>
                {selectedOption === optionIndex && <Check size={20}/>} 
              </button>;
            })}
          </div>}
          {slide.timerSeconds && <div className={`slide-timer ${seconds === 0 ? "finished" : ""}`}><Clock3 size={25}/><strong>{minutes}:{remaining}</strong><button onClick={() => setRunning(!running)}>{running ? "Pause" : seconds === 0 ? "Finished" : "Start"}</button><button onClick={() => { setRunning(false); setSeconds(slide.timerSeconds ?? 0); }} aria-label="Reset timer"><RotateCcw size={18}/></button></div>}
          {slide.reveal && <div className={revealed ? "slide-reveal visible" : "slide-reveal"}><span>{revealed ? <Eye size={18}/> : <EyeOff size={18}/>}</span><p>{revealed ? <FuriganaText value={slide.reveal}/> : "Response hidden"}</p></div>}
        </article>
        {notes && slide.teacherCue && <aside className="speaker-note"><StickyNote size={16}/><p><strong>Teacher cue</strong>{slide.teacherCue}</p></aside>}
      </div>

      <footer className="present-controls">
        <button className="nav-control" onClick={() => go(index - 1)} disabled={index === 0}><ArrowLeft size={20}/><span>Previous</span></button>
        <div className="progress-track" aria-label={`Slide ${index + 1} of ${slides.length}`}><span style={{ width: `${((index + 1) / slides.length) * 100}%` }}/></div>
        <div className="center-controls">
          {slide.reveal && <button className="reveal-control" onClick={() => setRevealed(!revealed)}>{revealed ? <EyeOff size={18}/> : <Eye size={18}/>} {revealed ? "Hide response" : "Reveal response"}</button>}
          {!slide.reveal && <span className="participation-hint"><UsersRound size={17}/> Wait for everyone</span>}
        </div>
        <button className="nav-control next" onClick={() => index === slides.length - 1 ? onClose() : go(index + 1)}><span>{index === slides.length - 1 ? "Finish" : "Next"}</span><ArrowRight size={20}/></button>
      </footer>
    </div>
  );
}
