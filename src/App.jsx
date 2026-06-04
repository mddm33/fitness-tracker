import { useState, useEffect, useRef } from "react";

const PROGRAM_DAYS = {
  push: {
    label: "Push", fullLabel: "Day 1 — Push", accent: "#2563eb",
    compound: [
      { id: "bench", name: "Barbell Bench Press", sets: 4, reps: [12,10,8,6] },
      { id: "shoulder", name: "Seated DB Shoulder Press", sets: 4, reps: [12,10,8,6] },
    ],
    isolation: [
      { id: "incline", name: "Incline DB Press", sets: 3, reps: 10 },
      { id: "laterals", name: "Cable Lateral Raises", sets: 3, reps: 15 },
      { id: "triceps", name: "Tricep Rope Pushdowns", sets: 3, reps: 12 },
    ],
  },
  pull: {
    label: "Pull", fullLabel: "Day 2 — Pull", accent: "#d97706",
    compound: [
      { id: "rows", name: "Barbell/Cable Rows", sets: 4, reps: [12,10,8,6] },
      { id: "pulldown", name: "Lat Pulldowns / Pull-Ups", sets: 4, reps: [12,10,8,6] },
    ],
    isolation: [
      { id: "cablerow", name: "Seated Cable Row", sets: 3, reps: 10 },
      { id: "facepull", name: "Face Pulls", sets: 3, reps: 15 },
      { id: "curls", name: "Dumbbell Curls", sets: 3, reps: 12 },
    ],
  },
  fullbody: {
    label: "Full Body", fullLabel: "Day 3 — Full Body", accent: "#16a34a",
    compound: [
      { id: "squat", name: "Barbell Squats", sets: 4, reps: [12,10,8,6] },
      { id: "rdl", name: "Romanian Deadlifts", sets: 4, reps: [12,10,8,6] },
    ],
    isolation: [
      { id: "lunges", name: "Dumbbell Lunges", sets: 3, reps: "10 each" },
      { id: "plank", name: "Plank", sets: 3, reps: "45-60s" },
      { id: "abs", name: "Ab Wheel / Hanging Leg Raises", sets: 3, reps: 12 },
    ],
  },
};

function getWeeks(count) { return Array.from({ length: count }, (_, i) => `Week ${i + 1}`); }
const STORAGE_KEY = "wfit-v5";
const ACCENT_POOL = ["#7c3aed","#db2777","#0891b2","#ea580c","#65a30d","#0d9488","#b45309"];
const S = {
  dark: "#0f0f1a", mid: "#1a1a2e", card: "rgba(255,255,255,0.04)",
  border: "#2d2d5e", muted: "#8888aa", text: "#e8e8f0",
  accent: "#4f46e5", accentLight: "#a5b4fc", green: "#16a34a",
};

function load() {
  try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : defaultData(); }
  catch { return defaultData(); }
}
function defaultData() {
  return { weightLog:{}, workoutLog:{}, extraDays:[], measurements:{}, checkIns:{} };
}
function persist(data) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {} }

function Card({ children, accent, style={} }) {
  return <div style={{ background:S.card, borderRadius:12, padding:"14px 16px", marginBottom:12, border:`1px solid ${accent||S.border}`, ...style }}>{children}</div>;
}
function Label({ children, style={} }) {
  return <div style={{ fontSize:10, letterSpacing:2, color:S.muted, textTransform:"uppercase", marginBottom:8, ...style }}>{children}</div>;
}
function Btn({ children, onClick, disabled, color, small, full, style={} }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: small?"6px 12px":"10px 18px", background: disabled?"#2d2d5e":(color||S.accent),
      color:"#fff", border:"none", borderRadius:9, fontSize:small?11:13,
      fontFamily:"Georgia,serif", fontWeight:"bold", cursor:disabled?"not-allowed":"pointer",
      width: full?"100%":"auto", ...style
    }}>{children}</button>
  );
}
function Inp({ value, onChange, placeholder, type="text", style={}, onKeyDown }) {
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} onKeyDown={onKeyDown} style={{
      background:S.dark, border:`1px solid ${S.border}`, color:S.text,
      padding:"8px 11px", borderRadius:8, fontSize:13,
      fontFamily:"Georgia,serif", outline:"none", ...style
    }} />
  );
}
function Textarea({ value, onChange, placeholder, rows=3 }) {
  return (
    <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} style={{
      background:S.dark, border:`1px solid ${S.border}`, color:S.text,
      padding:"8px 11px", borderRadius:8, fontSize:13, fontFamily:"Georgia,serif",
      outline:"none", width:"100%", boxSizing:"border-box", resize:"vertical",
    }} />
  );
}

// Reusable set logger: shows lbs + actual reps per set
function SetLogger({ exId, setCount, targetReps, weights, onWeight, onReps, accent }) {
  return (
    <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
      {Array.from({ length: setCount }, (_, i) => (
        <div key={i} style={{ textAlign:"center" }}>
          <div style={{ fontSize:10, color:S.muted, marginBottom:4 }}>
            Set {i+1}{targetReps ? ` · ${Array.isArray(targetReps) ? targetReps[i] : targetReps}r` : ""}
          </div>
          <input
            type="number" placeholder="lbs"
            value={weights[`${exId}-${i}`] || ""}
            onChange={e => onWeight(exId, i, e.target.value)}
            style={{
              display:"block", width:58, textAlign:"center", padding:"7px 4px",
              background:S.dark, border:`1px solid ${weights[`${exId}-${i}`] ? (accent||"#6366f1") : S.border}`,
              color:S.text, borderRadius:8, fontSize:13, fontFamily:"Georgia,serif",
              outline:"none", marginBottom:4,
            }}
          />
          <input
            type="number" placeholder="reps"
            value={weights[`${exId}-${i}-reps`] || ""}
            onChange={e => onReps(exId, i, e.target.value)}
            style={{
              display:"block", width:58, textAlign:"center", padding:"5px 4px",
              background:S.dark, border:`1px solid ${weights[`${exId}-${i}-reps`] ? "#6366f1" : S.border}`,
              color:S.muted, borderRadius:8, fontSize:11, fontFamily:"Georgia,serif",
              outline:"none",
            }}
          />
        </div>
      ))}
    </div>
  );
}

// ── PROGRAM DAY ───────────────────────────────────────────────────────────────
function ProgramDayTab({ dayKey, week, data, setData, weeks }) {
  const day = PROGRAM_DAYS[dayKey];
  const logKey = `${week}-${dayKey}`;
  const entry = data.workoutLog[logKey] || {};
  const [weights, setWeights] = useState(entry.weights||{});
  const [cardio, setCardio] = useState(entry.cardio||"");
  const [sauna, setSauna] = useState(entry.sauna||false);
  const [saunaMin, setSaunaMin] = useState(entry.saunaMin||"");
  const [notes, setNotes] = useState(entry.notes||"");
  const [extras, setExtras] = useState(entry.extras||[]);
  const [newExtra, setNewExtra] = useState({ name:"", sets:"", reps:"" });
  const [subs, setSubs] = useState(entry.subs||{});
  const [swapping, setSwapping] = useState(null);
  const [swapName, setSwapName] = useState("");
  const [saved, setSaved] = useState(false);

  const prevEntry = (() => {
    for (let i = weeks.indexOf(week)-1; i >= 0; i--) {
      const e = data.workoutLog[`${weeks[i]}-${dayKey}`];
      if (e?.weights && Object.keys(e.weights).length) return { week: weeks[i], weights: e.weights };
    }
    return null;
  })();

  useEffect(() => {
    const e = data.workoutLog[logKey]||{};
    setWeights(e.weights||{}); setCardio(e.cardio||""); setSauna(e.sauna||false);
    setSaunaMin(e.saunaMin||""); setNotes(e.notes||""); setExtras(e.extras||[]);
    setSubs(e.subs||{}); setSwapping(null); setSwapName("");
  }, [logKey]);

  function setW(id, i, val) { setWeights(p=>({...p, [`${id}-${i}`]:val})); }
  function setR(id, i, val) { setWeights(p=>({...p, [`${id}-${i}-reps`]:val})); }
  function confirmSwap(exId) {
    if (!swapName.trim()) return;
    setSubs(p=>({...p,[exId]:swapName.trim()}));
    setSwapping(null); setSwapName("");
  }
  function clearSub(exId) { setSubs(p=>{ const n={...p}; delete n[exId]; return n; }); }

  function handleSave() {
    const newData = { ...data, workoutLog:{ ...data.workoutLog, [logKey]:{ weights, cardio, sauna, saunaMin, notes, extras, subs, savedAt:new Date().toISOString() } } };
    setData(newData); persist(newData); setSaved(true); setTimeout(()=>setSaved(false),2000);
  }

  function renderExHeader(ex, subName, isSwapping) {
    return (
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
        <div>
          <div style={{ fontSize:14, fontWeight:"bold", color:"#fff" }}>{subName || ex.name}</div>
          {subName && <div style={{ fontSize:10, color:"#c4b5fd", marginTop:2 }}>Subbing for: {ex.name}</div>}
        </div>
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          {subName && <button onClick={()=>clearSub(ex.id)} style={{ background:"none", border:"none", color:S.muted, fontSize:11, cursor:"pointer" }}>Reset</button>}
          <button onClick={()=>{ setSwapping(isSwapping?null:ex.id); setSwapName(subName||""); }}
            style={{ background:"#374151", border:"none", color:"#fff", fontSize:11, borderRadius:6, padding:"4px 10px", cursor:"pointer", fontFamily:"Georgia,serif" }}>
            {isSwapping ? "Cancel" : "⇄ Sub"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Card>
        <Label>Body Weight — {week}</Label>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <Inp type="number" placeholder="e.g. 203" value={data.weightLog[week]||""}
            onChange={e=>{ const nd={...data,weightLog:{...data.weightLog,[week]:e.target.value}}; setData(nd); persist(nd); }}
            style={{ width:85 }} />
          <span style={{ color:S.muted, fontSize:13 }}>lbs</span>
        </div>
      </Card>

      {prevEntry && (
        <Card style={{ background:"rgba(79,70,229,0.06)", border:`1px solid ${S.accent}44` }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
            <Label style={{ marginBottom:0 }}>Last Session ({prevEntry.week})</Label>
            <Btn small onClick={()=>setWeights(prevEntry.weights)} color="#374151">Copy Weights</Btn>
          </div>
          <div style={{ fontSize:11, color:S.muted, lineHeight:1.8 }}>
            {[...day.compound, ...day.isolation].map(ex => {
              const setCount = Array.isArray(ex.reps) ? ex.reps.length : ex.sets;
              const vals = Array.from({length:setCount},(_,i)=>prevEntry.weights[`${ex.id}-${i}`]).filter(Boolean);
              if (!vals.length) return null;
              return (
                <div key={ex.id}>{ex.name}: {vals.map((v,i)=>{
                  const r = prevEntry.weights[`${ex.id}-${i}-reps`];
                  return r ? `${v}lbs×${r}` : `${v}lbs`;
                }).join(" · ")}</div>
              );
            })}
          </div>
        </Card>
      )}

      <Label>Compound Lifts — Pyramid (12/10/8/6)</Label>
      <div style={{ fontSize:11, color:S.muted, marginBottom:10 }}>Log weight (lbs) and actual reps completed each set</div>
      {day.compound.map(ex=>{
        const subName = subs[ex.id];
        const isSwapping = swapping === ex.id;
        return (
          <Card key={ex.id} accent={subName ? "#7c3aed55" : `${day.accent}55`}>
            {renderExHeader(ex, subName, isSwapping)}
            {isSwapping && (
              <div style={{ display:"flex", gap:8, marginBottom:10, alignItems:"center" }}>
                <Inp value={swapName} onChange={e=>setSwapName(e.target.value)} placeholder="e.g. Dumbbell Press" onKeyDown={e=>e.key==="Enter"&&confirmSwap(ex.id)} style={{ flex:1 }} />
                <Btn small onClick={()=>confirmSwap(ex.id)} color="#7c3aed">Use This</Btn>
              </div>
            )}
            <SetLogger exId={ex.id} setCount={ex.reps.length} targetReps={ex.reps} weights={weights} onWeight={setW} onReps={setR} accent={day.accent} />
          </Card>
        );
      })}

      <Label>Isolation — Straight Sets</Label>
      {day.isolation.map(ex=>{
        const subName = subs[ex.id];
        const isSwapping = swapping === ex.id;
        return (
          <Card key={ex.id} accent={subName ? "#7c3aed55" : S.border}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
              <div>
                <div style={{ fontSize:14, fontWeight:"bold", color:"#fff" }}>
                  {subName || ex.name} <span style={{ fontSize:11, color:S.muted, fontWeight:"normal" }}>· {ex.sets}×{ex.reps}</span>
                </div>
                {subName && <div style={{ fontSize:10, color:"#c4b5fd", marginTop:2 }}>Subbing for: {ex.name}</div>}
              </div>
              <div style={{ display:"flex", gap:6 }}>
                {subName && <button onClick={()=>clearSub(ex.id)} style={{ background:"none", border:"none", color:S.muted, fontSize:11, cursor:"pointer" }}>Reset</button>}
                <button onClick={()=>{ setSwapping(isSwapping?null:ex.id); setSwapName(subName||""); }}
                  style={{ background:"#374151", border:"none", color:"#fff", fontSize:11, borderRadius:6, padding:"4px 10px", cursor:"pointer", fontFamily:"Georgia,serif" }}>
                  {isSwapping ? "Cancel" : "⇄ Sub"}
                </button>
              </div>
            </div>
            {isSwapping && (
              <div style={{ display:"flex", gap:8, marginBottom:10, alignItems:"center" }}>
                <Inp value={swapName} onChange={e=>setSwapName(e.target.value)} placeholder="Substitute exercise name" onKeyDown={e=>e.key==="Enter"&&confirmSwap(ex.id)} style={{ flex:1 }} />
                <Btn small onClick={()=>confirmSwap(ex.id)} color="#7c3aed">Use This</Btn>
              </div>
            )}
            <SetLogger exId={ex.id} setCount={ex.sets} targetReps={ex.reps} weights={weights} onWeight={setW} onReps={setR} accent="#6366f1" />
          </Card>
        );
      })}

      <Label>Extra Exercises</Label>
      <Card>
        <div style={{ display:"flex", gap:6, marginBottom:8, flexWrap:"wrap" }}>
          <Inp value={newExtra.name} onChange={e=>setNewExtra({...newExtra,name:e.target.value})} placeholder="Exercise" style={{ flex:2, minWidth:100 }} />
          <Inp value={newExtra.sets} onChange={e=>setNewExtra({...newExtra,sets:e.target.value})} placeholder="Sets" style={{ width:52 }} />
          <Inp value={newExtra.reps} onChange={e=>setNewExtra({...newExtra,reps:e.target.value})} placeholder="Target reps" style={{ width:80 }} />
          <Btn small onClick={()=>{ if(!newExtra.name)return; setExtras(p=>[...p,{...newExtra,id:Date.now()}]); setNewExtra({name:"",sets:"",reps:""}); }}>+</Btn>
        </div>
        {extras.map(ex=>(
          <Card key={ex.id} accent={S.border} style={{ marginBottom:8 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <span style={{ fontSize:13, color:S.text, fontWeight:"bold" }}>{ex.name} <span style={{ color:S.muted, fontWeight:"normal", fontSize:11 }}>{ex.sets&&`${ex.sets}×${ex.reps}`}</span></span>
              <button onClick={()=>setExtras(p=>p.filter(e=>e.id!==ex.id))} style={{ background:"none", border:"none", color:"#ef4444", cursor:"pointer", fontSize:16 }}>×</button>
            </div>
            <SetLogger exId={ex.id} setCount={parseInt(ex.sets)||3} targetReps={ex.reps} weights={weights} onWeight={setW} onReps={setR} accent="#6366f1" />
          </Card>
        ))}
      </Card>

      <Card>
        <Label>Cardio</Label>
        <Inp value={cardio} onChange={e=>setCardio(e.target.value)} placeholder="e.g. 20 min incline treadmill, HR 138" style={{ width:"100%", boxSizing:"border-box" }} />
      </Card>

      <Card accent={sauna?`${S.accent}66`:S.border}>
        <Label>Sauna</Label>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <button onClick={()=>setSauna(!sauna)} style={{ width:44, height:24, borderRadius:12, border:"none", cursor:"pointer", background:sauna?"#4f46e5":"#374151", position:"relative", transition:"background 0.2s" }}>
            <div style={{ width:18, height:18, borderRadius:9, background:"#fff", position:"absolute", top:3, left:sauna?23:3, transition:"left 0.2s" }} />
          </button>
          <span style={{ fontSize:13, color:sauna?S.accentLight:S.muted }}>{sauna?"Done it!":"Did sauna?"}</span>
          {sauna && (
            <div style={{ display:"flex", alignItems:"center", gap:6, marginLeft:8 }}>
              <Inp type="number" value={saunaMin} onChange={e=>setSaunaMin(e.target.value)} placeholder="min" style={{ width:60 }} />
              <span style={{ fontSize:12, color:S.muted }}>minutes</span>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <Label>Workout Notes</Label>
        <Textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="How did it feel? Any soreness, PRs, energy level..." rows={3} />
      </Card>

      <Btn full onClick={handleSave} style={{ padding:"13px", fontSize:15, background:saved?"#16a34a":S.accent }}>
        {saved?"✓ Saved!":"Save Workout"}
      </Btn>
    </div>
  );
}

// ── EXTRA DAY TAB ─────────────────────────────────────────────────────────────
function ExtraDayTab({ dayDef, week, data, setData, weeks }) {
  const logKey = `${week}-${dayDef.id}`;
  const entry = data.workoutLog[logKey]||{};
  const [exercises, setExercises] = useState(entry.exercises||[]);
  const [weights, setWeights] = useState(entry.weights||{});
  const [cardio, setCardio] = useState(entry.cardio||"");
  const [sauna, setSauna] = useState(entry.sauna||false);
  const [saunaMin, setSaunaMin] = useState(entry.saunaMin||"");
  const [notes, setNotes] = useState(entry.notes||"");
  const [newEx, setNewEx] = useState({ name:"", sets:"3", reps:"" });
  const [saved, setSaved] = useState(false);

  const prevEntry = (() => {
    for (let i = weeks.indexOf(week)-1; i >= 0; i--) {
      const e = data.workoutLog[`${weeks[i]}-${dayDef.id}`];
      if (e?.exercises?.length) return { week:weeks[i], exercises:e.exercises, weights:e.weights||{} };
    }
    return null;
  })();

  useEffect(() => {
    const e = data.workoutLog[logKey]||{};
    setExercises(e.exercises||[]); setWeights(e.weights||{}); setCardio(e.cardio||"");
    setSauna(e.sauna||false); setSaunaMin(e.saunaMin||""); setNotes(e.notes||"");
  }, [logKey]);

  function addEx() {
    if (!newEx.name) return;
    setExercises(p=>[...p,{ ...newEx, id:Date.now(), sets:parseInt(newEx.sets)||3 }]);
    setNewEx({ name:"", sets:"3", reps:"" });
  }
  function setW(id,i,val) { setWeights(p=>({...p,[`${id}-${i}`]:val})); }
  function setR(id,i,val) { setWeights(p=>({...p,[`${id}-${i}-reps`]:val})); }

  function handleSave() {
    const nd={...data,workoutLog:{...data.workoutLog,[logKey]:{ exercises,weights,cardio,sauna,saunaMin,notes,savedAt:new Date().toISOString() }}};
    setData(nd); persist(nd); setSaved(true); setTimeout(()=>setSaved(false),2000);
  }

  return (
    <div>
      <div style={{ fontSize:16, fontWeight:"bold", color:dayDef.accent, marginBottom:14 }}>{dayDef.label}</div>
      {prevEntry && (
        <Card style={{ background:"rgba(79,70,229,0.06)", border:`1px solid ${S.accent}44` }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
            <Label style={{ marginBottom:0 }}>Last Session ({prevEntry.week})</Label>
            <Btn small onClick={()=>{ setExercises(prevEntry.exercises); setWeights(prevEntry.weights); }} color="#374151">Copy</Btn>
          </div>
          <div style={{ fontSize:11, color:S.muted, lineHeight:1.8 }}>
            {prevEntry.exercises.map(ex=>{
              const vals=Array.from({length:ex.sets},(_,i)=>prevEntry.weights[`${ex.id}-${i}`]).filter(Boolean);
              return <div key={ex.id}>{ex.name}: {vals.length ? vals.map((v,i)=>{ const r=prevEntry.weights[`${ex.id}-${i}-reps`]; return r?`${v}lbs×${r}`:`${v}lbs`; }).join(" · ") : `${ex.sets}×${ex.reps}`}</div>;
            })}
          </div>
        </Card>
      )}
      <Card>
        <Label>Add Exercise</Label>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:8 }}>
          <Inp value={newEx.name} onChange={e=>setNewEx({...newEx,name:e.target.value})} placeholder="Exercise name" style={{ flex:2, minWidth:120 }} />
          <Inp type="number" value={newEx.sets} onChange={e=>setNewEx({...newEx,sets:e.target.value})} placeholder="Sets" style={{ width:52 }} />
          <Inp value={newEx.reps} onChange={e=>setNewEx({...newEx,reps:e.target.value})} placeholder="Target reps" style={{ width:90 }} />
          <Btn small onClick={addEx}>+ Add</Btn>
        </div>
      </Card>
      {exercises.map(ex=>(
        <Card key={ex.id} accent={`${dayDef.accent}55`}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <div>
              <div style={{ fontSize:14, fontWeight:"bold", color:S.text }}>{ex.name}</div>
              <div style={{ fontSize:11, color:S.muted }}>{ex.sets} sets{ex.reps&&` × ${ex.reps} (target)`}</div>
            </div>
            <button onClick={()=>setExercises(p=>p.filter(e=>e.id!==ex.id))} style={{ background:"none", border:"none", color:"#ef4444", fontSize:18, cursor:"pointer" }}>×</button>
          </div>
          <SetLogger exId={ex.id} setCount={ex.sets||3} targetReps={null} weights={weights} onWeight={setW} onReps={setR} accent={dayDef.accent} />
        </Card>
      ))}
      <Card>
        <Label>Cardio</Label>
        <Inp value={cardio} onChange={e=>setCardio(e.target.value)} placeholder="e.g. 30 min run" style={{ width:"100%", boxSizing:"border-box" }} />
      </Card>
      <Card accent={sauna?`${S.accent}66`:S.border}>
        <Label>Sauna</Label>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <button onClick={()=>setSauna(!sauna)} style={{ width:44, height:24, borderRadius:12, border:"none", cursor:"pointer", background:sauna?"#4f46e5":"#374151", position:"relative" }}>
            <div style={{ width:18, height:18, borderRadius:9, background:"#fff", position:"absolute", top:3, left:sauna?23:3, transition:"left 0.2s" }} />
          </button>
          <span style={{ fontSize:13, color:sauna?S.accentLight:S.muted }}>{sauna?"Done it!":"Did sauna?"}</span>
          {sauna && <><Inp type="number" value={saunaMin} onChange={e=>setSaunaMin(e.target.value)} placeholder="min" style={{ width:60, marginLeft:8 }} /><span style={{ fontSize:12, color:S.muted }}>min</span></>}
        </div>
      </Card>
      <Card><Label>Workout Notes</Label><Textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="How did it feel? Any soreness, PRs..." /></Card>
      <Btn full onClick={handleSave} style={{ padding:"13px", fontSize:15, background:saved?"#16a34a":S.accent }}>
        {saved?"✓ Saved!":"Save Workout"}
      </Btn>
    </div>
  );
}

// ── HISTORY TAB ───────────────────────────────────────────────────────────────
function HistoryTab({ data, weeks }) {
  const [filterDay, setFilterDay] = useState("all");
  const allDayKeys = [...Object.keys(PROGRAM_DAYS), ...(data.extraDays||[]).map(d=>d.id)];
  const allEntries = [];
  weeks.forEach(w => {
    allDayKeys.forEach(dk => {
      const key = `${w}-${dk}`;
      const entry = data.workoutLog[key];
      if (!entry) return;
      const dayDef = PROGRAM_DAYS[dk] || (data.extraDays||[]).find(d=>d.id===dk);
      if (!dayDef) return;
      allEntries.push({ week:w, dayKey:dk, dayDef, entry, key });
    });
  });
  const filtered = filterDay==="all" ? allEntries : allEntries.filter(e=>e.dayKey===filterDay);

  function formatSets(exId, setCount, w) {
    const vals = Array.from({length:setCount},(_,i)=>w[`${exId}-${i}`]).filter(Boolean);
    return vals.map((v,i) => { const r=w[`${exId}-${i}-reps`]; return r?`${v}×${r}`:`${v}lbs`; }).join(" → ");
  }

  return (
    <div>
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:16 }}>
        <button onClick={()=>setFilterDay("all")} style={{ padding:"6px 12px", borderRadius:16, border:"none", cursor:"pointer", fontSize:11, fontFamily:"Georgia,serif", background:filterDay==="all"?S.accent:"#1e1e3a", color:"#fff" }}>All</button>
        {allDayKeys.map(dk=>{
          const d = PROGRAM_DAYS[dk]||(data.extraDays||[]).find(x=>x.id===dk);
          if (!d) return null;
          return <button key={dk} onClick={()=>setFilterDay(dk)} style={{ padding:"6px 12px", borderRadius:16, border:"none", cursor:"pointer", fontSize:11, fontFamily:"Georgia,serif", background:filterDay===dk?d.accent:"#1e1e3a", color:"#fff" }}>{d.label}</button>;
        })}
      </div>
      {filtered.length===0 && <Card><div style={{ color:S.muted, fontSize:13, textAlign:"center", padding:"20px 0" }}>No workouts logged yet.</div></Card>}
      {[...filtered].reverse().map(({ week, dayDef, entry, key })=>(
        <Card key={key} accent={`${dayDef.accent}55`}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <div>
              <div style={{ fontSize:14, fontWeight:"bold", color:dayDef.accent }}>{dayDef.label || dayDef.fullLabel}</div>
              <div style={{ fontSize:11, color:S.muted }}>{week}</div>
            </div>
            {entry.sauna && <span style={{ fontSize:11, color:S.accentLight }}>🧖 {entry.saunaMin&&`${entry.saunaMin}min`}</span>}
          </div>
          {PROGRAM_DAYS[dayDef.id||""] && [...(PROGRAM_DAYS[dayDef.id]?.compound||[]), ...(PROGRAM_DAYS[dayDef.id]?.isolation||[])].map(ex=>{
            const setCount = Array.isArray(ex.reps) ? ex.reps.length : ex.sets;
            const str = formatSets(ex.id, setCount, entry.weights||{});
            return str ? <div key={ex.id} style={{ fontSize:12, color:S.text, marginBottom:4 }}><span style={{ color:S.muted }}>{ex.name}:</span> {str}</div> : null;
          })}
          {(entry.exercises||[]).map(ex=>{
            const str = formatSets(ex.id, ex.sets||3, entry.weights||{});
            return <div key={ex.id} style={{ fontSize:12, color:S.text, marginBottom:4 }}><span style={{ color:S.muted }}>{ex.name}:</span> {str || `${ex.sets}×${ex.reps}`}</div>;
          })}
          {entry.cardio && <div style={{ fontSize:12, color:"#10b981", marginTop:4 }}>🏃 {entry.cardio}</div>}
          {entry.notes && <div style={{ fontSize:12, color:S.muted, marginTop:6, fontStyle:"italic" }}>"{entry.notes}"</div>}
        </Card>
      ))}
    </div>
  );
}

// ── PROGRESS TAB ──────────────────────────────────────────────────────────────
function ProgressTab({ data, setData, weeks }) {
  const [showMeasurements, setShowMeasurements] = useState(false);
  const [measWeek, setMeasWeek] = useState("Week 1");
  const [meas, setMeas] = useState({ waist:"", hips:"", chest:"", arms:"" });

  useEffect(()=>{ setMeas(data.measurements?.[measWeek]||{ waist:"", hips:"", chest:"", arms:"" }); }, [measWeek]);

  function saveMeas() {
    const nd={...data,measurements:{...data.measurements,[measWeek]:meas}};
    setData(nd); persist(nd);
  }

  const trend = weeks.map(w=>({ week:w, weight:parseFloat(data.weightLog[w]) })).filter(e=>!isNaN(e.weight));
  const startW = trend[0]?.weight, latestW = trend[trend.length-1]?.weight;
  const totalLost = startW&&latestW?(startW-latestW).toFixed(1):null;
  const workoutsLogged = Object.keys(data.workoutLog).length;
  const saunaCount = Object.values(data.workoutLog).filter(e=>e.sauna).length;

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
        {[
          { label:"Start Weight", value:startW?`${startW} lbs`:"—" },
          { label:"Current Weight", value:latestW?`${latestW} lbs`:"—" },
          { label:"Total Lost", value:totalLost?`${totalLost} lbs`:"—", hi:true },
          { label:"Workouts Logged", value:`${workoutsLogged}`, sub:"sessions" },
          { label:"Sauna Sessions", value:`${saunaCount}`, sub:"sessions" },
        ].map(s=>(
          <Card key={s.label} accent={s.hi?S.accent:S.border} style={{ textAlign:"center", marginBottom:0 }}>
            <div style={{ fontSize:9, color:S.muted, letterSpacing:1, textTransform:"uppercase", marginBottom:5 }}>{s.label}</div>
            <div style={{ fontSize:s.hi?22:18, fontWeight:"bold", color:s.hi?S.accentLight:"#fff" }}>{s.value}</div>
            {s.sub&&<div style={{ fontSize:10, color:S.muted }}>{s.sub}</div>}
          </Card>
        ))}
      </div>
      <Card>
        <Label>Weight Trend</Label>
        {trend.length>0?(() => {
          const min=Math.min(...trend.map(t=>t.weight))-2, max=Math.max(...trend.map(t=>t.weight))+2, range=max-min||1;
          const px=i=>(i/Math.max(trend.length-1,1))*560+20;
          const py=w=>100-((w-min)/range)*85;
          return (
            <div>
              <svg width="100%" viewBox="0 0 600 120" preserveAspectRatio="none">
                <defs><linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={S.accent} stopOpacity="0.3"/><stop offset="100%" stopColor={S.accent} stopOpacity="0"/></linearGradient></defs>
                {trend.length>1&&<><polyline fill="url(#wg)" stroke="none" points={[...trend.map((t,i)=>`${px(i)},${py(t.weight)}`),`${px(trend.length-1)},120`,`${px(0)},120`].join(" ")}/>
                <polyline fill="none" stroke={S.accent} strokeWidth="2.5" points={trend.map((t,i)=>`${px(i)},${py(t.weight)}`).join(" ")}/></>}
                {trend.map((t,i)=>(<g key={i}><circle cx={px(i)} cy={py(t.weight)} r="5" fill={S.accent} stroke="#fff" strokeWidth="2"/><text x={px(i)} y={py(t.weight)-10} textAnchor="middle" fill={S.text} fontSize="11">{t.weight}</text></g>))}
              </svg>
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
                {trend.map(t=><span key={t.week} style={{ fontSize:10, color:S.muted }}>{t.week.replace("Week ","W")}</span>)}
              </div>
            </div>
          );
        })():<div style={{ color:S.muted, fontSize:13, textAlign:"center", padding:"16px 0" }}>Log your weight in the Log tab.</div>}
      </Card>
      <Card>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <Label style={{ marginBottom:0 }}>Body Measurements</Label>
          <Btn small onClick={()=>setShowMeasurements(!showMeasurements)}>{showMeasurements?"Hide":"Log"}</Btn>
        </div>
        {showMeasurements && (
          <div>
            <select value={measWeek} onChange={e=>setMeasWeek(e.target.value)} style={{ background:"#1e1e3a", border:`1px solid ${S.border}`, color:S.text, padding:"6px 10px", borderRadius:8, fontSize:12, fontFamily:"Georgia,serif", marginBottom:10 }}>
              {weeks.map(w=><option key={w}>{w}</option>)}
            </select>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
              {[["waist","Waist (in)"],["hips","Hips (in)"],["chest","Chest (in)"],["arms","Arms (in)"]].map(([key,label])=>(
                <div key={key}>
                  <div style={{ fontSize:11, color:S.muted, marginBottom:4 }}>{label}</div>
                  <Inp type="number" value={meas[key]} onChange={e=>setMeas({...meas,[key]:e.target.value})} placeholder="inches" style={{ width:"100%", boxSizing:"border-box" }} />
                </div>
              ))}
            </div>
            <Btn small full onClick={saveMeas} color={S.green}>Save Measurements</Btn>
          </div>
        )}
        <div style={{ marginTop:showMeasurements?12:0, display:"flex", flexDirection:"column", gap:4 }}>
          {weeks.filter(w=>data.measurements?.[w]).map(w=>(
            <div key={w} style={{ display:"flex", justifyContent:"space-between", fontSize:12, padding:"5px 0", borderBottom:`1px solid ${S.border}` }}>
              <span style={{ color:S.muted }}>{w}</span>
              <span style={{ color:S.text }}>
                {["waist","hips","chest","arms"].filter(k=>data.measurements[w][k]).map(k=>`${k[0].toUpperCase()+k.slice(1)}: ${data.measurements[w][k]}"`).join(" · ")}
              </span>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <Label>Workout Consistency</Label>
        <div style={{ display:"grid", gridTemplateColumns:`repeat(${Math.min(weeks.length,12)},1fr)`, gap:5 }}>
          {weeks.map(w=>(
            <div key={w} style={{ textAlign:"center" }}>
              <div style={{ fontSize:9, color:S.muted, marginBottom:5 }}>{w.replace("Week ","W")}</div>
              {[...Object.entries(PROGRAM_DAYS),...(data.extraDays||[]).map(d=>[d.id,d])].map(([dk,d])=>{
                const logged=!!data.workoutLog[`${w}-${dk}`];
                return <div key={dk} style={{ height:13, borderRadius:3, marginBottom:3, background:logged?d.accent:"#1e1e3a", border:`1px solid ${logged?d.accent:S.border}` }} />;
              })}
            </div>
          ))}
        </div>
        <div style={{ marginTop:10, fontSize:13, color:S.accentLight }}>{workoutsLogged} sessions logged</div>
      </Card>
    </div>
  );
}

// ── CHECK-IN ──────────────────────────────────────────────────────────────────
function CheckInTab({ data, setData, weeks }) {
  const [week, setWeek] = useState("Week 1");
  const [form, setForm] = useState({ energy:"", soreness:"", sleep:"", stress:"", notes:"" });
  const [saved, setSaved] = useState(false);

  useEffect(()=>{ setForm(data.checkIns?.[week]||{ energy:"", soreness:"", sleep:"", stress:"", notes:"" }); }, [week]);

  function handleSave() {
    const nd={...data,checkIns:{...data.checkIns,[week]:form}};
    setData(nd); persist(nd); setSaved(true); setTimeout(()=>setSaved(false),2000);
  }

  const questions = [
    { key:"energy", label:"How was your energy this week?", opts:["Very low","Low","Average","Good","Great"] },
    { key:"soreness", label:"Overall soreness / recovery?", opts:["Very sore","Somewhat sore","Mild","Recovered","100%"] },
    { key:"sleep", label:"Sleep quality?", opts:["Poor","Below avg","Average","Good","Excellent"] },
    { key:"stress", label:"Stress level?", opts:["Very high","High","Moderate","Low","Very low"] },
  ];

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
        <Label style={{ marginBottom:0 }}>Weekly Check-In —</Label>
        <select value={week} onChange={e=>setWeek(e.target.value)} style={{ background:"#1e1e3a", border:`1px solid ${S.border}`, color:S.text, padding:"6px 10px", borderRadius:8, fontSize:12, fontFamily:"Georgia,serif" }}>
          {weeks.map(w=><option key={w}>{w}</option>)}
        </select>
      </div>
      <Card style={{ background:"rgba(79,70,229,0.08)", border:`1px solid ${S.accent}44` }}>
        <div style={{ fontSize:12, color:S.accentLight, lineHeight:1.6 }}>Fill this out at the end of each week to get better trainer feedback.</div>
      </Card>
      {questions.map(q=>(
        <Card key={q.key}>
          <Label>{q.label}</Label>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {q.opts.map(opt=>(
              <button key={opt} onClick={()=>setForm(f=>({...f,[q.key]:opt}))} style={{
                padding:"7px 12px", borderRadius:8, border:"none", cursor:"pointer", fontSize:12,
                fontFamily:"Georgia,serif", background:form[q.key]===opt?S.accent:"#1e1e3a",
                color:form[q.key]===opt?"#fff":S.muted,
              }}>{opt}</button>
            ))}
          </div>
        </Card>
      ))}
      <Card>
        <Label>Anything else your trainer should know?</Label>
        <Textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Injuries, life stress, travel, wins..." />
      </Card>
      <Btn full onClick={handleSave} style={{ padding:"13px", fontSize:15, background:saved?"#16a34a":S.accent }}>
        {saved?"✓ Saved!":"Submit Check-In"}
      </Btn>
      {Object.keys(data.checkIns||{}).length>0 && (
        <div style={{ marginTop:20 }}>
          <Label>Past Check-Ins</Label>
          {weeks.filter(w=>data.checkIns?.[w]?.energy).map(w=>{
            const c=data.checkIns[w];
            return (
              <Card key={w}>
                <div style={{ fontSize:13, fontWeight:"bold", color:S.accentLight, marginBottom:8 }}>{w}</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:"4px 16px" }}>
                  {[["Energy",c.energy],["Soreness",c.soreness],["Sleep",c.sleep],["Stress",c.stress]].filter(([,v])=>v).map(([k,v])=>(
                    <span key={k} style={{ fontSize:12 }}><span style={{ color:S.muted }}>{k}:</span> {v}</span>
                  ))}
                </div>
                {c.notes&&<div style={{ fontSize:12, color:S.muted, marginTop:6, fontStyle:"italic" }}>"{c.notes}"</div>}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── FEEDBACK ──────────────────────────────────────────────────────────────────
function FeedbackTab({ data, weeks }) {
  const [copied, setCopied] = useState(false);

  function buildSummary() {
    const lines = ["=== WEIGHT ==="];
    weeks.forEach(w=>{ if(data.weightLog[w]) lines.push(`${w}: ${data.weightLog[w]} lbs`); });
    lines.push("\n=== WORKOUTS ===");
    weeks.forEach(w=>{
      [...Object.keys(PROGRAM_DAYS),...(data.extraDays||[]).map(d=>d.id)].forEach(dk=>{
        const key=`${w}-${dk}`, entry=data.workoutLog[key];
        if(!entry) return;
        const dayDef=PROGRAM_DAYS[dk]||(data.extraDays||[]).find(d=>d.id===dk);
        lines.push(`\n${w} - ${dayDef?.label||dk}:`);
        if(PROGRAM_DAYS[dk]) {
          [...PROGRAM_DAYS[dk].compound,...PROGRAM_DAYS[dk].isolation].forEach(ex=>{
            const setCount=Array.isArray(ex.reps)?ex.reps.length:ex.sets;
            const vals=Array.from({length:setCount},(_,i)=>entry.weights?.[`${ex.id}-${i}`]).filter(Boolean);
            if(vals.length) lines.push(`  ${ex.name}: ${vals.map((v,i)=>{ const r=entry.weights?.[`${ex.id}-${i}-reps`]; return r?`${v}lbs×${r}reps`:`${v}lbs`; }).join(", ")}`);
          });
        }
        (entry.exercises||[]).forEach(ex=>{
          const vals=Array.from({length:ex.sets||3},(_,i)=>entry.weights?.[`${ex.id}-${i}`]).filter(Boolean);
          lines.push(`  ${ex.name}: ${vals.length?vals.map((v,i)=>{ const r=entry.weights?.[`${ex.id}-${i}-reps`]; return r?`${v}lbs×${r}reps`:`${v}lbs`; }).join(", "):`${ex.sets}×${ex.reps}`}`);
        });
        if(entry.cardio) lines.push(`  Cardio: ${entry.cardio}`);
        if(entry.sauna) lines.push(`  Sauna: ${entry.saunaMin||"?"}min`);
        if(entry.notes) lines.push(`  Notes: "${entry.notes}"`);
      });
    });
    lines.push("\n=== MEASUREMENTS ===");
    weeks.filter(w=>data.measurements?.[w]).forEach(w=>{
      const m=data.measurements[w];
      lines.push(`${w}: Waist ${m.waist||"?"}in, Hips ${m.hips||"?"}in, Chest ${m.chest||"?"}in, Arms ${m.arms||"?"}in`);
    });
    lines.push("\n=== CHECK-INS ===");
    weeks.filter(w=>data.checkIns?.[w]?.energy).forEach(w=>{
      const c=data.checkIns[w];
      lines.push(`${w}: Energy=${c.energy}, Soreness=${c.soreness}, Sleep=${c.sleep}, Stress=${c.stress}${c.notes?`, Notes: "${c.notes}"`:""}`);
    });
    return lines.join("\n") || "No data yet.";
  }

  function copyToClipboard() {
    const text = `Here's my fitness tracker data — can you give me trainer feedback?\n\n${buildSummary()}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  }

  return (
    <div>
      <Card style={{ background:"rgba(79,70,229,0.08)", border:`1px solid ${S.accent}44` }}>
        <Label>How to get trainer feedback</Label>
        <div style={{ fontSize:13, color:S.accentLight, lineHeight:2 }}>
          1. Click <strong>"Copy My Data"</strong> below<br/>
          2. Open <strong>Claude.ai</strong> → your Fitness Tracker project<br/>
          3. Paste into the chat — I'll analyze everything and respond
        </div>
      </Card>
      <Card>
        <Label>Your Progress Data</Label>
        <pre style={{ fontSize:10, color:"#6666aa", whiteSpace:"pre-wrap", fontFamily:"monospace", margin:"0 0 14px", lineHeight:1.5, maxHeight:300, overflowY:"auto" }}>
          {buildSummary()}
        </pre>
        <Btn full onClick={copyToClipboard} color={copied ? S.green : S.accent}>
          {copied ? "✓ Copied! Paste it into Claude." : "Copy My Data"}
        </Btn>
      </Card>
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [data, setData] = useState(load);
  const [tab, setTab] = useState("log");
  const [week, setWeek] = useState("Week 1");
  const [workoutTab, setWorkoutTab] = useState("push");
  const [showAddDay, setShowAddDay] = useState(false);
  const [newDayName, setNewDayName] = useState("");
  const fileRef = useRef();

  const extraDays = data.extraDays || [];
  const weekCount = data.weekCount || 7;
  const weeks = getWeeks(weekCount);

  function setWeekCount(n) {
    const nd = { ...data, weekCount: Math.max(1, n) };
    setData(nd); persist(nd);
    if (!getWeeks(n).includes(week)) setWeek(`Week ${n}`);
  }
  function addExtraDay() {
    if (!newDayName.trim()) return;
    const id = `extra_${Date.now()}`;
    const accent = ACCENT_POOL[extraDays.length % ACCENT_POOL.length];
    const newData = { ...data, extraDays:[...extraDays,{ id, label:newDayName.trim(), accent }] };
    setData(newData); persist(newData);
    setWorkoutTab(id); setNewDayName(""); setShowAddDay(false);
  }
  function removeExtraDay(id) {
    const newData = { ...data, extraDays:extraDays.filter(d=>d.id!==id) };
    setData(newData); persist(newData);
    if (workoutTab===id) setWorkoutTab("push");
  }
  function exportData() {
    const blob = new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download="fitness-backup.json"; a.click();
    URL.revokeObjectURL(url);
  }
  function importData(e) {
    const file=e.target.files[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=ev=>{ try { const d=JSON.parse(ev.target.result); setData(d); persist(d); alert("Imported!"); } catch { alert("Invalid file."); } };
    reader.readAsText(file);
  }

  const TOP_TABS = [
    { id:"log", label:"Log" },
    { id:"history", label:"History" },
    { id:"progress", label:"Progress" },
    { id:"checkin", label:"Check-In" },
    { id:"feedback", label:"Feedback" },
  ];

  return (
    <div style={{ fontFamily:"Georgia,serif", minHeight:"100vh", background:`linear-gradient(135deg,${S.dark} 0%,${S.mid} 60%,#16213e 100%)`, color:S.text }}>
      <div style={{ background:"linear-gradient(90deg,#1a1a2e,#2d2d5e)", borderBottom:"2px solid #3d3d7e", padding:"14px 16px 12px", position:"sticky", top:0, zIndex:10 }}>
        <div style={{ maxWidth:760, margin:"0 auto" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <div style={{ fontSize:9, letterSpacing:3, color:S.muted, textTransform:"uppercase" }}>Wedding Prep</div>
              <div style={{ fontSize:18, fontWeight:"bold", color:"#fff", marginBottom:10 }}>Fitness Tracker</div>
            </div>
            <div style={{ display:"flex", gap:6 }}>
              <button onClick={exportData} style={{ padding:"5px 10px", borderRadius:14, border:"1px solid #3d3d6e", background:"transparent", color:"#aaa", fontSize:10, fontFamily:"Georgia,serif", cursor:"pointer" }}>⬇ Export</button>
              <button onClick={()=>fileRef.current.click()} style={{ padding:"5px 10px", borderRadius:14, border:"1px solid #3d3d6e", background:"transparent", color:"#aaa", fontSize:10, fontFamily:"Georgia,serif", cursor:"pointer" }}>⬆ Import</button>
              <input ref={fileRef} type="file" accept=".json" onChange={importData} style={{ display:"none" }} />
            </div>
          </div>
          <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
            {TOP_TABS.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{
                padding:"5px 13px", borderRadius:18, border:"none", cursor:"pointer", fontSize:11,
                fontFamily:"Georgia,serif", background:tab===t.id?S.accent:"rgba(255,255,255,0.08)",
                color:tab===t.id?"#fff":"#aaa", fontWeight:tab===t.id?"bold":"normal",
              }}>{t.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:760, margin:"0 auto", padding:"16px 14px" }}>
        {tab==="log" && (
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12, flexWrap:"wrap" }}>
              <select value={week} onChange={e=>setWeek(e.target.value)} style={{ background:"#1e1e3a", border:`1px solid ${S.border}`, color:S.text, padding:"7px 12px", borderRadius:8, fontSize:13, fontFamily:"Georgia,serif" }}>
                {weeks.map(w=><option key={w}>{w}</option>)}
              </select>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <button onClick={()=>setWeekCount(weekCount-1)} disabled={weekCount<=1} style={{ width:28, height:28, borderRadius:6, border:`1px solid ${S.border}`, background:"#1e1e3a", color:S.muted, cursor:weekCount<=1?"not-allowed":"pointer", fontSize:16 }}>−</button>
                <span style={{ fontSize:11, color:S.muted, whiteSpace:"nowrap" }}>{weekCount} wks</span>
                <button onClick={()=>setWeekCount(weekCount+1)} style={{ width:28, height:28, borderRadius:6, border:`1px solid ${S.border}`, background:"#1e1e3a", color:S.accentLight, cursor:"pointer", fontSize:16 }}>+</button>
              </div>
            </div>
            <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:16, alignItems:"center" }}>
              {Object.entries(PROGRAM_DAYS).map(([dk,d])=>(
                <button key={dk} onClick={()=>setWorkoutTab(dk)} style={{
                  padding:"7px 13px", borderRadius:8, border:workoutTab===dk?"none":`1px solid ${S.border}`,
                  cursor:"pointer", fontSize:12, fontFamily:"Georgia,serif",
                  background:workoutTab===dk?d.accent:"#1e1e3a", color:"#fff",
                  fontWeight:workoutTab===dk?"bold":"normal",
                }}>{d.label}</button>
              ))}
              {extraDays.map(d=>(
                <div key={d.id} style={{ display:"flex" }}>
                  <button onClick={()=>setWorkoutTab(d.id)} style={{
                    padding:"7px 13px", borderRadius:"8px 0 0 8px", border:workoutTab===d.id?"none":`1px solid ${S.border}`,
                    cursor:"pointer", fontSize:12, fontFamily:"Georgia,serif",
                    background:workoutTab===d.id?d.accent:"#1e1e3a", color:"#fff",
                  }}>{d.label}</button>
                  <button onClick={()=>removeExtraDay(d.id)} style={{ padding:"7px 8px", borderRadius:"0 8px 8px 0", border:`1px solid ${S.border}`, background:"#1e1e3a", color:"#ef4444", cursor:"pointer", fontSize:13 }}>×</button>
                </div>
              ))}
              {!showAddDay
                ? <button onClick={()=>setShowAddDay(true)} style={{ padding:"7px 13px", borderRadius:8, border:`1px dashed ${S.border}`, background:"transparent", color:S.muted, cursor:"pointer", fontSize:12, fontFamily:"Georgia,serif" }}>+ Add Day</button>
                : <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                    <input value={newDayName} onChange={e=>setNewDayName(e.target.value)} placeholder="e.g. Legs, Arms..." autoFocus
                      onKeyDown={e=>e.key==="Enter"&&addExtraDay()}
                      style={{ background:S.dark, border:`1px solid ${S.accent}`, color:S.text, padding:"7px 10px", borderRadius:8, fontSize:12, fontFamily:"Georgia,serif", width:120 }} />
                    <Btn small onClick={addExtraDay}>Add</Btn>
                    <button onClick={()=>setShowAddDay(false)} style={{ background:"none", border:"none", color:S.muted, cursor:"pointer", fontSize:18 }}>×</button>
                  </div>
              }
            </div>
            {PROGRAM_DAYS[workoutTab]
              ? <ProgramDayTab dayKey={workoutTab} week={week} data={data} setData={setData} weeks={weeks} />
              : (() => { const d=extraDays.find(d=>d.id===workoutTab); return d?<ExtraDayTab dayDef={d} week={week} data={data} setData={setData} weeks={weeks}/>:null; })()
            }
          </div>
        )}
        {tab==="history" && <HistoryTab data={data} weeks={weeks} />}
        {tab==="progress" && <ProgressTab data={data} setData={setData} weeks={weeks} />}
        {tab==="checkin" && <CheckInTab data={data} setData={setData} weeks={weeks} />}
        {tab==="feedback" && <FeedbackTab data={data} weeks={weeks} />}
      </div>
    </div>
  );
}
