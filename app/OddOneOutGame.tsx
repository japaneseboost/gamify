"use client";

import { ArrowRight, Check, Eye, RotateCcw, Shapes, X } from "lucide-react";
import { useMemo, useState } from "react";
import { displayWordPackItem, type VocabularyGroup } from "./wordPacks";

type Props = {
  groups: VocabularyGroup[];
  packName: string;
  onClose: () => void;
};

type Question = {
  options: string[];
  oddIndex: number;
  sharedLabel: string;
  oddLabel: string;
};

type Bucket = {
  label: string;
  items: string[];
};

function shuffled<T>(values: T[]) {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function traitBuckets(items: string[]): Bucket[] {
  const hasKatakana = (value: string) => /[ァ-ヶー]/.test(value);
  const hasKanji = (value: string) => /[一-龯々]/.test(value);
  const isMasuVerb = (value: string) => /ます$/.test(value);
  return [
    { label: "Katakana words", items: items.filter(hasKatakana) },
    { label: "non-Katakana words", items: items.filter((item) => !hasKatakana(item)) },
    { label: "words containing kanji", items: items.filter(hasKanji) },
    { label: "kana-only words", items: items.filter((item) => !hasKanji(item)) },
    { label: "verbs in ます form", items: items.filter(isMasuVerb) },
    { label: "other word forms", items: items.filter((item) => !isMasuVerb(item)) },
  ].filter((bucket) => bucket.items.length > 0);
}

function buildQuestions(groups: VocabularyGroup[]) {
  const normalisedGroups = groups
    .map((group) => ({ label: group.label, items: unique(group.items) }))
    .filter((group) => group.items.length > 0);
  const allItems = unique(normalisedGroups.flatMap((group) => group.items));
  const buckets = [...normalisedGroups, ...traitBuckets(allItems)];
  const usedSignatures = new Set<string>();
  const usage = new Map<string, number>();
  const questions: Question[] = [];

  const chooseItems = (items: string[], count: number) => shuffled(items)
    .sort((a, b) => (usage.get(a) ?? 0) - (usage.get(b) ?? 0))
    .slice(0, count);

  for (let questionIndex = 0; questionIndex < 10; questionIndex += 1) {
    const optionCount = questionIndex < 6 ? 3 : 4;
    const relatedCount = optionCount - 1;
    const candidates = shuffled(buckets.flatMap((shared) => {
      if (shared.items.length < relatedCount) return [];
      return buckets
        .filter((odd) => odd.label !== shared.label && odd.items.some((item) => !shared.items.includes(item)))
        .map((odd) => ({ shared, odd }));
    }));

    let built: Question | null = null;
    for (const candidate of candidates) {
      const related = chooseItems(candidate.shared.items, relatedCount);
      const oddPool = candidate.odd.items.filter((item) => !candidate.shared.items.includes(item) && !related.includes(item));
      if (oddPool.length === 0) continue;
      const oddItem = chooseItems(oddPool, 1)[0];
      const options = shuffled([...related, oddItem]);
      const signature = [...options].sort().join("|");
      if (usedSignatures.has(signature)) continue;
      usedSignatures.add(signature);
      options.forEach((item) => usage.set(item, (usage.get(item) ?? 0) + 1));
      built = {
        options,
        oddIndex: options.indexOf(oddItem),
        sharedLabel: candidate.shared.label,
        oddLabel: candidate.odd.label,
      };
      break;
    }

    if (!built) {
      const source = allItems.length >= optionCount
        ? shuffled(allItems).slice(0, optionCount)
        : unique([...allItems, "ほん", "よみます", "たのしい", "テレビ"]).slice(0, optionCount);
      built = {
        options: source,
        oddIndex: source.length - 1,
        sharedLabel: "the same vocabulary pattern",
        oddLabel: "a different pattern",
      };
    }
    questions.push(built);
  }
  return questions;
}

export default function OddOneOutGame({ groups, packName, onClose }: Props) {
  const poolKey = useMemo(() => groups.flatMap((group) => group.items).join("|"), [groups]);
  const [round, setRound] = useState(1);
  const [questions, setQuestions] = useState<Question[]>(() => buildQuestions(groups));
  const [questionIndex, setQuestionIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const question = questions[questionIndex];
  const isLastQuestion = questionIndex === questions.length - 1;
  const challengeRound = question.options.length === 4;

  const nextQuestion = () => {
    if (!revealed) return;
    if (isLastQuestion) {
      setQuestions(buildQuestions(groups));
      setQuestionIndex(0);
      setRevealed(false);
      setRound((value) => value + 1);
      return;
    }
    setQuestionIndex((value) => value + 1);
    setRevealed(false);
  };

  return (
    <div className="ooo-portal" role="dialog" aria-modal="true" aria-label="Odd One Out reading game" data-pool={poolKey}>
      <header className="ooo-topbar">
        <div className="ooo-brand">
          <span aria-hidden="true"><Shapes size={23}/></span>
          <div><strong>Odd One Out</strong><small>{packName} · Round {round}</small></div>
        </div>
        <button type="button" className="ooo-close" onClick={onClose} aria-label="Close Odd One Out"><X size={22}/></button>
      </header>

      <main className="ooo-main">
        <section className="ooo-heading">
          <div>
            <p>READ · COMPARE · DECIDE</p>
            <h1>Which word is the odd one out?</h1>
            <span>Read every word, then show the number with your fingers.</span>
          </div>
          <aside className={challengeRound ? "challenge" : ""}>
            <small>QUESTION</small>
            <strong>{questionIndex + 1}<span>/10</span></strong>
            <b>{challengeRound ? "Challenge · 4 options" : "Warm-up · 3 options"}</b>
          </aside>
        </section>

        <div className="ooo-progress" aria-label={`Question ${questionIndex + 1} of 10`}>
          {questions.map((_, index) => <i key={index} className={index < questionIndex ? "done" : index === questionIndex ? "current" : ""}/>)}
        </div>

        <section className="ooo-platter" aria-label={`${question.options.length} words to compare`}>
          <div className="ooo-platter-mark" aria-hidden="true">読</div>
          <ol className="ooo-option-grid" data-count={question.options.length}>
            {question.options.map((option, index) => {
              const isOdd = revealed && index === question.oddIndex;
              return (
                <li className={revealed ? (isOdd ? "odd" : "related") : ""} key={`${round}-${questionIndex}-${option}`}>
                  <span className="ooo-option-number">{index + 1}</span>
                  <strong>{displayWordPackItem(option)}</strong>
                  {isOdd && <span className="ooo-answer-tag"><Check size={17}/> Odd one</span>}
                </li>
              );
            })}
          </ol>
        </section>

        <section className="ooo-vote-strip" aria-label="Finger voting guide">
          <span>Everyone votes together:</span>
          <div>
            {question.options.map((_, index) => <b key={index}><i>{index + 1}</i><small>{index + 1 === 1 ? "finger" : "fingers"}</small></b>)}
          </div>
        </section>

        <section className={`ooo-explanation ${revealed ? "visible" : ""}`} aria-live="polite" aria-atomic="true">
          {revealed ? (
            <>
              <span><Check size={20}/></span>
              <div>
                <small>THE ODD ONE OUT IS NUMBER {question.oddIndex + 1}</small>
                <strong>{displayWordPackItem(question.options[question.oddIndex])}</strong>
                <p>It belongs with <b>{question.oddLabel}</b>. The other words belong with <b>{question.sharedLabel}</b>.</p>
              </div>
            </>
          ) : (
            <>
              <span aria-hidden="true"><Eye size={20}/></span>
              <div><small>THINKING TIME</small><strong>Look for what the words have in common.</strong></div>
            </>
          )}
        </section>
      </main>

      <footer className="ooo-controls">
        <div><small>Difficulty increases automatically</small><strong>{questionIndex < 6 ? "3 choices" : "4 choices"}</strong></div>
        <button type="button" className="ooo-reveal-button" onClick={() => setRevealed(true)} disabled={revealed}><Eye size={19}/> Reveal answer</button>
        <button type="button" className="ooo-next-button" onClick={nextQuestion} disabled={!revealed}>
          {isLastQuestion ? <RotateCcw size={19}/> : <ArrowRight size={19}/>}
          {isLastQuestion ? "New 10-question round" : "Next question"}
        </button>
      </footer>
    </div>
  );
}
