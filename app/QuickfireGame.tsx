"use client";

import {
  ArrowRight,
  BookOpenText,
  Eye,
  Flame,
  Languages,
  RotateCcw,
  Type,
  Volume2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { VocabularyGroup } from "./wordPacks";
import {
  cleanJapaneseWord,
  quickfireSentenceBank,
  vocabularyEnglish,
  type QuickfireSentence,
} from "./quickfireData";

type Props = {
  packId: string;
  packName: string;
  groups: VocabularyGroup[];
  patterns: string[];
  onClose: () => void;
};

type PromptLanguage = "english" | "japanese";
type Challenge = "word" | "sentence";
type QuickfirePrompt = {
  key: string;
  japanese: string;
  english: string;
  challenge: Challenge;
};

const sentenceStarter = (english: string) => /^[aeiou]/i.test(english) ? "an" : "a";

function choosePrompt(pool: QuickfirePrompt[], previousKey = "") {
  const choices = pool.filter((prompt) => prompt.key !== previousKey);
  const available = choices.length ? choices : pool;
  return available[Math.floor(Math.random() * available.length)] ?? {
    key:"fallback",
    japanese:"にほんご",
    english:"Japanese",
    challenge:"word" as const,
  };
}

function buildSentenceFallback(groups: VocabularyGroup[]): QuickfireSentence[] {
  return groups.flatMap((group) => group.items.map((value) => {
    const japanese = cleanJapaneseWord(value);
    const english = vocabularyEnglish[value] ?? value;
    if (group.id === "nouns") {
      return {
        japanese:`これは${japanese}です。`,
        english:`This is ${sentenceStarter(english)} ${english}.`,
        needs:[value],
      };
    }
    if (group.id === "adjectives") return {japanese:`${japanese}です。`,english:`It is ${english}.`,needs:[value]};
    if (group.id === "verbs") return {japanese:`${japanese}。`,english:`I ${english}.`,needs:[value]};
    return {japanese:`${japanese}です。`,english:`It is ${english}.`,needs:[value]};
  }));
}

export default function QuickfireGame({ packId, packName, groups, patterns, onClose }: Props) {
  const [phase,setPhase]=useState<"setup"|"playing">("setup");
  const [promptLanguage,setPromptLanguage]=useState<PromptLanguage>("english");
  const [round,setRound]=useState(1);
  const [revealed,setRevealed]=useState(false);

  const vocabulary=useMemo(()=>groups.flatMap((group)=>group.items),[groups]);
  const wordPrompts=useMemo<QuickfirePrompt[]>(()=>vocabulary.map((value)=>({
    key:`word-${value}`,
    japanese:cleanJapaneseWord(value),
    english:vocabularyEnglish[value]??value,
    challenge:"word",
  })),[vocabulary]);
  const sentencePrompts=useMemo<QuickfirePrompt[]>(()=>{
    const selected=new Set([...vocabulary,...patterns]);
    const curated=(quickfireSentenceBank[packId]??[]).filter((sentence)=>sentence.needs.every((need)=>selected.has(need)));
    const source=curated.length?curated:buildSentenceFallback(groups);
    return source.map((sentence,index)=>({
      key:`sentence-${sentence.japanese}-${index}`,
      japanese:sentence.japanese,
      english:sentence.english,
      challenge:"sentence",
    }));
  },[packId,groups,patterns,vocabulary]);
  const [prompt,setPrompt]=useState<QuickfirePrompt>(()=>choosePrompt(wordPrompts));

  const startGame=()=>{
    setRound(1);
    setPrompt(choosePrompt(wordPrompts));
    setRevealed(false);
    setPhase("playing");
  };

  const nextRound=(challenge:Challenge)=>{
    const pool=challenge==="word"?wordPrompts:sentencePrompts;
    setPrompt(choosePrompt(pool,prompt.key));
    setRound((value)=>value+1);
    setRevealed(false);
  };

  const restartPrompt=()=>setRevealed(false);
  const promptText=promptLanguage==="english"?prompt.english:prompt.japanese;
  const answerText=promptLanguage==="english"?prompt.japanese:prompt.english;
  const answerLabel=promptLanguage==="english"?"JAPANESE ANSWER":"MATCHING MEANING";

  return <div className="qf-portal" role="dialog" aria-modal="true" aria-label="Quickfire classroom game">
    <header className="qf-topbar">
      <div className="qf-brand"><span aria-hidden="true"><Flame size={25}/></span><div><strong>Quickfire</strong><small>{packName} · {vocabulary.length} selected words</small></div></div>
      <div className="qf-top-actions">{phase==="playing"&&<button type="button" onClick={()=>setPhase("setup")}><BookOpenText size={17}/><span>Rules</span></button>}<button type="button" className="qf-close" onClick={onClose} aria-label="Close Quickfire"><X size={21}/></button></div>
    </header>

    {phase==="setup"&&<main className="qf-setup-stage">
      <section className="qf-start-panel" aria-labelledby="qf-title">
        <div className="qf-start-copy"><p>LISTENING GAME · FAST RECALL</p><h1 id="qf-title">Be first. Answer fast. Move forward!</h1><span>Quickfire turns your selected Word Pack into short, energetic retrieval rounds.</span><div className="qf-classroom-line"><Volume2 size={19}/><strong>Teacher reads the prompt aloud.</strong></div></div>
        <ol className="qf-rules">
          <li><b>1</b><div><strong>Stand at the back</strong><span>All students begin at the back of the classroom.</span></div></li>
          <li><b>2</b><div><strong>Listen to the prompt</strong><span>The teacher reads the word or sentence on screen.</span></div></li>
          <li><b>3</b><div><strong>Answer in Japanese</strong><span>The first student to answer correctly wins the round.</span></div></li>
          <li><b>4</b><div><strong>Move towards the front</strong><span>The winner advances one step. First to the front wins.</span></div></li>
        </ol>
        <fieldset className="qf-language-choice"><legend>Prompt language</legend><button type="button" className={promptLanguage==="english"?"selected":""} aria-pressed={promptLanguage==="english"} onClick={()=>setPromptLanguage("english")}><span>EN</span><div><strong>English → Japanese</strong><small>Students produce the Japanese answer</small></div></button><button type="button" className={promptLanguage==="japanese"?"selected":""} aria-pressed={promptLanguage==="japanese"} onClick={()=>setPromptLanguage("japanese")}><span>日</span><div><strong>Japanese prompt</strong><small>Students pronounce it quickly and accurately</small></div></button></fieldset>
        <button type="button" className="qf-start" onClick={startGame}><Flame size={20}/> Start Quickfire <ArrowRight size={20}/></button>
      </section>
    </main>}

    {phase==="playing"&&<main className="qf-game-stage">
      <section className="qf-round-bar" aria-label={`Round ${round}`}>
        <div><small>QUICKFIRE ROUND</small><strong>Round {round}</strong></div>
        <span className={`qf-challenge qf-${prompt.challenge}`}>{prompt.challenge==="word"?<Type size={16}/>:<BookOpenText size={16}/>} {prompt.challenge} challenge</span>
        <span className="qf-direction"><Languages size={16}/>{promptLanguage==="english"?"English → Japanese":"Japanese prompt"}</span>
      </section>

      <section className="qf-prompt-card" aria-live="polite">
        <p>TEACHER PROMPT · SAY THIS ALOUD</p>
        <h1 className={prompt.challenge==="sentence"?"sentence":""}>{promptText}</h1>
        <span>First correct Japanese response wins this round.</span>
        <div className={`qf-answer ${revealed?"revealed":""}`} aria-live="polite">
          {revealed?<><small>{answerLabel}</small><strong>{answerText}</strong></>:<button type="button" onClick={()=>setRevealed(true)}><Eye size={22}/> Reveal answer</button>}
        </div>
      </section>

      <section className="qf-round-controls">
        <div className="qf-next-copy"><small>START ANOTHER ROUND</small><strong>Choose the next challenge</strong><span>Use a word for speed, or a sentence for a harder round.</span></div>
        <div className="qf-next-actions"><button type="button" onClick={()=>nextRound("word")}><Type size={19}/><span><small>NEXT</small>Word</span></button><button type="button" className="sentence" onClick={()=>nextRound("sentence")}><BookOpenText size={19}/><span><small>NEXT</small>Sentence</span></button></div>
        <button type="button" className="qf-reset" onClick={restartPrompt} aria-label="Hide the answer and restart this prompt"><RotateCcw size={18}/><span>Restart prompt</span></button>
      </section>
    </main>}
  </div>;
}
