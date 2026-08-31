"use client";

import {
  ArrowRight, BookOpenText, Check,
  Layers3, MessageCircleMore, Move3D, Play, Presentation,
  Brain, Gavel, MessagesSquare, UsersRound, X, PencilLine, Target, PackageOpen,
  Clock3, Moon, Palette, Puzzle, Shapes, Sun, Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { generateActivity, type GeneratedActivity } from "./generator";
import PresentationPortal from "./PresentationPortal";
import ReadMyMindGame from "./ReadMyMindGame";
import DelayedDictationGame from "./DelayedDictationGame";
import TugOfWarGame from "./TugOfWarGame";
import { wordPacks } from "./wordPacks";

type Activity = {
  id:string; title:string; shortTitle:string; description:string;
  category:string; time:string; icon:typeof MessageCircleMore; tone:string; stage:StageId;
};

type StageId = "listening"|"reading"|"writing"|"speaking";
type ThemeMode = "light"|"dark";

const lessonStages:{id:StageId;number:string;name:string;purpose:string;tone:string}[] = [
  {id:"listening",number:"01",name:"Input by Listening",purpose:"Hear and understand language",tone:"blue"},
  {id:"reading",number:"02",name:"Input by Reading",purpose:"Read and process meaning",tone:"cyan"},
  {id:"writing",number:"03",name:"Production by Writing",purpose:"Create language in writing",tone:"orange"},
  {id:"speaking",number:"04",name:"Production by Speaking",purpose:"Use language aloud",tone:"rose"},
];

const vocabularyGroupVisuals:Record<string,{icon:typeof Shapes;tone:string;description:string}> = {
  nouns:{icon:Shapes,tone:"sky",description:"People, places and things"},
  verbs:{icon:Zap,tone:"mint",description:"Actions and routines"},
  adjectives:{icon:Palette,tone:"peach",description:"Describing words"},
  expressions:{icon:MessageCircleMore,tone:"pink",description:"Useful classroom phrases"},
  "adverbs-time":{icon:Clock3,tone:"lavender",description:"Time, frequency and manner"},
};

const activities:Activity[] = [
  { id:"read-my-mind", title:"Read My Mind", shortTitle:"Read My Mind", description:"Sensei secretly chooses one answer. Students predict, listen to clues, change their minds, then see the reveal.", category:"Input by Listening", time:"5–8 min", icon:Brain, tone:"purple", stage:"listening" },
  { id:"faulty-echo", title:"Faulty Echo", shortTitle:"Faulty Echo", description:"Students echo the model only when what they hear is accurate, noticing tiny changes in familiar language.", category:"Input by Listening", time:"3–6 min", icon:Check, tone:"blue", stage:"listening" },
  { id:"delayed-dictation", title:"Delayed Dictation", shortTitle:"Delayed Dictation", description:"Listen to a hidden sentence, hold it in memory, write it from recall, then self-correct against the model.", category:"Input by Listening", time:"5–8 min", icon:PencilLine, tone:"indigo", stage:"listening" },
  { id:"karuta", title:"Karuta", shortTitle:"Karuta", description:"Race to identify the correct card from a spoken word, clue or sentence before anyone else.", category:"Input by Listening", time:"5–10 min", icon:Target, tone:"rose", stage:"listening" },
  { id:"narrow-listening", title:"Narrow Listening", shortTitle:"Narrow Listening", description:"Listen to several highly similar mini-texts and detect the small details that change.", category:"Input by Listening", time:"8–12 min", icon:Presentation, tone:"cyan", stage:"listening" },
  { id:"true-false", title:"True or false", shortTitle:"True or False", description:"Listen to familiar-language statements and decide whether each is true.", category:"Input by Listening", time:"5–8 min", icon:Check, tone:"blue", stage:"listening" },
  { id:"story-listening", title:"Story listening", shortTitle:"Story Listening", description:"Provide controlled, understandable input with prediction and gesture.", category:"Input by Listening", time:"10–15 min", icon:Presentation, tone:"rose", stage:"listening" },
  { id:"listen-draw", title:"Listen and draw", shortTitle:"Listen & Draw", description:"Students listen for familiar vocabulary and turn meaning into a drawing.", category:"Input by Listening", time:"8–12 min", icon:PencilLine, tone:"cyan", stage:"listening" },

  { id:"sentence-chaos", title:"Sentence Chaos", shortTitle:"Sentence Chaos", description:"Reconstruct scrambled chunks into meaningful, grammatically valid sentences.", category:"Input by Reading", time:"5–8 min", icon:Layers3, tone:"orange", stage:"reading" },
  { id:"sentence-maze", title:"Sentence Maze", shortTitle:"Sentence Maze", description:"Navigate a path through sentence chunks while avoiding plausible distractors.", category:"Input by Reading", time:"6–10 min", icon:Move3D, tone:"green", stage:"reading" },
  { id:"find-intruder", title:"Find the Intruder", shortTitle:"Find Intruder", description:"Choose the item that does not belong, then justify the category or language pattern.", category:"Input by Reading", time:"5–8 min", icon:Target, tone:"amber", stage:"reading" },
  { id:"reading-bingo", title:"Reading Bingo", shortTitle:"Reading Bingo", description:"Match written target language to meanings, clues or spoken prompts on a bingo grid.", category:"Input by Reading", time:"8–12 min", icon:Check, tone:"sky", stage:"reading" },
  { id:"lesson-focus", title:"Guided reading", shortTitle:"Guided Reading", description:"Read the target language together and identify the key meaning.", category:"Input by Reading", time:"5–8 min", icon:Target, tone:"indigo", stage:"reading" },
  { id:"read-discuss", title:"Read and discuss", shortTitle:"Read & Discuss", description:"Process familiar written language, then connect it to personal meaning.", category:"Input by Reading", time:"10–15 min", icon:BookOpenText, tone:"amber", stage:"reading" },

  { id:"one-pen-one-dice", title:"One Pen One Dice", shortTitle:"One Pen One Dice", description:"One student writes while the other rolls; hitting the target number steals the pen and reverses roles.", category:"Production by Writing", time:"8–12 min", icon:PencilLine, tone:"green", stage:"writing" },
  { id:"pyramid-translation", title:"Pyramid Translation", shortTitle:"Pyramid", description:"Translate increasingly long lines that repeatedly recycle the same core chunks.", category:"Production by Writing", time:"8–12 min", icon:Layers3, tone:"purple", stage:"writing" },
  { id:"sentence-race", title:"Sentence Race", shortTitle:"Sentence Race", description:"Build an accurate sentence from timed keywords, meanings or image prompts.", category:"Production by Writing", time:"5–10 min", icon:ArrowRight, tone:"rose", stage:"writing" },
  { id:"running-dictation", title:"Running Dictation", shortTitle:"Running Dictation", description:"Runners memorise target-language stations and dictate them to a partner writer.", category:"Production by Writing", time:"10–15 min", icon:Move3D, tone:"cyan", stage:"writing" },
  { id:"sentence-auction", title:"Sentence Auction", shortTitle:"Sentence Auction", description:"Teams bid imaginary money on whether sentences are correct, then repair errors for bonus points.", category:"Production by Writing", time:"10–15 min", icon:Gavel, tone:"orange", stage:"writing" },
  { id:"question-ladder", title:"Question ladder", shortTitle:"Question Ladder", description:"Build increasingly independent written responses from a clear scaffold.", category:"Production by Writing", time:"6–10 min", icon:Layers3, tone:"green", stage:"writing" },
  { id:"exit-ticket", title:"Exit ticket", shortTitle:"Exit Ticket", description:"Write one concise piece of evidence showing what was learned.", category:"Production by Writing", time:"3–5 min", icon:ArrowRight, tone:"slate", stage:"writing" },

  { id:"sentence-stealer", title:"Sentence Stealer", shortTitle:"Sentence Stealer", description:"Students secretly choose sentences, mingle and steal matches through repeated speaking.", category:"Production by Speaking", time:"5–10 min", icon:UsersRound, tone:"purple", stage:"speaking" },
  { id:"tug-of-war", title:"Tug-of-War Vocabulary Game", shortTitle:"Tug-of-War", description:"Four starting kana begin in the centre. Drag the matching kana toward the team whenever they give a correct Word Pack item.", category:"Production by Speaking", time:"8–12 min", icon:Move3D, tone:"pink", stage:"speaking" },
  { id:"trapdoor", title:"Trapdoor", shortTitle:"Trapdoor", description:"Guess a partner's hidden sentence-builder route; one wrong choice sends you back to the start.", category:"Production by Speaking", time:"8–12 min", icon:Layers3, tone:"orange", stage:"speaking" },
  { id:"oral-ping-pong", title:"Oral Ping-Pong", shortTitle:"Oral Ping-Pong", description:"Pairs rally rapidly between prompts and responses, keeping familiar language moving aloud.", category:"Production by Speaking", time:"5–8 min", icon:MessageCircleMore, tone:"sky", stage:"speaking" },
  { id:"battleships", title:"Battleships", shortTitle:"Battleships", description:"Attack hidden grid coordinates by producing complete target-language questions or sentences.", category:"Production by Speaking", time:"10–15 min", icon:Target, tone:"blue", stage:"speaking" },
  { id:"janken-evolution", title:"Janken Evolution", shortTitle:"Janken Evolution", description:"Students mingle, complete a target-language exchange, then evolve through stages by winning janken.", category:"Production by Speaking", time:"8–12 min", icon:Move3D, tone:"green", stage:"speaking" },
  { id:"pqa", title:"Personal questions", shortTitle:"Personal Questions", description:"Create personal relevance through a genuine class conversation.", category:"Production by Speaking", time:"8–12 min", icon:MessageCircleMore, tone:"sky", stage:"speaking" },
  { id:"special-person", title:"Special person interview", shortTitle:"Special Person", description:"Interview a class member, then retell what was learned.", category:"Production by Speaking", time:"12–18 min", icon:UsersRound, tone:"purple", stage:"speaking" },
  { id:"co-created-story", title:"Co-created story", shortTitle:"Class Story", description:"Introduce and recycle language through bounded student choices.", category:"Production by Speaking", time:"15–25 min", icon:MessagesSquare, tone:"orange", stage:"speaking" },
  { id:"four-corners", title:"Four corners", shortTitle:"Four Corners", description:"Use target-language choices in a visible whole-class movement task.", category:"Production by Speaking", time:"8–12 min", icon:Move3D, tone:"pink", stage:"speaking" },
];

export default function Home(){
  const [packId,setPackId]=useState(wordPacks[0].id);
  const [selectedVocabulary,setSelectedVocabulary]=useState<string[]>(()=>[...wordPacks[0].vocabulary]);
  const [selectedPatterns,setSelectedPatterns]=useState<string[]>(()=>[...wordPacks[0].patterns]);
  const yearLevel="8";
  const support="Developing";
  const duration="10–15 minutes";
  const participation="Whole class";
  const energy="calm";
  const [selected,setSelected]=useState<Activity|null>(null);
  const [generated,setGenerated]=useState<GeneratedActivity|null>(null);
  const [presentationOpen,setPresentationOpen]=useState(false);
  const [readMyMindOpen,setReadMyMindOpen]=useState(false);
  const [delayedDictationOpen,setDelayedDictationOpen]=useState(false);
  const [tugOfWarOpen,setTugOfWarOpen]=useState(false);
  const [memoryDelay,setMemoryDelay]=useState(5);
  const [theme,setTheme]=useState<ThemeMode>("light");

  const activePack=wordPacks.find((pack)=>pack.id===packId)??wordPacks[0];
  const selectedCount=selectedVocabulary.length+selectedPatterns.length;
  const totalPackItems=activePack.vocabulary.length+activePack.patterns.length;
  const vocabulary=(selectedVocabulary.length>0?selectedVocabulary:selectedPatterns).join("、");
  const grammar=selectedPatterns.join("／");
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
      if(event.key==="Escape"&&!presentationOpen&&!readMyMindOpen&&!delayedDictationOpen&&!tugOfWarOpen)setSelected(null);
    };
    window.addEventListener("keydown",close);
    return()=>window.removeEventListener("keydown",close);
  },[presentationOpen,readMyMindOpen,delayedDictationOpen,tugOfWarOpen]);

  const createActivity=()=>{
    if(!selected||selectedCount===0)return;
    if(selected.id==="read-my-mind"){
      setSelected(null);
      setReadMyMindOpen(true);
      return;
    }
    if(selected.id==="delayed-dictation"){
      setSelected(null);
      setDelayedDictationOpen(true);
      return;
    }
    if(selected.id==="tug-of-war"){
      if(selectedVocabulary.length===0)return;
      setSelected(null);
      setTugOfWarOpen(true);
      return;
    }
    const created=generateActivity({activityId:selected.id,activityTitle:selected.title,vocabulary,grammar,yearLevel,support,duration,participation,energy});
    setGenerated(created);
    setSelected(null);
    setPresentationOpen(true);
  };

  const SelectedIcon=selected?.icon??Target;
  const selectedLanguageCount=selected?.id==="tug-of-war"?selectedVocabulary.length:selectedCount;
  const launchLabel=selected?.id==="read-my-mind"?"Launch Read My Mind":selected?.id==="delayed-dictation"?"Launch Delayed Dictation":selected?.id==="tug-of-war"?"Launch Tug-of-War":"Build and launch slides";

  return <main className="ipad-page" data-theme={theme}>
    <a className="skip-link" href="#activity-apps">Skip to activities</a>
    <div className="pastel-decor" aria-hidden="true">
      <span className="pastel-blob blob-sky"/><span className="pastel-blob blob-mint"/><span className="pastel-blob blob-peach"/><span className="pastel-blob blob-lavender"/>
    </div>
    <header className="ipad-status brand-status">
      <div className="brand-lockup" aria-label="Gamify — Language Activity Studio">
        <span className="brand-mark" aria-hidden="true"><span>G</span><i/></span>
        <span className="brand-copy"><strong>Gamify</strong><small>Language Activity Studio</small></span>
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
            <label className="pack-picker"><span>Choose pack</span><select className="pack-select" value={packId} onChange={(event)=>choosePack(event.target.value)}>{wordPacks.map((pack)=><option key={pack.id} value={pack.id}>{pack.name}</option>)}</select></label>
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
              <header className="pack-section-heading"><span className="pos-icon pattern-icon" aria-hidden="true"><Puzzle size={16}/></span><div><h3 id="pack-patterns-title">Target patterns</h3><small>Sentence frames and grammar</small></div><span>{selectedPatterns.length}/{activePack.patterns.length}</span></header>
              <div className="language-chip-grid">{activePack.patterns.map((item)=>{const isSelected=selectedPatterns.includes(item);return <button type="button" className={`language-chip pattern-chip ${isSelected?"selected":""}`} aria-pressed={isSelected} key={item} onClick={()=>toggleLanguageItem("patterns",item)}>{isSelected&&<Check size={13} aria-hidden="true"/>}<span>{item}</span></button>;})}</div>
            </section>
          </div>
        </article>
      </aside>

      <section className="apps-area" id="activity-apps" aria-labelledby="apps-title">
        <h1 className="visually-hidden" id="apps-title">Gamify learning modes</h1>
        <div className="lesson-stage-grid">
          {lessonStages.map((stage)=><section className={`lesson-stage stage-${stage.tone}`} key={stage.id} aria-labelledby={`stage-${stage.id}`}><header><span className="stage-index"><small>Stage</small><b>{stage.number}</b></span><div><h2 id={`stage-${stage.id}`}>{stage.name}</h2><p>{stage.purpose}</p></div></header><div className="stage-activities">
            {activities.filter((activity)=>activity.stage===stage.id).map((activity)=>{const Icon=activity.icon;return <button className="stage-activity" key={activity.id} onClick={()=>setSelected(activity)} aria-label={`Create ${activity.title}`}><span className={`app-icon app-${activity.tone}`}><Icon size={24}/><i/></span><span><strong>{activity.shortTitle}</strong><small>{activity.time}</small></span></button>;})}
          </div></section>)}
        </div>
      </section>
    </section>

    {selected&&<div className="modal-backdrop app-modal-backdrop" onMouseDown={(event)=>{if(event.target===event.currentTarget)setSelected(null);}}><section className="launch-sheet" role="dialog" aria-modal="true" aria-labelledby="launch-title">
      <button className="sheet-close" onClick={()=>setSelected(null)} aria-label="Close"><X size={20}/></button>
      <header className="launch-identity"><div className={`app-icon app-${selected.tone}`}><SelectedIcon size={34}/><i/></div><div><p className="sheet-category">{selected.category} · {selected.time}</p><h2 id="launch-title">{selected.title}</h2></div></header>
      <p className="launch-description">{selected.description}</p>
      <section className="launch-config" aria-label="Selected language">
        <div className="language-preview"><small>{activePack.name} · {selectedLanguageCount} selected</small><strong>{selectedVocabulary.length>0?`${selectedVocabulary.slice(0,8).join("、")}${selectedVocabulary.length>8?" …":""}`:selected?.id==="tug-of-war"?"Choose at least one vocabulary item":selectedPatterns.slice(0,6).join("、")||"Choose at least one language item"}</strong>{selected?.id!=="tug-of-war"&&selectedPatterns.length>0&&<span>{selectedPatterns.slice(0,4).join("／")}{selectedPatterns.length>4?" …":""}</span>}</div>
        {selected.id==="delayed-dictation"&&<div className="dd-launch-setting"><div><strong>Memory delay</strong><small>How long students must hold the sentence before writing.</small></div><div className="dd-delay-options">{[3,5,8,10].map((delay)=><button type="button" key={delay} className={memoryDelay===delay?"selected":""} aria-pressed={memoryDelay===delay} onClick={()=>setMemoryDelay(delay)}>{delay} sec</button>)}</div></div>}
        {selected.id==="tug-of-war"&&<div className="tow-launch-note"><UsersRound size={19}/><div><strong>Teacher-controlled team board</strong><small>Four different starting kana are drawn from the vocabulary selected in this Word Pack.</small></div></div>}
      </section>
      <button className="launch-button" onClick={createActivity} disabled={selectedLanguageCount===0}><Play size={19}/> {launchLabel} <ArrowRight size={19}/></button>
    </section></div>}

    {presentationOpen&&generated&&<PresentationPortal activity={generated} onClose={()=>setPresentationOpen(false)}/>} 
    {readMyMindOpen&&<ReadMyMindGame options={readMyMindOptions} onClose={()=>setReadMyMindOpen(false)}/>} 
    {delayedDictationOpen&&<DelayedDictationGame packId={activePack.id} groups={delayedDictationGroups} patterns={selectedPatterns} memoryDelay={memoryDelay} onClose={()=>setDelayedDictationOpen(false)}/>} 
    {tugOfWarOpen&&<TugOfWarGame items={selectedVocabulary} packName={activePack.name} onClose={()=>setTugOfWarOpen(false)}/>}
    <footer className="legal-note">Gamify · Classroom-ready language activities organised by input and production mode.</footer>
  </main>;
}
