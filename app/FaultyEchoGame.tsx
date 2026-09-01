"use client";

import { ArrowRight, Check, Ear, RefreshCw, RotateCcw, X, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import type { VocabularyGroup } from "./wordPacks";

type Props = {
  packId: string;
  packName: string;
  groups: VocabularyGroup[];
  patterns: string[];
  onClose: () => void;
};

type DisplayMode = "kana" | "furigana";
type Segment = { text: string; reading?: string };
type EchoPrompt = { kana: string; parts: Segment[]; needs: string[] };

const readings: Record<string, { text: string; reading: string }> = {
  "まい日":{text:"毎日",reading:"まいにち"}, "学校":{text:"学校",reading:"がっこう"},
  "小学校":{text:"小学校",reading:"しょうがっこう"}, "中学校":{text:"中学校",reading:"ちゅうがっこう"},
  "高校":{text:"高校",reading:"こうこう"}, "大学":{text:"大学",reading:"だいがく"},
  "すう学":{text:"数学",reading:"すうがく"}, "自己紹介":{text:"自己紹介",reading:"じこしょうかい"},
  "はる（春）":{text:"春",reading:"はる"}, "なつ（夏）":{text:"夏",reading:"なつ"},
  "あき（秋）":{text:"秋",reading:"あき"}, "ふゆ（冬）":{text:"冬",reading:"ふゆ"},
  "一がつ":{text:"一月",reading:"いちがつ"}, "二がつ":{text:"二月",reading:"にがつ"},
  "三がつ":{text:"三月",reading:"さんがつ"}, "にゅう学しき":{text:"入学式",reading:"にゅうがくしき"},
  "水えいたいかい":{text:"水泳大会",reading:"すいえいたいかい"}, "しゅう学りょこう":{text:"修学旅行",reading:"しゅうがくりょこう"},
  "山":{text:"山",reading:"やま"}, "川":{text:"川",reading:"かわ"}, "天気":{text:"天気",reading:"てんき"},
  "きょ年":{text:"去年",reading:"きょねん"}, "まい年":{text:"毎年",reading:"まいとし"},
  "先しゅう":{text:"先週",reading:"せんしゅう"}, "手":{text:"手",reading:"て"},
  "耳":{text:"耳",reading:"みみ"}, "目":{text:"目",reading:"め"},
  "おとこの人":{text:"男の人",reading:"おとこのひと"}, "おんなの人":{text:"女の人",reading:"おんなのひと"},
  "全員":{text:"全員",reading:"ぜんいん"}, "かみ(の毛)":{text:"髪の毛",reading:"かみのけ"},
  "人気があります":{text:"人気があります",reading:"にんきがあります"}, "けんこう":{text:"健康",reading:"けんこう"},
  "上げます":{text:"上げます",reading:"あげます"}, "自然":{text:"自然",reading:"しぜん"},
  "めいそう":{text:"瞑想",reading:"めいそう"}, "にわ":{text:"庭",reading:"にわ"},
  "りょかん":{text:"旅館",reading:"りょかん"}, "せんそう":{text:"戦争",reading:"せんそう"},
  "れきし":{text:"歴史",reading:"れきし"}, "しんりんよく":{text:"森林浴",reading:"しんりんよく"},
  "いなか":{text:"田舎",reading:"いなか"}, "かんこうする":{text:"観光する",reading:"かんこうする"},
  "さいがい":{text:"災害",reading:"さいがい"},
  "大好き":{text:"大好き",reading:"だいすき"}, "好き":{text:"好き",reading:"すき"},
  "あまり好きじゃない":{text:"あまり好きじゃない",reading:"あまりすきじゃない"},
};

const clean = (value: string) => value
  .replace(/^\(お\)/, "お")
  .replace(/^\(あさ\)/, "あさ")
  .replace(/^\(で\)/, "")
  .replace(/\(な\)/g, "")
  .replace(/（([^）]+)）/g, "")
  .replace(/[\[\]]/g, "");

const item = (value: string): Segment => readings[value] ?? { text: clean(value) };
const text = (value: string, reading?: string): Segment => ({ text:value, reading });
const sentence = (needs: string[], ...parts: Segment[]): EchoPrompt => ({
  needs,
  parts,
  kana:parts.map((part)=>part.reading ?? part.text).join(""),
});

const p = (needs: string[], ...parts: Array<Segment|string>) => sentence(
  needs,
  ...parts.map((part)=>typeof part === "string" ? text(part) : part),
);

const promptBank: Record<string, EchoPrompt[]> = {
  "iitomo2-ch1":[
    p(["(お)ちゃ"],item("(お)ちゃ"),"。"),
    p(["はやく","おきます"],item("はやく"),item("おきます"),"。"),
    p(["ぶかつ","おわります"],item("ぶかつ"),"が",item("おわります"),"。"),
    p(["まい日","(お)ちゃ","のみます"],item("まい日"),"、",item("(お)ちゃ"),"を",item("のみます"),"。"),
    p(["学校","うち","かえります"],item("学校"),"から",item("うち"),"に",item("かえります"),"。"),
    p(["しゅくだい","ねます"],item("しゅくだい"),"のあと、",item("ねます"),"。"),
    p(["ばんごはん","(お)ふろ","はいります"],item("ばんごはん"),"のあと、",item("(お)ふろ"),"に",item("はいります"),"。"),
  ],
  "iitomo2-ch2":[
    p(["りか"],item("りか"),"。"),
    p(["きょう","えいご"],item("きょう"),"は",item("えいご"),"です。"),
    p(["すう学","むずかしい"],item("すう学"),"は",item("むずかしい"),"です。"),
    p(["たいいく","にがて(な)"],item("たいいく"),"は",item("にがて(な)"),"です。"),
    p(["きょう","そうじ","そうじ(を)します"],item("きょう"),"、",item("そうじ"),"をします。"),
    p(["おんがく","かもく"],item("おんがく"),"がいちばんすきな",item("かもく"),"です。"),
    p(["高校","まで"],item("高校"),"はさんじまでです。"),
  ],
  "iitomo2-ch3":[
    p(["バス"],item("バス"),"。"),
    p(["あるいて","あるいて行きます"],item("あるいて"),text("行きます","いきます"),"。"),
    p(["でんしゃ"],item("でんしゃ"),"でいきます。"),
    p(["なつやすみ","バス"],item("なつやすみ"),"に",item("バス"),"でいきます。"),
    p(["ぶんかさい","えんげき"],item("ぶんかさい"),"で",item("えんげき"),"をみます。"),
    p(["しゅう学りょこう","ふゆ（冬）"],item("しゅう学りょこう"),"は",item("ふゆ（冬）"),"です。"),
    p(["にゅう学しき","三がつ"],item("にゅう学しき"),"は",item("三がつ"),"です。"),
  ],
  "iitomo2-ch4":[
    p(["つり"],item("つり"),"。"),
    p(["うたいます"],item("うたいます"),"。"),
    p(["あした","りょうり"],item("あした"),"、",item("りょうり"),"をします。"),
    p(["うみ","しゃしんをとります"],item("うみ"),"で",item("しゃしんをとります"),"。"),
    p(["さんぽします","しゅうまつに"],text("週末","しゅうまつ"),"に",item("さんぽします"),"。"),
    p(["どくしょ","ひまな時に"],"ひまな",text("時","とき"),"に",item("どくしょ"),"をします。"),
    p(["ビーチ","たくさん","しゃしんをとります"],item("ビーチ"),"で",item("たくさん"),item("しゃしんをとります"),"。"),
    p(["つり","大好き"],item("つり"),"が",item("大好き"),"です。"),
    p(["アクションえいが","好き"],item("アクションえいが"),"は",item("好き"),"です。"),
    p(["かいもの","あまり好きじゃない"],item("かいもの"),"は",item("あまり好きじゃない"),"です。"),
    p(["あした","やすみます"],item("あした"),"、",item("やすみます"),"。"),
    p(["おべんとう","つくります"],item("おべんとう"),"を",item("つくります"),"。"),
  ],
  "iitomo2-ch5":[
    p(["耳"],item("耳"),"。"),
    p(["せがたかい"],"せがたかいです。"),
    p(["かみ(の毛)","ながい"],item("かみ(の毛)"),"が",item("ながい"),"です。"),
    p(["キャラクター","つよい"],"この",item("キャラクター"),"は",item("つよい"),"です。"),
    p(["コスプレ","じょうずに","できます"],item("コスプレ"),"がじょうずに",item("できます"),"。"),
    p(["まい年","アニメ","ふく","きます"],item("まい年"),item("アニメ"),"の",item("ふく"),"を",item("きます"),"。"),
    p(["キャラクター","しっぽ","みじかい"],"この",item("キャラクター"),"は",item("しっぽ"),"が",item("みじかい"),"です。"),
  ],
  "iitomo2-ch6":[
    p(["はなび"],item("はなび"),"。"),
    p(["たこやき"],item("たこやき"),"です。"),
    p(["ゆかた","たいせつ(な)"],item("ゆかた"),"は",item("たいせつ(な)"),"です。"),
    p(["みんなで","(お)いわいします"],item("みんなで"),"おいわいします。"),
    p(["パーティー","こんでいました"],item("パーティー"),"はこんでいました。"),
    p(["わたあめ","つめたい"],item("わたあめ"),"は",item("つめたい"),"です。"),
    p(["プレゼント","もらいます"],item("プレゼント"),"をもらいます。"),
  ],
  "iitomo2-tourism":[
    p(["ホテル"],item("ホテル"),"。"),
    p(["ホテル","人気があります"],item("ホテル"),"は",item("人気があります"),"。"),
    p(["しんりんよく","ストレス","へらします"],item("しんりんよく"),"で",item("ストレス"),"を",item("へらします"),"。"),
    p(["ヨガ","エネルギー","上げます"],item("ヨガ"),"で",item("エネルギー"),"を",item("上げます"),"。"),
    p(["いなか","ゆっくりする"],item("いなか"),"でゆっくりします。"),
    p(["自然","リラックスします"],item("自然"),"のなかで",item("リラックスします"),"。"),
    p(["りょかん","にわ","めいそう"],item("りょかん"),"の",item("にわ"),"で",item("めいそう"),"します。"),
  ],
};

function shuffled<T>(values: T[]) {
  const copy=[...values];
  for(let index=copy.length-1;index>0;index-=1){
    const swap=Math.floor(Math.random()*(index+1));
    [copy[index],copy[swap]]=[copy[swap],copy[index]];
  }
  return copy;
}

const kanaLength = (value: string) => Array.from(value.replace(/[^\p{Script=Hiragana}\p{Script=Katakana}ー]/gu,"")).length;

function buildEchoRound(packId: string, groups: VocabularyGroup[], patterns: string[]) {
  const vocabulary=groups.flatMap((group)=>group.items);
  const selected=new Set([...vocabulary,...patterns]);
  const bareWords=shuffled(vocabulary).map((word)=>p([word],item(word),"。"));
  const curated=(promptBank[packId]??[]).filter((prompt)=>prompt.needs.every((need)=>selected.has(need)) && kanaLength(prompt.kana)<20);
  const first=bareWords[0] ?? p([],"よくきいてください。"), firstItem=vocabulary[0] ?? "日本語";
  const supplements: EchoPrompt[] = [
    p([firstItem],"これは",item(firstItem),"です。"),
    p([firstItem],item(firstItem),"をよくきいてください。"),
    p([firstItem],"もういちど、",item(firstItem),"。"),
    p([firstItem],item(firstItem),"ですか。"),
  ];
  const chosen: EchoPrompt[]=[first];
  const addUnique=(prompt:EchoPrompt)=>{
    if(chosen.length<5 && kanaLength(prompt.kana)<20 && !chosen.some((candidate)=>candidate.kana===prompt.kana))chosen.push(prompt);
  };
  const richPrompt=shuffled(curated.filter((prompt)=>prompt.parts.some((part)=>part.reading)))[0];
  if(richPrompt)addUnique(richPrompt);
  shuffled(curated).forEach(addUnique);
  shuffled(supplements).forEach(addUnique);
  bareWords.slice(1).forEach(addUnique);
  while(chosen.length<5)chosen.push(supplements[chosen.length%supplements.length]);
  return chosen.sort((left,right)=>kanaLength(left.kana)-kanaLength(right.kana));
}

function PromptText({ prompt, mode }:{prompt:EchoPrompt;mode:DisplayMode}) {
  if(mode==="kana")return <>{prompt.kana}</>;
  return <>{prompt.parts.map((part,index)=>part.reading
    ? <ruby key={`${part.text}-${index}`}>{part.text}<rp>（</rp><rt>{part.reading}</rt><rp>）</rp></ruby>
    : <span key={`${part.text}-${index}`}>{part.text}</span>)}</>;
}

export default function FaultyEchoGame({ packId, packName, groups, patterns, onClose }: Props) {
  const [mode,setMode]=useState<DisplayMode>("kana");
  const [phase,setPhase]=useState<"setup"|"playing"|"complete">("setup");
  const [echoIndex,setEchoIndex]=useState(0);
  const initialPrompts=useMemo(()=>buildEchoRound(packId,groups,patterns),[packId,groups,patterns]);
  const [prompts,setPrompts]=useState<EchoPrompt[]>(initialPrompts);
  const prompt=prompts[echoIndex];

  const startRound=()=>{setEchoIndex(0);setPhase("playing");};
  const nextEcho=()=>{
    if(echoIndex>=prompts.length-1){setPhase("complete");return;}
    setEchoIndex((current)=>current+1);
  };
  const newRound=()=>{setPrompts(buildEchoRound(packId,groups,patterns));setEchoIndex(0);setPhase("playing");};

  return <div className="fe-portal" role="dialog" aria-modal="true" aria-label="Faulty Echo classroom game">
    <header className="fe-topbar">
      <div className="fe-brand"><span aria-hidden="true"><Ear size={24}/></span><div><strong>Faulty Echo</strong><small>{packName} · 5 listening prompts</small></div></div>
      <div className="fe-top-actions">{phase!=="setup"&&<button type="button" onClick={()=>setPhase("setup")}><RotateCcw size={17}/><span>Rules</span></button>}<button type="button" className="fe-close" onClick={onClose} aria-label="Close Faulty Echo"><X size={21}/></button></div>
    </header>

    {phase==="setup"&&<main className="fe-setup-stage">
      <section className="fe-start-panel" aria-labelledby="fe-title">
        <div className="fe-start-copy"><p>LISTENING GAME · 5 ECHOES</p><h1 id="fe-title">Listen carefully. Echo only if it is correct!</h1><span>Each round grows gently from a short word or phrase to a sentence under 20 kana.</span></div>
        <ol className="fe-rules">
          <li><b>1</b><div><strong>Say the model once</strong><span>Read the sentence on screen clearly.</span></div></li>
          <li><b>2</b><div><strong>Give an echo</strong><span>Repeat it exactly, or quietly change one detail.</span></div></li>
          <li><b>3</b><div><strong>Students decide</strong><span>They repeat only a correct echo. For a faulty echo, they stay silent or show a gesture.</span></div></li>
          <li><b>4</b><div><strong>Move on</strong><span>Discuss the changed part if needed, then press Next Echo.</span></div></li>
        </ol>
        <fieldset className="fe-format"><legend>Sentence display</legend><button type="button" className={mode==="kana"?"selected":""} aria-pressed={mode==="kana"} onClick={()=>setMode("kana")}><span>かな</span><div><strong>Kana only</strong><small>Fast, uncluttered reading</small></div></button><button type="button" className={mode==="furigana"?"selected":""} aria-pressed={mode==="furigana"} onClick={()=>setMode("furigana")}><span><ruby>学校<rt>がっこう</rt></ruby></span><div><strong>Kanji + furigana</strong><small>Show readings above kanji</small></div></button></fieldset>
        <button type="button" className="fe-start" onClick={startRound}>Start 5 echoes <ArrowRight size={20}/></button>
      </section>
    </main>}

    {phase==="playing"&&<main className="fe-game-stage">
      <section className="fe-progress" aria-label={`Echo ${echoIndex+1} of ${prompts.length}`}><div><small>ROUND PROGRESS</small><strong>Echo {echoIndex+1} <span>of {prompts.length}</span></strong></div><div className="fe-dots" aria-hidden="true">{prompts.map((_,index)=><i className={index<echoIndex?"done":index===echoIndex?"current":""} key={index}/>)}</div><span>{kanaLength(prompt.kana)} kana</span></section>
      <section className="fe-echo-card" aria-live="polite">
        <p>MODEL SENTENCE · ECHO {String(echoIndex+1).padStart(2,"0")}</p>
        <h1 className={kanaLength(prompt.kana)>15?"long":kanaLength(prompt.kana)>10?"medium":""}><PromptText prompt={prompt} mode={mode}/></h1>
        <div className="fe-teacher-cue"><span>Teacher chooses:</span><b className="same"><Check size={17}/> Same sentence</b><i>or</i><b className="change"><XCircle size={17}/> Change one detail</b></div>
      </section>
      <section className="fe-game-controls"><div><strong>Read the model, then give your echo.</strong><span>Students repeat only when every word matches.</span></div><button type="button" onClick={nextEcho}>{echoIndex===prompts.length-1?"Finish round":"Next Echo"}<ArrowRight size={21}/></button></section>
    </main>}

    {phase==="complete"&&<main className="fe-complete-stage"><section className="fe-complete-card"><span aria-hidden="true"><Check size={38}/></span><p>ROUND COMPLETE</p><h1>Five sharp listens!</h1><div><button type="button" onClick={newRound}><RefreshCw size={18}/> New 5 echoes</button><button type="button" onClick={()=>setPhase("setup")}><RotateCcw size={18}/> Back to rules</button></div></section></main>}
  </div>;
}
