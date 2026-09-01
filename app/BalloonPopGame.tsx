"use client";

import {
  ArrowRight,
  BookOpenText,
  CircleDot,
  Dice5,
  Eye,
  Flag,
  Languages,
  RotateCcw,
  Shuffle,
  Swords,
  Trophy,
  UsersRound,
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
type PlayMode = "turns" | "race";
type PromptLanguage = "english" | "japanese";
type Phase = "setup" | "playing" | "finished";

type Prompt = {
  key: string;
  japanese: string;
  english: string;
};

type BalloonPosition = {
  x: number;
  y: number;
  rotation: number;
  scale: number;
};

const FALLBACK_PROMPT: Prompt = {
  key: "fallback",
  japanese: "にほんご",
  english: "Japanese",
};

const sleep = (duration: number) => new Promise((resolve) => window.setTimeout(resolve, duration));
const otherTeam = (team: TeamId): TeamId => team === "a" ? "b" : "a";
const teamName = (team: TeamId) => team === "a" ? "Team A" : "Team B";

function choosePrompt(pool: Prompt[], previousKey = "") {
  const choices = pool.filter((prompt) => prompt.key !== previousKey);
  const available = choices.length ? choices : pool;
  return available[Math.floor(Math.random() * available.length)] ?? FALLBACK_PROMPT;
}

function shuffledBalloonIds(total: number) {
  const ids = Array.from({ length: total }, (_, index) => index);
  for (let index = ids.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [ids[index], ids[target]] = [ids[target], ids[index]];
  }
  return ids;
}

function balloonLayout(total: number): BalloonPosition[] {
  const rows = total === 12 ? [4, 4, 3, 1] : total === 24 ? [6, 6, 5, 4, 2, 1] : [5, 5, 4, 3, 1];
  const positions: BalloonPosition[] = [];
  const rowGap = rows.length > 5 ? 13.2 : rows.length > 4 ? 16.2 : 20.2;

  rows.forEach((count, rowIndex) => {
    const width = Math.min(86, Math.max(22, count * 15.5));
    const start = 50 - width / 2;
    for (let column = 0; column < count; column += 1) {
      const index = positions.length;
      positions.push({
        x: count === 1 ? 50 : start + (width * column) / (count - 1),
        y: 4 + rowIndex * rowGap,
        rotation: ((index % 5) - 2) * 2.4,
        scale: 0.94 + (index % 3) * 0.035,
      });
    }
  });

  return positions.slice(0, total);
}

const dieDots: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

function DieFace({ value, rolling }: { value: number; rolling: boolean }) {
  const visible = new Set(dieDots[value] ?? dieDots[1]);
  return <span className={`bp-die ${rolling ? "rolling" : ""}`} role="img" aria-label={`Die showing ${value}`}>
    {Array.from({ length: 9 }, (_, index) => <i className={visible.has(index) ? "visible" : ""} key={index}/>) }
  </span>;
}

function Shark({ team }: { team: TeamId }) {
  return <svg className="bp-shark" viewBox="0 0 150 82" aria-hidden="true">
    <path className="bp-shark-tail" d="M35 42 6 18l7 28-7 25 30-18Z"/>
    <path className="bp-shark-body" d="M28 46c13-27 48-36 82-22 13 5 23 13 32 23-11 11-23 19-38 22-32 7-62-1-76-23Z"/>
    <path className="bp-shark-fin" d="m69 24 15-20 10 25M71 66l16 13 7-15"/>
    <path className="bp-shark-mouth" d="M115 43c8 0 16 2 23 6-8 7-16 11-25 12"/>
    <circle className="bp-shark-eye" cx="111" cy="32" r="3.3"/>
    <path className="bp-shark-gill" d="M99 40c-2 5-2 10 0 15"/>
    <path className={`bp-shark-accent team-${team}`} d="M46 49c15 9 34 12 51 9"/>
  </svg>;
}

function Rider({ team }: { team: TeamId }) {
  return <svg className="bp-rider" viewBox="0 0 90 126" aria-hidden="true">
    <path className="bp-rider-rope" d="M16 2 45 34 74 2"/>
    <circle className="bp-rider-head" cx="45" cy="48" r="12"/>
    <path className="bp-rider-body" d="M45 60v36M45 70 24 83M45 70l22 12M45 96l-17 27M45 96l18 27"/>
    <path className={`bp-rider-shirt team-${team}`} d="M32 63c8-5 18-5 26 0l-3 28H35Z"/>
  </svg>;
}

function BalloonField({
  team,
  total,
  activeIds,
  popping,
  falling,
  caught,
}: {
  team: TeamId;
  total: number;
  activeIds: number[];
  popping: { team: TeamId; id: number } | null;
  falling: TeamId | null;
  caught: TeamId | null;
}) {
  const positions = useMemo(() => balloonLayout(total), [total]);
  const active = useMemo(() => new Set(activeIds), [activeIds]);
  const state = caught === team ? "caught" : falling === team ? "falling" : "flying";

  return <section className={`bp-team-field team-${team} ${state}`} aria-label={`${teamName(team)} has ${activeIds.length} of ${total} balloons remaining`}>
    <header>
      <div><Flag size={17} aria-hidden="true"/><span>{teamName(team)}</span></div>
      <strong>{activeIds.length}<small>/{total}</small></strong>
    </header>
    <div className="bp-team-sky">
      <span className="bp-cloud cloud-one" aria-hidden="true"/><span className="bp-cloud cloud-two" aria-hidden="true"/>
      <div className="bp-balloon-cluster" aria-hidden="true">
        {positions.map((position, id) => {
          const isActive = active.has(id);
          const isPopping = popping?.team === team && popping.id === id;
          const style = {
            "--bp-x": `${position.x}%`,
            "--bp-y": `${position.y}%`,
            "--bp-rotate": `${position.rotation}deg`,
            "--bp-scale": position.scale,
            "--bp-delay": `${(id % 7) * -0.31}s`,
          } as CSSProperties;
          return <span className={`bp-balloon ${isActive ? "active" : "popped"} ${isPopping ? "popping" : ""}`} style={style} key={id}>
            <i/><b/>
          </span>;
        })}
      </div>
      <div className="bp-rider-wrap"><Rider team={team}/></div>
      <div className="bp-water" aria-hidden="true"><span/><span/></div>
      <div className="bp-shark-wrap"><Shark team={team}/></div>
      {caught === team && <div className="bp-splash" aria-hidden="true"><i/><i/><i/><i/></div>}
    </div>
    <footer><span className="bp-balloon-meter"><i style={{ width: `${(activeIds.length / total) * 100}%` }}/></span><b>{activeIds.length === 0 ? "Down in the water!" : `${activeIds.length} balloons keeping the rider safe`}</b></footer>
  </section>;
}

export default function BalloonPopGame({ items, packName, onClose }: Props) {
  const prompts = useMemo<Prompt[]>(() => items.map((value) => ({
    key: value,
    japanese: cleanJapaneseWord(value),
    english: vocabularyEnglish[value] ?? value,
  })), [items]);

  const [phase, setPhase] = useState<Phase>("setup");
  const [playMode, setPlayMode] = useState<PlayMode>("turns");
  const [promptLanguage, setPromptLanguage] = useState<PromptLanguage>("english");
  const [balloonTotal, setBalloonTotal] = useState(18);
  const [prompt, setPrompt] = useState<Prompt>(() => choosePrompt(prompts));
  const [round, setRound] = useState(1);
  const [currentTurn, setCurrentTurn] = useState<TeamId>("a");
  const [revealed, setRevealed] = useState(false);
  const [selectedLoser, setSelectedLoser] = useState<TeamId | null>(null);
  const [balloons, setBalloons] = useState<Record<TeamId, number[]>>({ a: [], b: [] });
  const [dieValue, setDieValue] = useState(1);
  const [rolling, setRolling] = useState(false);
  const [popping, setPopping] = useState<{ team: TeamId; id: number } | null>(null);
  const [falling, setFalling] = useState<TeamId | null>(null);
  const [caught, setCaught] = useState<TeamId | null>(null);
  const [winner, setWinner] = useState<TeamId | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("Choose the losing team, then roll the die.");
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

  const playTone = (frequency: number, duration = 0.08, volume = 0.035, type: OscillatorType = "sine") => {
    const context = getAudioContext();
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(48, frequency * 0.72), context.currentTime + duration);
    gain.gain.setValueAtTime(volume, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration);
  };

  const playPop = (index: number) => {
    const context = getAudioContext();
    if (!context) return;
    const length = Math.floor(context.sampleRate * 0.105);
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let sample = 0; sample < length; sample += 1) {
      const decay = 1 - sample / length;
      data[sample] = (Math.random() * 2 - 1) * decay * decay;
    }
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    filter.type = "highpass";
    filter.frequency.value = 520 + (index % 3) * 150;
    gain.gain.setValueAtTime(0.12, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.105);
    source.buffer = buffer;
    source.connect(filter).connect(gain).connect(context.destination);
    source.start();
  };

  const playSplash = () => {
    playTone(185, 0.34, 0.06, "sawtooth");
    window.setTimeout(() => playTone(92, 0.42, 0.05, "sine"), 120);
    window.setTimeout(() => playTone(310, 0.16, 0.035, "triangle"), 260);
  };

  const resetBoard = () => {
    setBalloons({ a: shuffledBalloonIds(balloonTotal), b: shuffledBalloonIds(balloonTotal) });
    setPrompt(choosePrompt(prompts));
    setRound(1);
    setCurrentTurn("a");
    setRevealed(false);
    setSelectedLoser(null);
    setDieValue(1);
    setRolling(false);
    setPopping(null);
    setFalling(null);
    setCaught(null);
    setWinner(null);
    setAnnouncement("Choose the losing team, then roll the die.");
  };

  const startGame = () => {
    resetBoard();
    playTone(440, 0.1, 0.035, "triangle");
    window.setTimeout(() => playTone(660, 0.14, 0.04, "triangle"), 90);
    setPhase("playing");
  };

  const nextPrompt = () => {
    if (rolling || winner) return;
    setPrompt((current) => choosePrompt(prompts, current.key));
    setRound((value) => value + 1);
    if (playMode === "turns") setCurrentTurn((team) => otherTeam(team));
    setRevealed(false);
    setSelectedLoser(null);
    setAnnouncement("New prompt ready. Choose the losing team after students answer.");
    playTone(520, 0.09, 0.025, "triangle");
  };

  const selectLosingTeam = (team: TeamId) => {
    if (rolling || winner) return;
    setSelectedLoser(team);
    setAnnouncement(`${teamName(team)} will lose balloons. Roll the die when ready.`);
    playTone(team === "a" ? 330 : 392, 0.09, 0.025, "sine");
  };

  const rollDie = async () => {
    if (!selectedLoser || rolling || winner) return;
    const losingTeam = selectedLoser;
    setRolling(true);
    setRevealed(false);
    setAnnouncement(`Rolling for ${teamName(losingTeam)}.`);

    for (let tick = 0; tick < 10; tick += 1) {
      if (!mountedRef.current) return;
      setDieValue(1 + Math.floor(Math.random() * 6));
      playTone(260 + tick * 22, 0.045, 0.018, "square");
      await sleep(58 + tick * 5);
    }

    const result = 1 + Math.floor(Math.random() * 6);
    if (!mountedRef.current) return;
    setDieValue(result);
    playTone(660, 0.13, 0.045, "triangle");
    await sleep(230);

    const activeIds = [...balloons[losingTeam]];
    const popCount = Math.min(result, activeIds.length);
    const poppingIds = activeIds.slice(-popCount).reverse();
    setAnnouncement(`${result}! ${teamName(losingTeam)} loses ${popCount} ${popCount === 1 ? "balloon" : "balloons"}.`);

    for (let index = 0; index < poppingIds.length; index += 1) {
      if (!mountedRef.current) return;
      const id = poppingIds[index];
      setPopping({ team: losingTeam, id });
      playPop(index);
      await sleep(175);
      setBalloons((current) => ({ ...current, [losingTeam]: current[losingTeam].filter((balloonId) => balloonId !== id) }));
      await sleep(75);
    }
    setPopping(null);

    const remaining = activeIds.length - popCount;
    if (remaining === 0) {
      setFalling(losingTeam);
      setAnnouncement(`${teamName(losingTeam)} is falling!`);
      await sleep(780);
      if (!mountedRef.current) return;
      setCaught(losingTeam);
      playSplash();
      await sleep(850);
      if (!mountedRef.current) return;
      const winningTeam = otherTeam(losingTeam);
      setWinner(winningTeam);
      setPhase("finished");
      setRolling(false);
      setAnnouncement(`${teamName(winningTeam)} wins the match!`);
      playTone(523, 0.18, 0.045, "triangle");
      window.setTimeout(() => playTone(659, 0.18, 0.045, "triangle"), 130);
      window.setTimeout(() => playTone(784, 0.32, 0.05, "triangle"), 260);
      return;
    }

    setSelectedLoser(null);
    setRolling(false);
    setRound((value) => value + 1);
    if (playMode === "turns") setCurrentTurn((team) => otherTeam(team));
    setPrompt((current) => choosePrompt(prompts, current.key));
    setAnnouncement("Next prompt ready. Listen for the correct answer.");
  };

  const playAgain = () => {
    resetBoard();
    setPhase("playing");
  };

  const promptText = promptLanguage === "english" ? prompt.english : prompt.japanese;
  const answerText = promptLanguage === "english" ? prompt.japanese : prompt.english;
  const promptDirection = promptLanguage === "english" ? "English → Japanese" : "Japanese → English";
  const turnCopy = playMode === "race" ? "Both teams race to answer" : `${teamName(currentTurn)} answers this round`;

  return <div className="bp-portal" role="dialog" aria-modal="true" aria-label="Balloon Pop classroom game">
    <header className="bp-topbar">
      <div className="bp-brand"><span aria-hidden="true"><CircleDot size={25}/></span><div><strong>Balloon Pop</strong><small>{packName} · {items.length} selected words</small></div></div>
      <div className="bp-top-actions">
        {phase !== "setup" && <button type="button" onClick={() => setRulesOpen(true)}><BookOpenText size={18} aria-hidden="true"/><span>Rules</span></button>}
        <button type="button" className="bp-sound" aria-pressed={soundEnabled} onClick={() => setSoundEnabled((value) => !value)} aria-label={`${soundEnabled ? "Mute" : "Turn on"} game sounds`}>{soundEnabled ? <Volume2 size={19}/> : <VolumeX size={19}/>}<span>{soundEnabled ? "Sound on" : "Sound off"}</span></button>
        <button type="button" className="bp-close" onClick={onClose} aria-label="Close Balloon Pop"><X size={22}/></button>
      </div>
    </header>

    {phase === "setup" && <main className="bp-setup-stage">
      <section className="bp-start-panel" aria-labelledby="bp-start-title">
        <div className="bp-start-hero">
          <div className="bp-mini-scene" aria-hidden="true"><span className="mini-a"/><span className="mini-b"/><span className="mini-c"/><span className="mini-person"/><span className="mini-wave"/></div>
          <p>SPEAKING GAME · TEAM CHALLENGE</p>
          <h1 id="bp-start-title">Answer, roll, and keep your team in the sky!</h1>
          <span>Students answer prompts from the chosen Word Pack. A correct answer earns an attack on the opposing team.</span>
        </div>

        <ol className="bp-rules">
          <li><b>1</b><div><strong>Read or hear the prompt</strong><span>Play in turns, or let both teams race to answer first.</span></div></li>
          <li><b>2</b><div><strong>Answer in the other language</strong><span>The teacher decides which team loses the round.</span></div></li>
          <li><b>3</b><div><strong>Roll the digital die</strong><span>The result pops that many balloons from the losing team.</span></div></li>
          <li><b>4</b><div><strong>Stay above the shark</strong><span>Lose every balloon and the rider falls. Last team aloft wins.</span></div></li>
        </ol>

        <div className="bp-setup-options">
          <fieldset>
            <legend>How teams answer</legend>
            <div className="bp-choice-row two">
              <button type="button" className={playMode === "turns" ? "selected" : ""} aria-pressed={playMode === "turns"} onClick={() => setPlayMode("turns")}><UsersRound size={20}/><span><strong>Take turns</strong><small>Team A, then Team B</small></span></button>
              <button type="button" className={playMode === "race" ? "selected" : ""} aria-pressed={playMode === "race"} onClick={() => setPlayMode("race")}><Swords size={20}/><span><strong>Race mode</strong><small>First correct answer wins</small></span></button>
            </div>
          </fieldset>
          <fieldset>
            <legend>Prompt language</legend>
            <div className="bp-choice-row two">
              <button type="button" className={promptLanguage === "english" ? "selected" : ""} aria-pressed={promptLanguage === "english"} onClick={() => setPromptLanguage("english")}><span className="bp-language-mark">EN</span><span><strong>English</strong><small>Answer in Japanese</small></span></button>
              <button type="button" className={promptLanguage === "japanese" ? "selected" : ""} aria-pressed={promptLanguage === "japanese"} onClick={() => setPromptLanguage("japanese")}><span className="bp-language-mark">日</span><span><strong>Japanese</strong><small>Give the English meaning</small></span></button>
            </div>
          </fieldset>
          <fieldset className="bp-balloon-count">
            <legend>Balloons per team</legend>
            <div className="bp-choice-row three">{[12, 18, 24].map((total) => <button type="button" className={balloonTotal === total ? "selected" : ""} aria-pressed={balloonTotal === total} onClick={() => setBalloonTotal(total)} key={total}><strong>{total}</strong><small>{total === 12 ? "Quick" : total === 18 ? "Classic" : "Long"} match</small></button>)}</div>
          </fieldset>
        </div>

        <button type="button" className="bp-start" onClick={startGame} disabled={prompts.length === 0}><CircleDot size={21}/> Start Balloon Pop <ArrowRight size={20}/></button>
      </section>
    </main>}

    {phase !== "setup" && <main className="bp-game-stage">
      <section className="bp-scorebar" aria-label="Match status">
        <div className="bp-score-team team-a"><Flag size={20}/><span><small>TEAM A</small><strong>{balloons.a.length} balloons</strong></span></div>
        <div className="bp-round-card"><small>MATCH</small><strong>Round {round}</strong><span>{playMode === "race" ? <><Swords size={14}/> Race mode</> : <><UsersRound size={14}/> Taking turns</>}</span></div>
        <div className="bp-score-team team-b"><span><small>TEAM B</small><strong>{balloons.b.length} balloons</strong></span><Flag size={20}/></div>
      </section>

      <section className="bp-prompt-strip" aria-live="polite">
        <div className="bp-prompt-context"><small>{turnCopy}</small><span><Languages size={15}/>{promptDirection}</span></div>
        <div className="bp-prompt-copy"><p>CLASS PROMPT</p><h1>{promptText}</h1>{revealed && <strong className="bp-revealed-answer">{answerText}</strong>}</div>
        <div className="bp-prompt-actions"><button type="button" onClick={() => setRevealed((value) => !value)} disabled={rolling}>{revealed ? <><Eye size={17}/> Hide answer</> : <><Eye size={17}/> Reveal answer</>}</button><button type="button" onClick={nextPrompt} disabled={rolling}><Shuffle size={17}/> New prompt</button></div>
      </section>

      <section className="bp-arena">
        <BalloonField team="a" total={balloonTotal} activeIds={balloons.a} popping={popping} falling={falling} caught={caught}/>

        <section className="bp-control-tower" aria-labelledby="bp-control-title">
          <div className="bp-control-heading"><small>TEACHER CONTROLS</small><h2 id="bp-control-title">Who loses this round?</h2><p>Choose the team that should lose balloons.</p></div>
          <div className="bp-loser-buttons">
            <button type="button" className={`team-a ${selectedLoser === "a" ? "selected" : ""}`} aria-pressed={selectedLoser === "a"} onClick={() => selectLosingTeam("a")} disabled={rolling || Boolean(winner)}><span>A</span><strong>Team A loses</strong></button>
            <button type="button" className={`team-b ${selectedLoser === "b" ? "selected" : ""}`} aria-pressed={selectedLoser === "b"} onClick={() => selectLosingTeam("b")} disabled={rolling || Boolean(winner)}><span>B</span><strong>Team B loses</strong></button>
          </div>
          <div className={`bp-die-zone ${selectedLoser ? `target-${selectedLoser}` : ""}`}>
            <span className="bp-die-label">{rolling ? "ROLLING…" : selectedLoser ? `${teamName(selectedLoser)} AT RISK` : "SELECT A TEAM"}</span>
            <DieFace value={dieValue} rolling={rolling}/>
            <strong className="bp-die-result">{rolling ? "?" : dieValue}</strong>
            <button type="button" className="bp-roll-button" onClick={rollDie} disabled={!selectedLoser || rolling || Boolean(winner)}><Dice5 size={21}/>{rolling ? "Rolling…" : "Roll & pop"}</button>
          </div>
          <div className="bp-next-step" aria-live="polite"><CircleDot size={16}/><span>{announcement}</span></div>
        </section>

        <BalloonField team="b" total={balloonTotal} activeIds={balloons.b} popping={popping} falling={falling} caught={caught}/>

        {phase === "finished" && winner && <div className="bp-winner-card" role="status">
          <span><Trophy size={38}/></span><small>MATCH COMPLETE</small><h2>{teamName(winner)} wins!</h2><p>{teamName(otherTeam(winner))}&apos;s rider fell into the water and the shark swooped in.</p><div><button type="button" onClick={playAgain}><RotateCcw size={18}/> Play again</button><button type="button" onClick={() => setPhase("setup")}><BookOpenText size={18}/> Change setup</button></div>
        </div>}
      </section>
    </main>}

    {rulesOpen && <div className="bp-rules-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setRulesOpen(false); }}>
      <section className="bp-rules-dialog" role="dialog" aria-modal="true" aria-labelledby="bp-rules-title">
        <button type="button" className="bp-rules-close" onClick={() => setRulesOpen(false)} aria-label="Close game rules"><X size={20}/></button>
        <span className="bp-rules-icon" aria-hidden="true"><BookOpenText size={29}/></span><small>HOW TO PLAY</small><h2 id="bp-rules-title">Balloon Pop rules</h2>
        <ol><li><b>1</b><span>Students answer the displayed English or Japanese Word Pack prompt.</span></li><li><b>2</b><span>Play in turns, or let both teams race for the first correct answer.</span></li><li><b>3</b><span>Teacher selects the losing team, then rolls the digital die.</span></li><li><b>4</b><span>The die pops that many balloons. A team with no balloons falls to the shark.</span></li></ol>
        <button type="button" className="bp-rules-done" onClick={() => setRulesOpen(false)}>Back to the game <ArrowRight size={18}/></button>
      </section>
    </div>}
  </div>;
}
