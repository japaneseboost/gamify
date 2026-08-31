"use client";

import {
  ArrowRight, BookOpenText, Check, Languages,
  Layers3, MessageCircleMore, Move3D, Play, Presentation,
  Sparkles, Trash2, UsersRound, WandSparkles, X, PencilLine, Target,
} from "lucide-react";
import { useEffect, useState } from "react";
import { generateActivity, type GeneratedActivity } from "./generator";
import PresentationPortal from "./PresentationPortal";

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
  { id:"true-false", title:"True or false", shortTitle:"True or False", description:"Listen to familiar-language statements and decide whether each is true.", category:"Input by Listening", time:"5–8 min", icon:Check, tone:"blue", stage:"listening" },
  { id:"story-listening", title:"Story listening", shortTitle:"Story Listening", description:"Provide controlled, understandable input with prediction and gesture.", category:"Input by Listening", time:"10–15 min", icon:Presentation, tone:"rose", stage:"listening" },
  { id:"listen-draw", title:"Listen and draw", shortTitle:"Listen & Draw", description:"Students listen for familiar vocabulary and turn meaning into a drawing.", category:"Input by Listening", time:"8–12 min", icon:PencilLine, tone:"cyan", stage:"listening" },
  { id:"lesson-focus", title:"Guided reading", shortTitle:"Guided Reading", description:"Read the target language together and identify the key meaning.", category:"Input by Reading", time:"5–8 min", icon:Target, tone:"indigo", stage:"reading" },
  { id:"read-discuss", title:"Read and discuss", shortTitle:"Read & Discuss", description:"Process familiar written language, then connect it to personal meaning.", category:"Input by Reading", time:"10–15 min", icon:BookOpenText, tone:"amber", stage:"reading" },
  { id:"question-ladder", title:"Question ladder", shortTitle:"Question Ladder", description:"Build increasingly independent written responses from a clear scaffold.", category:"Production by Writing", time:"6–10 min", icon:Layers3, tone:"green", stage:"writing" },
  { id:"exit-ticket", title:"Exit ticket", shortTitle:"Exit Ticket", description:"Write one concise piece of evidence showing what was learned.", category:"Production by Writing", time:"3–5 min", icon:ArrowRight, tone:"slate", stage:"writing" },
  { id:"pqa", title:"Personal questions", shortTitle:"Personal Questions", description:"Create personal relevance through a genuine class conversation.", category:"Production by Speaking", time:"8–12 min", icon:MessageCircleMore, tone:"sky", stage:"speaking" },
  { id:"special-person", title:"Special person interview", shortTitle:"Special Person", description:"Interview a class member, then retell what was learned.", category:"Production by Speaking", time:"12–18 min", icon:UsersRound, tone:"purple", stage:"speaking" },
  { id:"co-created-story", title:"Co-created story", shortTitle:"Class Story", description:"Introduce and recycle language through bounded student choices.", category:"Production by Speaking", time:"15–25 min", icon:WandSparkles, tone:"orange", stage:"speaking" },
  { id:"four-corners", title:"Four corners", shortTitle:"Four Corners", description:"Use target-language choices in a visible whole-class movement task.", category:"Production by Speaking", time:"8–12 min", icon:Move3D, tone:"pink", stage:"speaking" },
];

export default function Home(){
  const [vocabulary,setVocabulary]=useState("学校、先生、数学、体育、好き、きらい");
  const [grammar,setGrammar]=useState("～が好きです／～が好きじゃないです");
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
    if(!selected||!vocabulary.trim())return;
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
      <aside className="widget-column" aria-label="Target language widgets">
        <article className="language-widget vocabulary-widget">
          <div className="widget-heading"><span>Vocabulary</span><small>Tap to edit</small></div>
          <textarea value={vocabulary} onChange={(event)=>setVocabulary(event.target.value)} aria-label="Main vocabulary"/>
          <div className="widget-footer"><span>{vocabulary.split(/[、,\n]/).filter(Boolean).length} items</span><Languages size={16}/></div>
        </article>
        <article className="language-widget grammar-widget">
          <div className="widget-heading"><span>Target pattern</span><small>One is best</small></div>
          <textarea value={grammar} onChange={(event)=>setGrammar(event.target.value)} aria-label="Target grammar or sentence pattern"/>
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
      <button onClick={()=>document.querySelector<HTMLTextAreaElement>(".vocabulary-widget textarea")?.focus()}><span className="dock-icon dock-language"><Languages size={25}/></span><small>Language</small></button>
      <button className="dock-launch" disabled={!generated} onClick={()=>generated&&setPresentationOpen(true)}><span className="dock-icon dock-play"><Play size={26}/></span><small>Last activity</small></button>
      <button onClick={()=>setTrayOpen(true)}><span className="dock-icon dock-tray"><Layers3 size={25}/>{tray.length>0&&<b>{tray.length}</b>}</span><small>Saved</small></button>
    </nav>

    {selected&&<div className="modal-backdrop app-modal-backdrop" onMouseDown={(event)=>{if(event.target===event.currentTarget)setSelected(null);}}><section className="launch-sheet" role="dialog" aria-modal="true" aria-labelledby="launch-title">
      <button className="sheet-close" onClick={()=>setSelected(null)} aria-label="Close"><X size={20}/></button>
      <header className="launch-identity"><div className={`app-icon app-${selected.tone}`}><SelectedIcon size={34}/><i/></div><div><p className="sheet-category">{selected.category} · {selected.time}</p><h2 id="launch-title">{selected.title}</h2></div></header>
      <p className="launch-description">{selected.description}</p>
      <section className="launch-config" aria-label="Activity setup"><div className="language-preview"><small>Target language</small><strong>{vocabulary||"Add vocabulary first"}</strong>{grammar&&<span>{grammar}</span>}</div><div className="setup-heading"><span>Classroom setup</span><small>Adjust before launching</small></div>
      <div className="sheet-options"><label>Participation<select value={participation} onChange={(event)=>setParticipation(event.target.value)}><option>Whole class</option><option>Pairs</option><option>Small groups</option></select></label><label>Energy<select value={energy} onChange={(event)=>setEnergy(event.target.value)}><option value="calm">Calm and focused</option><option value="active">Active and playful</option></select></label></div></section>
      <button className="launch-button" onClick={createActivity} disabled={!vocabulary.trim()}><Play size={19}/> Build and launch slides <ArrowRight size={19}/></button>
    </section></div>}


    {trayOpen&&<div className="drawer-backdrop" onMouseDown={(event)=>{if(event.target===event.currentTarget)setTrayOpen(false);}}><aside className="tray-drawer"><div className="tray-heading"><div><p>RECENT DECKS</p><h2>Saved activities</h2></div><button className="sheet-close" onClick={()=>setTrayOpen(false)} aria-label="Close"><X size={20}/></button></div>{!tray.length?<div className="tray-empty"><Layers3 size={30}/><h3>No activities yet</h3><p>Activities appear here automatically after you launch them.</p></div>:<div className="saved-decks">{tray.map((item)=><article key={item.id}><button className="saved-main" onClick={()=>{setGenerated(item);setTrayOpen(false);setPresentationOpen(true);}}><span><Presentation size={19}/></span><div><strong>{item.title}</strong><small>{item.subtitle}</small></div><Play size={18}/></button><button className="delete-deck" onClick={()=>saveTray(tray.filter((entry)=>entry.id!==item.id))} aria-label={`Delete ${item.title}`}><Trash2 size={16}/></button></article>)}</div>}</aside></div>}

    {presentationOpen&&generated&&<PresentationPortal activity={generated} onClose={()=>setPresentationOpen(false)}/>} 
    <footer className="legal-note">Gamify · Classroom-ready language activities organised by input and production mode.</footer>
  </main>;
}
