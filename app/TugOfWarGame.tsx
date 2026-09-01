"use client";

import {
  ArrowLeft,
  ArrowRight,
  Flag,
  GripVertical,
  Play,
  RotateCcw,
  Target,
  Trophy,
  Timer,
  UsersRound,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import {
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type TeamId = "a" | "b";
type GamePhase = "setup" | "playing" | "round-win" | "match-win";

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
};

type KanaTile = {
  id: string;
  kana: string;
  position: number;
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
  "人気があります": "にんきがあります",
  "上げます": "あげます",
  "自然": "しぜん",
  "大好き": "だいすき",
  "好き": "すき",
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

function makeEntry(display: string, index: number): WordEntry | null {
  const reading = readingOverrides[display] ?? katakanaToHiragana(cleanWord(display));
  const initial = reading.charAt(0);
  if (!/[ぁ-ん]/.test(initial) || initial === "ん") return null;
  return { id: `${display}-${index}`, display, reading, initial };
}

function shuffled<T>(values: T[]) {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function chooseKana(groups: Map<string, WordEntry[]>, previous: string[]) {
  const allKana = Array.from(groups.keys());
  const fresh = allKana.filter((kana) => !previous.includes(kana));
  const firstPass = shuffled(fresh);
  const secondPass = shuffled(allKana.filter((kana) => !firstPass.includes(kana)));
  return [...firstPass, ...secondPass].slice(0, 4);
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
  const [pullsToGoal, setPullsToGoal] = useState(2);
  const [round, setRound] = useState(1);
  const [wins, setWins] = useState<Record<TeamId, number>>({ a: 0, b: 0 });
  const [tiles, setTiles] = useState<KanaTile[]>([]);
  const [winningTeam, setWinningTeam] = useState<TeamId | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [soundMuted, setSoundMuted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [timerRunning, setTimerRunning] = useState(false);
  const [announcement, setAnnouncement] = useState("Four kana are centred and ready to move.");

  const boardRef = useRef<HTMLDivElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const roundResolvedRef = useRef(false);

  const columnCount = pullsToGoal * 2 + 1;
  const availableKana = promptGroups.size;
  const activeKana = tiles.map((tile) => tile.kana);
  const teamAClaims = tiles.filter((tile) => tile.position === -pullsToGoal).length;
  const teamBClaims = tiles.filter((tile) => tile.position === pullsToGoal).length;

  const getAudioContext = () => {
    if (soundMuted || typeof window === "undefined") return null;
    const context = audioContextRef.current ?? new window.AudioContext();
    audioContextRef.current = context;
    if (context.state === "suspended") void context.resume();
    return context;
  };

  const playMoveSound = (direction: number) => {
    const context = getAudioContext();
    if (!context) return;
    const now = context.currentTime;
    const main = context.createOscillator();
    const shimmer = context.createOscillator();
    const gain = context.createGain();
    const shimmerGain = context.createGain();

    main.type = "triangle";
    shimmer.type = "sine";
    main.frequency.setValueAtTime(direction < 0 ? 610 : 470, now);
    main.frequency.exponentialRampToValueAtTime(direction < 0 ? 390 : 760, now + 0.16);
    shimmer.frequency.setValueAtTime(direction < 0 ? 920 : 760, now);
    shimmer.frequency.exponentialRampToValueAtTime(direction < 0 ? 690 : 1120, now + 0.12);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.13, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.19);
    shimmerGain.gain.setValueAtTime(0.0001, now);
    shimmerGain.gain.exponentialRampToValueAtTime(0.045, now + 0.018);
    shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

    main.connect(gain);
    shimmer.connect(shimmerGain);
    gain.connect(context.destination);
    shimmerGain.connect(context.destination);
    main.start(now);
    shimmer.start(now);
    main.stop(now + 0.2);
    shimmer.stop(now + 0.15);
  };

  const playVictorySound = (team: TeamId) => {
    const context = getAudioContext();
    if (!context) return;
    const now = context.currentTime;
    const notes = team === "a" ? [523.25, 659.25, 783.99] : [587.33, 739.99, 880];
    notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "triangle";
      oscillator.frequency.value = frequency;
      const start = now + index * 0.09;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.12, start + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.28);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.3);
    });
  };

  const playTimerSound = (finished: boolean) => {
    const context = getAudioContext();
    if (!context) return;
    const now = context.currentTime;
    const frequencies = finished ? [392, 293.66] : [760];
    frequencies.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = now + index * 0.14;
      oscillator.type = finished ? "sawtooth" : "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(finished ? 0.1 : 0.075, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + (finished ? 0.22 : 0.1));
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + (finished ? 0.24 : 0.12));
    });
  };

  useEffect(() => {
    if (!timerRunning || phase !== "playing") return;
    const interval = window.setInterval(() => {
      setTimeLeft((current) => {
        const next = current - 1;
        if (next <= 0) {
          window.clearInterval(interval);
          setTimerRunning(false);
          setAnnouncement("Time is up. Click the timer to give the next team 15 seconds.");
          playTimerSound(true);
          return 0;
        }
        if (next <= 3) playTimerSound(false);
        return next;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [phase, soundMuted, timerRunning]);

  const resetTimer = () => {
    setTimerRunning(false);
    setTimeLeft(15);
  };

  const startTimer = () => {
    void getAudioContext();
    setTimeLeft(15);
    setTimerRunning(true);
    setAnnouncement("The 15-second answer timer has started.");
  };

  const prepareRound = (nextRound: number, previousKana = activeKana) => {
    const nextKana = chooseKana(promptGroups, previousKana);
    setRound(nextRound);
    setTiles(nextKana.map((kana, index) => ({ id: `${nextRound}-${kana}-${index}`, kana, position: 0 })));
    setWinningTeam(null);
    setDraggingId(null);
    resetTimer();
    setAnnouncement("Four new kana are centred and ready to move.");
    roundResolvedRef.current = false;
    setPhase("playing");
  };

  const startMatch = () => {
    setWins({ a: 0, b: 0 });
    prepareRound(1, []);
  };

  const awardRound = (team: TeamId) => {
    if (roundResolvedRef.current) return;
    roundResolvedRef.current = true;
    const nextWins = { ...wins, [team]: wins[team] + 1 };
    setWins(nextWins);
    setWinningTeam(team);
    setTimerRunning(false);
    setAnnouncement(`${teamNames[team]} wins round ${round}.`);
    playVictorySound(team);
    setPhase(nextWins[team] >= roundsToWin ? "match-win" : "round-win");
  };

  const moveTile = (tileId: string, requestedPosition: number) => {
    if (phase !== "playing") return;
    const current = tiles.find((tile) => tile.id === tileId);
    if (!current) return;
    const nextPosition = Math.max(-pullsToGoal, Math.min(pullsToGoal, requestedPosition));
    if (nextPosition === current.position) return;

    const direction = nextPosition > current.position ? 1 : -1;
    const nextTiles = tiles.map((tile) => tile.id === tileId ? { ...tile, position: nextPosition } : tile);
    setTiles(nextTiles);
    resetTimer();
    playMoveSound(direction);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(12);

    const destination = nextPosition === 0
      ? "back to the centre"
      : `${Math.abs(nextPosition)} ${Math.abs(nextPosition) === 1 ? "column" : "columns"} toward ${teamNames[nextPosition < 0 ? "a" : "b"]}`;
    setAnnouncement(`${current.kana} moved ${destination}.`);

    const aClaims = nextTiles.filter((tile) => tile.position === -pullsToGoal).length;
    const bClaims = nextTiles.filter((tile) => tile.position === pullsToGoal).length;
    if (aClaims >= 3) awardRound("a");
    else if (bClaims >= 3) awardRound("b");
  };

  const positionFromPointer = (clientX: number) => {
    const board = boardRef.current;
    if (!board) return 0;
    const bounds = board.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, (clientX - bounds.left) / bounds.width));
    const columnIndex = Math.min(columnCount - 1, Math.floor(progress * columnCount));
    return columnIndex - pullsToGoal;
  };

  const beginDrag = (event: PointerEvent<HTMLButtonElement>, tileId: string) => {
    if (phase !== "playing") return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDraggingId(tileId);
    void getAudioContext();
  };

  const continueDrag = (event: PointerEvent<HTMLButtonElement>, tileId: string) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    moveTile(tileId, positionFromPointer(event.clientX));
  };

  const endDrag = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    setDraggingId(null);
  };

  const handleTileKey = (event: KeyboardEvent<HTMLButtonElement>, tile: KanaTile) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveTile(tile.id, tile.position - 1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      moveTile(tile.id, tile.position + 1);
    }
    if (event.key === "Home") {
      event.preventDefault();
      moveTile(tile.id, 0);
    }
  };

  const centreBoard = () => {
    const moved = tiles.some((tile) => tile.position !== 0);
    setTiles((current) => current.map((tile) => ({ ...tile, position: 0 })));
    resetTimer();
    setAnnouncement("All kana returned to the centre.");
    if (moved) playMoveSound(-1);
  };

  const changeKana = () => prepareRound(round, activeKana);

  const returnToSetup = () => {
    if (phase !== "setup" && !window.confirm("Restart the match and return to game setup?")) return;
    setPhase("setup");
    setWins({ a: 0, b: 0 });
    setTiles([]);
    setWinningTeam(null);
    resetTimer();
    roundResolvedRef.current = false;
  };

  return (
    <div className="tow-portal" role="dialog" aria-modal="true" aria-label="Tug-of-War Vocabulary Game">
      <header className="tow-topbar">
        <div className="tow-brand">
          <span aria-hidden="true"><UsersRound size={22}/></span>
          <div><strong>Tug-of-War</strong><small>{packName} · Teacher-controlled vocabulary game</small></div>
        </div>
        <div className="tow-header-actions">
          <button type="button" onClick={() => setSoundMuted((value) => !value)} aria-pressed={soundMuted} aria-label={soundMuted ? "Turn movement sounds on" : "Mute movement sounds"}>
            {soundMuted ? <VolumeX size={18}/> : <Volume2 size={18}/>}<span>{soundMuted ? "Sound off" : "Sound on"}</span>
          </button>
          {phase !== "setup" && <button type="button" onClick={returnToSetup}><RotateCcw size={18}/><span>Restart</span></button>}
          <button type="button" className="tow-close" onClick={onClose} aria-label="Close Tug-of-War"><X size={21}/></button>
        </div>
      </header>

      {phase === "setup" ? (
        <main className="tow-setup-stage">
          <section className="tow-setup-card" aria-labelledby="tow-setup-title">
            <span className="tow-setup-icon" aria-hidden="true"><ArrowLeft/><ArrowRight/></span>
            <p>TEACHER-CONTROLLED TEAM CHALLENGE</p>
            <h1 id="tow-setup-title">Four sounds. One big pull.</h1>
            <span className="tow-setup-copy">Four different starting kana begin in the middle. When a team gives a correct word, drag that kana one column toward their side.</span>

            <div className="tow-settings">
              <fieldset>
                <legend>Rounds needed to win</legend>
                <div className="tow-option-row">{[2, 3, 5].map((value) => <button type="button" key={value} className={roundsToWin === value ? "selected" : ""} aria-pressed={roundsToWin === value} onClick={() => setRoundsToWin(value)}>First to {value}</button>)}</div>
              </fieldset>
              <fieldset>
                <legend>Board distance</legend>
                <div className="tow-option-row">{[2, 3, 4].map((value) => <button type="button" key={value} className={pullsToGoal === value ? "selected" : ""} aria-pressed={pullsToGoal === value} onClick={() => setPullsToGoal(value)}>{value * 2 + 1} columns</button>)}</div>
              </fieldset>
            </div>

            <div className={`tow-pack-summary ${availableKana < 4 ? "needs-more" : ""}`}><Target size={20}/><div><strong>{availableKana} starting kana available</strong><span>{availableKana >= 4 ? "Each round draws four different kana from your selected Word Pack items." : "Select vocabulary with at least four different starting kana before playing."}</span></div></div>
            <button type="button" className="tow-start" onClick={startMatch} disabled={availableKana < 4}><Play size={20} fill="currentColor"/> Start match</button>
          </section>
        </main>
      ) : (
        <main className="tow-game-stage">
          <section className="tow-scorebar" aria-label={`Round ${round}. First team to ${roundsToWin} rounds wins.`}>
            <article className="tow-team-card team-a">
              <span className="tow-team-icon"><ArrowLeft size={22}/></span>
              <div><small>TEAM A · DRAG LEFT</small><strong>{wins.a}</strong><span>round{wins.a === 1 ? "" : "s"}</span></div>
            </article>
            <button type="button" className={`tow-round-summary ${timerRunning ? "running" : timeLeft === 0 ? "expired" : timeLeft <= 5 ? "urgent" : ""}`} onClick={startTimer} aria-label={`${timerRunning ? "Restart" : "Start"} the 15-second answer timer. ${timeLeft} seconds ${timerRunning ? "remaining" : "shown"}.`}>
              <small>MATCH</small><strong>Round {round}</strong><span className="tow-round-countdown" aria-hidden="true"><Timer size={13}/><b>{timeLeft}</b><i>sec</i></span>
            </button>
            <article className="tow-team-card team-b">
              <div><small>TEAM B · DRAG RIGHT</small><strong>{wins.b}</strong><span>round{wins.b === 1 ? "" : "s"}</span></div>
              <span className="tow-team-icon"><ArrowRight size={22}/></span>
            </article>
          </section>

          <section className="tow-board" aria-labelledby="tow-board-title">
            <header className="tow-board-header">
              <div>
                <p>LIVE GAME BOARD</p>
                <h1 id="tow-board-title">Drag the kana for the team that answers</h1>
                <span>Tiles snap to each column. The first team to bring three kana home wins the round.</span>
              </div>
              <div className="tow-board-actions">
                <button type="button" className={`tow-board-timer ${timerRunning ? "running" : timeLeft === 0 ? "expired" : timeLeft <= 5 ? "urgent" : ""}`} onClick={startTimer} aria-label={`${timerRunning ? "Restart" : "Start"} the 15-second answer timer. ${timeLeft} seconds ${timerRunning ? "remaining" : "shown"}.`}>
                  <Timer size={18}/><span>{timerRunning ? "Restart timer" : timeLeft === 0 ? "Start again" : "Start timer"}</span><strong aria-hidden="true">{timeLeft}s</strong><i className="tow-timer-progress" style={{transform:`scaleX(${timeLeft / 15})`}} aria-hidden="true"/>
                </button>
                <button type="button" onClick={centreBoard}><Target size={17}/> Centre all</button>
                <button type="button" onClick={changeKana}><RotateCcw size={17}/> New kana</button>
              </div>
            </header>

            <div className="tow-board-labels" aria-hidden="true">
              <span className="team-a"><Flag size={16}/> Team A goal</span>
              <span>STARTING COLUMN</span>
              <span className="team-b">Team B goal <Flag size={16}/></span>
            </div>

            <div className="tow-board-scroll">
              <div
                className="tow-lane-board"
                ref={boardRef}
                style={{ "--tow-columns": columnCount } as CSSProperties}
              >
                <div className="tow-column-grid" aria-hidden="true">
                  {Array.from({ length: columnCount }, (_, index) => <span key={index} className={`${index === 0 ? "goal-a" : ""} ${index === columnCount - 1 ? "goal-b" : ""} ${index === pullsToGoal ? "centre" : ""}`}/>) }
                </div>
                {tiles.map((tile, index) => {
                  const left = ((tile.position + pullsToGoal + 0.5) / columnCount) * 100;
                  const claimedTeam = tile.position === -pullsToGoal ? "a" : tile.position === pullsToGoal ? "b" : null;
                  const distance = Math.abs(tile.position);
                  const valueText = tile.position === 0 ? "centred" : `${distance} ${distance === 1 ? "column" : "columns"} toward ${teamNames[tile.position < 0 ? "a" : "b"]}`;
                  return <div className={`tow-kana-lane lane-${index + 1}`} key={tile.id}>
                    <span className="tow-lane-number" aria-hidden="true">{index + 1}</span>
                    <button
                      type="button"
                      className={`tow-kana-token ${draggingId === tile.id ? "dragging" : ""} ${claimedTeam ? `claimed-${claimedTeam}` : ""}`}
                      style={{ left: `${left}%` }}
                      role="slider"
                      aria-label={`${tile.kana}, ${valueText}. Drag it or use the left and right arrow keys.`}
                      aria-valuemin={-pullsToGoal}
                      aria-valuemax={pullsToGoal}
                      aria-valuenow={tile.position}
                      aria-valuetext={valueText}
                      onPointerDown={(event) => beginDrag(event, tile.id)}
                      onPointerMove={(event) => continueDrag(event, tile.id)}
                      onPointerUp={endDrag}
                      onPointerCancel={endDrag}
                      onKeyDown={(event) => handleTileKey(event, tile)}
                    >
                      <strong lang="ja">{tile.kana}</strong>
                      <GripVertical size={17} aria-hidden="true"/>
                    </button>
                  </div>;
                })}
              </div>
            </div>

            <footer className="tow-board-footer">
              <div className="tow-claim-meter team-a"><span>{teamAClaims}/3</span><strong>Team A home</strong></div>
              <div className="tow-drag-tip"><GripVertical size={18}/><span>Drag any kana left or right</span></div>
              <div className="tow-claim-meter team-b"><strong>Team B home</strong><span>{teamBClaims}/3</span></div>
            </footer>
            <p className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">{announcement}</p>
          </section>
        </main>
      )}

      {(phase === "round-win" || phase === "match-win") && winningTeam && (
        <div className="tow-result-backdrop">
          <section className={`tow-result team-${winningTeam}`} role="dialog" aria-modal="true" aria-labelledby="tow-result-title">
            <span className="tow-result-icon" aria-hidden="true">{phase === "match-win" ? <Trophy size={46}/> : <Flag size={42}/>}</span>
            <p>{phase === "match-win" ? "MATCH VICTORY" : `ROUND ${round} COMPLETE`}</p>
            <h2 id="tow-result-title">{teamNames[winningTeam]} wins!</h2>
            <span>{phase === "match-win" ? `${wins[winningTeam]} rounds secured. Brilliant teamwork!` : `${teamNames[winningTeam]} brought three kana home.`}</span>
            <div className="tow-result-score"><span>Team A <strong>{wins.a}</strong></span><i>—</i><span><strong>{wins.b}</strong> Team B</span></div>
            {phase === "match-win" ? <button type="button" onClick={startMatch} autoFocus><RotateCcw size={19}/> Play again</button> : <button type="button" onClick={() => prepareRound(round + 1)} autoFocus>Next round <ArrowRight size={19}/></button>}
          </section>
        </div>
      )}
    </div>
  );
}
