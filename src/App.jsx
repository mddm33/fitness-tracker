import { useState, useEffect, useRef } from "react";

// ── CONSTANTS ────────────────────────────────────────────────────────────────
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
const STORAGE_KEY = "wfit-v4";
const PROTEIN_TARGET = 190;
const CALORIE_TARGET = 2200;
const WATER_TARGET = 128;

const S = {
  dark: "#0f0f1a", mid: "#1a1a2e", card: "rgba(255,255,255,0.04)",
  border: "#2d2d5e", muted: "#8888aa", text: "#e8e8f0",
  accent: "#4f46e5", accentLight: "#a5b4fc", green: "#16a34a",
};

const ACCENT_POOL = ["#7c3aed","#db2777","#0891b2","#ea580c","#65a30d","#0d9488","#b45309"];

function todayStr() { return new Date().toISOString().slice(0,10); }
function load() {
  try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : defaultData(); }
  catch { return defaultData(); }
}
function defaultData() {
  return { weightLog:{}, workoutLog:{}, dietLog:{}, extraDays:[], measurements:{}, checkIns:{}, favoriteFoods:[] };
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
function MacroBar({ label, value, target, color, unit }) {
  const pct = Math.min((value/target)*100,100);
  const over = value > target;
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}>
        <span style={{ color:S.muted }}>{label}</span>
        <span style={{ color: over?"#ef4444":S.text, fontWeight:"bold" }}>
          {Math.round(value)}<span style={{ color:S.muted, fontWeight:"normal" }}>/{target}{unit}</span>
        </span>
      </div>
      <div style={{ background:"#1e1e3a", borderRadius:6, height:9, overflow:"hidden" }}>
        <div style={{ width:`${pct}%`, height:"100%", background: over?"#ef4444":color, borderRadius:6, transition:"width 0.4s" }} />
      </div>
    </div>
  );
}

function DietTab({ data, setData }) {
  const [date, setDate] = useState(todayStr());
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState("");
  const [showFavs, setShowFavs] = useState(false);

  const dietDay = data.dietLog?.[date] || { meals:[], water:0 };
  const meals = dietDay.meals || [];
  const waterOz = dietDay.water || 0;
  const favs = data.favoriteFoods || [];

  function updateDay(updated) {
    const newData = { ...data, dietLog:{ ...data.dietLog, [date]: updated } };
    setData(newData); persist(newData);
  }
  function setMeals(m) { updateDay({ ...dietDay, meals:m }); }
  function setWaterOz(w) { updateDay({ ...dietDay, water:w }); }

  async function lookupFood() {
    if (!query.trim()) return;
    setLoading(true); setError(""); setSuggestions([]);
    try {
      const prompt = `User wants to log: "${query}"\nReturn ONLY a JSON array of 1-3 serving options. Each: {"name":string,"serving":string,"calories":number,"protein":number,"carbs":number,"fat":number}. Use accurate USDA nutrition data. No markdown, no explanation.`;
      const res = await fetch("/api/claude",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ max_tokens:800, messages:[{role:"user",content:prompt}] })
      });
      const result = await res.json();
      const text = result.content?.map(c=>c.text||"").join("")||"[]";
      setSuggestions(JSON.parse(text.replace(/```json|```/g,"").trim()));
    } catch { setError("Couldn't look up that food. Try being more specific."); }
    setLoading(false);
  }

  function addMeal(item) {
    const meal = { ...item, id:Date.now() };
    setMeals([...meals, meal]);
    if (!favs.find(f => f.name===item.name && f.serving===item.serving)) {
      const newData = { ...data, favoriteFoods:[...favs, item], dietLog:{ ...data.dietLog, [date]:{ ...dietDay, meals:[...meals, meal] } } };
      setData(newData); persist(newData);
    }
    setSuggestions([]); setQuery("");
  }

  function addFav(fav) { setMeals([...meals, { ...fav, id:Date.now() }]); }
  function removeFav(idx) {
    const newFavs = favs.filter((_,i)=>i!==idx);
    const newData = { ...data, favoriteFoods:newFavs };
    setData(newData); persist(newData);
  }
  function removeMeal(id) { setMeals(meals.filter(m=>m.id!==id)); }

  const totals = meals.reduce((a,m)=>({ calories:a.calories+(m.calories||0), protein:a.protein+(m.protein||0), carbs:a.carbs+(m.carbs||0), fat:a.fat+(m.fat||0) }), {calories:0,protein:0,carbs:0,fat:0});
  const waterPct = Math.min((waterOz/WATER_TARGET)*100,100);

  function shiftDate(days) {
    const d = new Date(date); d.setDate(d.getDate()+days);
    setDate(d.toISOString().slice(0,10)); setSuggestions([]);
  }

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
        <Btn small onClick={()=>shiftDate(-1)}>← Prev</Btn>
        <Inp type="date" value={date} onChange={e=>{setDate(e.target.value);setSuggestions([]);}} style={{ fontSize:12, padding:"6px 10px" }} />
        <Btn small onClick={()=>shiftDate(1)} disabled={date>=todayStr()}>Next →</Btn>
        {date===todayStr() && <span style={{ fontSize:11, color:S.green }}>Today</span>}
      </div>
      <Card>
        <Label>Daily Totals</Label>
        <MacroBar label="Calories" value={totals.calories} target={CALORIE_TARGET} color="#f59e0b" unit=" kcal" />
        <MacroBar label="Protein" value={totals.protein} target={PROTEIN_TARGET} color={S.accent} unit="g" />
        <MacroBar label="Carbs" value={totals.carbs} target={250} color="#10b981" unit="g" />
        <MacroBar label="Fat" value={totals.fat} target={70} color="#f97316" unit="g" />
      </Card>
      <Card>
        <Label>Water Intake</Label>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
          <Btn small color="#0891b2" onClick={()=>setWaterOz(Math.max(0,waterOz-8))}>−8 oz</Btn>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}>
              <span style={{ color:S.muted }}>Ounces</span>
              <span style={{ color: waterOz>=WATER_TARGET?"#10b981":S.text, fontWeight:"bold" }}>{waterOz}<span style={{ color:S.muted, fontWeight:"normal" }}>/{WATER_TARGET} oz</span></span>
            </div>
            <div style={{ background:"#1e1e3a", borderRadius:6, height:9 }}>
              <div style={{ width:`${waterPct}%`, height:"100%", background:"#0891b2", borderRadius:6, transition:"width 0.3s" }} />
            </div>
          </div>
          <Btn small color="#0891b2" onClick={()=>setWaterOz(waterOz+8)}>+8 oz</Btn>
        </div>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {[16,20,32].map(oz=>(
            <Btn key={oz} small color="#0c4a6e" onClick={()=>setWaterOz(waterOz+oz)}>+{oz} oz</Btn>
          ))}
          <Btn small color="#374151" onClick={()=>setWaterOz(0)}>Reset</Btn>
        </div>
      </Card>
      <Card>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
          <Label style={{ marginBottom:0 }}>Add Food</Label>
          {favs.length>0 && <button onClick={()=>setShowFavs(!showFavs)} style={{ background:"none", border:"none", color:S.accentLight, fontSize:12, cursor:"pointer" }}>{showFavs?"Hide":"⭐ Favorites"}</button>}
        </div>
        {showFavs && favs.length>0 && (
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:11, color:S.muted, marginBottom:6 }}>Tap to add instantly:</div>
            {favs.map((f,i)=>(
              <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"#1e1e3a", borderRadius:8, padding:"8px 12px", marginBottom:6, cursor:"pointer" }} onClick={()=>addFav(f)}>
                <div>
                  <span style={{ fontSize:13, color:S.text, fontWeight:"bold" }}>{f.name}</span>
                  <span style={{ fontSize:11, color:S.muted }}> — {f.serving}</span>
                </div>
                <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                  <span style={{ fontSize:11, color:"#f59e0b" }}>{f.calories} kcal</span>
                  <span style={{ fontSize:11, color:S.accentLight }}>{f.protein}g P</span>
                  <button onClick={e=>{e.stopPropagation();removeFav(i);}} style={{ background:"none", border:"none", color:"#ef4444", fontSize:15, cursor:"pointer" }}>×</button>
                </div>
              </div>
            ))}
          </div>
        )}
        <p style={{ fontSize:11, color:S.muted, margin:"0 0 8px", lineHeight:1.5 }}>Just describe it — "2 scrambled eggs", "grande latte", "6oz salmon", "handful almonds"</p>
        <div style={{ display:"flex", gap:8, marginBottom:8 }}>
          <Inp value={query} onChange={e=>setQuery(e.target.value)} placeholder='e.g. "protein shake with milk"' style={{ flex:1 }} onKeyDown={e=>e.key==="Enter"&&lookupFood()} />
          <Btn onClick={lookupFood} disabled={loading} color={S.green}>{loading?"...":"Look Up"}</Btn>
        </div>
        {error && <div style={{ fontSize:12, color:"#ef4444" }}>{error}</div>}
        {suggestions.length>0 && (
          <div style={{ marginTop:8 }}>
            <div style={{ fontSize:11, color:S.muted, marginBottom:6 }}>Select a serving:</div>
            {suggestions.map((s,i)=>(
              <div key={i} onClick={()=>addMeal(s)} style={{ background:"#1e1e3a", borderRadius:9, padding:"10px 13px", marginBottom:7, border:`1px solid ${S.border}`, cursor:"pointer" }}
                onMouseEnter={e=>e.currentTarget.style.borderColor=S.accent}
                onMouseLeave={e=>e.currentTarget.style.borderColor=S.border}>
                <div style={{ fontSize:13, fontWeight:"bold", color:S.text, marginBottom:3 }}>
                  {s.name} <span style={{ fontSize:11, color:S.muted, fontWeight:"normal" }}>— {s.serving}</span>
                </div>
                <div style={{ display:"flex", gap:10, fontSize:11, flexWrap:"wrap" }}>
                  <span style={{ color:"#f59e0b" }}>{s.calories} kcal</span>
                  <span style={{ color:S.accentLight }}>{s.protein}g protein</span>
                  <span style={{ color:"#10b981" }}>{s.carbs}g carbs</span>
                  <span style={{ color:"#f97316" }}>{s.fat}g fat</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
      {meals.length>0 && (
        <Card>
          <Label>Food Log — {date}</Label>
          {meals.map(m=>(
            <div key={m.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:`1px solid ${S.border}` }}>
              <div>
                <div style={{ fontSize:13, color:S.text, fontWeight:"bold" }}>{m.name}</div>
                <div style={{ fontSize:11, color:S.muted, marginTop:2 }}>{m.serving} · {m.calories} kcal · {m.protein}g P · {m.carbs}g C · {m.fat}g F</div>
              </div>
              <button onClick={()=>removeMeal(m.id)} style={{ background:"none", border:"none", color:"#ef4444", fontSize:20, cursor:"pointer", padding:"0 4px" }}>×</button>
            </div>
          ))}
          <div style={{ paddingTop:10, display:"flex", justifyContent:"space-between", fontSize:13, fontWeight:"bold" }}>
            <span style={{ color:S.muted }}>Total</span>
            <span>{Math.round(totals.calories)} kcal · {Math.round(totals.protein)}g protein</span>
          </div>
        </Card>
      )}
    </div>
  );
}

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

  function copyPrev() { if (prevEntry) { setWeights(prevEntry.weights); } }

  useEffect(() => {
    const e = data.workoutLog[logKey]||{};
    setWeights(e.weights||{}); setCardio(e.cardio||""); setSauna(e.sauna||false);
    setSaunaMin(e.saunaMin||""); setNotes(e.notes||""); setExtras(e.extras||[]);
    setSubs(e.subs||{}); setSwapping(null); setSwapName("");
  }, [logKey]);

  function updateWeight(id, i, val) { setWeights(p=>({...p,[`${id}-${i}`]:val})); }

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
            <Btn small onClick={copyPrev} color="#374151">Copy Weights</Btn>
          </div>
          <div style={{ fontSize:11, color:S.muted, lineHeight:1.8 }}>
            {[...day.compound, ...day.isolation].map(ex => {
              const sets = Array.isArray(ex.reps) ? ex.reps.length : ex.sets;
              const vals = Array.from({length:sets},(_,i)=>prevEntry.weights[`${ex.id}-${i}`]).filter(Boolean);
              return vals.length ? <div key={ex.id}>{ex.name}: {vals.map((v,i)=>`Set${i+1} ${v}lbs`).join(" · ")}</div> : null;
            })}
          </div>
        </Card>
      )}
      <Label>Compound Lifts — Pyramid (12/10/8/6)</Label>
      {day.compound.map(ex=>{
        const subName = subs[ex.id];
        const displayName = subName || ex.name;
        const isSwapping = swapping === ex.id;
        return (
          <Card key={ex.id} accent={subName ? "#7c3aed55" : `${day.accent}55`}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
              <div>
                <div style={{ fontSize:14, fontWeight:"bold", color:"#fff" }}>{displayName}</div>
                {subName && <div style={{ fontSize:10, color:"#c4b5fd", marginTop:2 }}>Subbing for: {ex.name}</div>}
              </div>
              <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                {subName && <button onClick={()=>clearSub(ex.id)} style={{ background:"none", border:"none", color:S.muted, fontSize:11, cursor:"pointer", padding:"2px 6px" }}>Reset</button>}
                <button onClick={()=>{ setSwapping(isSwapping?null:ex.id); setSwapName(subName||""); }} style={{ background:"#374151", border:"none", color:"#fff", fontSize:11, borderRadius:6, padding:"4px 10px", cursor:"pointer", fontFamily:"Georgia,serif" }}>
                  {isSwapping ? "Cancel" : "⇄ Sub"}
                </button>
              </div>
            </div>
            {isSwapping && (
              <div style={{ display:"flex", gap:8, marginBottom:10, alignItems:"center" }}>
                <Inp value={swapName} onChange={e=>setSwapName(e.target.value)} placeholder="e.g. Dumbbell Press" onKeyDown={e=>e.key==="Enter"&&confirmSwap(ex.id)} style={{ flex:1 }} />
                <Btn small onClick={()=>confirmSwap(ex.id)} color="#7c3aed">Use This</Btn>
              </div>
            )}
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {ex.reps.map((rep,i)=>(
                <div key={i} style={{ textAlign:"center" }}>
                  <div style={{ fontSize:10, color:S.muted, marginBottom:4 }}>Set {i+1} · {rep}r</div>
                  <Inp type="number" placeholder="lbs" value={weights[`${ex.id}-${i}`]||""}
                    onChange={e=>updateWeight(ex.id,i,e.target.value)}
                    style={{ width:62, textAlign:"center", padding:"7px 4px", border:`1px solid ${weights[`${ex.id}-${i}`]?day.accent:S.border}` }} />
                </div>
              ))}
            </div>
          </Card>
        );
      })}
      <Label>Isolation — Straight Sets</Label>
      {day.isolation.map(ex=>{
        const subName = subs[ex.id];
        const displayName = subName || ex.name;
        const isSwapping = swapping === ex.id;
        return (
          <Card key={ex.id} accent={subName ? "#7c3aed55" : S.border}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
              <div>
                <div style={{ fontSize:14, fontWeight:"bold", color:"#fff" }}>
                  {displayName} <span style={{ fontSize:11, color:S.muted, fontWeight:"normal" }}>· {ex.sets}×{ex.reps}</span>
                </div>
                {subName && <div style={{ fontSize:10, color:"#c4b5fd", marginTop:2 }}>Subbing for: {ex.name}</div>}
              </div>
              <div style={{ display:"flex", gap:6 }}>
                {subName && <button onClick={()=>clearSub(ex.id)} style={{ background:"none", border:"none", color:S.muted, fontSize:11, cursor:"pointer" }}>Reset</button>}
                <button onClick={()=>{ setSwapping(isSwapping?null:ex.id); setSwapName(subName||""); }} style={{ background:"#374151", border:"none", color:"#fff", fontSize:11, borderRadius:6, padding:"4px 10px", cursor:"pointer", fontFamily:"Georgia,serif" }}>
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
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {Array.from({length:ex.sets},(_,i)=>(
                <div key={i} style={{ textAlign:"center" }}>
                  <div style={{ fontSize:10, color:S.muted, marginBottom:4 }}>Set {i+1}</div>
                  <Inp type="number" placeholder="lbs" value={weights[`${ex.id}-${i}`]||""}
                    onChange={e=>updateWeight(ex.id,i,e.target.value)}
                    style={{ width:62, textAlign:"center", padding:"7px 4px", border:`1px solid ${weights[`${ex.id}-${i}`]?"#6366f1":S.border}` }} />
                </div>
              ))}
            </div>
          </Card>
        );
      })}
      <Label>Extra Exercises</Label>
      <Card>
        <div style={{ display:"flex", gap:6, marginBottom:8, flexWrap:"wrap" }}>
          <Inp value={newExtra.name} onChange={e=>setNewExtra({...newExtra,name:e.target.value})} placeholder="Exercise" style={{ flex:2, minWidth:100 }} />
          <Inp value={newExtra.sets} onChange={e=>setNewExtra({...newExtra,sets:e.target.value})} placeholder="Sets" style={{ width:52 }} />
          <Inp value={newExtra.reps} onChange={e=>setNewExtra({...newExtra,reps:e.target.value})} placeholder="Reps" style={{ width:52 }} />
          <Btn small onClick={()=>{ if(!newExtra.name)return; setExtras(p=>[...p,{...newExtra,id:Date.now()}]); setNewExtra({name:"",sets:"",reps:""}); }}>+</Btn>
        </div>
        {extras.map(ex=>(
          <div key={ex.id} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:`1px solid ${S.border}`, fontSize:13 }}>
            <span style={{ color:S.text }}>{ex.name} {ex.sets&&`${ex.sets}×${ex.reps}`}</span>
            <button onClick={()=>setExtras(p=>p.filter(e=>e.id!==ex.id))} style={{ background:"none", border:"none", color:"#ef4444", cursor:"pointer" }}>×</button>
          </div>
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
  function updateWeight(id,i,val) { setWeights(p=>({...p,[`${id}-${i}`]:val})); }

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
              return <div key={ex.id}>{ex.name}: {vals.length?vals.map((v,i)=>`Set${i+1} ${v}lbs`).join(" · "):`${ex.sets}×${ex.reps}`}</div>;
            })}
          </div>
        </Card>
      )}
      <Card>
        <Label>Add Exercise</Label>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:8 }}>
          <Inp value={newEx.name} onChange={e=>setNewEx({...newEx,name:e.target.value})} placeholder="Exercise name" style={{ flex:2, minWidth:120 }} />
          <Inp type="number" value={newEx.sets} onChange={e=>setNewEx({...newEx,sets:e.target.value})} placeholder="Sets" style={{ width:52 }} />
          <Inp value={newEx.reps} onChange={e=>setNewEx({...newEx,reps:e.target.value})} placeholder="Reps" style={{ width:70 }} />
          <Btn small onClick={addEx}>+ Add</Btn>
        </div>
      </Card>
      {exercises.map(ex=>(
        <Card key={ex.id} accent={`${dayDef.accent}55`}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <div>
              <div style={{ fontSize:14, fontWeight:"bold", color:S.text }}>{ex.name}</div>
              <div style={{ fontSize:11, color:S.muted }}>{ex.sets} sets{ex.reps&&` × ${ex.reps}`}</div>
            </div>
            <button onClick={()=>setExercises(p=>p.filter(e=>e.id!==ex.id))} style={{ background:"none", border:"none", color:"#ef4444", fontSize:18, cursor:"pointer" }}>×</button>
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {Array.from({length:ex.sets||3},(_,i)=>(
              <div key={i} style={{ textAlign:"center" }}>
                <div style={{ fontSize:10, color:S.muted, marginBottom:4 }}>Set {i+1}</div>
                <Inp type="number" placeholder="lbs" value={weights[`${ex.id}-${i}`]||""}
                  onChange={e=>updateWeight(ex.id,i,e.target.value)}
                  style={{ width:62, textAlign:"center", padding:"7px 4px", border:`1px solid ${weights[`${ex.id}-${i}`]?dayDef.accent:S.border}` }} />
              </div>
            ))}
          </div>
        </Card>
      ))}
      <Card><Label>Cardio / Notes</Label><Inp value={cardio} onChange={e=>setCardio(e.target.value)} placeholder="e.g. 30 min run" style={{ width:"100%", boxSizing:"border-box" }} /></Card>
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
            {entry.sauna && <span style={{ fontSize:11, color:S.accentLight }}>🧖 Sauna {entry.saunaMin&&`${entry.saunaMin}min`}</span>}
          </div>
          {PROGRAM_DAYS[dayDef.id||""] && [...(PROGRAM_DAYS[dayDef.id]?.compound||[]), ...(PROGRAM_DAYS[dayDef.id]?.isolation||[])].map(ex=>{
            const sets=Array.isArray(ex.reps)?ex.reps.length:ex.sets;
            const vals=Array.from({length:sets},(_,i)=>entry.weights?.[`${ex.id}-${i}`]).filter(Boolean);
            return vals.length?<div key={ex.id} style={{ fontSize:12, color:S.text, marginBottom:4 }}><span style={{ color:S.muted }}>{ex.name}:</span> {vals.map((v)=>`${v}lbs`).join(" → ")}</div>:null;
          })}
          {(entry.exercises||[]).map(ex=>{
            const vals=Array.from({length:ex.sets||3},(_,i)=>entry.weights?.[`${ex.id}-${i}`]).filter(Boolean);
            return <div key={ex.id} style={{ fontSize:12, color:S.text, marginBottom:4 }}><span style={{ color:S.muted }}>{ex.name}:</span> {vals.length?vals.map(v=>`${v}lbs`).join(" → "):`${ex.sets}×${ex.reps}`}</div>;
          })}
          {entry.cardio && <div style={{ fontSize:12, color:"#10b981", marginTop:4 }}>🏃 {entry.cardio}</div>}
          {entry.notes && <div style={{ fontSize:12, color:S.muted, marginTop:6, fontStyle:"italic" }}>"{entry.notes}"</div>}
        </Card>
      ))}
    </div>
  );
}

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

  const dietDays = Object.keys(data.dietLog||{});
  const proteinHits = dietDays.filter(d=>{
    const tot=(data.dietLog[d]?.meals||[]).reduce((a,m)=>a+(m.protein||0),0);
    return tot>=PROTEIN_TARGET*0.9;
  }).length;

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
        {[
          { label:"Start Weight", value:startW?`${startW} lbs`:"—" },
          { label:"Current Weight", value:latestW?`${latestW} lbs`:"—" },
          { label:"Total Lost", value:totalLost?`${totalLost} lbs`:"—", hi:true },
          { label:"Workouts Logged", value:`${workoutsLogged}`, sub:"sessions" },
          { label:"Sauna Sessions", value:`${saunaCount}`, sub:"sessions" },
          { label:"Protein Goals Hit", value:`${proteinHits}`, sub:`of ${dietDays.length} days` },
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
      <Card>
        <Label>Diet Log Summary</Label>
        {dietDays.length===0?<div style={{ color:S.muted, fontSize:13 }}>No diet data yet.</div>:
          dietDays.sort().map(date=>{
            const meals=data.dietLog[date]?.meals||[];
            const water=data.dietLog[date]?.water||0;
            const tot=meals.reduce((a,m)=>({cal:a.cal+(m.calories||0),pro:a.pro+(m.protein||0)}),{cal:0,pro:0});
            return (
              <div key={date} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 0", borderBottom:`1px solid ${S.border}` }}>
                <span style={{ fontSize:12, color:S.text }}>{date}</span>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", justifyContent:"flex-end" }}>
                  <span style={{ fontSize:11, color:tot.cal<=CALORIE_TARGET+100?"#10b981":"#ef4444" }}>{Math.round(tot.cal)} kcal</span>
                  <span style={{ fontSize:11, color:tot.pro>=PROTEIN_TARGET*0.9?"#10b981":"#f59e0b" }}>{Math.round(tot.pro)}g P</span>
                  <span style={{ fontSize:11, color:water>=WATER_TARGET?"#0891b2":S.muted }}>💧{water}oz</span>
                </div>
              </div>
            );
          })
        }
      </Card>
    </div>
  );
}

function CheckInTab({ data, setData, weeks }) {
  const [week, setWeek] = useState("Week 1");
  const [form, setForm] = useState({ energy:"", soreness:"", diet:"", sleep:"", stress:"", notes:"" });
  const [saved, setSaved] = useState(false);

  useEffect(()=>{ setForm(data.checkIns?.[week]||{ energy:"", soreness:"", diet:"", sleep:"", stress:"", notes:"" }); }, [week]);

  function handleSave() {
    const nd={...data,checkIns:{...data.checkIns,[week]:form}};
    setData(nd); persist(nd); setSaved(true); setTimeout(()=>setSaved(false),2000);
  }

  const questions = [
    { key:"energy", label:"How was your energy this week?", opts:["Very low","Low","Average","Good","Great"] },
    { key:"soreness", label:"Overall soreness / recovery?", opts:["Very sore","Somewhat sore","Mild","Recovered","100%"] },
    { key:"diet", label:"How well did you stick to the diet?", opts:["Poorly","Somewhat","Pretty good","Very good","Perfect"] },
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
        <div style={{ fontSize:12, color:S.accentLight, lineHeight:1.6 }}>
          Fill this out at the end of each week. It helps your trainer give you better, more specific feedback.
        </div>
      </Card>
      {questions.map(q=>(
        <Card key={q.key}>
          <Label>{q.label}</Label>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {q.opts.map(opt=>(
              <button key={opt} onClick={()=>setForm(f=>({...f,[q.key]:opt}))} style={{
                padding:"7px 12px", borderRadius:8, border:"none", cursor:"pointer", fontSize:12,
                fontFamily:"Georgia,serif", background:form[q.key]===opt?S.accent:"#1e1e3a",
                color:form[q.key]===opt?"#fff":S.muted, transition:"background 0.15s",
              }}>{opt}</button>
            ))}
          </div>
        </Card>
      ))}
      <Card>
        <Label>Anything else your trainer should know?</Label>
        <Textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Injuries, life stress, travel, diet slip-ups, wins..." />
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
                  {[["Energy",c.energy],["Soreness",c.soreness],["Diet",c.diet],["Sleep",c.sleep],["Stress",c.stress]].filter(([,v])=>v).map(([k,v])=>(
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

function FeedbackTab({ data, weeks }) {
  const [aiFeedback, setAiFeedback] = useState("");
  const [loading, setLoading] = useState(false);

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
            const sets=Array.isArray(ex.reps)?ex.reps.length:ex.sets;
            const vals=Array.from({length:sets},(_,i)=>entry.weights?.[`${ex.id}-${i}`]).filter(Boolean);
            if(vals.length) lines.push(`  ${ex.name}: ${vals.map(v=>`${v}lbs`).join(", ")}`);
          });
        }
        (entry.exercises||[]).forEach(ex=>{
          const vals=Array.from({length:ex.sets||3},(_,i)=>entry.weights?.[`${ex.id}-${i}`]).filter(Boolean);
          lines.push(`  ${ex.name} ${ex.sets}×${ex.reps}${vals.length?`: ${vals.join(", ")}`:"" }`);
        });
        if(entry.cardio) lines.push(`  Cardio: ${entry.cardio}`);
        if(entry.sauna) lines.push(`  Sauna: ${entry.saunaMin||"?"}min`);
        if(entry.notes) lines.push(`  Notes: "${entry.notes}"`);
      });
    });
    lines.push("\n=== DIET (recent) ===");
    Object.keys(data.dietLog||{}).sort().slice(-7).forEach(date=>{
      const meals=data.dietLog[date]?.meals||[], water=data.dietLog[date]?.water||0;
      const tot=meals.reduce((a,m)=>({cal:a.cal+(m.calories||0),pro:a.pro+(m.protein||0)}),{cal:0,pro:0});
      lines.push(`${date}: ${Math.round(tot.cal)} kcal, ${Math.round(tot.pro)}g protein, ${water}oz water`);
    });
    lines.push("\n=== MEASUREMENTS ===");
    weeks.filter(w=>data.measurements?.[w]).forEach(w=>{
      const m=data.measurements[w];
      lines.push(`${w}: Waist ${m.waist||"?"}in, Hips ${m.hips||"?"}in, Chest ${m.chest||"?"}in, Arms ${m.arms||"?"}in`);
    });
    lines.push("\n=== WEEKLY CHECK-INS ===");
    weeks.filter(w=>data.checkIns?.[w]?.energy).forEach(w=>{
      const c=data.checkIns[w];
      lines.push(`${w}: Energy=${c.energy}, Soreness=${c.soreness}, Diet=${c.diet}, Sleep=${c.sleep}, Stress=${c.stress}${c.notes?`, Notes: "${c.notes}"`:"" }`);
    });
    return lines.join("\n") || "No data yet.";
  }

  async function getFeedback() {
    setLoading(true); setAiFeedback("");
    const prompt = `You are a personal trainer reviewing your client's fitness program data. Here's everything:\n\n${buildSummary()}\n\nClient profile: 6'2", started ~205 lbs, above average strength, training 3x/week (Push/Pull/Full Body) + any extra sessions logged. Goal: lose fat especially lower midsection and hips, look great at a wedding. Program: pyramid reps (12,10,8,6) on compounds, straight sets on isolation, 15-20 min cardio post-workout, sauna after sessions, creatine daily, targeting 2200 kcal/day and 190g protein, 1 gallon water/day.\n\nGive direct, specific, motivating trainer feedback. Reference actual numbers from their data. Comment on: weight trend, workout consistency including sauna, diet adherence, water intake, measurements if available, and anything from their check-ins. End with 2-3 specific action items for next week. Sound like a real trainer who knows this client well. 6-8 sentences.`;
    try {
      const res = await fetch("/api/claude",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ max_tokens:1000, messages:[{role:"user",content:prompt}] })
      });
      const result = await res.json();
      setAiFeedback(result.content?.map(c=>c.text||"").join("")||"No feedback.");
    } catch { setAiFeedback("Couldn't load feedback. Try again."); }
    setLoading(false);
  }

  return (
    <div>
      <Card>
        <Label>Trainer Check-In</Label>
        <p style={{ fontSize:13, color:"#aaa", lineHeight:1.6, margin:"0 0 14px" }}>
          For the best feedback: log your workouts, weight, diet, and complete your weekly check-in first. I'll analyze everything.
        </p>
        <Btn full onClick={getFeedback} disabled={loading}>
          {loading?"Analyzing your progress...":"Get Trainer Feedback"}
        </Btn>
      </Card>
      {aiFeedback && (
        <Card accent={S.accent} style={{ background:"rgba(79,70,229,0.1)" }}>
          <Label>Your Trainer Says</Label>
          <p style={{ fontSize:15, color:S.text, lineHeight:1.8, margin:0 }}>{aiFeedback}</p>
        </Card>
      )}
      <Card>
        <Label>Data on File</Label>
        <pre style={{ fontSize:10, color:"#6666aa", whiteSpace:"pre-wrap", fontFamily:"monospace", margin:0, lineHeight:1.5, maxHeight:200, overflowY:"auto" }}>
          {buildSummary()}
        </pre>
      </Card>
    </div>
  );
}

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
    { id:"diet", label:"Diet" },
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
                padding:"5px 13px", borderRadius:18, border:"none", cursor:"pointer",
                fontSize:11, fontFamily:"Georgia,serif",
                background:tab===t.id?S.accent:"rgba(255,255,255,0.08)",
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
                <button onClick={()=>setWeekCount(weekCount-1)} disabled={weekCount<=1} style={{ width:28, height:28, borderRadius:6, border:`1px solid ${S.border}`, background:"#1e1e3a", color:S.muted, cursor:weekCount<=1?"not-allowed":"pointer", fontSize:16, fontFamily:"Georgia,serif" }}>−</button>
                <span style={{ fontSize:11, color:S.muted, whiteSpace:"nowrap" }}>{weekCount} wks</span>
                <button onClick={()=>setWeekCount(weekCount+1)} style={{ width:28, height:28, borderRadius:6, border:`1px solid ${S.border}`, background:"#1e1e3a", color:S.accentLight, cursor:"pointer", fontSize:16, fontFamily:"Georgia,serif" }}>+</button>
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
                    fontWeight:workoutTab===d.id?"bold":"normal",
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
        {tab==="diet" && <DietTab data={data} setData={setData} />}
        {tab==="history" && <HistoryTab data={data} weeks={weeks} />}
        {tab==="progress" && <ProgressTab data={data} setData={setData} weeks={weeks} />}
        {tab==="checkin" && <CheckInTab data={data} setData={setData} weeks={weeks} />}
        {tab==="feedback" && <FeedbackTab data={data} weeks={weeks} />}
      </div>
    </div>
  );
}
