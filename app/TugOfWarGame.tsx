"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Flag,
  Play,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
  UsersRound,
  X,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

type TeamId = "a" | "b";
type GamePhase = "setup" | "playing" | "round-win" | "match-win";
type FeedbackTone = "info" | "success" | "error";

type Props = {
  items: string[];
  packName: string;
  onClose: () => void;
};

type WordEntry = {
  id: string;
  display: string;
  reading: string;
  initial: string;
  normalizedDisplay: string;
  normalizedReading: string;
};

type UsedWord = {
  id: string;
  display: string;
  reading: string;
  team: TeamId;
};

const readingOverrides: Record<string, string> = {
  "まい日": "まいにち",
  "学校": "がっこう",
  "小学校": "しょうがっこう",
  "中学校": "ちゅうがっこう",
  "高校": "こうこう",
  "大学": "だいがく",
  "すう学": "すうがく",
  "自己紹介": "じこしょうかい",
  "一がつ": "いちがつ",
  "二がつ": "にがつ",
  "三がつ": "さんがつ",
  "にゅう学しき": "にゅうがくしき",
  "水えいたいかい": "すいえいたいかい",
  "しゅう学りょこう": "しゅうがくりょこう",
  "(で)あそびます": "あそびます",
  "山": "やま",
  "川": "かわ",
  "きょ年": "きょねん",
  "天気": "てんき",
  "手": "て",
  "耳": "みみ",
  "目": "め",
  "先しゅう": "せんしゅう",
  "まい年": "まいとし",
};

const teamNames: Record<TeamId, string> = { a: "Team A", b: "Team B" };

function katakanaToHiragana(value: string) {
  return value.replace(/[ァ-ヶ]/g, (character) =>
    String.fromCharCode(character.charCodeAt(0) - 0x60),
  );
}

function cleanWord(value: string) {
  return value
    .normalize("NFKC")
    .replace(/^\(お\)/, "お")
    .replace(/^\(あさ\)/, "あさ")
    .replace(/^\(で\)/, "")
    .replace(/\(な\)/g, "")
    .replace(/[（(][^)）]+[)）]/g, "")
    .trim();
}

function normalizeAnswer(value: string) {
  return katakanaToHiragana(cleanWord(value))
    .replace(/[\s、。・!！?？]/g, "")
    .toLocaleLowerCase("ja");
}

function makeEntry(display: string, index: number): WordEntry | null {
  const reading = readingOverrides[display] ?? katakanaToHiragana(cleanWord(display));
  const initial = reading.charAt(0);
  if (!/[ぁ-ん]/.test(initial) || initial === "ん") return null;
  return {
    id: `${display}-${index}`,
    display,
    reading,
    initial,
    normalizedDisplay: normalizeAnswer(display),
    normalizedReading: normalizeAnswer(reading),
  };
}

function choosePrompt(
  groups: Map<string, WordEntry[]>,
  requestedPulls: number,
  previousPrompt: string,
) {
  const allGroups = Array.from(groups.entries());
  const enoughForGoal = allGroups.filter(([, entries]) => entries.length >= requestedPulls);
  const enoughForPlay = allGroups.filter(([, entries]) => entries.length >= 2);
  let choices = enoughForGoal.length ? enoughForGoal : enoughForPlay.length ? enoughForPlay : allGroups;
  const freshChoices = choices.filter(([initial]) => initial !== previousPrompt);
  if (freshChoices.length) choices = freshChoices;
  return choices[Math.floor(Math.random() * choices.length)] ?? ["あ", [] as WordEntry[]];
}

export default function TugOfWarGame({ items, packName, onClose }: Props) {
  const entries = useMemo(
    () => items.map(makeEntry).filter((entry): entry is WordEntry => entry !== null),
    [items],
  );
  const promptGroups = useMemo(() => {
    const groups = new Map<string, WordEntry[]>();
    entries.forEach((entry) => groups.set(entry.initial, [...(groups.get(entry.initial) ?? []), entry]));
    return groups;
  }, [entries]);

  const [phase, setPhase] = useState<GamePhase>("setup");
  const [roundsToWin, setRoundsToWin] = useState(3);
  const [pullsToWin, setPullsToWin] = useState(3);
  const [round, setRound] = useState(1);
  const [wins, setWins] = useState<Record<TeamId, number>>({ a: 0, b: 0 });
  const [position, setPosition] = useState(0);
  const [roundPullTarget, setRoundPullTarget] = useState(3);
  const [prompt, setPrompt] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<TeamId>("a");
  const [answer, setAnswer] = useState("");
  const [usedWords, setUsedWords] = useState<UsedWord[]>([]);
  const [winningTeam, setWinningTeam] = useState<TeamId | null>(null);
  const [feedback, setFeedback] = useState({
    tone: "info" as FeedbackTone,
    message: "Choose the team that answered, then enter the word.",
  });
  const [showWordBank, setShowWordBank] = useState(false);

  const promptWords = promptGroups.get(prompt) ?? [];
  const markerPosition = roundPullTarget
    ? ((position + roundPullTarget) / (roundPullTarget * 2)) * 100
    : 50;

  const prepareRound = (nextRound: number, previousPrompt = prompt) => {
    const [nextPrompt, possibleWords] = choosePrompt(promptGroups, pullsToWin, previousPrompt);
    setRound(nextRound);
    setPrompt(nextPrompt);
    setRoundPullTarget(Math.max(1, Math.min(pullsToWin, possibleWords.length)));
    setPosition(0);
    setUsedWords([]);
    setAnswer("");
    setWinningTeam(null);
    setShowWordBank(false);
    setFeedback({
      tone: "info",
      message: `${possibleWords.length} selected ${possibleWords.length === 1 ? "word starts" : "words start"} with ${nextPrompt}.`,
    });
    setPhase("playing");
  };

  const startMatch = () => {
    setWins({ a: 0, b: 0 });
    setSelectedTeam("a");
    prepareRound(1, "");
  };

  const submitAnswer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (phase !== "playing") return;
    const normalized = normalizeAnswer(answer);
    if (!normalized) {
      setFeedback({ tone: "error", message: "Enter a Japanese vocabulary word first." });
      return;
    }

    const entry = entries.find(
      (candidate) => candidate.normalizedDisplay === normalized || candidate.normalizedReading === normalized,
    );
    if (!entry) {
      setFeedback({ tone: "error", message: `That word is not in the selected ${packName} Word Pack.` });
      return;
    }
    if (entry.initial !== prompt) {
      setFeedback({
        tone: "error",
        message: `${entry.display} starts with ${entry.initial} when read aloud—not ${prompt}.`,
      });
      return;
    }
    if (usedWords.some((word) => word.id === entry.id)) {
      setFeedback({ tone: "error", message: `${entry.display} has already been used this round.` });
      return;
    }

    const movement = selectedTeam === "a" ? -1 : 1;
    const nextPosition = Math.max(-roundPullTarget, Math.min(roundPullTarget, position + movement));
    const nextUsedWords = [
      ...usedWords,
      { id: entry.id, display: entry.display, reading: entry.reading, team: selectedTeam },
    ];
    setUsedWords(nextUsedWords);
    setPosition(nextPosition);
    setAnswer("");

    if (Math.abs(nextPosition) >= roundPullTarget) {
      const nextWins = { ...wins, [selectedTeam]: wins[selectedTeam] + 1 };
      setWins(nextWins);
      setWinningTeam(selectedTeam);
      setFeedback({ tone: "success", message: `${entry.display} wins the round for ${teamNames[selectedTeam]}!` });
      setPhase(nextWins[selectedTeam] >= roundsToWin ? "match-win" : "round-win");
      return;
    }

    setFeedback({
      tone: "success",
      message: `${entry.display} accepted—${teamNames[selectedTeam]} pulls ${selectedTeam === "a" ? "left" : "right"}!`,
    });
  };

  const changePrompt = () => prepareRound(round, prompt);

  const returnToSetup = () => {
    if (phase !== "setup" && !window.confirm("Restart the match and return to game setup?")) return;
    setPhase("setup");
    setWins({ a: 0, b: 0 });
    setPosition(0);
    setUsedWords([]);
    setWinningTeam(null);
  };

  return (
    <div className="tow-portal" role="dialog" aria-modal="true" aria-label="Tug-of-War Vocabulary Game">
      <header className="tow-topbar">
        <div className="tow-brand">
          <span aria-hidden="true"><UsersRound size={22}/></span>
          <div><strong>Tug-of-War</strong><small>{packName} · Vocabulary Game</small></div>
        </div>
        <div className="tow-header-actions">
          {phase !== "setup" && <button type="button" onClick={returnToSetup}><RotateCcw size={18}/><span>Restart</span></button>}
          <button type="button" className="tow-close" onClick={onClose} aria-label="Close Tug-of-War"><X size={21}/></button>
        </div>
      </header>

      {phase === "setup" ? (
        <main className="tow-setup-stage">
          <section className="tow-setup-card" aria-labelledby="tow-setup-title">
            <span className="tow-setup-icon" aria-hidden="true"><ArrowLeft/><ArrowRight/></span>
            <p>TEAM VOCABULARY CHALLENGE</p>
            <h1 id="tow-setup-title">Pull together. Think fast.</h1>
            <span className="tow-setup-copy">Teams take turns naming a selected Word Pack item that begins with the target hiragana. Every accepted word pulls the rope.</span>

            <div className="tow-settings">
              <fieldset>
                <legend>Rounds needed to win</legend>
                <div className="tow-option-row">{[2, 3, 5].map((value) => <button type="button" key={value} className={roundsToWin === value ? "selected" : ""} aria-pressed={roundsToWin === value} onClick={() => setRoundsToWin(value)}>First to {value}</button>)}</div>
              </fieldset>
              <fieldset>
                <legend>Pulls to reach the boundary</legend>
                <div className="tow-option-row">{[2, 3, 4].map((value) => <button type="button" key={value} className={pullsToWin === value ? "selected" : ""} aria-pressed={pullsToWin === value} onClick={() => setPullsToWin(value)}>{value} pulls</button>)}</div>
              </fieldset>
            </div>

            <div className="tow-pack-summary"><Target size={20}/><div><strong>{entries.length} selected words</strong><span>{promptGroups.size} available starting hiragana · shorter word groups automatically use a closer boundary</span></div></div>
            <button type="button" className="tow-start" onClick={startMatch} disabled={!entries.length}><Play size={20} fill="currentColor"/> Start match</button>
          </section>
        </main>
      ) : (
        <main className="tow-game-stage">
          <section className="tow-scorebar" aria-label={`Round ${round}. First team to ${roundsToWin} rounds wins.`}>
            <article className={`tow-team-card team-a ${selectedTeam === "a" ? "active" : ""}`}>
              <span className="tow-team-icon"><ArrowLeft size={22}/></span>
              <div><small>TEAM A · PULL LEFT</small><strong>{wins.a}</strong><span>round{wins.a === 1 ? "" : "s"}</span></div>
            </article>
            <div className="tow-round-summary"><small>MATCH</small><strong>Round {round}</strong><span>First to {roundsToWin}</span></div>
            <article className={`tow-team-card team-b ${selectedTeam === "b" ? "active" : ""}`}>
              <div><small>TEAM B · PULL RIGHT</small><strong>{wins.b}</strong><span>round{wins.b === 1 ? "" : "s"}</span></div>
              <span className="tow-team-icon"><ArrowRight size={22}/></span>
            </article>
          </section>

          <div className="tow-play-layout">
            <section className="tow-board" aria-label="Tug-of-War playing field">
              <div className="tow-prompt">
                <span>STARTING HIRAGANA</span>
                <strong lang="ja">{prompt}</strong>
                <small>Say a selected word beginning with this sound</small>
              </div>

              <div className="tow-field">
                <div className="tow-goal-label goal-a"><Flag size={16}/> Team A wins here</div>
                <div className="tow-goal-label goal-b">Team B wins here <Flag size={16}/></div>
                <div className="tow-rope-wrap">
                  <span className="tow-boundary boundary-a" aria-hidden="true"/>
                  <span className="tow-centre-line" aria-hidden="true"/>
                  <span className="tow-boundary boundary-b" aria-hidden="true"/>
                  <div className="tow-rope" aria-hidden="true"/>
                  <div className="tow-marker" style={{ left: `${markerPosition}%` }} aria-hidden="true"><span/><b><Sparkles size={17}/></b></div>
                  <span className="tow-centre-tag">CENTRE</span>
                </div>
                <div className="tow-pull-count" role="status" aria-atomic="true">
                  <span>{Math.max(0, roundPullTarget + position)} pulls to Team A</span>
                  <strong>{position === 0 ? "Rope is centred" : `${teamNames[position < 0 ? "a" : "b"]} leads by ${Math.abs(position)}`}</strong>
                  <span>{Math.max(0, roundPullTarget - position)} pulls to Team B</span>
                </div>
              </div>

              <div id="tow-feedback" className={`tow-feedback ${feedback.tone}`} role={feedback.tone === "error" ? "alert" : "status"} aria-live={feedback.tone === "error" ? "assertive" : "polite"} aria-atomic="true">
                {feedback.tone === "success" ? <Check size={20}/> : feedback.tone === "error" ? <X size={20}/> : <Target size={20}/>}<span>{feedback.message}</span>
              </div>
            </section>

            <aside className="tow-control-card" aria-label="Submit a vocabulary word">
              <header><div><small>ANSWER DESK</small><h2>Who answered?</h2></div><span>{usedWords.length}/{promptWords.length} used</span></header>
              <div className="tow-team-picker" role="group" aria-label="Choose the answering team">
                <button type="button" className={`team-a ${selectedTeam === "a" ? "selected" : ""}`} aria-pressed={selectedTeam === "a"} onClick={() => setSelectedTeam("a")}><ArrowLeft size={18}/> Team A</button>
                <button type="button" className={`team-b ${selectedTeam === "b" ? "selected" : ""}`} aria-pressed={selectedTeam === "b"} onClick={() => setSelectedTeam("b")}>Team B <ArrowRight size={18}/></button>
              </div>

              <form onSubmit={submitAnswer}>
                <label htmlFor="tow-answer">Japanese word beginning with <strong lang="ja">{prompt}</strong></label>
                <input id="tow-answer" lang="ja" autoComplete="off" aria-describedby="tow-feedback" value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder={`例：${prompt}…`} disabled={phase !== "playing"} autoFocus/>
                <button type="submit" className={`tow-submit team-${selectedTeam}`} disabled={phase !== "playing" || !answer.trim()}>{selectedTeam === "a" ? <ArrowLeft size={20}/> : <ArrowRight size={20}/>} Accept & pull for {teamNames[selectedTeam]}</button>
              </form>

              <section className="tow-used-words" aria-labelledby="tow-used-title">
                <div><h3 id="tow-used-title">Used this round</h3><span>No repeats</span></div>
                {usedWords.length ? <ul>{[...usedWords].reverse().map((word) => <li key={word.id} className={`team-${word.team}`}><span>{word.team.toUpperCase()}</span><strong>{word.display}</strong>{word.reading !== cleanWord(word.display) && <small>{word.reading}</small>}</li>)}</ul> : <p>Accepted words will appear here.</p>}
              </section>

              <div className="tow-teacher-tools">
                <button type="button" aria-expanded={showWordBank} aria-controls="tow-word-bank" onClick={() => setShowWordBank((value) => !value)}>{showWordBank ? <EyeOff size={17}/> : <Eye size={17}/>} {showWordBank ? "Hide" : "Teacher"} word bank</button>
                <button type="button" onClick={changePrompt}><RotateCcw size={17}/> New hiragana</button>
              </div>
              {showWordBank && <div className="tow-word-bank" id="tow-word-bank"><small>VALID FOR {prompt}</small><div>{promptWords.map((word) => <span key={word.id} className={usedWords.some((used) => used.id === word.id) ? "used" : ""}>{word.display}</span>)}</div></div>}
            </aside>
          </div>
        </main>
      )}

      {(phase === "round-win" || phase === "match-win") && winningTeam && (
        <div className="tow-result-backdrop">
          <section className={`tow-result team-${winningTeam}`} role="dialog" aria-modal="true" aria-labelledby="tow-result-title">
            <span className="tow-result-icon" aria-hidden="true">{phase === "match-win" ? <Trophy size={46}/> : <Flag size={42}/>}</span>
            <p>{phase === "match-win" ? "MATCH VICTORY" : `ROUND ${round} COMPLETE`}</p>
            <h2 id="tow-result-title">{teamNames[winningTeam]} wins!</h2>
            <span>{phase === "match-win" ? `${wins[winningTeam]} rounds secured. Brilliant teamwork!` : `${teamNames[winningTeam]} pulled the marker across the boundary.`}</span>
            <div className="tow-result-score"><span>Team A <strong>{wins.a}</strong></span><i>—</i><span><strong>{wins.b}</strong> Team B</span></div>
            {phase === "match-win" ? <button type="button" onClick={startMatch} autoFocus><RotateCcw size={19}/> Play again</button> : <button type="button" onClick={() => prepareRound(round + 1)} autoFocus>Next round <ArrowRight size={19}/></button>}
          </section>
        </div>
      )}
    </div>
  );
}
