"use client";

import {
  ArrowRight,
  BookOpenText,
  Eraser,
  Eye,
  EyeOff,
  MousePointer2,
  Pilcrow,
  RefreshCw,
  RotateCcw,
  Shuffle,
  WholeWord,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { VocabularyGroup } from "./wordPacks";

type Props = {
  packId: string;
  packName: string;
  groups: VocabularyGroup[];
  patterns: string[];
  onClose: () => void;
};

type EraseMode = "random" | "teacher" | "particles" | "verbs" | "reverse";
type ChunkRole = "time" | "person" | "place" | "detail" | "verb";
type ChunkPart = { text:string; particle?:boolean };
type SentenceChunk = { role:ChunkRole; parts:ChunkPart[] };
type EraseSentence = { key:string; needs:string[]; chunks:SentenceChunk[] };

const text = (value:string):ChunkPart => ({text:value});
const particle = (value:string):ChunkPart => ({text:value,particle:true});
const chunk = (role:ChunkRole,...parts:Array<ChunkPart|string>):SentenceChunk => ({
  role,
  parts:parts.map((part)=>typeof part==="string"?text(part):part),
});
const sentence = (key:string,needs:string[],...chunks:SentenceChunk[]):EraseSentence => ({key,needs,chunks});

const eraseSentenceBank:Record<string,EraseSentence[]> = {
  "iitomo2-ch1":[
    sentence("ch1-early",["まい日","はやく","おきます"],chunk("time","まいにち"),chunk("detail","はやく"),chunk("verb","おきます")),
    sentence("ch1-tea",["(お)ちゃ","のみます"],chunk("detail","おちゃ",particle("を")),chunk("verb","のみます")),
    sentence("ch1-home",["学校","うち","かえります"],chunk("place","がっこう",particle("から")),chunk("place","うち",particle("に")),chunk("verb","かえります")),
    sentence("ch1-club",["ぶかつ","おわります"],chunk("detail","ぶかつ",particle("が")),chunk("verb","おわります")),
    sentence("ch1-bath",["ばんごはん","(お)ふろ","はいります"],chunk("time","ばんごはん",particle("の"),"あと"),chunk("place","おふろ",particle("に")),chunk("verb","はいります")),
    sentence("ch1-sleep",["しゅくだい","ねます"],chunk("time","しゅくだい",particle("の"),"あと"),chunk("verb","ねます")),
  ],
  "iitomo2-ch2":[
    sentence("ch2-maths",["すう学","むずかしい"],chunk("detail","すうがく",particle("は")),chunk("detail","むずかしいです")),
    sentence("ch2-music",["おんがく","かもく"],chunk("detail","おんがく",particle("は")),chunk("detail","すきなかもくです")),
    sentence("ch2-clean",["きょう","そうじ","そうじ(を)します"],chunk("time","きょう"),chunk("detail","そうじ",particle("を")),chunk("verb","します")),
    sentence("ch2-pe",["たいいく","にがて(な)"],chunk("detail","たいいく",particle("は")),chunk("detail","にがてです")),
    sentence("ch2-school",["高校","まで"],chunk("place","こうこう",particle("は")),chunk("time","さんじ",particle("まで")),chunk("detail","です")),
    sentence("ch2-history",["れきし","つまらない"],chunk("detail","れきし",particle("は")),chunk("detail","つまらないです")),
  ],
  "iitomo2-ch3":[
    sentence("ch3-trip",["えんそく","バス"],chunk("place","えんそく",particle("に")),chunk("detail","バス",particle("で")),chunk("verb","いきます")),
    sentence("ch3-summer",["なつやすみ","ひこうき"],chunk("time","なつやすみ",particle("に")),chunk("detail","ひこうき",particle("で")),chunk("verb","いきます")),
    sentence("ch3-festival",["ぶんかさい","ミュージカル"],chunk("place","ぶんかさい",particle("で")),chunk("detail","ミュージカル",particle("を")),chunk("verb","みます")),
    sentence("ch3-schooltrip",["しゅう学りょこう","しんかんせん"],chunk("place","しゅうがくりょこう",particle("に")),chunk("detail","しんかんせん",particle("で")),chunk("verb","いきます")),
    sentence("ch3-spring",["はる（春）","にゅう学しき"],chunk("time","はる",particle("に")),chunk("detail","にゅうがくしき",particle("が")),chunk("verb","あります")),
    sentence("ch3-winter",["ふゆやすみ","でんしゃ"],chunk("time","ふゆやすみ",particle("に")),chunk("detail","でんしゃ",particle("で")),chunk("verb","いきます")),
  ],
  "iitomo2-ch4":[
    sentence("ch4-cook",["しゅうまつに","りょうり"],chunk("time","しゅうまつ",particle("に")),chunk("detail","りょうり",particle("を")),chunk("verb","します")),
    sentence("ch4-photo",["うみ","しゃしんをとります"],chunk("place","うみ",particle("で")),chunk("detail","しゃしん",particle("を")),chunk("verb","とります")),
    sentence("ch4-read",["ひまな時に","どくしょ"],chunk("time","ひまなとき",particle("に")),chunk("detail","どくしょ",particle("を")),chunk("verb","します")),
    sentence("ch4-walk",["山","さんぽします"],chunk("place","やま",particle("で")),chunk("verb","さんぽします")),
    sentence("ch4-sing",["あした","へや","うたいます"],chunk("time","あした"),chunk("place","へや",particle("で")),chunk("verb","うたいます")),
    sentence("ch4-beach",["ビーチ","たくさん","しゃしんをとります"],chunk("place","ビーチ",particle("で")),chunk("detail","たくさん"),chunk("detail","しゃしん",particle("を")),chunk("verb","とります")),
  ],
  "iitomo2-ch5":[
    sentence("ch5-tall",["キャラクター","せがたかい"],chunk("detail","このキャラクター",particle("は")),chunk("detail","せ",particle("が")),chunk("detail","たかいです")),
    sentence("ch5-hair",["キャラクター","かみ(の毛)","ながい"],chunk("detail","このキャラクター",particle("は")),chunk("detail","かみのけ",particle("が")),chunk("detail","ながいです")),
    sentence("ch5-tail",["キャラクター","しっぽ","みじかい"],chunk("detail","このキャラクター",particle("は")),chunk("detail","しっぽ",particle("が")),chunk("detail","みじかいです")),
    sentence("ch5-strong",["キャラクター","つよい"],chunk("detail","このキャラクター",particle("は")),chunk("detail","つよいです")),
    sentence("ch5-cosplay",["先しゅう","コスプレ","ふく","きます"],chunk("time","せんしゅう"),chunk("detail","コスプレ",particle("の"),"ふく",particle("を")),chunk("verb","きました")),
    sentence("ch5-anime",["まい年","アニメ","コスプレ"],chunk("time","まいとし"),chunk("detail","アニメ",particle("の"),"コスプレ",particle("を")),chunk("verb","します")),
  ],
  "iitomo2-ch6":[
    sentence("ch6-fireworks",["みんなで","はなび"],chunk("person","みんな",particle("で")),chunk("detail","はなび",particle("を")),chunk("verb","みました")),
    sentence("ch6-food",["パーティー","たこやき"],chunk("place","パーティー",particle("で")),chunk("detail","たこやき",particle("を")),chunk("verb","たべました")),
    sentence("ch6-celebrate",["かぞくみんなで","(お)いわいします"],chunk("person","かぞくみんな",particle("で")),chunk("verb","おいわいしました")),
    sentence("ch6-gift",["プレゼント","ギフトカード","もらいます"],chunk("detail","プレゼント",particle("に")),chunk("detail","ギフトカード",particle("を")),chunk("verb","もらいました")),
    sentence("ch6-yukata",["ゆかた","はなび"],chunk("detail","ゆかた",particle("を")),chunk("time","はなび",particle("の"),"よる",particle("に")),chunk("verb","きました")),
    sentence("ch6-karaoke",["みんなで","カラオケ"],chunk("person","みんな",particle("で")),chunk("place","カラオケ",particle("に")),chunk("verb","いきました")),
  ],
};

const kanaOverrides:Record<string,string> = {
  "学校":"がっこう","小学校":"しょうがっこう","中学校":"ちゅうがっこう","高校":"こうこう","大学":"だいがく","すう学":"すうがく","自己紹介":"じこしょうかい",
  "はる（春）":"はる","なつ（夏）":"なつ","あき（秋）":"あき","ふゆ（冬）":"ふゆ","一がつ":"いちがつ","二がつ":"にがつ","三がつ":"さんがつ","にゅう学しき":"にゅうがくしき","水えいたいかい":"すいえいたいかい","しゅう学りょこう":"しゅうがくりょこう",
  "山":"やま","川":"かわ","天気":"てんき","きょ年":"きょねん","手":"て","耳":"みみ","目":"め","先しゅう":"せんしゅう","まい年":"まいとし","おとこの人":"おとこのひと","おんなの人":"おんなのひと",
};
const kanaWord = (value:string) => (kanaOverrides[value]??value)
  .replace(/^\(お\)/,"お")
  .replace(/^\(あさ\)/,"あさ")
  .replace(/^\(で\)/,"")
  .replace(/\(な\)/g,"")
  .replace(/かみ\(の毛\)/g,"かみのけ");

const modeDetails:{id:EraseMode;label:string;description:string;icon:typeof Shuffle}[] = [
  {id:"random",label:"Random erase",description:"Gamify chooses a whole chunk",icon:Shuffle},
  {id:"teacher",label:"Teacher chooses",description:"Click any chunk to hide or restore it",icon:MousePointer2},
  {id:"particles",label:"Particles only",description:"Remove は・が・を・に・で and more",icon:Pilcrow},
  {id:"verbs",label:"Verbs only",description:"Hide the action or sentence ending",icon:WholeWord},
  {id:"reverse",label:"Reverse reveal",description:"Begin blank and reveal one chunk at a time",icon:Eye},
];

function chooseSentence(pool:EraseSentence[],previousKey=""){
  const different=pool.filter((item)=>item.key!==previousKey);
  const choices=different.length?different:pool;
  return choices[Math.floor(Math.random()*choices.length)]??sentence("fallback",[],chunk("detail","にほんご"),chunk("detail",particle("を")),chunk("verb","よみます"));
}

const chunkText = (value:SentenceChunk) => value.parts.map((part)=>part.text).join("");
const particleKeys = (value:EraseSentence) => value.chunks.flatMap((sentenceChunk,chunkIndex)=>sentenceChunk.parts.flatMap((part,partIndex)=>part.particle?[`${chunkIndex}-${partIndex}`]:[]));
const verbIndexes = (value:EraseSentence) => value.chunks.flatMap((sentenceChunk,index)=>sentenceChunk.role==="verb"?[index]:[]);

export default function EraseGame({packId,packName,groups,patterns,onClose}:Props){
  const [phase,setPhase]=useState<"setup"|"playing">("setup");
  const [mode,setMode]=useState<EraseMode>("random");
  const [round,setRound]=useState(1);
  const [hiddenChunks,setHiddenChunks]=useState<Set<number>>(()=>new Set());
  const [hiddenParticles,setHiddenParticles]=useState<Set<string>>(()=>new Set());
  const [actions,setActions]=useState(0);
  const vocabulary=useMemo(()=>groups.flatMap((group)=>group.items),[groups]);
  const selected=useMemo(()=>new Set([...vocabulary,...patterns]),[vocabulary,patterns]);
  const fallbackSentences=useMemo<EraseSentence[]>(()=>vocabulary.map((value,index)=>sentence(
    `fallback-${index}-${value}`,[value],chunk("detail","これ",particle("は")),chunk("detail",kanaWord(value)),chunk("detail","です"),
  )),[vocabulary]);
  const sentences=useMemo(()=>{
    const curated=(eraseSentenceBank[packId]??[]).filter((item)=>item.needs.every((need)=>selected.has(need)));
    return curated.length?curated:fallbackSentences;
  },[fallbackSentences,packId,selected]);
  const [current,setCurrent]=useState<EraseSentence>(()=>chooseSentence(sentences));

  const poolForMode=(nextMode:EraseMode)=>{
    if(nextMode==="verbs"){
      const verbSentences=sentences.filter((item)=>verbIndexes(item).length>0);
      return verbSentences.length?verbSentences:sentences;
    }
    if(nextMode==="particles"){
      const particleSentences=sentences.filter((item)=>particleKeys(item).length>0);
      return particleSentences.length?particleSentences:sentences;
    }
    return sentences;
  };

  const resetBoard=(nextMode:EraseMode,nextSentence=current)=>{
    setHiddenChunks(nextMode==="reverse"?new Set(nextSentence.chunks.map((_,index)=>index)):new Set());
    setHiddenParticles(new Set());
    setActions(0);
  };

  const startGame=()=>{
    const next=chooseSentence(poolForMode(mode));
    setCurrent(next);
    setRound(1);
    resetBoard(mode,next);
    setPhase("playing");
  };

  const changeMode=(nextMode:EraseMode)=>{
    const pool=poolForMode(nextMode);
    const next=(nextMode==="verbs"&&verbIndexes(current).length===0)||(nextMode==="particles"&&particleKeys(current).length===0)?chooseSentence(pool,current.key):current;
    setMode(nextMode);
    setCurrent(next);
    resetBoard(nextMode,next);
  };

  const nextStep=()=>{
    if(mode==="random"){
      const available=current.chunks.map((_,index)=>index).filter((index)=>!hiddenChunks.has(index));
      if(!available.length)return;
      const target=available[Math.floor(Math.random()*available.length)];
      setHiddenChunks((values)=>new Set([...values,target]));
    }
    if(mode==="particles"){
      const available=particleKeys(current).filter((key)=>!hiddenParticles.has(key));
      if(!available.length)return;
      const target=available[Math.floor(Math.random()*available.length)];
      setHiddenParticles((values)=>new Set([...values,target]));
    }
    if(mode==="verbs"){
      const available=verbIndexes(current).filter((index)=>!hiddenChunks.has(index));
      if(!available.length)return;
      const target=available[Math.floor(Math.random()*available.length)];
      setHiddenChunks((values)=>new Set([...values,target]));
    }
    if(mode==="reverse"){
      const available=Array.from(hiddenChunks);
      if(!available.length)return;
      const target=available[Math.floor(Math.random()*available.length)];
      setHiddenChunks((values)=>{const next=new Set(values);next.delete(target);return next;});
    }
    setActions((value)=>value+1);
  };

  const toggleTeacherChunk=(index:number)=>{
    if(mode!=="teacher")return;
    setHiddenChunks((values)=>{
      const next=new Set(values);
      if(next.has(index))next.delete(index);else next.add(index);
      return next;
    });
    setActions((value)=>value+1);
  };

  const newSentence=()=>{
    const next=chooseSentence(poolForMode(mode),current.key);
    setCurrent(next);
    setRound((value)=>value+1);
    resetBoard(mode,next);
  };

  const relevantTotal=mode==="particles"?particleKeys(current).length:mode==="verbs"?verbIndexes(current).length:current.chunks.length;
  const relevantHidden=mode==="particles"?hiddenParticles.size:mode==="verbs"?verbIndexes(current).filter((index)=>hiddenChunks.has(index)).length:hiddenChunks.size;
  const complete=mode==="reverse"?hiddenChunks.size===0:relevantTotal>0&&relevantHidden>=relevantTotal;
  const progressValue=mode==="reverse"?current.chunks.length-hiddenChunks.size:relevantHidden;
  const progressLabel=mode==="reverse"?`${progressValue}/${current.chunks.length} revealed`:`${progressValue}/${relevantTotal} erased`;
  const actionLabel=mode==="reverse"?(actions===0?"Reveal one":"Reveal another"):mode==="particles"?(actions===0?"Erase a particle":"Erase another particle"):mode==="verbs"?"Erase a verb":actions===0?"Erase one":"Erase another";

  return <div className="eg-portal" role="dialog" aria-modal="true" aria-label="Erase Game classroom activity">
    <header className="eg-topbar">
      <div className="eg-brand"><span aria-hidden="true"><Eraser size={25}/></span><div><strong>Erase Game</strong><small>{packName} · sentence memory</small></div></div>
      <div className="eg-top-actions">{phase==="playing"&&<button type="button" onClick={()=>setPhase("setup")}><BookOpenText size={17}/><span>Rules</span></button>}<button type="button" className="eg-close" onClick={onClose} aria-label="Close Erase Game"><X size={21}/></button></div>
    </header>

    {phase==="setup"&&<main className="eg-setup-stage"><section className="eg-start-panel" aria-labelledby="eg-title">
      <div className="eg-start-copy"><p>INPUT BY READING · MEMORY BUILDER</p><h1 id="eg-title">Read it. Erase it. Say it from memory!</h1><span>Gamify creates a logical, mostly-kana sentence from the selected Word Pack and breaks it into readable chunks.</span><div className="eg-kana-note"><BookOpenText size={19}/><strong>All-kana display keeps the reading accessible.</strong></div></div>
      <ol className="eg-rules">
        <li><b>1</b><div><strong>Read together</strong><span>Students read the complete sentence aloud as a class.</span></div></li>
        <li><b>2</b><div><strong>Erase one part</strong><span>Press Erase one, or choose a chunk yourself.</span></div></li>
        <li><b>3</b><div><strong>Say the whole sentence</strong><span>Students still reproduce every missing chunk.</span></div></li>
        <li><b>4</b><div><strong>Keep going</strong><span>Continue until students can say it completely from memory.</span></div></li>
      </ol>
      <fieldset className="eg-mode-choice"><legend>Erase mode</legend>{modeDetails.map((option)=>{const Icon=option.icon;return <button type="button" key={option.id} className={mode===option.id?"selected":""} aria-pressed={mode===option.id} onClick={()=>setMode(option.id)}><span><Icon size={18}/></span><div><strong>{option.label}</strong><small>{option.description}</small></div></button>;})}</fieldset>
      <button type="button" className="eg-start" onClick={startGame}><Eraser size={20}/> Start Erase Game <ArrowRight size={20}/></button>
    </section></main>}

    {phase==="playing"&&<main className="eg-game-stage">
      <section className="eg-round-bar"><div><small>READING ROUND</small><strong>Round {round}</strong></div><span>{progressLabel}</span><button type="button" onClick={()=>resetBoard(mode)}><RotateCcw size={17}/> Reset sentence</button></section>
      <nav className="eg-mode-bar" aria-label="Erase mode">{modeDetails.map((option)=>{const Icon=option.icon;return <button type="button" key={option.id} className={mode===option.id?"selected":""} aria-pressed={mode===option.id} onClick={()=>changeMode(option.id)}><Icon size={16}/><span>{option.label}</span></button>;})}</nav>

      <section className="eg-board">
        <div className="eg-board-heading"><p>SENTENCE BUILDER</p><h1>{mode==="reverse"&&actions===0?"Can you rebuild the sentence?":actions===0?"Read the complete sentence together.":complete&&mode!=="reverse"?"Can you say the whole sentence?":"Keep the whole sentence in your memory."}</h1><span>{mode==="teacher"?"Click any chunk to hide or restore it.":mode==="reverse"?"Reveal the chunks, but keep predicting the complete sentence.":"Students say every chunk, including the missing ones."}</span></div>
        <div className="eg-sentence-builder" aria-live="polite">
          {current.chunks.map((sentenceChunk,chunkIndex)=>{
            const isHidden=hiddenChunks.has(chunkIndex);
            const content=isHidden?<span className="eg-blank" aria-label="erased chunk">{"_".repeat(Math.max(4,Math.min(9,chunkText(sentenceChunk).length)))}</span>:<>{sentenceChunk.parts.map((part,partIndex)=>{const key=`${chunkIndex}-${partIndex}`;return part.particle&&hiddenParticles.has(key)?<span className="eg-particle-blank" aria-label="erased particle" key={key}>{"_".repeat(part.text.length)}</span>:<span className={part.particle?"eg-particle":""} key={key}>{part.text}</span>;})}</>;
            return <div className="eg-chunk-wrap" key={`${current.key}-${chunkIndex}`}>{mode==="teacher"?<button type="button" className={`eg-chunk ${isHidden?"hidden":""}`} aria-pressed={isHidden} aria-label={`${isHidden?"Restore":"Erase"} chunk ${chunkIndex+1}`} onClick={()=>toggleTeacherChunk(chunkIndex)}>{content}</button>:<span className={`eg-chunk ${isHidden?"hidden":""}`}>{content}</span>}{chunkIndex<current.chunks.length-1&&<i aria-hidden="true"/>}</div>;
          })}
        </div>
        {complete&&<div className={`eg-complete-note ${mode==="reverse"?"reverse":""}`}>{mode==="reverse"?<Eye size={20}/>:<EyeOff size={20}/>}<strong>{mode==="reverse"?"The full sentence is back!":"Now say every missing part from memory!"}</strong></div>}
      </section>

      <section className="eg-controls"><div><small>CLASS PROMPT</small><strong>{mode==="teacher"?"Choose the next chunk on the board.":actionLabel}</strong><span>After every change, read the complete sentence again.</span></div>{mode!=="teacher"&&<button type="button" className="eg-main-action" onClick={nextStep} disabled={complete}>{mode==="reverse"?<Eye size={20}/>:<Eraser size={20}/>} {complete?(mode==="reverse"?"Fully revealed":"All erased"):actionLabel}</button>}<button type="button" className="eg-new-sentence" onClick={newSentence}><RefreshCw size={19}/><span><small>START ANOTHER ROUND</small>New sentence</span></button></section>
    </main>}
  </div>;
}
