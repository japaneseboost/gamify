"use client";

import {
  CheckCircle2,
  Eye,
  Hand,
  LockKeyhole,
  Pause,
  PencilLine,
  Play,
  RotateCcw,
  SkipForward,
  TimerReset,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cleanJapaneseWord, vocabularyEnglish } from "./quickfireData";

type Props = {
  items: string[];
  packName: string;
  onClose: () => void;
};

type ClueMode = "draw" | "act" | null;
type TimerState = "idle" | "running" | "paused" | "finished";

function chooseWord(items: string[], previous = "") {
  const alternatives=items.filter((item)=>item!==previous);
  const source=alternatives.length?alternatives:items;
  return source[Math.floor(Math.random()*source.length)]??"にほんご";
}

export default function DrawOrActGame({items,packName,onClose}:Props){
  const pool=useMemo(()=>Array.from(new Set(items)),[items]);
  const [round,setRound]=useState(1);
  const [word,setWord]=useState(()=>chooseWord(pool));
  const [mode,setMode]=useState<ClueMode>(null);
  const [duration,setDuration]=useState(30);
  const [secondsLeft,setSecondsLeft]=useState(30);
  const [timerState,setTimerState]=useState<TimerState>("idle");
  const [secretVisible,setSecretVisible]=useState(false);

  useEffect(()=>{
    if(timerState!=="running")return;
    const interval=window.setInterval(()=>setSecondsLeft((current)=>Math.max(0,current-1)),1000);
    return()=>window.clearInterval(interval);
  },[timerState]);

  useEffect(()=>{
    if(timerState==="running"&&secondsLeft===0)setTimerState("finished");
  },[secondsLeft,timerState]);

  useEffect(()=>{
    const hide=()=>setSecretVisible(false);
    window.addEventListener("blur",hide);
    document.addEventListener("visibilitychange",hide);
    return()=>{
      window.removeEventListener("blur",hide);
      document.removeEventListener("visibilitychange",hide);
    };
  },[]);

  const resetTimer=(nextDuration=duration)=>{
    setDuration(nextDuration);
    setSecondsLeft(nextDuration);
    setTimerState("idle");
  };

  const toggleTimer=()=>{
    if(timerState==="finished"){setSecondsLeft(duration);setTimerState("running");return;}
    setTimerState((current)=>current==="running"?"paused":"running");
  };

  const nextWord=()=>{
    setWord((current)=>chooseWord(pool,current));
    setRound((current)=>current+1);
    setMode(null);
    setSecretVisible(false);
    resetTimer();
  };

  const japanese=cleanJapaneseWord(word);
  const english=vocabularyEnglish[word]??"Selected Word Pack item";
  const timerPercent=Math.round((secondsLeft/duration)*100);

  return <div className="doa-portal" role="dialog" aria-modal="true" aria-label="Draw or Act classroom game">
    <header className="doa-topbar">
      <div className="doa-brand"><span aria-hidden="true"><PencilLine size={25}/></span><div><strong>Draw or Act</strong><small>{packName}</small></div></div>
      <button type="button" className="doa-close" onClick={onClose} aria-label="Close Draw or Act"><X size={21}/></button>
    </header>

    <main className="doa-board">
      <section className="doa-round-strip" aria-label={`Round ${round}`}>
        <div><small>CLASSROOM ROUND</small><strong>Round {round}</strong></div>
        <p><LockKeyhole size={17}/><span>Only the performer should look while holding the secret button.</span></p>
        <div className="doa-duration" aria-label="Countdown length">{[15,30,45].map((value)=><button type="button" key={value} className={duration===value?"selected":""} aria-pressed={duration===value} onClick={()=>resetTimer(value)}>{value}s</button>)}</div>
      </section>

      <section className="doa-play-grid">
        <article className="doa-mode-panel">
          <header><small>STEP 1</small><h1>Choose your clue</h1><p>No speaking, writing letters, or mouthing the answer.</p></header>
          <div className="doa-mode-options">
            <button type="button" className={mode==="draw"?"selected draw":"draw"} aria-pressed={mode==="draw"} onClick={()=>setMode("draw")}><span aria-hidden="true"><PencilLine size={31}/></span><strong>Draw it</strong><small>Sketch clues only</small></button>
            <button type="button" className={mode==="act"?"selected act":"act"} aria-pressed={mode==="act"} onClick={()=>setMode("act")}><span aria-hidden="true"><UserRound size={31}/></span><strong>Act it</strong><small>Use actions only</small></button>
          </div>
          <div className="doa-mode-status" aria-live="polite">{mode?<><CheckCircle2 size={18}/><span><strong>{mode==="draw"?"Drawing":"Acting"} selected.</strong> Your team guesses in Japanese.</span></>:<><Hand size={18}/><span>Performer chooses Draw or Act.</span></>}</div>
        </article>

        <article className={`doa-secret-panel ${secretVisible?"revealed":""}`}>
          <header><small>STEP 2 · PRIVATE VIEW</small><h1>Hold to see the word</h1><p>Release the button and the word hides immediately.</p></header>
          <div className="doa-secret-window" aria-live="off">
            {secretVisible?<div className="doa-secret-copy"><small>YOUR SECRET WORD</small><strong lang="ja">{japanese}</strong><span>{english}</span></div>:<div className="doa-secret-cover" aria-hidden="true"><LockKeyhole size={36}/><strong>Word hidden</strong><span>Teammates: look away</span></div>}
          </div>
          <button
            type="button"
            className="doa-secret-button"
            aria-label="Hold to reveal the secret word"
            onPointerDown={(event)=>{event.currentTarget.setPointerCapture(event.pointerId);setSecretVisible(true);}}
            onPointerUp={()=>setSecretVisible(false)}
            onPointerCancel={()=>setSecretVisible(false)}
            onLostPointerCapture={()=>setSecretVisible(false)}
            onBlur={()=>setSecretVisible(false)}
            onContextMenu={(event)=>event.preventDefault()}
            onKeyDown={(event)=>{if(event.key===" "||event.key==="Enter"){event.preventDefault();setSecretVisible(true);}}}
            onKeyUp={(event)=>{if(event.key===" "||event.key==="Enter"){event.preventDefault();setSecretVisible(false);}}}
          ><Eye size={21}/><span>{secretVisible?"Keep holding…":"Hold Secret Word"}</span></button>
        </article>

        <article className={`doa-timer-panel ${timerState==="finished"?"finished":""}`}>
          <header><small>STEP 3</small><h1>Beat the timer</h1><p>Start when the performer begins drawing or acting.</p></header>
          <div className="doa-timer" style={{"--timer-progress":`${timerPercent}%`} as React.CSSProperties} aria-live="polite"><span>{secondsLeft}</span><small>seconds</small></div>
          <div className="doa-timer-actions">
            <button type="button" className="primary" onClick={toggleTimer}>{timerState==="running"?<><Pause size={19}/> Pause</>:<><Play size={19}/> {timerState==="finished"?"Try again":"Start timer"}</>}</button>
            <button type="button" onClick={()=>resetTimer()} aria-label="Reset countdown"><TimerReset size={19}/> Reset</button>
          </div>
          <p className="doa-timer-message" aria-live="polite">{timerState==="finished"?"Time’s up — reveal or skip the word.":timerState==="running"?"Guess the word in Japanese!":timerState==="paused"?"Timer paused.":"Ready when the performer is."}</p>
        </article>
      </section>

      <footer className="doa-controls">
        <div><small>TEAM ANSWER</small><strong>Did the team guess it in Japanese?</strong></div>
        <button type="button" className="doa-skip" onClick={nextWord}><SkipForward size={19}/> Skip word</button>
        <button type="button" className="doa-correct" onClick={nextWord}><CheckCircle2 size={20}/> Correct — next word</button>
        <button type="button" className="doa-restart" onClick={()=>{setMode(null);setSecretVisible(false);resetTimer();}} aria-label="Restart this round"><RotateCcw size={18}/></button>
      </footer>
    </main>
  </div>;
}
