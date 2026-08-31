"use client";

import { Brain, Check, Ear, Eye, RotateCcw, Volume2, X, PencilLine } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type VocabularyGroup = { id: string; label: string; items: string[] };

type Props = {
  packId: string;
  groups: VocabularyGroup[];
  patterns: string[];
  memoryDelay: number;
  onClose: () => void;
};

type Phase = "listen" | "remember" | "write" | "reveal";

const clean = (value: string) => value.replace(/^\(お\)/, "お").replace(/^\(あさ\)/, "あさ").replace(/\(な\)/g, "").replace(/[（(]([^)）]+)[)）]/g, "$1");

function shuffled<T>(values: T[]) {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

function buildSentences(packId: string, groups: VocabularyGroup[], patterns: string[]) {
  const selected = new Set(groups.flatMap((group) => group.items));
  const nouns = groups.find((group) => group.id === "nouns")?.items ?? [];
  const verbs = groups.find((group) => group.id === "verbs")?.items ?? [];
  const adjectives = groups.find((group) => group.id === "adjectives")?.items ?? [];
  const adverbs = groups.find((group) => group.id === "adverbs-time")?.items ?? [];
  const expressions = groups.find((group) => group.id === "expressions")?.items ?? [];
  const candidates: Array<{ text: string; needs: string[] }> = [];
  const add = (text: string, ...needs: string[]) => candidates.push({ text, needs });

  if (packId === "iitomo2-ch1") {
    add("まい日、はやくおきます。", "まい日", "はやく", "おきます");
    add("まい日、おふろにはいります。", "まい日", "(お)ふろ", "はいります");
    add("おちゃをのみます。", "(お)ちゃ", "のみます");
    add("学校からうちにかえります。", "学校", "うち", "かえります");
    add("ぶかつがおわります。", "ぶかつ", "おわります");
    add("しゅくだいがおわります。", "しゅくだい", "おわります");
    add("あさごはんのあと、おちゃをのみます。", "(あさ)ごはん", "(お)ちゃ", "のみます");
    add("ばんごはんのあと、おふろにはいります。", "ばんごはん", "(お)ふろ", "はいります");
  }

  if (packId === "iitomo2-ch2") {
    add("すう学はむずかしいです。", "すう学", "むずかしい");
    add("おんがくは好きなかもくです。", "おんがく", "かもく");
    add("きょう、そうじをします。", "きょう", "そうじ");
    add("りかはむずかしいです。", "りか", "むずかしい");
    add("れきしはつまらないです。", "れきし", "つまらない");
    add("高校は三時までです。", "高校");
    add("たいいくはにがてです。", "たいいく", "にがて(な)");
  }

  if (packId === "iitomo2-ch3") {
    add("なつにしゅう学りょこうがあります。", "なつ（夏）", "しゅう学りょこう");
    add("えんそくにバスで行きます。", "えんそく", "バス");
    add("しゅう学りょこうにしんかんせんで行きます。", "しゅう学りょこう", "しんかんせん");
    add("ふゆやすみは十二月です。", "ふゆやすみ");
    add("なつやすみにひこうきで行きます。", "なつやすみ", "ひこうき");
    add("ぶんかさいにミュージカルがあります。", "ぶんかさい", "ミュージカル");
  }

  if (packId === "iitomo2-ch4") {
    add("しゅうまつにりょうりをします。", "しゅみ", "りょうり");
    add("うみでしゃしんをとります。", "うみ", "しゃしんをとります");
    add("ひまな時にどくしょをします。", "どくしょ");
    add("山でさんぽします。", "山", "さんぽします");
    add("あした、へやでうたいます。", "あした", "へや", "うたいます");
    add("ビーチでたくさんしゃしんをとります。", "ビーチ", "たくさん", "しゃしんをとります");
  }

  if (packId === "iitomo2-ch5") {
    add("このキャラクターはせがたかいです。", "キャラクター", "たかい");
    add("このキャラクターはかみの毛がながいです。", "キャラクター", "かみ(の毛)", "ながい");
    add("このキャラクターはすてきです。", "キャラクター", "すてき(な)");
    add("このキャラクターはしっぽがみじかいです。", "キャラクター", "しっぽ", "みじかい");
    add("このキャラクターは目が大きいです。", "キャラクター", "目");
    add("このキャラクターはつよいです。", "キャラクター", "つよい");
  }

  if (packId === "iitomo2-ch6") {
    add("はなびはたのしかったです。", "はなび");
    add("たこやきはおいしかったです。", "たこやき");
    add("パーティーはこんでいました。", "パーティー");
    add("みんなでおいわいします。", "みんなで");
    add("ゆかたはたいせつです。", "ゆかた", "たいせつ(な)");
    add("またカラオケに行きたいです。", "また", "カラオケ");
  }

  const valid = candidates.filter((candidate) => candidate.needs.every((item) => selected.has(item))).map((candidate) => candidate.text);
  const fallback: string[] = [];
  const noun = nouns[0] ? clean(nouns[0]) : "";
  if (verbs.length) {
    verbs.slice(0, 4).forEach((verb, index) => {
      const time = adverbs[index % Math.max(adverbs.length, 1)];
      fallback.push(`${time ? `${clean(time)}、` : ""}${clean(verb)}。`);
    });
  }
  if (noun && adjectives.length) adjectives.slice(0, 4).forEach((adj) => fallback.push(`${noun}は${clean(adj)}です。`));
  if (noun) fallback.push(`${noun}です。`);
  expressions.slice(0, 3).forEach((expression) => fallback.push(`${clean(expression)}。`));
  patterns.slice(0, 2).forEach((pattern) => {
    if (!/[～\[\]]/.test(pattern)) fallback.push(`${clean(pattern)}。`);
  });

  const unique = Array.from(new Set([...valid, ...fallback])).filter((sentence) => sentence.length > 2);
  return shuffled(unique.length ? unique : ["日本語をよく聞いてください。", "もう一ど聞いてください。"]).slice(0, 10);
}

export default function DelayedDictationGame({ packId, groups, patterns, memoryDelay, onClose }: Props) {
  const sentences = useMemo(() => buildSentences(packId, groups, patterns), [packId, groups, patterns]);
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<Phase>("listen");
  const [seconds, setSeconds] = useState(memoryDelay);
  const [sequenceRunning, setSequenceRunning] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const cancelledRef = useRef(false);
  const timeoutIds = useRef<number[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sentence = sentences[round % sentences.length];

  const clearSequence = (cancelSpeech = true) => {
    cancelledRef.current = true;
    timeoutIds.current.forEach((id) => window.clearTimeout(id));
    timeoutIds.current = [];
    if (cancelSpeech) window.speechSynthesis?.cancel();
    setSequenceRunning(false);
  };

  useEffect(() => () => {
    cancelledRef.current = true;
    timeoutIds.current.forEach((id) => window.clearTimeout(id));
    window.speechSynthesis?.cancel();
    void audioContextRef.current?.close();
  }, []);

  useEffect(() => {
    if (phase !== "remember") return;
    setSeconds(memoryDelay);
    const timer = window.setInterval(() => {
      setSeconds((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          setPhase("write");
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase, memoryDelay, round]);

  const wait = (milliseconds: number) => new Promise<void>((resolve) => {
    const id = window.setTimeout(resolve, milliseconds);
    timeoutIds.current.push(id);
  });

  const chime = (finalChime = false) => {
    try {
      const context = audioContextRef.current ?? new AudioContext();
      audioContextRef.current = context;
      if (context.state === "suspended") void context.resume();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = finalChime ? 1040 : 820;
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.3);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.32);
    } catch {
      // If Web Audio is unavailable, speech still continues normally.
    }
  };

  const speakOnce = () => new Promise<boolean>((resolve) => {
    if (!("speechSynthesis" in window)) {
      setAudioError(true);
      resolve(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.lang = "ja-JP";
    utterance.rate = 0.75;
    utterance.pitch = 1;
    utterance.onstart = () => setAudioError(false);
    utterance.onend = () => resolve(true);
    utterance.onerror = () => {
      setAudioError(true);
      resolve(false);
    };
    window.speechSynthesis.speak(utterance);
  });

  const runListenSequence = async () => {
    clearSequence(true);
    cancelledRef.current = false;
    setSequenceRunning(true);
    setAudioError(false);

    // Audio-only get-ready cue: five chimes, with no visual countdown.
    for (let number = 5; number >= 1; number -= 1) {
      if (cancelledRef.current) return;
      chime(number === 1);
      await wait(1000);
    }

    if (cancelledRef.current) return;
    const firstWorked = await speakOnce();
    if (cancelledRef.current) return;
    if (!firstWorked) {
      setSequenceRunning(false);
      return;
    }

    await wait(3000);
    if (cancelledRef.current) return;

    const secondWorked = await speakOnce();
    if (cancelledRef.current) return;
    setSequenceRunning(false);
    if (secondWorked) setPhase("remember");
  };

  const hearAgain = () => {
    if (!("speechSynthesis" in window)) {
      setAudioError(true);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.lang = "ja-JP";
    utterance.rate = 0.75;
    utterance.pitch = 1;
    utterance.onerror = () => setAudioError(true);
    window.speechSynthesis.speak(utterance);
  };

  const nextRound = () => {
    clearSequence(true);
    setRound((value) => (value + 1) % sentences.length);
    setPhase("listen");
    setSeconds(memoryDelay);
    setAudioError(false);
  };

  const restartRound = () => {
    clearSequence(true);
    setPhase("listen");
    setSeconds(memoryDelay);
    setAudioError(false);
  };

  return (
    <div className="dd-portal" role="dialog" aria-modal="true" aria-label="Delayed Dictation classroom game">
      <header className="dd-topbar">
        <div><span className="dd-live-dot"/><div><strong>Delayed Dictation</strong><small>Sentence {round + 1} of {sentences.length} · {memoryDelay}s delay</small></div></div>
        <button type="button" onClick={onClose} aria-label="Close Delayed Dictation"><X size={22}/></button>
      </header>

      <main className={`dd-stage dd-${phase}`}>
        {phase === "listen" && <section className="dd-phase-card">
          <div className="dd-phase-icon"><Ear size={58}/></div>
          <p>STEP 1</p>
          <h1>Listen</h1>
          <span>The sentence stays hidden. You will hear a get-ready chime, then the sentence twice.</span>
          <button className="dd-main-action" type="button" onClick={runListenSequence} disabled={sequenceRunning}><Volume2 size={23}/>{sequenceRunning ? "Listening…" : "Start listening"}</button>
          {audioError && <div className="dd-audio-warning">Computer voice is unavailable in this browser. Read the hidden sentence aloud twice, three seconds apart, then restart the activity.</div>}
        </section>}

        {phase === "remember" && <section className="dd-phase-card">
          <div className="dd-phase-icon"><Brain size={58}/></div>
          <p>STEP 2</p>
          <h1>Remember</h1>
          <span>Hold the whole sentence in your head. No writing yet.</span>
          <div className="dd-countdown" aria-live="polite">{seconds}</div>
        </section>}

        {phase === "write" && <section className="dd-phase-card">
          <div className="dd-phase-icon"><PencilLine size={58}/></div>
          <p>STEP 3</p>
          <h1>Write</h1>
          <span>Write the sentence from memory. When everyone is ready, reveal it.</span>
          <button className="dd-main-action" type="button" onClick={() => setPhase("reveal")}><Eye size={23}/> Reveal answer</button>
        </section>}

        {phase === "reveal" && <section className="dd-phase-card dd-reveal-card">
          <div className="dd-phase-icon"><Check size={58}/></div>
          <p>STEP 4</p>
          <h1>Self-correct</h1>
          <span>Check every word, particle and ending against the model.</span>
          <div className="dd-answer">{sentence}</div>
          <div className="dd-reveal-actions"><button type="button" onClick={hearAgain}><Volume2 size={19}/> Hear again</button><button type="button" onClick={nextRound}>Next sentence</button></div>
        </section>}
      </main>

      <footer className="dd-footer">
        <button type="button" onClick={restartRound}><RotateCcw size={18}/> Restart sentence</button>
        <div className="dd-stepper" aria-label={`Delayed Dictation step ${["listen","remember","write","reveal"].indexOf(phase)+1} of 4`}><i className={phase === "listen" ? "active" : "done"}/><i className={phase === "remember" ? "active" : (["write","reveal"].includes(phase) ? "done" : "")}/><i className={phase === "write" ? "active" : (phase === "reveal" ? "done" : "")}/><i className={phase === "reveal" ? "active" : ""}/></div>
      </footer>
    </div>
  );
}
