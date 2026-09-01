"use client";

import Image from "next/image";
import gamifyLogo from "../public/gamify-logo.png";
import {
  Armchair, ArrowRight, Brush, Check, ChevronRight, MessageCircleMore, Move3D, Play,
  Brain, UsersRound, X, PencilLine, Target, PackageOpen,
  CircleDot, Clock3, Eraser, EyeOff, Flame, ListChecks, Moon, Mountain, Palette, Puzzle, Shapes, Sun, Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import ReadMyMindGame from "./ReadMyMindGame";
import DelayedDictationGame from "./DelayedDictationGame";
import TugOfWarGame from "./TugOfWarGame";
import FaultyEchoGame from "./FaultyEchoGame";
import QuickfireGame from "./QuickfireGame";
import EraseGame from "./EraseGame";
import BalloonPopGame from "./BalloonPopGame";
import VolcanoGame from "./VolcanoGame";
import DrawOrActGame from "./DrawOrActGame";
import PassTheBombGame from "./PassTheBombGame";
import WhatsMissingGame from "./WhatsMissingGame";
import HotSeatGame from "./HotSeatGame";
import { wordPacks, wordPackSeries } from "./wordPacks";

type Activity = {
  id:string; title:string; shortTitle:string; description:string;
  category:string; time:string; icon:typeof MessageCircleMore; tone:string; stage:StageId;
  rules:string[];
};

type StageId = "listening"|"reading"|"writing"|"speaking"|"retrieval";
type ThemeMode = "light"|"dark";

const lessonStages:{id:StageId;number:string;name:string;purpose:string;tone:string}[] = [
  {id:"listening",number:"01",name:"Input by Listening",purpose:"Hear and understand language",tone:"blue"},
  {id:"reading",number:"02",name:"Input by Reading",purpose:"Read and process meaning",tone:"cyan"},
  {id:"writing",number:"03",name:"Production by Writing",purpose:"Create language in writing",tone:"orange"},
  {id:"speaking",number:"04",name:"Production by Speaking",purpose:"Use language aloud",tone:"rose"},
  {id:"retrieval",number:"05",name:"Retrieval Practice",purpose:"Recall and strengthen prior learning",tone:"violet"},
];

const vocabularyGroupVisuals:Record<string,{icon:typeof Shapes;tone:string;description:string}> = {
  nouns:{icon:Shapes,tone:"sky",description:"People, places and things"},
  verbs:{icon:Zap,tone:"mint",description:"Actions and routines"},
  adjectives:{icon:Palette,tone:"peach",description:"Describing words"},
  expressions:{icon:MessageCircleMore,tone:"pink",description:"Useful classroom phrases"},
  "adverbs-time":{icon:Clock3,tone:"lavender",description:"Time, frequency and manner"},
};

const activities:Activity[] = [
  {
    id:"quickfire", title:"Quickfire", shortTitle:"Quickfire", description:"Students race to produce the selected Japanese word or sentence, then the winner moves one step towards the front.", category:"Retrieval Practice", time:"5–10 min", icon:Flame, tone:"orange", stage:"retrieval",
    rules:["Everyone starts at the back of the classroom.","Teacher reads the English or Japanese prompt aloud.","The first correct Japanese answer wins the round.","The winner moves forward; first to the front wins."],
  },
  {
    id:"read-my-mind", title:"Read My Mind", shortTitle:"Read My Mind", description:"Sensei secretly chooses one answer. Students predict, listen to clues, change their minds, then see the reveal.", category:"Input by Reading", time:"5–8 min", icon:Brain, tone:"purple", stage:"reading",
    rules:["Teacher secretly chooses one of four answers.","Students predict using the numbered hand signals.","Give clues; students may change their prediction.","Reveal the answer and celebrate correct predictions."],
  },
  {
    id:"faulty-echo", title:"Faulty Echo", shortTitle:"Faulty Echo", description:"Students echo the model only when what they hear is accurate, noticing tiny changes in familiar language.", category:"Input by Listening", time:"3–6 min", icon:Check, tone:"blue", stage:"listening",
    rules:["Teacher reads the model sentence once.","Repeat it exactly or change one small detail.","Students echo only when the repeat is correct.","If it is faulty, stay silent and identify the change."],
  },
  {
    id:"delayed-dictation", title:"Delayed Dictation", shortTitle:"Delayed Dictation", description:"Listen to a hidden sentence, hold it in memory, write it from recall, then self-correct against the model.", category:"Production by Writing", time:"5–8 min", icon:PencilLine, tone:"indigo", stage:"writing",
    rules:["Listen to the hidden sentence twice.","Hold the whole sentence during the memory delay.","Write it from memory when the timer ends.","Reveal the model and self-correct every detail."],
  },
  {
    id:"erase-game", title:"Erase Game", shortTitle:"Erase Game", description:"Read a complete sentence, remove its chunks step by step, and keep reproducing every missing part from memory.", category:"Input by Reading", time:"5–10 min", icon:Eraser, tone:"mint", stage:"reading",
    rules:["Read the complete sentence together.","Erase or reveal one chunk using the chosen mode.","Students still say every hidden chunk from memory.","Continue until they can reproduce the whole sentence."],
  },
  {
    id:"tug-of-war", title:"Tug-of-War Vocabulary Game", shortTitle:"Tug-of-War", description:"Four starting kana begin in the centre. Drag the matching kana toward the team whenever they give a correct Word Pack item.", category:"Retrieval Practice", time:"8–12 min", icon:Move3D, tone:"pink", stage:"retrieval",
    rules:["Four starting kana begin in the centre.","A team says a Word Pack item beginning with one kana.","Teacher drags that kana one column towards the team.","First team to bring three kana home wins the round."],
  },
  {
    id:"balloon-pop", title:"Balloon Pop", shortTitle:"Balloon Pop", description:"Answer a Word Pack prompt, roll the digital die, and pop that many balloons from the opposing team before the shark gets your rider.", category:"Production by Speaking", time:"8–12 min", icon:CircleDot, tone:"blue", stage:"speaking",
    rules:["Choose turn-taking or race mode and an English or Japanese prompt.","Students answer aloud; the teacher decides which team loses the round.","Select the losing team, then roll the digital die.","The die pops that many balloons. The last team still in the sky wins."],
  },
  {
    id:"volcano", title:"Volcano", shortTitle:"Volcano", description:"Answer a Word Pack prompt, roll the special 1–3 die, and climb towards step 12 without overshooting into the lava.", category:"Retrieval Practice", time:"8–12 min", icon:Mountain, tone:"orange", stage:"retrieval",
    rules:["Choose turn-taking or race mode and an English or Japanese prompt.","Students answer aloud; the teacher selects the correct team.","Roll the special 1–3 die and move that climber up the steps.","Land exactly on step 12 to win. Go past 12 and fall into the lava."],
  },
  {
    id:"draw-or-act", title:"Draw or Act", shortTitle:"Draw or Act", description:"A student privately views one selected Word Pack item, then draws or acts while their team races to guess it in Japanese.", category:"Retrieval Practice", time:"5–10 min", icon:Brush, tone:"purple", stage:"retrieval",
    rules:["One student becomes the performer; teammates look away from the screen.","The performer holds Secret Word to privately view the selected item.","Choose Draw it or Act it without speaking, writing letters, or mouthing the answer.","The team must guess the word in Japanese before the timer ends."],
  },
  {
    id:"pass-the-bomb", title:"Pass the Bomb", shortTitle:"Pass the Bomb", description:"Answer one shared question from the chosen Word Pack, pass the imaginary bomb, and keep speaking until its hidden fuse explodes.", category:"Production by Speaking", time:"5–10 min", icon:Clock3, tone:"pink", stage:"speaking",
    rules:["Students form a circle and the teacher chooses a general Word Pack question.","The teacher lights a hidden random fuse.","Each player answers the same question in Japanese, then passes immediately.","When the ticking stops and the bomb explodes, the current holder loses the round."],
  },
  {
    id:"whats-missing", title:"What’s Missing?", shortTitle:"What’s Missing?", description:"Students memorise a wall of picture vocabulary cards, then identify what disappeared or changed after the animated curtain opens.", category:"Production by Speaking", time:"5–10 min", icon:EyeOff, tone:"purple", stage:"speaking",
    rules:["Study 8–12 picture vocabulary cards for ten seconds.","An animated curtain closes while Gamify changes the board.","The curtain opens with one or two cards missing, moved, changed, or hidden.","Students say what changed in Japanese; reveal the answer, then start another round."],
  },
  {
    id:"hot-seat", title:"Hot Seat", shortTitle:"Hot Seat", description:"One student faces away from the screen while teammates describe each Japanese and English Word Pack item without saying or spelling it.", category:"Production by Speaking", time:"5–10 min", icon:Armchair, tone:"orange", stage:"speaking",
    rules:["Choose Team A or Team B and seat one student with their back to the screen.","Teammates describe the displayed Japanese and English item without saying, translating, spelling, or mouthing it.","Use Pass, Next (wrong), or Next (correct) to move through the Word Pack.","Each correct answer adds one point to the active team. Score as many as possible in 60 seconds."],
  },
];

export default function Home(){
  const [packId,setPackId]=useState(wordPacks[0].id);
  const [selectedVocabulary,setSelectedVocabulary]=useState<string[]>(()=>[...wordPacks[0].vocabulary]);
  const [selectedPatterns,setSelectedPatterns]=useState<string[]>(()=>[...wordPacks[0].patterns]);
  const [selected,setSelected]=useState<Activity|null>(null);
  const [readMyMindOpen,setReadMyMindOpen]=useState(false);
  const [quickfireOpen,setQuickfireOpen]=useState(false);
  const [faultyEchoOpen,setFaultyEchoOpen]=useState(false);
  const [delayedDictationOpen,setDelayedDictationOpen]=useState(false);
  const [eraseGameOpen,setEraseGameOpen]=useState(false);
  const [tugOfWarOpen,setTugOfWarOpen]=useState(false);
  const [balloonPopOpen,setBalloonPopOpen]=useState(false);
  const [volcanoOpen,setVolcanoOpen]=useState(false);
  const [drawOrActOpen,setDrawOrActOpen]=useState(false);
  const [passTheBombOpen,setPassTheBombOpen]=useState(false);
  const [whatsMissingOpen,setWhatsMissingOpen]=useState(false);
  const [hotSeatOpen,setHotSeatOpen]=useState(false);
  const [memoryDelay,setMemoryDelay]=useState(5);
  const [theme,setTheme]=useState<ThemeMode>("light");

  const activePack=wordPacks.find((pack)=>pack.id===packId)??wordPacks[0];
  const selectedCount=selectedVocabulary.length+selectedPatterns.length;
  const totalPackItems=activePack.vocabulary.length+activePack.patterns.length;
  const allPatternsSelected=activePack.patterns.length>0&&activePack.patterns.every((item)=>selectedPatterns.includes(item));
  const selectedNouns=activePack.vocabularyGroups.find((group)=>group.id==="nouns")?.items.filter((item)=>selectedVocabulary.includes(item))??[];
  const readMyMindOptions=selectedNouns.length>=4?selectedNouns:(selectedVocabulary.length>=4?selectedVocabulary:activePack.vocabulary);
  const delayedDictationGroups=activePack.vocabularyGroups.map((group)=>({...group,items:group.items.filter((item)=>selectedVocabulary.includes(item))})).filter((group)=>group.items.length>0);

  const choosePack=(nextPackId:string)=>{
    const nextPack=wordPacks.find((pack)=>pack.id===nextPackId)??wordPacks[0];
    setPackId(nextPack.id);
    setSelectedVocabulary([...nextPack.vocabulary]);
    setSelectedPatterns([...nextPack.patterns]);
  };

  const toggleLanguageItem=(group:"vocabulary"|"patterns",item:string)=>{
    const update=group==="vocabulary"?setSelectedVocabulary:setSelectedPatterns;
    update((current)=>current.includes(item)?current.filter((value)=>value!==item):[...current,item]);
  };

  const toggleVocabularyGroup=(items:string[])=>{
    setSelectedVocabulary((current)=>{
      const allSelected=items.every((item)=>current.includes(item));
      if(allSelected)return current.filter((item)=>!items.includes(item));
      return [...current,...items.filter((item)=>!current.includes(item))];
    });
  };

  const toggleAllPatterns=()=>{
    setSelectedPatterns((current)=>activePack.patterns.every((item)=>current.includes(item))?[]:[...activePack.patterns]);
  };

  const selectAllItems=()=>{
    setSelectedVocabulary([...activePack.vocabulary]);
    setSelectedPatterns([...activePack.patterns]);
  };

  const clearItems=()=>{
    setSelectedVocabulary([]);
    setSelectedPatterns([]);
  };

  useEffect(()=>{
    setTheme(document.documentElement.dataset.theme==="dark"?"dark":"light");
  },[]);

  const toggleTheme=()=>{
    setTheme((current)=>{
      const next:ThemeMode=current==="light"?"dark":"light";
      document.documentElement.dataset.theme=next;
      try{window.localStorage.setItem("gamify-theme",next);}catch{}
      return next;
    });
  };

  useEffect(()=>{
    const close=(event:KeyboardEvent)=>{
      if(event.key==="Escape"&&!readMyMindOpen&&!quickfireOpen&&!faultyEchoOpen&&!delayedDictationOpen&&!eraseGameOpen&&!tugOfWarOpen&&!balloonPopOpen&&!volcanoOpen&&!drawOrActOpen&&!passTheBombOpen&&!whatsMissingOpen&&!hotSeatOpen)setSelected(null);
    };
    window.addEventListener("keydown",close);
    return()=>window.removeEventListener("keydown",close);
  },[readMyMindOpen,quickfireOpen,faultyEchoOpen,delayedDictationOpen,eraseGameOpen,tugOfWarOpen,balloonPopOpen,volcanoOpen,drawOrActOpen,passTheBombOpen,whatsMissingOpen,hotSeatOpen]);

  const createActivity=()=>{
    if(!selected||(selected.id!=="pass-the-bomb"&&selectedCount===0))return;
    if(selected.id==="quickfire"){
      if(selectedVocabulary.length===0)return;
      setSelected(null);
      setQuickfireOpen(true);
      return;
    }
    if(selected.id==="read-my-mind"){
      setSelected(null);
      setReadMyMindOpen(true);
      return;
    }
    if(selected.id==="faulty-echo"){
      if(selectedVocabulary.length===0)return;
      setSelected(null);
      setFaultyEchoOpen(true);
      return;
    }
    if(selected.id==="delayed-dictation"){
      setSelected(null);
      setDelayedDictationOpen(true);
      return;
    }
    if(selected.id==="erase-game"){
      if(selectedVocabulary.length===0)return;
      setSelected(null);
      setEraseGameOpen(true);
      return;
    }
    if(selected.id==="tug-of-war"){
      if(selectedVocabulary.length===0)return;
      setSelected(null);
      setTugOfWarOpen(true);
      return;
    }
    if(selected.id==="balloon-pop"){
      if(selectedVocabulary.length===0)return;
      setSelected(null);
      setBalloonPopOpen(true);
      return;
    }
    if(selected.id==="volcano"){
      if(selectedVocabulary.length===0)return;
      setSelected(null);
      setVolcanoOpen(true);
      return;
    }
    if(selected.id==="draw-or-act"){
      if(selectedVocabulary.length===0)return;
      setSelected(null);
      setDrawOrActOpen(true);
      return;
    }
    if(selected.id==="pass-the-bomb"){
      setSelected(null);
      setPassTheBombOpen(true);
      return;
    }
    if(selected.id==="whats-missing"){
      if(selectedVocabulary.length<8)return;
      setSelected(null);
      setWhatsMissingOpen(true);
      return;
    }
    if(selected.id==="hot-seat"){
      if(selectedVocabulary.length===0)return;
      setSelected(null);
      setHotSeatOpen(true);
      return;
    }
  };

  const SelectedIcon=selected?.icon??Target;
  const vocabularyOnlyActivities=["quickfire","faulty-echo","erase-game","tug-of-war","balloon-pop","volcano","draw-or-act","whats-missing","hot-seat"];
  const selectedLanguageCount=selected?.id==="pass-the-bomb"?1:selected&&vocabularyOnlyActivities.includes(selected.id)?selectedVocabulary.length:selectedCount;
  const canLaunchSelected=selectedLanguageCount>0&&(selected?.id!=="whats-missing"||selectedVocabulary.length>=8);
  const launchLabel=selected?.id==="quickfire"?"Launch Quickfire":selected?.id==="read-my-mind"?"Launch Read My Mind":selected?.id==="faulty-echo"?"Launch Faulty Echo":selected?.id==="delayed-dictation"?"Launch Delayed Dictation":selected?.id==="erase-game"?"Launch Erase Game":selected?.id==="tug-of-war"?"Launch Tug-of-War":selected?.id==="balloon-pop"?"Launch Balloon Pop":selected?.id==="volcano"?"Launch Volcano":selected?.id==="draw-or-act"?"Launch Draw or Act":selected?.id==="pass-the-bomb"?"Launch Pass the Bomb":selected?.id==="whats-missing"?"Launch What’s Missing?":selected?.id==="hot-seat"?"Launch Hot Seat":"Launch activity";

  return <main className="ipad-page" data-theme={theme}>
    <a className="skip-link" href="#activity-apps">Skip to activities</a>
    <div className="pastel-decor" aria-hidden="true">
      <span className="pastel-blob blob-sky"/><span className="pastel-blob blob-mint"/><span className="pastel-blob blob-peach"/><span className="pastel-blob blob-lavender"/>
    </div>
    <header className="ipad-status brand-status">
      <div className="brand-lockup brand-image-lockup">
        <Image
          className="brand-logo-image"
          src={gamifyLogo}
          alt="Gamify — Language Activity Studio"
          loading="eager"
          sizes="(max-width: 680px) 180px, 230px"
        />
      </div>
      <button type="button" className="theme-toggle" onClick={toggleTheme} aria-pressed={theme==="dark"} aria-label={`Switch to ${theme==="light"?"dark":"light"} mode`}>
        <span aria-hidden="true">{theme==="light"?<Moon size={19}/>:<Sun size={19}/>}</span>
        <strong>{theme==="light"?"Dark mode":"Light mode"}</strong>
      </button>
    </header>

    <section className="home-screen">
      <aside className="widget-column word-pack-column" aria-label="Word pack">
        <article className="word-pack-widget">
          <header className="word-pack-header">
            <div className="word-pack-title">
              <span className="word-pack-icon" aria-hidden="true"><PackageOpen size={24}/></span>
              <div><small>WORD PACK</small><h2>{activePack.name}</h2><p>Build the language set for today&apos;s games.</p></div>
            </div>
            <section className="pack-series-catalog" aria-labelledby="pack-series-title">
              <header><span id="pack-series-title">Series</span><small>Add their vocabulary when you send it later.</small></header>
              <ul>
                {wordPackSeries.map((series)=><li className={series.status==="available"?"available":"awaiting"} key={series.id}>
                  <strong>{series.name}</strong>
                  <small>{series.status==="available"?`${series.packCount} word packs`:"Awaiting words"}</small>
                </li>)}
              </ul>
            </section>
            <label className="pack-picker"><span>Choose word pack</span><select className="pack-select" value={packId} onChange={(event)=>choosePack(event.target.value)}>{wordPackSeries.map((series)=>{const seriesPacks=wordPacks.filter((pack)=>pack.seriesId===series.id);if(seriesPacks.length===0)return null;return <optgroup label={`${series.name} · ${seriesPacks.length} word packs`} key={series.id}>{seriesPacks.map((pack)=><option key={pack.id} value={pack.id}>{pack.name}</option>)}</optgroup>;})}</select></label>
          </header>

          <div className="pack-toolbar">
            <span className="selection-summary"><i aria-hidden="true"><Check size={12}/></i><strong>{selectedCount}</strong> of {totalPackItems} ready</span>
            <div><button type="button" onClick={selectAllItems}>Select all</button><button type="button" onClick={clearItems}>Clear</button></div>
          </div>

          <div className="pack-groups">
            <section className="pack-group vocabulary-library" aria-labelledby="pack-vocabulary-title">
              <header className="pack-section-heading"><div><h3 id="pack-vocabulary-title">Vocabulary library</h3><small>Grouped by how each word works</small></div><span>{selectedVocabulary.length}/{activePack.vocabulary.length}</span></header>
              <div className="pos-vocabulary-groups">
                {activePack.vocabularyGroups.map((group)=>{
                  const selectedInGroup=group.items.filter((item)=>selectedVocabulary.includes(item)).length;
                  const allSelected=selectedInGroup===group.items.length;
                  const visual=vocabularyGroupVisuals[group.id]??vocabularyGroupVisuals.nouns;
                  const GroupIcon=visual.icon;
                  return <section className={`pos-group pos-${visual.tone}`} key={group.id} aria-labelledby={`pos-${activePack.id}-${group.id}`}>
                    <header><span className="pos-icon" aria-hidden="true"><GroupIcon size={16}/></span><div className="pos-copy"><h4 id={`pos-${activePack.id}-${group.id}`}>{group.label}</h4><small>{visual.description}</small></div><div className="pos-group-actions"><span className="pos-count">{selectedInGroup}/{group.items.length}</span><button type="button" className="pos-toggle" onClick={()=>toggleVocabularyGroup(group.items)} aria-label={`${allSelected?"Deselect":"Select"} all ${group.label.toLowerCase()} words`}>{allSelected?"Deselect all":"Select all"}</button></div></header>
                    <div className="language-chip-grid">{group.items.map((item)=>{const isSelected=selectedVocabulary.includes(item);return <button type="button" className={`language-chip ${isSelected?"selected":""}`} aria-pressed={isSelected} key={item} onClick={()=>toggleLanguageItem("vocabulary",item)}>{isSelected&&<Check size={13} aria-hidden="true"/>}<span>{item}</span></button>;})}</div>
                  </section>;
                })}
              </div>
            </section>
            <section className="pack-group pattern-library" aria-labelledby="pack-patterns-title">
              <header className="pack-section-heading"><span className="pos-icon pattern-icon" aria-hidden="true"><Puzzle size={16}/></span><div><h3 id="pack-patterns-title">Target patterns</h3><small>Sentence frames and grammar</small></div><div className="pos-group-actions"><span className="pos-count">{selectedPatterns.length}/{activePack.patterns.length}</span><button type="button" className="pos-toggle" onClick={toggleAllPatterns} aria-label={`${allPatternsSelected?"Deselect":"Select"} all target patterns`}>{allPatternsSelected?"Deselect all":"Select all"}</button></div></header>
              <div className="language-chip-grid">{activePack.patterns.map((item)=>{const isSelected=selectedPatterns.includes(item);return <button type="button" className={`language-chip pattern-chip ${isSelected?"selected":""}`} aria-pressed={isSelected} key={item} onClick={()=>toggleLanguageItem("patterns",item)}>{isSelected&&<Check size={13} aria-hidden="true"/>}<span>{item}</span></button>;})}</div>
            </section>
          </div>
        </article>
      </aside>

      <section className="apps-area" id="activity-apps" aria-labelledby="apps-title">
        <h1 className="visually-hidden" id="apps-title">Gamify learning modes</h1>
        <div className="lesson-stage-grid">
          {lessonStages.map((stage)=>{const stageActivities=activities.filter((activity)=>activity.stage===stage.id);if(stageActivities.length===0)return null;return <section className={`lesson-stage stage-${stage.tone}`} key={stage.id} aria-labelledby={`stage-${stage.id}`}><header><span className="stage-index"><small>Stage</small><b>{stage.number}</b></span><div><h2 id={`stage-${stage.id}`}>{stage.name}</h2><p>{stage.purpose}</p></div></header><div className="stage-activities">
            {stageActivities.map((activity)=>{const Icon=activity.icon;return <button className="stage-activity" key={activity.id} onClick={()=>setSelected(activity)} aria-label={`Create ${activity.title}`}><span className={`app-icon app-${activity.tone}`}><Icon size={24}/><i/></span><span className="activity-copy"><strong>{activity.shortTitle}</strong><small>{activity.time}</small></span><ChevronRight className="activity-chevron" size={18} aria-hidden="true"/></button>;})}
          </div></section>;})}
        </div>
      </section>
    </section>

    {selected&&<div className="modal-backdrop app-modal-backdrop" onMouseDown={(event)=>{if(event.target===event.currentTarget)setSelected(null);}}><section className="launch-sheet" role="dialog" aria-modal="true" aria-labelledby="launch-title">
      <button className="sheet-close" onClick={()=>setSelected(null)} aria-label="Close"><X size={20}/></button>
      <header className="launch-identity"><div className={`app-icon app-${selected.tone}`}><SelectedIcon size={34}/><i/></div><div><p className="sheet-category">{selected.category} · {selected.time}</p><h2 id="launch-title">{selected.title}</h2></div></header>
      <p className="launch-description">{selected.description}</p>
      <section className={`launch-rules launch-rules-${selected.tone}`} aria-labelledby="launch-rules-title">
        <header><span aria-hidden="true"><ListChecks size={18}/></span><div><small>HOW TO PLAY</small><h3 id="launch-rules-title">Game rules</h3></div></header>
        <ol>{selected.rules.map((rule,index)=><li key={rule}><b aria-hidden="true">{index+1}</b><span>{rule}</span></li>)}</ol>
      </section>
      {(selected.id==="delayed-dictation"||selected.id==="tug-of-war")&&<section className="launch-config" aria-label="Launch settings">
        {selected.id==="delayed-dictation"&&<div className="dd-launch-setting"><div><strong>Memory delay</strong><small>How long students must hold the sentence before writing.</small></div><div className="dd-delay-options">{[3,5,8,10].map((delay)=><button type="button" key={delay} className={memoryDelay===delay?"selected":""} aria-pressed={memoryDelay===delay} onClick={()=>setMemoryDelay(delay)}>{delay} sec</button>)}</div></div>}
        {selected.id==="tug-of-war"&&<div className="tow-launch-note"><UsersRound size={19}/><div><strong>Teacher-controlled team board</strong><small>Four different starting kana are drawn from the vocabulary selected in this Word Pack.</small></div></div>}
      </section>}
      {selected.id==="whats-missing"&&selectedVocabulary.length<8&&<p className="launch-requirement" role="status">Select at least 8 vocabulary words to play.</p>}
      <button className="launch-button" onClick={createActivity} disabled={!canLaunchSelected}><Play size={19}/> {launchLabel} <ArrowRight size={19}/></button>
    </section></div>}

    {readMyMindOpen&&<ReadMyMindGame options={readMyMindOptions} onClose={()=>setReadMyMindOpen(false)}/>}
    {quickfireOpen&&<QuickfireGame packId={activePack.id} packName={activePack.name} groups={delayedDictationGroups} patterns={selectedPatterns} onClose={()=>setQuickfireOpen(false)}/>}
    {faultyEchoOpen&&<FaultyEchoGame packId={activePack.id} packName={activePack.name} groups={delayedDictationGroups} patterns={selectedPatterns} onClose={()=>setFaultyEchoOpen(false)}/>}
    {delayedDictationOpen&&<DelayedDictationGame packId={activePack.id} groups={delayedDictationGroups} patterns={selectedPatterns} memoryDelay={memoryDelay} onClose={()=>setDelayedDictationOpen(false)}/>}
    {eraseGameOpen&&<EraseGame packId={activePack.id} packName={activePack.name} groups={delayedDictationGroups} patterns={selectedPatterns} onClose={()=>setEraseGameOpen(false)}/>}
    {tugOfWarOpen&&<TugOfWarGame items={selectedVocabulary} packName={activePack.name} onClose={()=>setTugOfWarOpen(false)}/>}
    {balloonPopOpen&&<BalloonPopGame items={selectedVocabulary} packName={activePack.name} onClose={()=>setBalloonPopOpen(false)}/>}
    {volcanoOpen&&<VolcanoGame items={selectedVocabulary} packName={activePack.name} onClose={()=>setVolcanoOpen(false)}/>}
    {drawOrActOpen&&<DrawOrActGame items={selectedVocabulary} packName={activePack.name} onClose={()=>setDrawOrActOpen(false)}/>}
    {passTheBombOpen&&<PassTheBombGame packId={activePack.id} packName={activePack.name} onClose={()=>setPassTheBombOpen(false)}/>}
    {whatsMissingOpen&&<WhatsMissingGame items={selectedVocabulary} packName={activePack.name} onClose={()=>setWhatsMissingOpen(false)}/>}
    {hotSeatOpen&&<HotSeatGame items={selectedVocabulary} packName={activePack.name} onClose={()=>setHotSeatOpen(false)}/>}
    <footer className="legal-note">Gamify · Classroom-ready language activities organised by input and production mode.</footer>
  </main>;
}
