"use client";

import {
  ArrowRight, BookOpenText, Check, Languages,
  Layers3, MessageCircleMore, Move3D, Play, Presentation,
  Sparkles, Trash2, UsersRound, WandSparkles, X, PencilLine, Target, PackageOpen,
} from "lucide-react";
import { useEffect, useState } from "react";
import { generateActivity, type GeneratedActivity } from "./generator";
import PresentationPortal from "./PresentationPortal";
import { wordPacks } from "./wordPacks";

type Activity = {
  id:string; title:string; shortTitle:string; description:string;
  category:string; time:string; icon:typeof MessageCircleMore; tone:string; stage:StageId;
};

type StageId = "listening"|"reading"|"writing"|"speaking";

const lessonStages:{id:StageId;number:string;name:string;purpose:string;tone:string}[] = [
  {id:"listening",number:"01",name:"Input by Listening",purpose:"Hear and understand language",tone:"blue"},
  {id:"reading",number:"02",name:"Input by Reading",purpose:"Read and process meaning",tone:"cyan"},
  {id:"writing",number:"03",name:"Production by Writing",purpose:"Create language in writing",tone:"orange"},
  {id:"speaking",number:"04",name:"Production by Speaking",purpose:"Use language aloud",tone:"rose"},
];

const activities:Activity[] = [
  { id:"read-my-mind", title:"Read My Mind", shortTitle:"Read My Mind", description:"Students predict the teacher's hidden choice, then refine their guess from repeated target-language clues.", category:"Input by Listening", time:"5–8 min", icon:Sparkles, tone:"purple", stage:"listening" },
  { id:"faulty-echo", title:"Faulty Echo", shortTitle:"Faulty Echo", description:"Students echo the model only when what they hear is accurate, noticing tiny changes in familiar language.", category:"Input by Listening", time:"3–6 min", icon:Check, tone:"blue", stage:"listening" },
  { id:"delayed-dictation", title:"Delayed Dictation", shortTitle:"Delayed Dictation", description:"Listen, hold a phrase in memory for a short delay, then reconstruct it in writing.", category:"Input by Listening", time:"5–8 min", icon:PencilLine, tone:"indigo", stage:"listening" },
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
  { id:"sentence-auction", title:"Sentence Auction", shortTitle:"Sentence Auction", description:"Teams bid imaginary money on whether sentences are correct, then repair errors for bonus points.", category:"Production by Writing", time:"10–15 min", icon:Sparkles, tone:"orange", stage:"writing" },
  { id:"question-ladder", title:"Question ladder", shortTitle:"Question Ladder", description:"Build increasingly independent written responses from a clear scaffold.", category:"Production by Writing", time:"6–10 min", icon:Layers3, tone:"green", stage:"writing" },
  { id:"exit-ticket", title:"Exit ticket", shortTitle:"Exit Ticket", description:"Write one concise piece of evidence showing what was learned.", category:"Production by Writing", time:"3–5 min", icon:ArrowRight, tone:"slate", stage:"writing" },

  { id:"sentence-stealer", title:"Sentence Stealer", shortTitle:"Sentence Stealer", description:"Students secretly choose sentences, mingle and steal matches through repeated speaking.", category:"Production by Speaking", time:"5–10 min", icon:UsersRound, tone:"purple", stage:"speaking" },
  { id:"trapdoor", title:"Trapdoor", shortTitle:"Trapdoor", description:"Guess a partner's hidden sentence-builder route; one wrong choice sends you back to the start.", category:"Production by Speaking", time:"8–12 min", icon:Layers3, tone:"orange", stage:"speaking" },
  { id:"oral-ping-pong", title:"Oral Ping-Pong", shortTitle:"Oral Ping-Pong", description:"Pairs rally rapidly between prompts and responses, keeping familiar language moving aloud.", category:"Production by Speaking", time:"5–8 min", icon:MessageCircleMore, tone:"sky", stage:"speaking" },
  { id:"battleships", title:"Battleships", shortTitle:"Battleships", description:"Attack hidden grid coordinates by producing complete target-language questions or sentences.", category:"Production by Speaking", time:"10–15 min", icon:Target, tone:"blue", stage:"speaking" },
  { id:"janken-evolution", title:"Janken Evolution", shortTitle:"Janken Evolution", description:"Students mingle, complete a target-language exchange, then evolve through stages by winning janken.", category:"Production by Speaking", time:"8–12 min", icon:Move3D, tone:"green", stage:"speaking" },
  { id:"pqa", title:"Personal questions", shortTitle:"Personal Questions", description:"Create personal relevance through a genuine class conversation.", category:"Production by Speaking", time:"8–12 min", icon:MessageCircleMore, tone:"sky", stage:"speaking" },
  { id:"special-person", title:"Special person interview", shortTitle:"Special Person", description:"Interview a class member, then retell what was learned.", category:"Production by Speaking", time:"12–18 min", icon:UsersRound, tone:"purple", stage:"speaking" },
  { id:"co-created-story", title:"Co-created story", shortTitle:"Class Story", description:"Introduce and recycle language through bounded student choices.", category:"Production by Speaking", time:"15–25 min", icon:WandSparkles, tone:"orange", stage:"speaking" },
  { id:"four-corners", title:"Four corners", shortTitle:"Four Corners", description:"Use target-language choices in a visible whole-class movement task.", category:"Production by Speaking", time:"8–12 min", icon:Move3D, tone:"pink", stage:"speaking" },
];

export default function Home(){
  const [packId,setPackId]=useState(wordPacks[0].id);
  const [selectedVocabulary,setSelectedVocabulary]=useState<string[]>(()=>[...wordPacks[0].vocabulary]);
  const [selectedPatterns,setSelectedPatterns]=useState<string[]>(()=>[...wordPacks[0].patterns]);
  const yearLevel="8";
  const support="Developing";
  const duration="10–15 minutes";
  const [participation,setParticipation]=useState("Whole class");
  const [energy,setEnergy]=useState("calm");
  const [selected,setSelected]=useState<Activity|null>(null);
  const [generated,setGenerated]=useState<GeneratedActivity|null>(null);
  const [presentationOpen,setPresentationOpen]=useState(false);
  const [tray,setTray]=useState<GeneratedActivity[]>([]);
  const [trayOpen,setTrayOpen]=useState(false);

  const activePack=wordPacks.find((pack)=>pack.id===packId)??wordPacks[0];
  const selectedCount=selectedVocabulary.length+selectedPatterns.length;
  const totalPackItems=activePack.vocabulary.length+activePack.patterns.length;
  const vocabulary=(selectedVocabulary.length>0?selectedVocabulary:selectedPatterns).join("、");
  const grammar=selectedPatterns.join("／");

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

  const selectAllItems=()=>{
    setSelectedVocabulary([...activePack.vocabulary]);
    setSelectedPatterns([...activePack.patterns]);
  };

  const clearItems=()=>{
    setSelectedVocabulary([]);
    setSelectedPatterns([]);
  };

  useEffect(()=>{
    const restore=window.setTimeout(()=>{
      const stored=window.localStorage.getItem("lesson-lab-tray");
      if(stored){try{const parsed=JSON.parse(stored) as GeneratedActivity[];setTray(parsed.filter((item)=>item.activityId&&item.targetVocabulary));}catch{/* Ignore invalid local data. */}}
    },0);
    const close=(event:KeyboardEvent)=>{if(event.key==="Escape"&&!presentationOpen){setSelected(null);setTrayOpen(false);}};
    window.addEventListener("keydown",close);
    return()=>{window.clearTimeout(restore);window.removeEventListener("keydown",close);};
  },[presentationOpen]);

  const saveTray=(next:GeneratedActivity[])=>{
    setTray(next);
    window.localStorage.setItem("lesson-lab-tray",JSON.stringify(next));
  };

  const createActivity=()=>{
    if(!selected||selectedCount===0)return;
    const created=generateActivity({activityId:selected.id,activityTitle:selected.title,vocabulary,grammar,yearLevel,support,duration,participation,energy});
    setGenerated(created);
    saveTray([created,...tray.filter((item)=>item.id!==created.id)].slice(0,8));
    setSelected(null);
    setPresentationOpen(true);
  };

  const SelectedIcon=selected?.icon??Sparkles;
  return <main className="ipad-page">
    <a className="skip-link" href="#activity-apps">Skip to activities</a>
    <header className="ipad-status brand-status">
      <div className="brand-lockup" aria-label="Gamify — Language Activity Studio">
        <span className="brand-mark" aria-hidden="true"><span>G</span><i/></span>
        <span className="brand-copy"><strong>Gamify</strong><small>Language Activity Studio</small></span>
      </div>
    </header>

    <section className="home-screen">
      <aside className="widget-column word-pack-column" aria-label="Word pack">
        <article className="word-pack-widget">
          <header className="word-pack-header">
            <div className="word-pack-title">
              <span className="word-pack-icon" aria-hidden="true"><PackageOpen size={24}/></span>
              <div><small>WORD PACK</small><h2>{activePack.name}</h2><p>Select the language used in every game mode.</p></div>
            </div>
            <label className="pack-picker"><span>Choose pack</span><select className="pack-select" value={packId} onChange={(event)=>choosePack(event.target.value)}>{wordPacks.map((pack)=><option key={pack.id} value={pack.id}>{pack.name}</option>)}</select></label>
          </header>

          <div className="pack-toolbar">
            <span><strong>{selectedCount}</strong> of {totalPackItems} selected</span>
            <div><button type="button" onClick={selectAllItems}>Select all</button><button type="button" onClick={clearItems}>Clear</button></div>
          </div>

          <div className="pack-groups">
            <section className="pack-group" aria-labelledby="pack-vocabulary-title">
              <header><h3 id="pack-vocabulary-title">Vocabulary</h3><span>{selectedVocabulary.length}/{activePack.vocabulary.length}</span></header>
              <div className="language-chip-grid">{activePack.vocabulary.map((item)=>{const isSelected=selectedVocabulary.includes(item);return <button type="button" className={`language-chip ${isSelected?"selected":""}`} aria-pressed={isSelected} key={item} onClick={()=>toggleLanguageItem("vocabulary",item)}>{isSelected&&<Check size={13} aria-hidden="true"/>}<span>{item}</span></button>;})}</div>
            </section>
            <section className="pack-group" aria-labelledby="pack-patterns-title">
              <header><h3 id="pack-patterns-title">Target patterns</h3><span>{selectedPatterns.length}/{activePack.patterns.length}</span></header>
              <div className="language-chip-grid">{activePack.patterns.map((item)=>{const isSelected=selectedPatterns.includes(item);return <button type="button" className={`language-chip ${isSelected?"selected":""}`} aria-pressed={isSelected} key={item} onClick={()=>toggleLanguageItem("patterns",item)}>{isSelected&&<Check size={13} aria-hidden="true"/>}<span>{item}</span></button>;})}</div>
            </section>
          </div>
        </article>
      </aside>

      <section className="apps-area" id="activity-apps" aria-labelledby="apps-title">
        <div className="apps-heading"><div><p>LANGUAGE LEARNING</p><h1 id="apps-title">Choose by learning mode</h1></div><span>Every activity opens as a live classroom deck</span></div>
        <div className="lesson-stage-grid">
          {lessonStages.map((stage)=><section className={`lesson-stage stage-${stage.tone}`} key={stage.id} aria-labelledby={`stage-${stage.id}`}><header><span className="stage-index"><small>Stage</small><b>{stage.number}</b></span><div><h2 id={`stage-${stage.id}`}>{stage.name}</h2><p>{stage.purpose}</p></div></header><div className="stage-activities">
            {activities.filter((activity)=>activity.stage===stage.id).map((activity)=>{const Icon=activity.icon;return <button className="stage-activity" key={activity.id} onClick={()=>setSelected(activity)} aria-label={`Create ${activity.title}`}><span className={`app-icon app-${activity.tone}`}><Icon size={24}/><i/></span><span><strong>{activity.shortTitle}</strong><small>{activity.time}</small></span></button>;})}
          </div></section>)}
        </div>
      </section>
    </section>

    <div className="page-dots" aria-hidden="true"><i className="active"/><i/></div>
    <nav className="ipad-dock" aria-label="Quick actions">
      <button onClick={()=>document.querySelector<HTMLSelectElement>(".pack-select")?.focus()}><span className="dock-icon dock-language"><Languages size={25}/></span><small>Word pack</small></button>
      <button className="dock-launch" disabled={!generated} onClick={()=>generated&&setPresentationOpen(true)}><span className="dock-icon dock-play"><Play size={26}/></span><small>Last activity</small></button>
      <button onClick={()=>setTrayOpen(true)}><span className="dock-icon dock-tray"><Layers3 size={25}/>{tray.length>0&&<b>{tray.length}</b>}</span><small>Saved</small></button>
    </nav>

    {selected&&<div className="modal-backdrop app-modal-backdrop" onMouseDown={(event)=>{if(event.target===event.currentTarget)setSelected(null);}}><section className="launch-sheet" role="dialog" aria-modal="true" aria-labelledby="launch-title">
      <button className="sheet-close" onClick={()=>setSelected(null)} aria-label="Close"><X size={20}/></button>
      <header className="launch-identity"><div className={`app-icon app-${selected.tone}`}><SelectedIcon size={34}/><i/></div><div><p className="sheet-category">{selected.category} · {selected.time}</p><h2 id="launch-title">{selected.title}</h2></div></header>
      <p className="launch-description">{selected.description}</p>
      <section className="launch-config" aria-label="Activity setup"><div className="language-preview"><small>{activePack.name} · {selectedCount} selected</small><strong>{selectedVocabulary.length>0?`${selectedVocabulary.slice(0,8).join("、")}${selectedVocabulary.length>8?" …":""}`:selectedPatterns.slice(0,6).join("、")||"Choose at least one language item"}</strong>{selectedPatterns.length>0&&<span>{selectedPatterns.slice(0,4).join("／")}{selectedPatterns.length>4?" …":""}</span>}</div><div className="setup-heading"><span>Classroom setup</span><small>Adjust before launching</small></div>
      <div className="sheet-options"><label>Participation<select value={participation} onChange={(event)=>setParticipation(event.target.value)}><option>Whole class</option><option>Pairs</option><option>Small groups</option></select></label><label>Energy<select value={energy} onChange={(event)=>setEnergy(event.target.value)}><option value="calm">Calm and focused</option><option value="active">Active and playful</option></select></label></div></section>
      <button className="launch-button" onClick={createActivity} disabled={selectedCount===0}><Play size={19}/> Build and launch slides <ArrowRight size={19}/></button>
    </section></div>}

    {trayOpen&&<div className="drawer-backdrop" onMouseDown={(event)=>{if(event.target===event.currentTarget)setTrayOpen(false);}}><aside className="tray-drawer"><div className="tray-heading"><div><p>RECENT DECKS</p><h2>Saved activities</h2></div><button className="sheet-close" onClick={()=>setTrayOpen(false)} aria-label="Close"><X size={20}/></button></div>{!tray.length?<div className="tray-empty"><Layers3 size={30}/><h3>No activities yet</h3><p>Activities appear here automatically after you launch them.</p></div>:<div className="saved-decks">{tray.map((item)=><article key={item.id}><button className="saved-main" onClick={()=>{setGenerated(item);setTrayOpen(false);setPresentationOpen(true);}}><span><Presentation size={19}/></span><div><strong>{item.title}</strong><small>{item.subtitle}</small></div><Play size={18}/></button><button className="delete-deck" onClick={()=>saveTray(tray.filter((entry)=>entry.id!==item.id))} aria-label={`Delete ${item.title}`}><Trash2 size={16}/></button></article>)}</div>}</aside></div>}

    {presentationOpen&&generated&&<PresentationPortal activity={generated} onClose={()=>setPresentationOpen(false)}/>} 
    <footer className="legal-note">Gamify · Classroom-ready language activities organised by input and production mode.</footer>
  </main>;
}
