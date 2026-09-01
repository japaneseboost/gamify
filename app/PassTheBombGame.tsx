"use client";

import {
  MessageCircleQuestion,
  RefreshCw,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  packId: string;
  packName: string;
  onClose: () => void;
};

type FuseState = "idle" | "running" | "exploded";

const questionBank:Record<string,string[]> = {
  "iitomo2-ch1":[
    "まい日、何時におきますか。",
    "学校のあと、何をしますか。",
    "ばんごはんは何時に食べますか。",
  ],
  "iitomo2-ch2":[
    "いちばん好きなかもくは何ですか。",
    "学校は何時から何時までですか。",
    "にがてなかもくは何ですか。",
  ],
  "iitomo2-ch3":[
    "学校に何で行きますか。",
    "いちばん好きな学校のイベントは何ですか。",
    "休みにどこに行きますか。",
  ],
  "iitomo2-ch4":[
    "しゅうまつに何をしましたか。",
    "ひまな時に何をしますか。",
    "休みにどこに行きましたか。",
  ],
  "iitomo2-ch5":[
    "好きなキャラクターはどんなキャラクターですか。",
    "どんなアニメが好きですか。",
    "どんな人がにんきがありますか。",
  ],
  "iitomo2-ch6":[
    "おまつりで何をしましたか。",
    "パーティーで何を食べましたか。",
    "どんなプレゼントをもらいましたか。",
  ],
  "iitomo2-tourism":[
    "どんなツーリズムが好きですか。",
    "旅行でどうやってリラックスしますか。",
    "けんこうのために何をしますか。",
  ],
};

const fallbackQuestions=[
  "しゅうまつに何をしましたか。",
  "好きなものについて話してください。",
  "このごろ、何をしましたか。",
];

function chooseQuestion(questions:string[],previous=""){
  const alternatives=questions.filter((question)=>question!==previous);
  const source=alternatives.length?alternatives:questions;
  return source[Math.floor(Math.random()*source.length)]??fallbackQuestions[0];
}

function makeNoise(context:AudioContext,duration:number){
  const length=Math.floor(context.sampleRate*duration);
  const buffer=context.createBuffer(1,length,context.sampleRate);
  const channel=buffer.getChannelData(0);
  for(let index=0;index<length;index+=1)channel[index]=Math.random()*2-1;
  return buffer;
}

function playMechanicalTick(context:AudioContext,alternate:boolean){
  const now=context.currentTime;
  const master=context.createGain();
  master.gain.setValueAtTime(.82,now);
  master.connect(context.destination);

  const click=context.createBufferSource();
  const clickFilter=context.createBiquadFilter();
  const clickGain=context.createGain();
  click.buffer=makeNoise(context,.045);
  clickFilter.type="bandpass";
  clickFilter.frequency.setValueAtTime(alternate?1750:2350,now);
  clickFilter.Q.setValueAtTime(2.8,now);
  clickGain.gain.setValueAtTime(.0001,now);
  clickGain.gain.exponentialRampToValueAtTime(.16,now+.002);
  clickGain.gain.exponentialRampToValueAtTime(.0001,now+.042);
  click.connect(clickFilter).connect(clickGain).connect(master);

  const metal=context.createOscillator();
  const metalGain=context.createGain();
  metal.type="triangle";
  metal.frequency.setValueAtTime(alternate?920:1260,now);
  metal.frequency.exponentialRampToValueAtTime(alternate?610:760,now+.03);
  metalGain.gain.setValueAtTime(.0001,now);
  metalGain.gain.exponentialRampToValueAtTime(.075,now+.002);
  metalGain.gain.exponentialRampToValueAtTime(.0001,now+.05);
  metal.connect(metalGain).connect(master);

  const mechanism=context.createOscillator();
  const mechanismGain=context.createGain();
  mechanism.type="sine";
  mechanism.frequency.setValueAtTime(alternate?82:105,now);
  mechanism.frequency.exponentialRampToValueAtTime(58,now+.055);
  mechanismGain.gain.setValueAtTime(.0001,now);
  mechanismGain.gain.exponentialRampToValueAtTime(.055,now+.003);
  mechanismGain.gain.exponentialRampToValueAtTime(.0001,now+.065);
  mechanism.connect(mechanismGain).connect(master);

  click.start(now);
  metal.start(now);
  mechanism.start(now);
  metal.stop(now+.055);
  mechanism.stop(now+.07);
}

function playExplosion(context:AudioContext){
  const now=context.currentTime;
  const compressor=context.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-18,now);
  compressor.knee.setValueAtTime(18,now);
  compressor.ratio.setValueAtTime(8,now);
  compressor.attack.setValueAtTime(.002,now);
  compressor.release.setValueAtTime(.35,now);
  compressor.connect(context.destination);

  const body=context.createBufferSource();
  const bodyFilter=context.createBiquadFilter();
  const bodyGain=context.createGain();
  body.buffer=makeNoise(context,1.85);
  bodyFilter.type="lowpass";
  bodyFilter.frequency.setValueAtTime(920,now);
  bodyFilter.frequency.exponentialRampToValueAtTime(80,now+1.7);
  bodyGain.gain.setValueAtTime(.72,now);
  bodyGain.gain.exponentialRampToValueAtTime(.0001,now+1.82);
  body.connect(bodyFilter).connect(bodyGain).connect(compressor);

  const crack=context.createBufferSource();
  const crackFilter=context.createBiquadFilter();
  const crackGain=context.createGain();
  crack.buffer=makeNoise(context,.24);
  crackFilter.type="highpass";
  crackFilter.frequency.setValueAtTime(1150,now);
  crackGain.gain.setValueAtTime(.76,now);
  crackGain.gain.exponentialRampToValueAtTime(.0001,now+.22);
  crack.connect(crackFilter).connect(crackGain).connect(compressor);

  const rumble=context.createOscillator();
  const rumbleGain=context.createGain();
  rumble.type="sawtooth";
  rumble.frequency.setValueAtTime(92,now);
  rumble.frequency.exponentialRampToValueAtTime(24,now+1.35);
  rumbleGain.gain.setValueAtTime(.48,now);
  rumbleGain.gain.exponentialRampToValueAtTime(.0001,now+1.45);
  rumble.connect(rumbleGain).connect(compressor);

  const impact=context.createOscillator();
  const impactGain=context.createGain();
  impact.type="sine";
  impact.frequency.setValueAtTime(165,now);
  impact.frequency.exponentialRampToValueAtTime(38,now+.62);
  impactGain.gain.setValueAtTime(.55,now);
  impactGain.gain.exponentialRampToValueAtTime(.0001,now+.72);
  impact.connect(impactGain).connect(compressor);

  body.start(now);
  crack.start(now);
  rumble.start(now);
  impact.start(now);
  rumble.stop(now+1.5);
  impact.stop(now+.75);
}

export default function PassTheBombGame({packId,packName,onClose}:Props){
  const questions=useMemo(()=>questionBank[packId]??fallbackQuestions,[packId]);
  const [question,setQuestion]=useState(()=>chooseQuestion(questions));
  const [round,setRound]=useState(1);
  const [fuseState,setFuseState]=useState<FuseState>("idle");
  const [fuseDuration,setFuseDuration]=useState(60000);
  const [elapsedMs,setElapsedMs]=useState(0);
  const [soundEnabled,setSoundEnabled]=useState(true);
  const audioRef=useRef<AudioContext|null>(null);
  const tickVariantRef=useRef(false);

  const getAudio=()=>{
    if(!audioRef.current)audioRef.current=new AudioContext();
    if(audioRef.current.state==="suspended")void audioRef.current.resume();
    return audioRef.current;
  };

  useEffect(()=>()=>{void audioRef.current?.close();},[]);

  useEffect(()=>{
    if(fuseState!=="running")return;
    const startedAt=performance.now()-elapsedMs;
    let lastTick=Math.floor(elapsedMs/1000);
    const interval=window.setInterval(()=>{
      const nextElapsed=performance.now()-startedAt;
      const tick=Math.floor(nextElapsed/1000);
      if(tick>lastTick){
        lastTick=tick;
        tickVariantRef.current=!tickVariantRef.current;
        if(soundEnabled)playMechanicalTick(getAudio(),tickVariantRef.current);
      }
      if(nextElapsed>=fuseDuration){
        window.clearInterval(interval);
        setElapsedMs(fuseDuration);
        setFuseState("exploded");
        if(soundEnabled)playExplosion(getAudio());
        return;
      }
      setElapsedMs(nextElapsed);
    },100);
    return()=>window.clearInterval(interval);
    // The effect restarts only when fuse controls change, preserving elapsed time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[fuseState,fuseDuration,soundEnabled]);

  const startFuse=(newRound=false)=>{
    tickVariantRef.current=false;
    if(soundEnabled)playMechanicalTick(getAudio(),false);
    if(newRound){
      setRound((current)=>current+1);
      setQuestion((current)=>chooseQuestion(questions,current));
    }
    setFuseDuration((45+Math.floor(Math.random()*46))*1000);
    setElapsedMs(0);
    setFuseState("running");
  };

  const resetRound=()=>{
    setFuseState("idle");
    setElapsedMs(0);
  };

  const newQuestion=()=>setQuestion((current)=>chooseQuestion(questions,current));

  return <div className="ptb-portal" role="dialog" aria-modal="true" aria-label="Pass the Bomb classroom game">
    <header className="ptb-topbar">
      <div className="ptb-brand"><span aria-hidden="true"><span className="ptb-mini-bomb"/></span><div><strong>Pass the Bomb</strong><small>{packName}</small></div></div>
      <div className="ptb-top-actions"><button type="button" onClick={()=>setSoundEnabled((current)=>!current)} aria-pressed={soundEnabled} aria-label={soundEnabled?"Mute sound effects":"Turn on sound effects"}>{soundEnabled?<Volume2 size={19}/>:<VolumeX size={19}/>}<span>{soundEnabled?"Sound on":"Sound off"}</span></button><button type="button" className="ptb-close" onClick={onClose} aria-label="Close Pass the Bomb"><X size={21}/></button></div>
    </header>

    <main className="ptb-board">
      <section className="ptb-round-strip">
        <div><small>PASS THE BOMB</small><strong>Round {round}</strong></div>
        <p><span aria-hidden="true"/>Answer the same question in Japanese, then pass the bomb immediately.</p>
        <span className={`ptb-fuse-status ${fuseState}`}>{fuseState==="running"?"Fuse burning":fuseState==="exploded"?"Bomb exploded":"Fuse unlit"}</span>
      </section>

      <section className="ptb-game-stage">
        <article className={`ptb-bomb-card ${fuseState}`}>
          <section className="ptb-question-banner" aria-labelledby="ptb-question">
            <span className="ptb-question-icon" aria-hidden="true"><MessageCircleQuestion size={26}/></span>
            <div><small>EVERYONE ANSWERS</small><strong id="ptb-question" lang="ja">{question}</strong><p>Give your own answer in Japanese, then pass the bomb.</p></div>
            <button type="button" onClick={newQuestion}><RefreshCw size={18}/><span>New question</span></button>
          </section>

          <div className="ptb-hidden-fuse"><small>RANDOM FUSE</small><strong>Hidden explosion time</strong><span>No countdown or timing clues are shown.</span></div>

          <div className="ptb-bomb-scene" aria-live="assertive">
            {fuseState==="exploded"?<div className="ptb-explosion" role="status"><i/><i/><i/><strong>BOOM!</strong><span>The player holding the bomb loses this round.</span></div>:<div className="ptb-bomb" aria-label={fuseState==="running"?"Bomb fuse is burning":"Bomb fuse is not lit"}><div className="ptb-fuse"><i/></div><div className="ptb-bomb-cap"/><div className="ptb-bomb-body"><span/></div><div className="ptb-bomb-shadow"/></div>}
          </div>

          <p className="ptb-bomb-message">{fuseState==="running"?"Keep answering and passing — listen to the mechanical ticking.":fuseState==="exploded"?"Round over. Start a fresh hidden fuse when ready.":"The explosion time changes randomly every round."}</p>
          {fuseState==="idle"&&<button type="button" className="ptb-light" onClick={()=>startFuse(false)}><span aria-hidden="true"/> Light the fuse</button>}
          {fuseState==="exploded"&&<button type="button" className="ptb-light" onClick={()=>startFuse(true)}><RotateCcw size={20}/> Start next round</button>}
          {fuseState==="running"&&<button type="button" className="ptb-abort" onClick={resetRound}><RotateCcw size={18}/> Reset round</button>}
        </article>
      </section>
    </main>
  </div>;
}
