"use client";

import {
  Activity, Bath, BedDouble, Bike, BookOpen, Building2, BusFront, CalendarDays,
  Camera, CarFront, CircleUserRound, Cloud, Coffee, Drama, Dumbbell, Ear, Eye,
  EyeOff, Fish, FlaskConical, Flower2, Footprints, Gift, Hand, Heart, HeartOff,
  History, Home, Hotel, Image as ImageIcon, Leaf, Map, MapPin, Mic2, Mountain,
  Music2, PartyPopper, Pencil, Plane, Play, RotateCcw, School, Shapes, Shirt,
  ShoppingBag, Snowflake, Sun, TrainFront, TreePine, Utensils, Volume2, VolumeX,
  Waves, Wind, X, type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cleanJapaneseWord, vocabularyEnglish } from "./quickfireData";

type Props = { items: string[]; packName: string; onClose: () => void };
type Phase = "setup" | "memorise" | "curtain" | "guess" | "answer";
type Mode = "missing-one" | "missing-two" | "swap" | "change" | "hide-japanese";

type PictureCard = {
  id: string;
  raw: string;
  japanese: string;
  english: string;
  icon: LucideIcon;
  scene: string;
  tone: number;
};

type Challenge = {
  mode: Mode;
  altered: Array<PictureCard | null>;
  affected: number[];
  prompt: string;
  answer: string;
};

const MODE_OPTIONS: Array<{ id: Mode; label: string; detail: string }> = [
  { id: "missing-one", label: "One card disappears", detail: "Find one missing picture and word." },
  { id: "missing-two", label: "Two cards disappear", detail: "Recall both missing items." },
  { id: "swap", label: "Two cards swap places", detail: "Spot which two cards moved." },
  { id: "change", label: "One word changes", detail: "Notice the replacement card." },
  { id: "hide-japanese", label: "Japanese disappears", detail: "The picture remains as the clue." },
];

const pictureRules: Array<{ test: RegExp; icon: LucideIcon; scene: string }> = [
  { test: /shower|bath/, icon: Bath, scene: "aqua" },
  { test: /sleep|bed|get up|rest/, icon: BedDouble, scene: "night" },
  { test: /aeroplane/, icon: Plane, scene: "sky" },
  { test: /bullet train|train/, icon: TrainFront, scene: "sky" },
  { test: /school bus|bus/, icon: BusFront, scene: "sunny" },
  { test: /bicycle/, icon: Bike, scene: "mint" },
  { test: /car|taxi/, icon: CarFront, scene: "sunny" },
  { test: /walk|on foot/, icon: Footprints, scene: "mint" },
  { test: /primary school|high school|school|university|subject/, icon: School, scene: "sky" },
  { test: /homework|reading|japanese language|english|self-introduction/, icon: BookOpen, scene: "lavender" },
  { test: /science/, icon: FlaskConical, scene: "mint" },
  { test: /physical education|strong|health|wellness|yoga|energy/, icon: Dumbbell, scene: "sunny" },
  { test: /music|instrument/, icon: Music2, scene: "lavender" },
  { test: /history|last year|last week/, icon: History, scene: "peach" },
  { test: /geography|tourism|sightseeing|excursion|trip/, icon: Map, scene: "mint" },
  { test: /home|room/, icon: Home, scene: "peach" },
  { test: /hotel|inn/, icon: Hotel, scene: "lavender" },
  { test: /convenience store|canteen|service/, icon: Building2, scene: "sky" },
  { test: /tea|drink|yoghurt/, icon: Coffee, scene: "peach" },
  { test: /lunch|dinner|breakfast|food|curry|takoyaki|yakisoba|corn|cook|cooking/, icon: Utensils, scene: "sunny" },
  { test: /fishing/, icon: Fish, scene: "aqua" },
  { test: /sea|beach|river|swimming/, icon: Waves, scene: "aqua" },
  { test: /mountain/, icon: Mountain, scene: "mint" },
  { test: /forest|nature|countryside/, icon: TreePine, scene: "mint" },
  { test: /garden/, icon: Flower2, scene: "mint" },
  { test: /spring/, icon: Leaf, scene: "mint" },
  { test: /summer/, icon: Sun, scene: "sunny" },
  { test: /winter|cold/, icon: Snowflake, scene: "aqua" },
  { test: /cloud|weather/, icon: Cloud, scene: "sky" },
  { test: /photo/, icon: Camera, scene: "lavender" },
  { test: /write|draw|make/, icon: Pencil, scene: "peach" },
  { test: /sing|karaoke/, icon: Mic2, scene: "lavender" },
  { test: /shopping/, icon: ShoppingBag, scene: "peach" },
  { test: /film|anime|musical|play \/ drama|character|cosplay/, icon: Drama, scene: "lavender" },
  { test: /clothes|kimono|yukata|coat|wear/, icon: Shirt, scene: "peach" },
  { test: /present|gift/, icon: Gift, scene: "sunny" },
  { test: /party|festival|fireworks|ceremony/, icon: PartyPopper, scene: "sunny" },
  { test: /hand/, icon: Hand, scene: "peach" },
  { test: /eye/, icon: Eye, scene: "sky" },
  { test: /ear/, icon: Ear, scene: "peach" },
  { test: /head|face|hair|mouth|nose|leg|foot|man|woman|height/, icon: CircleUserRound, scene: "peach" },
  { test: /love|really like|popular|important|lovely/, icon: Heart, scene: "rose" },
  { test: /do not like|boring|not good/, icon: HeartOff, scene: "rose" },
  { test: /relax|stress|take it easy|meditation/, icon: Wind, scene: "aqua" },
  { test: /disaster|war/, icon: Activity, scene: "rose" },
  { test: /today|tomorrow|morning|night|every day|every year|january|february|march|holiday|break|now|early|again/, icon: CalendarDays, scene: "sky" },
  { test: /hobby|club activities|play|technology|cleaning/, icon: Activity, scene: "mint" },
  { test: /picture|image/, icon: ImageIcon, scene: "lavender" },
  { test: /place|enter|go home/, icon: MapPin, scene: "sky" },
];

function hashTone(value: string) {
  return Array.from(value).reduce((total, character) => total + character.charCodeAt(0), 0) % 6;
}

function makeCard(raw: string): PictureCard {
  const english = vocabularyEnglish[raw] ?? raw;
  const picture = pictureRules.find((rule) => rule.test.test(english.toLowerCase())) ?? { icon: Shapes, scene: "lavender" };
  return { id: raw, raw, japanese: cleanJapaneseWord(raw), english, icon: picture.icon, scene: picture.scene, tone: hashTone(raw) };
}

function shuffled<T>(values: T[]) {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
}

function twoIndexes(length: number) {
  const first = Math.floor(Math.random() * length);
  let second = Math.floor(Math.random() * (length - 1));
  if (second >= first) second += 1;
  return [first, second];
}

function createChallenge(base: PictureCard[], allCards: PictureCard[], mode: Mode): Challenge {
  const altered: Array<PictureCard | null> = [...base];
  if (mode === "missing-one") {
    const index = Math.floor(Math.random() * base.length);
    altered[index] = null;
    return { mode, altered, affected: [index], prompt: "What disappeared?", answer: `${base[index].japanese} disappeared.` };
  }
  if (mode === "missing-two") {
    const affected = twoIndexes(base.length);
    affected.forEach((index) => { altered[index] = null; });
    return { mode, altered, affected, prompt: "Which two cards disappeared?", answer: `${base[affected[0]].japanese} and ${base[affected[1]].japanese} disappeared.` };
  }
  if (mode === "swap") {
    const affected = twoIndexes(base.length);
    [altered[affected[0]], altered[affected[1]]] = [altered[affected[1]], altered[affected[0]]];
    return { mode, altered, affected, prompt: "Which two cards swapped places?", answer: `${base[affected[0]].japanese} and ${base[affected[1]].japanese} swapped places.` };
  }
  if (mode === "change") {
    const index = Math.floor(Math.random() * base.length);
    const outside = allCards.filter((card) => !base.some((item) => item.id === card.id));
    const candidates = outside.length > 0 ? outside : base.filter((_, candidateIndex) => candidateIndex !== index);
    const replacement = candidates[Math.floor(Math.random() * candidates.length)];
    altered[index] = replacement;
    return { mode, altered, affected: [index], prompt: "Which word changed?", answer: `${base[index].japanese} changed to ${replacement.japanese}.` };
  }
  const index = Math.floor(Math.random() * base.length);
  return { mode, altered, affected: [index], prompt: "Say the Japanese word hidden by the picture.", answer: `The hidden Japanese was ${base[index].japanese}.` };
}

function VocabularyCard({ card, missing, hideJapanese, highlighted, answerBadge }: {
  card: PictureCard | null;
  missing?: boolean;
  hideJapanese?: boolean;
  highlighted?: boolean;
  answerBadge?: string;
}) {
  if (!card || missing) return <article className="wm-card wm-card-missing" aria-label="A vocabulary card is missing"><span aria-hidden="true"><EyeOff size={34}/></span><strong>?</strong></article>;
  const Picture = card.icon;
  return <article className={`wm-card tone-${card.tone} ${highlighted ? "highlighted" : ""}`} aria-label={hideJapanese ? "Japanese word hidden" : `${card.japanese}: ${card.english}`}>
    {answerBadge && <span className="wm-answer-badge">{answerBadge}</span>}
    <div className={`wm-picture scene-${card.scene}`} aria-hidden="true"><i/><Picture size={48} strokeWidth={1.8}/></div>
    <strong lang="ja" className={hideJapanese ? "is-hidden" : ""}>{hideJapanese ? "？？？" : card.japanese}</strong>
  </article>;
}

export default function WhatsMissingGame({ items, packName, onClose }: Props) {
  const allCards = useMemo(() => Array.from(new Set(items)).map(makeCard), [items]);
  const availableCounts = [8, 10, 12].filter((count) => count <= allCards.length);
  const [phase, setPhase] = useState<Phase>("setup");
  const [cardCount, setCardCount] = useState(() => allCards.length >= 10 ? 10 : 8);
  const [enabledModes, setEnabledModes] = useState<Mode[]>(MODE_OPTIONS.map((option) => option.id));
  const [round, setRound] = useState(1);
  const [seconds, setSeconds] = useState(10);
  const [baseCards, setBaseCards] = useState<PictureCard[]>([]);
  const [displayedCards, setDisplayedCards] = useState<Array<PictureCard | null>>([]);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [curtainClosed, setCurtainClosed] = useState(false);
  const [changeApplied, setChangeApplied] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const audioRef = useRef<AudioContext | null>(null);

  const audio = () => {
    if (!soundOn) return null;
    if (!audioRef.current) audioRef.current = new AudioContext();
    void audioRef.current.resume();
    return audioRef.current;
  };

  const tone = (frequency: number, duration = 0.09, volume = 0.045) => {
    const context = audio();
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    gain.gain.setValueAtTime(volume, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration);
  };

  const curtainSound = (opening: boolean) => {
    const context = audio();
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(opening ? 210 : 420, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(opening ? 520 : 180, context.currentTime + 0.42);
    gain.gain.setValueAtTime(0.025, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.45);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.46);
  };

  useEffect(() => () => { void audioRef.current?.close(); }, []);

  useEffect(() => {
    if (phase !== "memorise") return;
    if (seconds === 0) {
      setPhase("curtain");
      return;
    }
    const timer = window.setTimeout(() => {
      tone(seconds <= 3 ? 740 : 520, seconds <= 3 ? 0.13 : 0.07, seconds <= 3 ? 0.06 : 0.035);
      setSeconds((current) => current - 1);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [phase, seconds]);

  useEffect(() => {
    if (phase !== "curtain" || !challenge) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const closeDelay = reducedMotion ? 30 : 720;
    const openDelay = reducedMotion ? 80 : 1320;
    const finishDelay = reducedMotion ? 140 : 2120;
    setCurtainClosed(true);
    curtainSound(false);
    const changeTimer = window.setTimeout(() => {
      setDisplayedCards(challenge.altered);
      setChangeApplied(true);
    }, closeDelay);
    const openTimer = window.setTimeout(() => {
      setCurtainClosed(false);
      curtainSound(true);
    }, openDelay);
    const finishTimer = window.setTimeout(() => setPhase("guess"), finishDelay);
    return () => {
      window.clearTimeout(changeTimer);
      window.clearTimeout(openTimer);
      window.clearTimeout(finishTimer);
    };
  }, [phase, challenge]);

  const toggleMode = (mode: Mode) => {
    setEnabledModes((current) => current.includes(mode) ? current.length === 1 ? current : current.filter((item) => item !== mode) : [...current, mode]);
  };

  const startRound = () => {
    const nextBase = shuffled(allCards).slice(0, cardCount);
    const mode = enabledModes[Math.floor(Math.random() * enabledModes.length)];
    const nextChallenge = createChallenge(nextBase, allCards, mode);
    setBaseCards(nextBase);
    setDisplayedCards(nextBase);
    setChallenge(nextChallenge);
    setSeconds(10);
    setCurtainClosed(false);
    setChangeApplied(false);
    setPhase("memorise");
    tone(620, 0.16, 0.05);
  };

  const nextRound = () => {
    setRound((current) => current + 1);
    startRound();
  };

  const revealAnswer = () => {
    setPhase("answer");
    tone(760, 0.18, 0.06);
    window.setTimeout(() => tone(960, 0.2, 0.05), 120);
  };

  const returnToSetup = () => {
    setPhase("setup");
    setRound(1);
    setCurtainClosed(false);
    setChangeApplied(false);
  };

  const renderCard = (index: number) => {
    if (!challenge) return null;
    const affected = challenge.affected.includes(index);
    const answerVisible = phase === "answer" && affected;
    const current = answerVisible ? baseCards[index] : displayedCards[index];
    const hideJapanese = challenge.mode === "hide-japanese" && affected && changeApplied && phase !== "answer";
    const answerBadge = answerVisible ? challenge.mode === "swap" ? "Original place" : challenge.mode === "change" ? "Original word" : challenge.mode === "hide-japanese" ? "Japanese restored" : "Missing card" : undefined;
    return <VocabularyCard key={`${index}-${current?.id ?? "missing"}`} card={current} missing={!current} hideJapanese={hideJapanese} highlighted={answerVisible} answerBadge={answerBadge}/>;
  };

  return <div className="wm-portal">
    <header className="wm-topbar">
      <div className="wm-brand"><span aria-hidden="true"><EyeOff size={25}/></span><div><strong>What&apos;s Missing?</strong><small>{packName}</small></div></div>
      <div className="wm-top-actions">
        <button type="button" onClick={() => setSoundOn((current) => !current)} aria-pressed={soundOn} aria-label={`${soundOn ? "Mute" : "Turn on"} game sounds`}>{soundOn ? <Volume2 size={18}/> : <VolumeX size={18}/>}<span>{soundOn ? "Sound on" : "Sound off"}</span></button>
        {phase !== "setup" && <button type="button" onClick={returnToSetup}><RotateCcw size={18}/><span>Setup</span></button>}
        <button type="button" className="wm-close" onClick={onClose} aria-label="Close What’s Missing"><X size={20}/></button>
      </div>
    </header>

    {phase === "setup" ? <main className="wm-setup-stage">
      <section className="wm-start-panel" aria-labelledby="wm-title">
        <div className="wm-start-copy">
          <p>PRODUCTION BY SPEAKING · VISUAL MEMORY</p>
          <h1 id="wm-title">Look closely.<br/>What changed?</h1>
          <span>Students study a wall of picture cards for ten seconds. The curtain closes, Gamify changes the board, and students answer in Japanese.</span>
          <div className="wm-mini-curtain" aria-hidden="true"><i/><i/><span><EyeOff size={30}/></span></div>
        </div>
        <div className="wm-settings">
          <fieldset><legend>Number of cards</legend><div className="wm-count-options">{[8, 10, 12].map((count) => <button type="button" key={count} disabled={!availableCounts.includes(count)} className={cardCount === count ? "selected" : ""} aria-pressed={cardCount === count} onClick={() => setCardCount(count)}><strong>{count}</strong><small>{count <= allCards.length ? "cards" : "not enough selected"}</small></button>)}</div></fieldset>
          <fieldset><legend>Random challenge pool</legend><div className="wm-mode-options">{MODE_OPTIONS.map((option) => { const selected = enabledModes.includes(option.id); return <button type="button" key={option.id} className={selected ? "selected" : ""} aria-pressed={selected} onClick={() => toggleMode(option.id)}><span aria-hidden="true">{selected ? "✓" : ""}</span><div><strong>{option.label}</strong><small>{option.detail}</small></div></button>; })}</div></fieldset>
          <button type="button" className="wm-start" onClick={startRound} disabled={allCards.length < 8}><Play size={20}/> Start memory round</button>
        </div>
      </section>
    </main> : <main className="wm-game-stage">
      <header className="wm-roundbar">
        <div><small>CLASSROOM ROUND</small><strong>Round {round}</strong></div>
        <p>{phase === "memorise" ? "Memorise every picture and Japanese word." : phase === "curtain" ? "Keep watching…" : phase === "guess" ? challenge?.prompt : "Answer revealed"}</p>
        <div className={`wm-timer ${phase === "memorise" && seconds <= 3 ? "urgent" : ""}`} aria-live="polite"><small>{phase === "memorise" ? "MEMORISE" : "CHALLENGE"}</small><strong>{phase === "memorise" ? seconds : phase === "curtain" ? "…" : "Speak!"}</strong></div>
      </header>
      <section className="wm-board-shell" aria-label="Vocabulary memory board">
        <div className={`wm-card-grid cards-${baseCards.length}`}>{baseCards.map((_, index) => renderCard(index))}</div>
        <div className={`wm-curtain ${curtainClosed ? "closed" : ""}`} aria-hidden="true"><div className="wm-curtain-half left"><i/><i/><i/><i/><span/></div><div className="wm-curtain-half right"><i/><i/><i/><i/><span/></div><div className="wm-curtain-valance"><i/><i/><i/><i/><i/><i/></div></div>
      </section>
      <footer className="wm-controlbar">
        <div className="wm-class-prompt"><small>CLASS PROMPT</small><strong>{phase === "memorise" ? "Remember the pictures and their positions." : phase === "curtain" ? "The board is changing behind the curtain." : phase === "guess" ? challenge?.prompt : challenge?.answer}</strong></div>
        {phase === "guess" && <button type="button" className="wm-reveal" onClick={revealAnswer}><Eye size={19}/> Reveal answer</button>}
        {phase === "answer" && <button type="button" className="wm-next" onClick={nextRound}><RotateCcw size={19}/> Next round</button>}
      </footer>
    </main>}
  </div>;
}
