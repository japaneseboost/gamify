"use client";

import {
  ArrowRight,
  BookOpenText,
  Dice3,
  Eye,
  Flag,
  Languages,
  Mountain,
  RotateCcw,
  Shuffle,
  Star,
  Trophy,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { cleanJapaneseWord, vocabularyEnglish } from "./quickfireData";

type Props = {
  items: string[];
  packName: string;
  onClose: () => void;
};

type TeamId = "a" | "b";
type PromptLanguage = "english" | "japanese";
type Phase = "setup" | "playing" | "finished";

type Prompt = {
  key: string;
  japanese: string;
  english: string;
};

const FALLBACK_PROMPT: Prompt = { key: "fallback", japanese: "にほんご", english: "Japanese" };
const sleep = (duration: number) => new Promise((resolve) => window.setTimeout(resolve, duration));
const otherTeam = (team: TeamId): TeamId => team === "a" ? "b" : "a";
const teamName = (team: TeamId) => team === "a" ? "Team A" : "Team B";

function choosePrompt(pool: Prompt[], previousKey = "") {
  const choices = pool.filter((prompt) => prompt.key !== previousKey);
  const available = choices.length ? choices : pool;
  return available[Math.floor(Math.random() * available.length)] ?? FALLBACK_PROMPT;
}

const dieDots: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
};

function VolcanoDie({ value, rolling }: { value: number; rolling: boolean }) {
  const faces = [1, 2, 3, 1, 2, 3];
  return <span className="vg-die-scene" role="img" aria-label={`Three-range die showing ${value}`}>
    <span className={`vg-die-cube value-${value} ${rolling ? "rolling" : ""}`}>
      {faces.map((faceValue, faceIndex) => {
        const visible = new Set(dieDots[faceValue]);
        return <span className={`vg-die-face face-${faceIndex + 1}`} aria-hidden="true" key={`${faceValue}-${faceIndex}`}>
          {Array.from({ length: 9 }, (_, index) => <i className={visible.has(index) ? "visible" : ""} key={index}/>) }
        </span>;
      })}
    </span>
  </span>;
}

function Climber({ team, danger }: { team: TeamId; danger: boolean }) {
  const shirtId = `vg-shirt-${team}`;
  const skinId = `vg-skin-${team}`;
  return <svg className="vg-climber-art" viewBox="0 0 100 142" aria-hidden="true">
    <defs>
      <radialGradient id={skinId} cx="34%" cy="24%" r="78%">
        <stop offset="0" stopColor="#ffddc3"/><stop offset="0.62" stopColor="#efa978"/><stop offset="1" stopColor="#c97854"/>
      </radialGradient>
      <linearGradient id={shirtId} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={team === "a" ? "#75d9f2" : "#ff9ebd"}/>
        <stop offset="0.58" stopColor={team === "a" ? "#329fd0" : "#e45884"}/>
        <stop offset="1" stopColor={team === "a" ? "#17668f" : "#9f2e52"}/>
      </linearGradient>
    </defs>
    <ellipse className="vg-climber-shadow" cx="51" cy="134" rx="30" ry="6"/>
    <path className="vg-backpack" d="M27 66c-8 5-10 27-3 41l15-3V70Z"/>
    <circle className="vg-climber-ear" fill={`url(#${skinId})`} cx="29" cy="42" r="6"/><circle className="vg-climber-ear" fill={`url(#${skinId})`} cx="72" cy="42" r="6"/>
    <ellipse className="vg-climber-head" fill={`url(#${skinId})`} cx="51" cy="41" rx="22" ry="24"/>
    <path className="vg-climber-hair" d="M30 38c0-17 9-27 23-27 13 0 22 8 24 22-10-7-19-8-28-3-7 4-12 7-19 8Z"/>
    <path className={`vg-climber-brow ${danger ? "danger" : ""}`} d={danger ? "M38 38l8-4M57 34l8 4" : "M38 37l8 1M57 38l8-1"}/>
    <ellipse className="vg-climber-eye" cx="43" cy="43" rx="2.4" ry="3"/><ellipse className="vg-climber-eye" cx="60" cy="43" rx="2.4" ry="3"/>
    <path className="vg-climber-mouth" d={danger ? "M44 54c5-4 10-4 15 0" : "M45 53h13"}/>
    <path className="vg-climber-neck" fill={`url(#${skinId})`} d="M45 60h13v11H45Z"/>
    <path className={`vg-climber-shirt team-${team}`} fill={`url(#${shirtId})`} d="M33 69c10-8 27-8 37 0l-3 38H36Z"/>
    <path className="vg-climber-strap" d="M37 70 51 92 66 70M39 91h25"/>
    <path className="vg-climber-arm" fill={`url(#${skinId})`} d="M35 72c-8 5-14 13-16 23l8 4 15-20ZM68 72c8 5 13 13 15 23l-8 4-14-20Z"/>
    <circle className="vg-climber-hand" fill={`url(#${skinId})`} cx="23" cy="97" r="5.5"/><circle className="vg-climber-hand" fill={`url(#${skinId})`} cx="79" cy="97" r="5.5"/>
    <path className="vg-climber-shorts" d="M36 104h31l4 16-15 1-5-11-5 11-15-1Z"/>
    <path className="vg-climber-leg" fill={`url(#${skinId})`} d="m35 117 12 2-5 16-10-2ZM56 119l12-2 4 16-10 2Z"/>
    <path className="vg-climber-boot" d="m31 130 13 3-1 6H23c1-5 3-7 8-9ZM63 133l11-3c5 2 7 4 8 9H62Z"/>
  </svg>;
}

function VolcanoArt() {
  return <svg className="vg-volcano-art" viewBox="0 0 320 210" aria-hidden="true">
    <defs>
      <linearGradient id="vg-rock" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#6d4450"/><stop offset=".55" stopColor="#422d3a"/><stop offset="1" stopColor="#261f2c"/></linearGradient>
      <linearGradient id="vg-lava" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff08b"/><stop offset=".36" stopColor="#ff9b35"/><stop offset="1" stopColor="#e53525"/></linearGradient>
      <radialGradient id="vg-glow"><stop offset="0" stopColor="#ffcc4e" stopOpacity=".8"/><stop offset="1" stopColor="#ef3928" stopOpacity="0"/></radialGradient>
    </defs>
    <ellipse className="vg-volcano-glow" cx="160" cy="178" rx="130" ry="48" fill="url(#vg-glow)"/>
    <path className="vg-volcano-mountain" fill="url(#vg-rock)" d="M15 204 74 118l39-24 20-52h55l20 52 40 25 57 85Z"/>
    <path className="vg-volcano-ridge" d="m33 193 64-71 29-12 20-56M288 193l-64-71-30-12-20-56"/>
    <ellipse className="vg-crater-rim" cx="160" cy="48" rx="36" ry="15"/>
    <ellipse className="vg-crater-lava" cx="160" cy="49" rx="27" ry="10" fill="url(#vg-lava)"/>
    <path className="vg-lava-flow" fill="url(#vg-lava)" d="M145 53c2 24-9 43-2 67 5 18 3 40-9 81h52c-13-33-14-61-7-83 7-24-6-41-4-65Z"/>
    <path className="vg-lava-highlight" d="M153 58c1 28-4 51 0 72 3 16 0 36-5 58M167 61c-3 22 3 39 1 59-2 18 3 35 5 58"/>
    <g className="vg-lava-bubbles"><circle cx="147" cy="39" r="5"/><circle cx="163" cy="27" r="7"/><circle cx="178" cy="38" r="4"/><circle cx="156" cy="14" r="3.5"/></g>
  </svg>;
}

function ClimbField({ team, position, moving, falling, winner }: { team: TeamId; position: number; moving: boolean; falling: boolean; winner: boolean }) {
  const climberX = position === 0 ? 5 : 6 + (position - 1) * 7.05;
  const climberY = position === 0 ? 3 : 8 + (position - 1) * 6.25;
  const climberStyle = { "--vg-climber-x": `${climberX}%`, "--vg-climber-y": `${climberY}%` } as CSSProperties;
  return <section className={`vg-climb team-${team} ${moving ? "moving" : ""} ${falling ? "falling" : ""} ${winner ? "winner" : ""}`} aria-label={`${teamName(team)} is on step ${position}`}>
    <header><div><Flag size={18} aria-hidden="true"/><strong>{teamName(team)}</strong></div><span><b>{position}</b><small>/12</small></span></header>
    <div className="vg-cliff">
      <span className="vg-summit-label"><Mountain size={15}/><b>SUMMIT 12</b></span>
      <div className="vg-mountain-face" aria-hidden="true"/>
      <div className="vg-steps" aria-hidden="true">
        {Array.from({ length: 12 }, (_, index) => {
          const step = index + 1;
          const style = { "--vg-step-x": `${index * 7.05}%`, "--vg-step-y": `${index * 6.25}%` } as CSSProperties;
          return <span className={`${step === position ? "current" : step < position ? "passed" : ""} ${step === 10 ? "win-step" : ""}`.trim()} style={style} key={step}><b>{step}</b>{step === 10 && <Star size={14} fill="currentColor"/>}</span>;
        })}
      </div>
      <div className="vg-climber" style={climberStyle}><Climber team={team} danger={position >= 10}/></div>
      {falling && <div className="vg-fall-trail" aria-hidden="true"><i/><i/><i/></div>}
    </div>
    <footer><span><i style={{ width: `${(position / 12) * 100}%` }}/></span><b>{position === 12 ? "Standing on the summit!" : position >= 10 ? "Safe win unlocked — stop or climb" : position === 0 ? "Ready at the base" : `${10 - position} ${10 - position === 1 ? "step" : "steps"} to the safe-win star`}</b></footer>
  </section>;
}

export default function VolcanoGame({ items, packName, onClose }: Props) {
  const prompts = useMemo<Prompt[]>(() => items.map((value) => ({ key: value, japanese: cleanJapaneseWord(value), english: vocabularyEnglish[value] ?? value })), [items]);
  const [phase, setPhase] = useState<Phase>("setup");
  const [promptLanguage, setPromptLanguage] = useState<PromptLanguage>("english");
  const [prompt, setPrompt] = useState<Prompt>(() => choosePrompt(prompts));
  const [positions, setPositions] = useState<Record<TeamId, number>>({ a: 0, b: 0 });
  const [selectedTeam, setSelectedTeam] = useState<TeamId | null>(null);
  const [dieValue, setDieValue] = useState(1);
  const [rolling, setRolling] = useState(false);
  const [movingTeam, setMovingTeam] = useState<TeamId | null>(null);
  const [fallingTeam, setFallingTeam] = useState<TeamId | null>(null);
  const [winner, setWinner] = useState<TeamId | null>(null);
  const [winReason, setWinReason] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("Choose the team that answered correctly.");
  const audioRef = useRef<AudioContext | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (audioRef.current && audioRef.current.state !== "closed") void audioRef.current.close();
    };
  }, []);

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (rulesOpen) setRulesOpen(false);
      else onClose();
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [onClose, rulesOpen]);

  const getAudioContext = () => {
    if (!soundEnabled) return null;
    if (audioRef.current) {
      if (audioRef.current.state === "suspended") void audioRef.current.resume();
      return audioRef.current;
    }
    const AudioConstructor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioConstructor) return null;
    audioRef.current = new AudioConstructor();
    return audioRef.current;
  };

  const playTone = (frequency: number, duration = 0.09, volume = 0.035, type: OscillatorType = "sine") => {
    const context = getAudioContext();
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(55, frequency * 0.78), context.currentTime + duration);
    gain.gain.setValueAtTime(volume, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration);
  };

  const playRumble = () => {
    const context = getAudioContext();
    if (!context) return;
    const length = Math.floor(context.sampleRate * 0.85);
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < length; index += 1) data[index] = (Math.random() * 2 - 1) * (1 - index / length);
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(260, context.currentTime);
    filter.frequency.exponentialRampToValueAtTime(75, context.currentTime + 0.8);
    gain.gain.setValueAtTime(0.08, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.85);
    source.buffer = buffer;
    source.connect(filter).connect(gain).connect(context.destination);
    source.start();
  };

  const resetGame = () => {
    setPrompt(choosePrompt(prompts));
    setPositions({ a: 0, b: 0 });
    setSelectedTeam(null);
    setDieValue(1);
    setRolling(false);
    setMovingTeam(null);
    setFallingTeam(null);
    setWinner(null);
    setWinReason("");
    setRevealed(false);
    setAnnouncement("Choose the team that answered correctly.");
  };

  const startGame = () => {
    resetGame();
    setPhase("playing");
    playTone(392, 0.1, 0.035, "triangle");
    window.setTimeout(() => playTone(587, 0.16, 0.04, "triangle"), 100);
  };

  const selectTeam = (team: TeamId) => {
    if (rolling || winner) return;
    setSelectedTeam(team);
    setAnnouncement(`${teamName(team)} answered correctly. Roll the 1–3 die.`);
    playTone(team === "a" ? 349 : 415, 0.08, 0.025, "triangle");
  };

  const completeWin = (team: TeamId, reason: string) => {
    setWinner(team);
    setWinReason(reason);
    setPhase("finished");
    setRolling(false);
    setMovingTeam(null);
    setAnnouncement(`${teamName(team)} wins!`);
    playTone(523, 0.16, 0.045, "triangle");
    window.setTimeout(() => playTone(659, 0.18, 0.045, "triangle"), 130);
    window.setTimeout(() => playTone(784, 0.3, 0.05, "triangle"), 270);
  };

  const rollDie = async () => {
    if (!selectedTeam || rolling || winner) return;
    const team = selectedTeam;
    const startingPosition = positions[team];
    setRolling(true);
    setRevealed(false);
    setAnnouncement(`Rolling for ${teamName(team)}…`);
    for (let tick = 0; tick < 9; tick += 1) {
      if (!mountedRef.current) return;
      setDieValue(1 + Math.floor(Math.random() * 3));
      playTone(240 + tick * 28, 0.04, 0.017, "square");
      await sleep(65 + tick * 4);
    }
    const result = 1 + Math.floor(Math.random() * 3);
    if (!mountedRef.current) return;
    setDieValue(result);
    setMovingTeam(team);
    setAnnouncement(`${teamName(team)} rolled ${result}. Climb!`);
    playTone(640, 0.13, 0.04, "triangle");
    await sleep(240);

    const target = startingPosition + result;
    for (let step = startingPosition + 1; step <= Math.min(target, 12); step += 1) {
      if (!mountedRef.current) return;
      setPositions((current) => ({ ...current, [team]: step }));
      playTone(340 + step * 23, 0.1, 0.032, "sine");
      await sleep(410);
    }

    if (target > 12) {
      setFallingTeam(team);
      setMovingTeam(null);
      setAnnouncement(`${teamName(team)} went past 12 and fell into the lava!`);
      playRumble();
      await sleep(1150);
      if (!mountedRef.current) return;
      completeWin(otherTeam(team), `${teamName(team)} overshot the summit and fell into the lava.`);
      return;
    }

    if (target === 12) {
      await sleep(420);
      if (!mountedRef.current) return;
      completeWin(team, `${teamName(team)} landed exactly on step 12.`);
      return;
    }

    setRolling(false);
    setMovingTeam(null);
    setSelectedTeam(null);
    setPrompt((current) => choosePrompt(prompts, current.key));
    setAnnouncement("Next prompt ready. Choose the correct team.");
  };

  const nextPrompt = () => {
    if (rolling || winner) return;
    setPrompt((current) => choosePrompt(prompts, current.key));
    setRevealed(false);
    setSelectedTeam(null);
    setAnnouncement("New prompt ready.");
    playTone(520, 0.08, 0.024, "triangle");
  };

  const claimVictory = (team: TeamId) => {
    if (rolling || winner || positions[team] < 10) return;
    completeWin(team, `${teamName(team)} stopped safely on step ${positions[team]} and claimed the win.`);
  };

  const playAgain = () => {
    resetGame();
    setPhase("playing");
  };

  const promptText = promptLanguage === "english" ? prompt.english : prompt.japanese;
  const answerText = promptLanguage === "english" ? prompt.japanese : prompt.english;
  const promptDirection = promptLanguage === "english" ? "English → Japanese" : "Japanese → English";
  const busy = rolling || Boolean(movingTeam) || Boolean(fallingTeam);

  return <div className={`vg-portal ${fallingTeam ? "is-erupting" : ""}`} role="dialog" aria-modal="true" aria-label="Volcano classroom game">
    <header className="vg-topbar">
      <div className="vg-brand"><span aria-hidden="true"><Mountain size={27}/></span><div><strong>Volcano</strong><small>{packName} · 1–3 climbing die</small></div></div>
      <div className="vg-top-actions">
        {phase !== "setup" && <button type="button" onClick={() => setRulesOpen(true)}><BookOpenText size={18}/><span>Rules</span></button>}
        <button type="button" aria-pressed={soundEnabled} onClick={() => setSoundEnabled((value) => !value)} aria-label={`${soundEnabled ? "Mute" : "Turn on"} game sounds`}>{soundEnabled ? <Volume2 size={19}/> : <VolumeX size={19}/>}<span>{soundEnabled ? "Sound on" : "Sound off"}</span></button>
        <button type="button" className="vg-close" onClick={onClose} aria-label="Close Volcano"><X size={22}/></button>
      </div>
    </header>

    {phase === "setup" && <main className="vg-setup-stage">
      <section className="vg-start-panel" aria-labelledby="vg-start-title">
        <div className="vg-start-hero">
          <div className="vg-mini-volcano" aria-hidden="true"><i/><i/><i/><span className="mini-climber-a"/><span className="mini-climber-b"/></div>
          <p>RETRIEVAL GAME · 2-TEAM RACE</p>
          <h1 id="vg-start-title">Climb high—but don&apos;t fall into the lava!</h1>
          <span>Race to answer, roll 1–3, and climb. From the starred step 10, stop and claim victory—or risk climbing higher. Go past 12 and fall into the lava.</span>
        </div>
        <ol className="vg-rules">
          <li><b>1</b><div><strong>Race to answer</strong><span>The first team with the correct answer earns the roll.</span></div></li>
          <li><b>2</b><div><strong>Select the correct team</strong><span>The answering team earns the roll.</span></div></li>
          <li><b>3</b><div><strong>Roll the 1–3 die</strong><span>The climber moves up that many steps.</span></div></li>
          <li><b>4</b><div><strong>Stop or take the risk</strong><span>From the starred step 10, claim victory or keep climbing. Go past 12 and lose.</span></div></li>
        </ol>
        <div className="vg-setup-options vg-prompt-only">
          <fieldset><legend>Prompt language</legend><div className="vg-choice-row">
            <button type="button" className={promptLanguage === "english" ? "selected" : ""} aria-pressed={promptLanguage === "english"} onClick={() => setPromptLanguage("english")}><span className="vg-language-mark">EN</span><span><strong>English</strong><small>Answer in Japanese</small></span></button>
            <button type="button" className={promptLanguage === "japanese" ? "selected" : ""} aria-pressed={promptLanguage === "japanese"} onClick={() => setPromptLanguage("japanese")}><span className="vg-language-mark">日</span><span><strong>Japanese</strong><small>Give the English meaning</small></span></button>
          </div></fieldset>
        </div>
        <button type="button" className="vg-start" onClick={startGame} disabled={prompts.length === 0}><Mountain size={22}/> Start Volcano <ArrowRight size={20}/></button>
      </section>
    </main>}

    {phase !== "setup" && <main className="vg-game-stage">
      <section className="vg-prompt-strip" aria-live="polite">
        <div className="vg-prompt-context"><small>Both teams race to answer</small><span><Languages size={15}/>{promptDirection}</span></div>
        <div className="vg-prompt-copy"><p>CLASS PROMPT</p><h1>{promptText}</h1>{revealed && <strong>{answerText}</strong>}</div>
        <div className="vg-prompt-actions"><button type="button" onClick={() => setRevealed((value) => !value)} disabled={busy}>{revealed ? <><Eye size={17}/> Hide answer</> : <><Eye size={17}/> Reveal answer</>}</button><button type="button" onClick={nextPrompt} disabled={busy}><Shuffle size={17}/> New prompt</button></div>
      </section>

      <section className="vg-arena">
        <ClimbField team="a" position={positions.a} moving={movingTeam === "a"} falling={fallingTeam === "a"} winner={winner === "a"}/>

        <section className="vg-control-core" aria-labelledby="vg-control-title">
          <div className="vg-control-heading"><small>TEACHER CONTROLS</small><h2 id="vg-control-title">Who answered correctly?</h2><p>Choose the fastest correct team.</p></div>
          <div className="vg-team-buttons">
            <button type="button" className={`team-a ${selectedTeam === "a" ? "selected" : ""}`} aria-pressed={selectedTeam === "a"} onClick={() => selectTeam("a")} disabled={busy || Boolean(winner)}><span>A</span><strong>Team A correct</strong></button>
            <button type="button" className={`team-b ${selectedTeam === "b" ? "selected" : ""}`} aria-pressed={selectedTeam === "b"} onClick={() => selectTeam("b")} disabled={busy || Boolean(winner)}><span>B</span><strong>Team B correct</strong></button>
          </div>
          <div className={`vg-die-zone ${selectedTeam ? `target-${selectedTeam}` : ""}`}>
            <span className="vg-die-label">{rolling ? "ROLLING 1–3…" : selectedTeam ? `${teamName(selectedTeam)} CLIMBS` : "SELECT A TEAM"}</span>
            <VolcanoDie value={dieValue} rolling={rolling}/>
            <strong className="vg-die-result">{rolling ? "?" : dieValue}</strong>
            <button type="button" className="vg-roll-button" onClick={rollDie} disabled={!selectedTeam || busy || Boolean(winner)}><Dice3 size={21}/>{rolling ? "Rolling…" : "Roll & climb"}</button>
          </div>
          <div className="vg-next-step" aria-live="polite"><Mountain size={16}/><span>{announcement}</span></div>
          <div className="vg-claim-zone" aria-live="polite">
            {positions.a < 10 && positions.b < 10 ? (
              <p><Star size={15} fill="currentColor"/> Reach the starred step 10 to unlock a safe win.</p>
            ) : (
              <>
                <p><Star size={15} fill="currentColor"/> Safe win unlocked — stop now or risk another climb.</p>
                <div>
                  {positions.a >= 10 && <button type="button" className="team-a" onClick={() => claimVictory("a")} disabled={busy || Boolean(winner)}><Trophy size={15}/> Team A: stop &amp; win</button>}
                  {positions.b >= 10 && <button type="button" className="team-b" onClick={() => claimVictory("b")} disabled={busy || Boolean(winner)}><Trophy size={15}/> Team B: stop &amp; win</button>}
                </div>
              </>
            )}
          </div>
          <div className="vg-volcano-scene"><VolcanoArt/></div>
        </section>

        <ClimbField team="b" position={positions.b} moving={movingTeam === "b"} falling={fallingTeam === "b"} winner={winner === "b"}/>

        {phase === "finished" && winner && <div className="vg-winner-card" role="status">
          <span><Trophy size={39}/></span><small>VOLCANO CHAMPION</small><h2>{teamName(winner)} wins!</h2><p>{winReason}</p><div><button type="button" onClick={playAgain}><RotateCcw size={18}/> Play again</button><button type="button" onClick={() => setPhase("setup")}><BookOpenText size={18}/> Change setup</button></div>
        </div>}
      </section>
    </main>}

    {rulesOpen && <div className="vg-rules-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setRulesOpen(false); }}>
      <section className="vg-rules-dialog" role="dialog" aria-modal="true" aria-labelledby="vg-rules-title">
        <button type="button" className="vg-rules-close" onClick={() => setRulesOpen(false)} aria-label="Close game rules"><X size={20}/></button>
        <span className="vg-rules-icon" aria-hidden="true"><Mountain size={30}/></span><small>HOW TO PLAY</small><h2 id="vg-rules-title">Volcano rules</h2>
        <ol><li><b>1</b><span>Both teams race to answer the displayed English or Japanese Word Pack prompt.</span></li><li><b>2</b><span>Teacher selects the fastest correct team, then rolls the special 1–3 die.</span></li><li><b>3</b><span>The team&apos;s climber moves up by the rolled number.</span></li><li><b>4</b><span>From the starred step 10, the team may stop and win or keep climbing. Exact step 12 wins; going beyond 12 loses.</span></li></ol>
        <button type="button" className="vg-rules-done" onClick={() => setRulesOpen(false)}>Back to the game <ArrowRight size={18}/></button>
      </section>
    </div>}
  </div>;
}
