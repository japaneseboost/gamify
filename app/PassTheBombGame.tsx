"use client";

import {
  Eye,
  Languages,
  RotateCcw,
  Shuffle,
  SkipForward,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cleanJapaneseWord, vocabularyEnglish } from "./quickfireData";

type Props = {
  items: string[];
  packName: string;
  onClose: () => void;
};

type PromptLanguage = "english" | "japanese";
type FuseState = "idle" | "running" | "exploded";

function chooseWord(items:string[],previous=""){
  const alternatives=items.filter((item)=>item!==previous);
  const source=alternatives.length?alternatives:items;
  return source[Math.floor(Math.random()*source.length)]??"にほんご";
}

function playTick(context:AudioContext){
  const now=context.currentTime;
  const oscillator=context.createOscillator();
  const gain=context.createGain();
  oscillator.type="square";
  oscillator.frequency.setValueAtTime(920,now);
  oscillator.frequency.exponentialRampToValueAtTime(520,now+.055);
  gain.gain.setValueAtTime(.0001,now);
  gain.gain.exponentialRampToValueAtTime(.075,now+.006);
  gain.gain.exponentialRampToValueAtTime(.0001,now+.07);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now+.075);
}

function playExplosion(context:AudioContext){
  const now=context.currentTime;
  const length=Math.floor(context.sampleRate*1.15);
  const buffer=context.createBuffer(1,length,context.sampleRate);
  const channel=buffer.getChannelData(0);
  for(let index=0;index<length;index+=1){
    const decay=Math.pow(1-index/length,2.4);
    channel[index]=(Math.random()*2-1)*decay;
  }
  const noise=context.createBufferSource();
  const filter=context.createBiquadFilter();
  const noiseGain=context.createGain();
  noise.buffer=buffer;
  filter.type="lowpass";
  filter.frequency.setValueAtTime(1100,now);
  filter.frequency.exponentialRampToValueAtTime(120,now+1.05);
  noiseGain.gain.setValueAtTime(.58,now);
  noiseGain.gain.exponentialRampToValueAtTime(.0001,now+1.12);
  noise.connect(filter).connect(noiseGain).connect(context.destination);

  const boom=context.createOscillator();
  const boomGain=context.createGain();
  boom.type="sine";
  boom.frequency.setValueAtTime(115,now);
  boom.frequency.exponentialRampToValueAtTime(36,now+.8);
  boomGain.gain.setValueAtTime(.42,now);
  boomGain.gain.exponentialRampToValueAtTime(.0001,now+.9);
  boom.connect(boomGain).connect(context.destination);
  noise.start(now);
  boom.start(now);
  boom.stop(now+.92);
}

export default function PassTheBombGame({items,packName,onClose}:Props){
  const pool=useMemo(()=>Array.from(new Set(items)),[items]);
  const [word,setWord]=useState(()=>chooseWord(pool));
  const [round,setRound]=useState(1);
  const [promptLanguage,setPromptLanguage]=useState<PromptLanguage>("english");
  const [answerVisible,setAnswerVisible]=useState(false);
  const [fuseState,setFuseState]=useState<FuseState>("idle");
  const [fuseDuration,setFuseDuration]=useState(60000);
  const [elapsedMs,setElapsedMs]=useState(0);
  const [soundEnabled,setSoundEnabled]=useState(true);
  const audioRef=useRef<AudioContext|null>(null);

  const getAudio=()=>{
    if(!audioRef.current)audioRef.current=new AudioContext();
    if(audioRef.current.state==="suspended")void audioRef.current.resume();
    return audioRef.current;
  };

  useEffect(()=>()=>{void audioRef.current?.close();},[]);

  useEffect(()=>{
    if(fuseState!=="running")return;
    const startedAt=performance.now()-elapsedMs;
    let lastTick=Math.floor(elapsedMs/1000);
    const interval=window.setInterval(()=>{
      const nextElapsed=performance.now()-startedAt;
      const tick=Math.floor(nextElapsed/1000);
      if(tick>lastTick){
        lastTick=tick;
        if(soundEnabled)playTick(getAudio());
      }
      if(nextElapsed>=fuseDuration){
        window.clearInterval(interval);
        setElapsedMs(fuseDuration);
        setFuseState("exploded");
        if(soundEnabled)playExplosion(getAudio());
        return;
      }
      setElapsedMs(nextElapsed);
    },100);
    return()=>window.clearInterval(interval);
    // The effect restarts only when fuse controls change, preserving elapsed time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[fuseState,fuseDuration,soundEnabled]);

  const startFuse=(newRound=false)=>{
    if(soundEnabled){const audio=getAudio();playTick(audio);}
    if(newRound)setRound((current)=>current+1);
    setFuseDuration((45+Math.floor(Math.random()*46))*1000);
    setElapsedMs(0);
    setAnswerVisible(false);
    setWord((current)=>chooseWord(pool,current));
    setFuseState("running");
  };

  const resetRound=()=>{
    setFuseState("idle");
    setElapsedMs(0);
    setAnswerVisible(false);
  };

  const nextWord=()=>{
    setWord((current)=>chooseWord(pool,current));
    setAnswerVisible(false);
  };

  const japanese=cleanJapaneseWord(word);
  const english=vocabularyEnglish[word]??"Selected Word Pack item";
  const prompt=promptLanguage==="english"?english:japanese;
  const answer=promptLanguage==="english"?japanese:english;
  const progress=Math.max(0,Math.min(100,(elapsedMs/fuseDuration)*100));

  return <div className="ptb-portal" role="dialog" aria-modal="true" aria-label="Pass the Bomb classroom game">
    <header className="ptb-topbar">
      <div className="ptb-brand"><span aria-hidden="true"><span className="ptb-mini-bomb"/></span><div><strong>Pass the Bomb</strong><small>{packName}</small></div></div>
      <div className="ptb-top-actions"><button type="button" onClick={()=>setSoundEnabled((current)=>!current)} aria-pressed={soundEnabled} aria-label={soundEnabled?"Mute sound effects":"Turn on sound effects"}>{soundEnabled?<Volume2 size={19}/>:<VolumeX size={19}/>}<span>{soundEnabled?"Sound on":"Sound off"}</span></button><button type="button" className="ptb-close" onClick={onClose} aria-label="Close Pass the Bomb"><X size={21}/></button></div>
    </header>

    <main className="ptb-board">
      <section className="ptb-round-strip">
        <div><small>PASS THE BOMB</small><strong>Round {round}</strong></div>
        <p><span aria-hidden="true"/>Say the answer, pass the bomb, then show the next player a new prompt.</p>
        <span className={`ptb-fuse-status ${fuseState}`}>{fuseState==="running"?"Fuse burning":fuseState==="exploded"?"Bomb exploded":"Fuse unlit"}</span>
      </section>

      <section className="ptb-game-grid">
        <article className={`ptb-bomb-card ${fuseState}`}>
          <div className="ptb-fuse-range"><small>RANDOM FUSE</small><strong>0:45–1:30</strong><span>The exact explosion time is hidden.</span></div>
          <div className="ptb-bomb-scene" aria-live="assertive">
            {fuseState==="exploded"?<div className="ptb-explosion" role="status"><i/><i/><i/><strong>BOOM!</strong><span>The player holding the bomb loses this round.</span></div>:<div className="ptb-bomb" aria-label={fuseState==="running"?"Bomb fuse is burning":"Bomb fuse is not lit"}><div className="ptb-fuse"><i/></div><div className="ptb-bomb-cap"/><div className="ptb-bomb-body"><span/></div><div className="ptb-bomb-shadow"/></div>}
          </div>
          <div className="ptb-fuse-track" aria-hidden="true"><span style={{width:`${progress}%`}}/></div>
          <p className="ptb-bomb-message">{fuseState==="running"?"Keep answering and passing — listen to the ticking!":fuseState==="exploded"?"Round over. Start a fresh random fuse when ready.":"The fuse will choose a new random time every round."}</p>
          {fuseState==="idle"&&<button type="button" className="ptb-light" onClick={()=>startFuse(false)}><span aria-hidden="true"/> Light the fuse</button>}
          {fuseState==="exploded"&&<button type="button" className="ptb-light" onClick={()=>startFuse(true)}><RotateCcw size={20}/> Start next round</button>}
          {fuseState==="running"&&<button type="button" className="ptb-abort" onClick={resetRound}><RotateCcw size={18}/> Reset round</button>}
        </article>

        <article className="ptb-prompt-card">
          <header><small>WORD PACK PROMPT</small><h1>Answer, then pass!</h1><p>Each player answers before handing the imaginary bomb to the next person.</p></header>
          <div className="ptb-language-toggle" aria-label="Prompt language"><button type="button" className={promptLanguage==="english"?"selected":""} aria-pressed={promptLanguage==="english"} onClick={()=>{setPromptLanguage("english");setAnswerVisible(false);}}>EN → 日</button><button type="button" className={promptLanguage==="japanese"?"selected":""} aria-pressed={promptLanguage==="japanese"} onClick={()=>{setPromptLanguage("japanese");setAnswerVisible(false);}}>日 → EN</button></div>
          <div className="ptb-prompt" aria-live="polite"><small>{promptLanguage==="english"?"SAY IT IN JAPANESE":"SAY THE MEANING"}</small><strong lang={promptLanguage==="japanese"?"ja":"en"}>{prompt}</strong></div>
          <div className={`ptb-answer ${answerVisible?"revealed":""}`}>{answerVisible?<><small>ANSWER</small><strong lang={promptLanguage==="english"?"ja":"en"}>{answer}</strong></>:<button type="button" onClick={()=>setAnswerVisible(true)}><Eye size={20}/> Reveal answer</button>}</div>
          <button type="button" className="ptb-next-word" onClick={nextWord}><Shuffle size={19}/><span><small>CORRECT — PASS IT</small>Next word</span><SkipForward size={19}/></button>
        </article>
      </section>
    </main>
  </div>;
}
