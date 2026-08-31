"use client";

import { Check, Eye, EyeOff, Lightbulb, RotateCcw, X } from "lucide-react";
import { useMemo, useState } from "react";

type Props = {
  options: string[];
  onClose: () => void;
};

const gestures = ["☝️", "✌️", "🤟", "✋"];

function shuffled<T>(values: T[]) {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

function buildRound(pool: string[]) {
  const unique = Array.from(new Set(pool.filter(Boolean)));
  const fallback = ["京都", "東京", "大阪", "広島"];
  const source = unique.length >= 4 ? unique : Array.from(new Set([...unique, ...fallback]));
  return shuffled(source).slice(0, 4);
}

export default function ReadMyMindGame({ options, onClose }: Props) {
  const initialPool = useMemo(() => options.length ? options : ["京都", "東京", "大阪", "広島"], [options]);
  const [round, setRound] = useState(1);
  const [roundOptions, setRoundOptions] = useState<string[]>(() => buildRound(initialPool));
  const [secretIndex, setSecretIndex] = useState<number | null>(null);
  const [setupOpen, setSetupOpen] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const [clueStep, setClueStep] = useState(0);
  const [openingClue, setOpeningClue] = useState("");
  const [secondClue, setSecondClue] = useState("");

  const activeClue = clueStep === 0
    ? openingClue
    : secondClue || "もう一つヒントを言いましょう。";

  const startRound = () => {
    if (secretIndex === null) return;
    setRevealed(false);
    setClueStep(0);
    setSetupOpen(false);
  };

  const nextRound = () => {
    setRound((value) => value + 1);
    setRoundOptions(buildRound(initialPool));
    setSecretIndex(null);
    setRevealed(false);
    setClueStep(0);
    setSecondClue("");
    setSetupOpen(true);
  };

  return (
    <div className="rmm-portal" role="dialog" aria-modal="true" aria-label="Read My Mind classroom game">
      <header className="rmm-topbar">
        <div>
          <span className="rmm-live-dot" aria-hidden="true"/>
          <div><strong>Read My Mind</strong><small>Round {round}</small></div>
        </div>
        <button type="button" onClick={onClose} aria-label="Close Read My Mind"><X size={22}/></button>
      </header>

      <main className="rmm-stage">
        <section className="rmm-heading">
          <p>LISTEN · PREDICT · CHANGE YOUR MIND</p>
          <h1>Which one is Sensei thinking?</h1>
          <span>Listen to each clue. You can change your prediction before the answer is revealed.</span>
        </section>

        <section className="rmm-clue" aria-live="polite">
          <div><Lightbulb size={22}/><span>Clue {clueStep + 1}</span></div>
          <strong>{activeClue}</strong>
        </section>

        <section className="rmm-answer-grid" aria-label="Four possible answers">
          {roundOptions.map((option, index) => {
            const isAnswer = revealed && secretIndex === index;
            return <article className={`rmm-answer-card ${isAnswer ? "answer" : ""}`} key={`${round}-${option}`}>
              <span className="rmm-number">{index + 1}</span>
              <strong>{option}</strong>
              {isAnswer && <span className="rmm-correct"><Check size={22}/> Answer</span>}
            </article>;
          })}
        </section>

        <section className="rmm-gesture-strip" aria-label="Hand signals students can use">
          <span>Students can answer with their hands:</span>
          {gestures.map((gesture, index)=><b key={gesture}>{gesture} <small>{index + 1}</small></b>)}
        </section>

        {revealed && secretIndex !== null && <section className="rmm-reveal" aria-live="polite">
          <small>SENSEI WAS THINKING…</small>
          <strong>{roundOptions[secretIndex]}</strong>
        </section>}
      </main>

      <footer className="rmm-controls">
        <button type="button" onClick={() => setSetupOpen(true)}><RotateCcw size={18}/> Change answer / clues</button>
        <button type="button" onClick={() => setClueStep((step) => Math.min(1, step + 1))} disabled={clueStep >= 1}><Lightbulb size={18}/> Next clue</button>
        <button type="button" onClick={() => setRevealed(false)} disabled={!revealed}><EyeOff size={18}/> Hide Answer</button>
        <button type="button" className="rmm-primary" onClick={() => setRevealed(true)} disabled={secretIndex === null || revealed}><Eye size={18}/> Reveal</button>
        <button type="button" className="rmm-next" onClick={nextRound}>Next Round</button>
      </footer>

      {setupOpen && <div className="rmm-setup-backdrop">
        <section className="rmm-setup" role="dialog" aria-modal="true" aria-labelledby="rmm-setup-title">
          <header><div><small>TEACHER SETUP · ROUND {round}</small><h2 id="rmm-setup-title">Choose the secret answer</h2><p>Select one before students look at the screen.</p></div>{secretIndex !== null && <button type="button" onClick={() => setSetupOpen(false)} aria-label="Close setup"><X size={20}/></button>}</header>
          <div className="rmm-secret-grid">
            {roundOptions.map((option, index)=><button type="button" key={option} className={secretIndex === index ? "selected" : ""} onClick={() => setSecretIndex(index)}><span>{index + 1}</span><strong>{option}</strong>{secretIndex === index && <Check size={18}/>}</button>)}
          </div>
          <div className="rmm-clue-fields">
            <label><span>Opening clue</span><input value={openingClue} onChange={(event)=>setOpeningClue(event.target.value)} placeholder="私は……"/></label>
            <label><span>Second clue <small>optional</small></span><input value={secondClue} onChange={(event)=>setSecondClue(event.target.value)} placeholder="例：関西に行きたいです。"/></label>
          </div>
          <button type="button" className="rmm-start" onClick={startRound} disabled={secretIndex === null}>Hide answer & start round</button>
        </section>
      </div>}
    </div>
  );
}
