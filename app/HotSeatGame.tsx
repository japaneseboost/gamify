"use client";

import {
  CheckCircle2, CircleX, Clock3, Crown, Play, RotateCcw, SkipForward,
  UsersRound, Volume2, VolumeX, X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { cleanJapaneseWord, vocabularyEnglish } from "./quickfireData";

type Props = { items: string[]; packName: string; onClose: () => void };
type TeamId = "a" | "b";
type Phase = "setup" | "playing" | "finished";
type Action = "correct" | "wrong" | "pass" | null;

const furigana: Array<[string, string]> = [
  ["小学校", "しょうがっこう"], ["中学校", "ちゅうがっこう"], ["自己紹介", "じこしょうかい"],
  ["人気", "にんき"], ["大好き", "だいすき"], ["自然", "しぜん"], ["上げます", "あげます"],
  ["学校", "がっこう"], ["高校", "こうこう"], ["大学", "だいがく"], ["天気", "てんき"],
  ["先", "せん"], ["山", "やま"], ["川", "かわ"], ["手", "て"], ["耳", "みみ"],
  ["目", "め"], ["人", "ひと"], ["好き", "すき"],
];

function JapaneseWord({ value }: { value: string }) {
  const match = furigana.find(([kanji]) => value.includes(kanji));
  if (!match) return <>{value}</>;
  const [kanji, reading] = match;
  const index = value.indexOf(kanji);
  const parts: ReactNode[] = [];
  if (index > 0) parts.push(value.slice(0, index));
  parts.push(<ruby key={kanji}>{kanji}<rp>（</rp><rt>{reading}</rt><rp>）</rp></ruby>);
  if (index + kanji.length < value.length) parts.push(value.slice(index + kanji.length));
  return <>{parts}</>;
}

function chooseWord(pool: string[], previous = "") {
  const alternatives = pool.filter((item) => item !== previous);
  const source = alternatives.length > 0 ? alternatives : pool;
  return source[Math.floor(Math.random() * source.length)] ?? "にほんご";
}

function playTone(context: AudioContext, frequencies: number[], type: OscillatorType = "triangle") {
  const now = context.currentTime;
  frequencies.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = now + index * 0.09;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.07, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.12);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.14);
  });
}

export default function HotSeatGame({ items, packName, onClose }: Props) {
  const pool = useMemo(() => Array.from(new Set(items)), [items]);
  const [phase, setPhase] = useState<Phase>("setup");
  const [activeTeam, setActiveTeam] = useState<TeamId>("a");
  const [scores, setScores] = useState<Record<TeamId, number>>({ a: 0, b: 0 });
  const [round, setRound] = useState(1);
  const [word, setWord] = useState(() => chooseWord(pool));
  const [seconds, setSeconds] = useState(60);
  const [roundCorrect, setRoundCorrect] = useState(0);
  const [roundWrong, setRoundWrong] = useState(0);
  const [roundPassed, setRoundPassed] = useState(0);
  const [lastAction, setLastAction] = useState<Action>(null);
  const [soundOn, setSoundOn] = useState(true);
  const secondsRef = useRef(60);
  const audioRef = useRef<AudioContext | null>(null);

  const audio = () => {
    if (!audioRef.current) audioRef.current = new AudioContext();
    if (audioRef.current.state === "suspended") void audioRef.current.resume();
    return audioRef.current;
  };

  useEffect(() => () => { void audioRef.current?.close(); }, []);

  useEffect(() => {
    if (phase !== "playing") return;
    const interval = window.setInterval(() => {
      const next = Math.max(0, secondsRef.current - 1);
      secondsRef.current = next;
      setSeconds(next);
      if (soundOn && next > 0 && next <= 10) playTone(audio(), [next <= 3 ? 980 : 690], "sine");
      if (next === 0) {
        if (soundOn) playTone(audio(), [470, 360], "sawtooth");
        setPhase("finished");
      }
    }, 1000);
    return () => window.clearInterval(interval);
  }, [phase, soundOn]);

  const advanceWord = (action: Exclude<Action, null>) => {
    if (phase !== "playing") return;
    if (action === "correct") {
      setScores((current) => ({ ...current, [activeTeam]: current[activeTeam] + 1 }));
      setRoundCorrect((current) => current + 1);
      if (soundOn) playTone(audio(), [660, 880]);
    } else if (action === "wrong") {
      setRoundWrong((current) => current + 1);
      if (soundOn) playTone(audio(), [360]);
    } else {
      setRoundPassed((current) => current + 1);
      if (soundOn) playTone(audio(), [520]);
    }
    setLastAction(action);
    setWord((current) => chooseWord(pool, current));
    window.setTimeout(() => setLastAction(null), 320);
  };

  const startRound = () => {
    secondsRef.current = 60;
    setSeconds(60);
    setRoundCorrect(0);
    setRoundWrong(0);
    setRoundPassed(0);
    setLastAction(null);
    setWord((current) => chooseWord(pool, current));
    setPhase("playing");
    if (soundOn) playTone(audio(), [520, 690]);
  };

  const nextRound = () => {
    setRound((current) => current + 1);
    setActiveTeam((current) => current === "a" ? "b" : "a");
    setPhase("setup");
    setSeconds(60);
    secondsRef.current = 60;
  };

  const resetMatch = () => {
    setScores({ a: 0, b: 0 });
    setRound(1);
    setActiveTeam("a");
    setPhase("setup");
    setSeconds(60);
    secondsRef.current = 60;
  };

  const japanese = cleanJapaneseWord(word);
  const english = vocabularyEnglish[word] ?? word;
  const timerPercent = Math.max(0, Math.round((seconds / 60) * 100));

  return <div className="hs-portal" role="dialog" aria-modal="true" aria-label="Hot Seat classroom game">
    <header className="hs-topbar">
      <div className="hs-brand"><span aria-hidden="true"><UsersRound size={25}/></span><div><strong>Hot Seat</strong><small>{packName}</small></div></div>
      <div className="hs-top-actions">
        <button type="button" onClick={() => { if (!soundOn) audio(); setSoundOn((current) => !current); }} aria-pressed={soundOn} aria-label={`${soundOn ? "Mute" : "Turn on"} game sounds`}>{soundOn ? <Volume2 size={18}/> : <VolumeX size={18}/>}<span>Sound</span></button>
        <button type="button" onClick={resetMatch}><RotateCcw size={18}/><span>Reset</span></button>
        <button type="button" className="hs-close" onClick={onClose} aria-label="Close Hot Seat"><X size={20}/></button>
      </div>
    </header>

    {phase === "setup" ? <main className="hs-setup-stage">
      <section className="hs-start-panel" aria-labelledby="hs-title">
        <div className="hs-start-visual" aria-hidden="true"><div className="hs-screen-card"><strong lang="ja">買い物</strong><span>shopping</span></div><i className="hs-chair-back"/><i className="hs-student-head"/><span className="hs-clue-one">shop</span><span className="hs-clue-two">buy</span></div>
        <div className="hs-start-copy"><p>PRODUCTION BY SPEAKING · 60 SECOND CHALLENGE</p><h1 id="hs-title">Clue it.<br/>Guess it.</h1><span>One student faces away from the screen while teammates describe the displayed word without saying or spelling it.</span></div>
        <section className="hs-team-setup" aria-label="Choose the team playing this round"><small>WHO IS IN THE HOT SEAT?</small><div>{(["a", "b"] as TeamId[]).map((team) => <button type="button" key={team} className={`team-${team} ${activeTeam === team ? "selected" : ""}`} aria-pressed={activeTeam === team} onClick={() => setActiveTeam(team)}><span>TEAM {team.toUpperCase()}</span><strong>{scores[team]} points</strong></button>)}</div></section>
        <button type="button" className="hs-start" onClick={startRound}><Play size={20}/> Start 60-second round</button>
      </section>
    </main> : <main className="hs-game-stage">
      <header className="hs-roundbar">
        <div><small>HOT SEAT ROUND</small><strong>Round {round}</strong></div>
        <div className={`hs-active-team team-${activeTeam}`}><Crown size={17}/><span>Team {activeTeam.toUpperCase()} is playing</span></div>
        <div className={`hs-countdown ${seconds <= 10 ? "urgent" : ""}`} style={{ "--hs-time": `${timerPercent}%` } as React.CSSProperties} aria-live="polite"><span><Clock3 size={17}/><b>{seconds}</b><small>sec</small></span></div>
      </header>

      <section className="hs-play-area">
        <aside className="hs-clue-rules"><small>TEAMMATES</small><h2>Give useful clues</h2><ul><li>Describe where or when.</li><li>Give an example.</li><li>Use a simple sentence.</li></ul><p><CircleX size={18}/> Don&apos;t say, translate, spell, or mouth the word.</p></aside>
        <article className={`hs-word-card ${lastAction ? `flash-${lastAction}` : ""}`} aria-live="polite"><small>HELP THE HOT-SEAT STUDENT GUESS</small><h1 lang="ja"><JapaneseWord value={japanese}/></h1><span>{english}</span></article>
        <aside className="hs-scoreboard" aria-label="Team tally"><header><small>TEAM TALLY</small><strong>Correct = +1</strong></header>{(["a", "b"] as TeamId[]).map((team) => <div className={`hs-score team-${team} ${activeTeam === team ? "active" : ""}`} key={team}><span>Team {team.toUpperCase()}</span><b>{scores[team]}</b></div>)}<footer><span><b>{roundCorrect}</b> correct</span><span><b>{roundWrong}</b> wrong</span><span><b>{roundPassed}</b> passed</span></footer></aside>
      </section>

      <footer className="hs-controls"><button type="button" className="hs-pass" disabled={phase !== "playing"} onClick={() => advanceWord("pass")}><SkipForward size={20}/><span><small>NO SCORE</small>Pass</span></button><button type="button" className="hs-wrong" disabled={phase !== "playing"} onClick={() => advanceWord("wrong")}><CircleX size={20}/><span><small>NO SCORE</small>Next (wrong)</span></button><button type="button" className="hs-correct" disabled={phase !== "playing"} onClick={() => advanceWord("correct")}><CheckCircle2 size={21}/><span><small>+1 POINT</small>Next (correct)</span></button></footer>

      {phase === "finished" && <div className="hs-finished-backdrop"><section className="hs-finished-card" role="status"><span aria-hidden="true"><Clock3 size={34}/></span><small>TIME&apos;S UP</small><h2>Team {activeTeam.toUpperCase()} scored {roundCorrect}!</h2><p>{roundWrong} wrong · {roundPassed} passed</p><div><button type="button" onClick={startRound}><RotateCcw size={18}/> Same team again</button><button type="button" className="primary" onClick={nextRound}><UsersRound size={18}/> Next team</button></div></section></div>}
    </main>}
  </div>;
}
