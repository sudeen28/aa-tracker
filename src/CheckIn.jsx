import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const STEPS = ["Verify Identity", "Review Flight", "Choose Seat", "Extras", "Boarding Pass"];

const CABIN_CONFIG = {
  selected_seat: "14A",
  sections: [
    { name: "Business", rows: [1,2,3,4,5,6], cols: ["A","C","D","G","H","K"], color: "#7c3aed" },
    { name: "Premium Economy", rows: [8,9,10,11], cols: ["A","B","C","D","E","F","G","H","J","K"], color: "#0047AB" },
    { name: "Economy", rows: Array.from({length:34},(_,i)=>i+12), cols: ["A","B","C","D","E","F","G","H","J","K"], color: "#64748b" },
  ],
  occupied: ["12A","12B","13C","14B","14C","15A","15D","16E","17A","18C","19A","20B","21C","22A"],
  exits: [1,12,30,45],
};

function ProgressBar({ step }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 32, overflowX: "auto", paddingBottom: 4 }}>
      {STEPS.map((s, i) => (
        <div key={s} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: 13,
              background: i < step ? "#0047AB" : i === step ? "#CC0000" : "#e2e8f4",
              color: i <= step ? "white" : "#94a3b8",
              boxShadow: i === step ? "0 0 0 4px rgba(204,0,0,0.2)" : "none",
              transition: "all 0.3s",
            }}>
              {i < step ? "✓" : i + 1}
            </div>
            <div style={{ fontSize: 10, color: i === step ? "#CC0000" : i < step ? "#0047AB" : "#94a3b8", fontWeight: i === step ? 700 : 400, whiteSpace: "nowrap" }}>
              {s}
            </div>
          </div>
          {i < STEPS.length - 1 && (
            <div style={{ width: 40, height: 2, background: i < step ? "#0047AB" : "#e2e8f4", margin: "0 4px", marginBottom: 22, transition: "background 0.3s", flexShrink: 0 }} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function CheckIn() {
  const params = new URLSearchParams(window.location.search);
  const pnrParam = params.get("pnr") || "";

  const [step, setStep] = useState(0);
  const [pnr, setPnr] = useState(pnrParam);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [passport, setPassport] = useState("");

  // Step 3 - seat
  const [chosenSeat, setChosenSeat] = useState("14A");
  const [hoveredSeat, setHoveredSeat] = useState(null);
  const [seatConfirmed, setSeatConfirmed] = useState(false);

  // Step 4 - extras
  const [meal, setMeal] = useState("Standard Meal");
  const [assistance, setAssistance] = useState([]);
  const [bagCount, setBagCount] = useState(1);

  // Step 5 - done
  const [checkedIn, setCheckedIn] = useState(false);

  const fetchBooking = async () => {
    if (!pnr.trim()) { setError("Please enter your PNR."); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(API_URL + "/api/booking/" + pnr.trim().toUpperCase());
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking not found.");
      setBooking(data);
      if (data.passenger?.name) {
        const parts = data.passenger.name.split(" ");
        setLastName(parts[parts.length - 1]);
      }
      if (data.segments?.[0]?.seat) setChosenSeat(data.segments[0].seat);
      setStep(1);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const getSeatStatus = (row, col) => {
    const id = row + col;
    if (id === chosenSeat) return "selected";
    if ((CABIN_CONFIG.occupied || []).includes(id)) return "occupied";
    return "available";
  };

  const seg = booking?.segments?.[0];
  const lastSeg = booking?.segments?.[booking.segments.length - 1];

  const inp = { width: "100%", boxSizing: "border-box", padding: "12px 14px", border: "1.5px solid #e2e8f4", borderRadius: 10, fontSize: 14, color: "#0f172a", outline: "none", fontFamily: "inherit", background: "#fafcff" };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#f0f4ff,#e8eef8)", fontFamily: "'DM Sans',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <header style={{ background: "#CC0000", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 20px rgba(204,0,0,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: "white", fontSize: 20 }}>✈</span>
          <div>
            <div style={{ color: "white", fontSize: 16, fontWeight: 700 }}>American Airlines</div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 9, letterSpacing: "0.15em" }}>ONLINE CHECK-IN</div>
          </div>
        </div>
        <a href="/" style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, textDecoration: "none" }}>← Back to Tracker</a>
      </header>
      <div style={{ height: 4, background: "linear-gradient(90deg,#0047AB,#003580,#CC0000)" }} />

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 16px 60px" }}>

        {/* Title */}
        <div style={{ marginBottom: 28, textAlign: "center" }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>Online Check-In</h1>
          <p style={{ color: "#64748b", fontSize: 14 }}>Check in online up to 24 hours before departure</p>
        </div>

        {/* Progress */}
        {step > 0 && <ProgressBar step={step - 1} />}

        {/* STEP 0: Enter PNR */}
        {step === 0 && (
          <div style={{ background: "white", borderRadius: 20, padding: "36px 32px", boxShadow: "0 4px 40px rgba(0,71,171,0.08)", border: "1px solid rgba(0,71,171,0.06)" }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>Enter Booking Reference</h2>
            <p style={{ color: "#64748b", fontSize: 13, marginBottom: 24 }}>Enter your PNR/booking reference to begin check-in.</p>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>BOOKING REFERENCE (PNR)</label>
              <input value={pnr} onChange={e => setPnr(e.target.value.toUpperCase())} onKeyDown={e => e.key === "Enter" && fetchBooking()} placeholder="e.g. AA7X4K2" maxLength={10} style={{ ...inp, fontSize: 18, fontWeight: 700, letterSpacing: "0.15em" }} />
            </div>
            {error && <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#dc2626", fontSize: 13, marginBottom: 16 }}>⚠ {error}</div>}
            <button onClick={fetchBooking} disabled={loading} style={{ width: "100%", padding: "14px", background: loading ? "#94a3b8" : "linear-gradient(135deg,#CC0000,#a80000)", color: "white", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", boxShadow: "0 4px 16px rgba(204,0,0,0.3)" }}>
              {loading ? "Searching..." : "Start Check-In →"}
            </button>
          </div>
        )}

        {/* STEP 1: Verify Identity */}
        {step === 1 && booking && (
          <div style={{ background: "white", borderRadius: 20, padding: "32px", boxShadow: "0 4px 40px rgba(0,71,171,0.08)" }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>Verify Your Identity</h2>
            <p style={{ color: "#64748b", fontSize: 13, marginBottom: 24 }}>Confirm your details match your travel document.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14, marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>FIRST NAME</label>
                <input style={inp} value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="James" />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>LAST NAME</label>
                <input style={inp} value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Mitchell" />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>PASSPORT NUMBER</label>
                <input style={inp} value={passport} onChange={e => setPassport(e.target.value)} placeholder="A12345678" />
              </div>
            </div>
            <div style={{ padding: "12px 16px", background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, fontSize: 13, color: "#0369a1", marginBottom: 20 }}>
              ℹ️ Your name must match exactly as it appears on your passport or travel document.
            </div>
            {error && <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#dc2626", fontSize: 13, marginBottom: 16 }}>⚠ {error}</div>}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setStep(0)} style={{ padding: "11px 22px", background: "white", color: "#64748b", border: "1.5px solid #e2e8f4", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Back</button>
              <button onClick={() => {
                if (!firstName.trim() || !lastName.trim()) { setError("Please enter your first and last name."); return; }
                setError(""); setStep(2);
              }} style={{ padding: "11px 28px", background: "linear-gradient(135deg,#0047AB,#003580)", color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(0,71,171,0.3)" }}>
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Review Flight */}
        {step === 2 && booking && (
          <div style={{ background: "white", borderRadius: 20, padding: "32px", boxShadow: "0 4px 40px rgba(0,71,171,0.08)" }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>Review Your Flight</h2>
            <p style={{ color: "#64748b", fontSize: 13, marginBottom: 24 }}>Please confirm your flight details before proceeding.</p>

            {/* Booking summary */}
            <div style={{ background: "linear-gradient(135deg,#0047AB,#003580)", borderRadius: 14, padding: "20px 24px", marginBottom: 16, color: "white" }}>
              <div style={{ fontSize: 11, opacity: 0.7, letterSpacing: "0.15em", marginBottom: 4 }}>BOOKING REFERENCE</div>
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "0.15em" }}>{booking.pnr}</div>
              <div style={{ marginTop: 8, opacity: 0.7, fontSize: 13 }}>{booking.passenger?.title} {booking.passenger?.name}</div>
            </div>

            {booking.segments?.map((s, i) => (
              <div key={i} style={{ border: "1px solid #e2e8f4", borderRadius: 12, padding: "16px 20px", marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>FLIGHT {s.flight}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>{s.from.code}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>{s.dep_time}</div>
                        <div style={{ fontSize: 10, color: "#94a3b8" }}>{s.departs}</div>
                      </div>
                      <div style={{ textAlign: "center", padding: "0 8px" }}>
                        <div style={{ fontSize: 10, color: "#94a3b8" }}>{s.duration}</div>
                        <div style={{ fontSize: 16 }}>✈</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>{s.to.code}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>{s.arr_time}</div>
                        <div style={{ fontSize: 10, color: "#94a3b8" }}>{s.arrives}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>Seat</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#CC0000" }}>{s.seat}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{s.class}</div>
                  </div>
                </div>
              </div>
            ))}

            <div style={{ padding: "12px 16px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, fontSize: 13, color: "#b45309", marginBottom: 20 }}>
              ⚠️ By continuing you confirm all flight details are correct and you accept the conditions of carriage.
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setStep(1)} style={{ padding: "11px 22px", background: "white", color: "#64748b", border: "1.5px solid #e2e8f4", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Back</button>
              <button onClick={() => setStep(3)} style={{ padding: "11px 28px", background: "linear-gradient(135deg,#0047AB,#003580)", color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(0,71,171,0.3)" }}>Confirm & Continue →</button>
            </div>
          </div>
        )}

        {/* STEP 3: Choose Seat */}
        {step === 3 && (
          <div style={{ background: "white", borderRadius: 20, padding: "32px", boxShadow: "0 4px 40px rgba(0,71,171,0.08)" }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Choose Your Seat</h2>
            <p style={{ color: "#64748b", fontSize: 13, marginBottom: 6 }}>Click any available seat to select it.</p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#CC0000" }}>Current: {chosenSeat}</div>
              {seatConfirmed && <span style={{ fontSize: 11, background: "#f0fdf4", color: "#16a34a", padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>✓ Confirmed</span>}
            </div>

            {/* Legend */}
            <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
              {[["#CC0000","2px solid #CC0000","Your Seat"],["#64748b30","1px solid #64748b60","Available"],["#e2e8f4","1px solid #cbd5e1","Occupied"]].map(([bg,border,label]) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 16, height: 16, borderRadius: 3, background: bg, border }} />
                  <span style={{ fontSize: 11, color: "#64748b" }}>{label}</span>
                </div>
              ))}
            </div>

            {/* Seat grid */}
            <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid #e2e8f4", marginBottom: 16 }}>
              <div style={{ minWidth: 340, padding: "12px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", marginBottom: 6, paddingLeft: 32 }}>
                  {["A","B","C","","D","E","F","G","","H","J","K"].map((col, i) => (
                    <div key={i} style={{ width: col === "" ? 14 : 24, textAlign: "center", fontSize: 10, fontWeight: 700, color: "#94a3b8", flexShrink: 0, marginRight: 3 }}>{col}</div>
                  ))}
                </div>
                {CABIN_CONFIG.sections.slice(2).map(section => (
                  <div key={section.name}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: section.color, letterSpacing: "0.15em", marginBottom: 4, marginTop: 8, textAlign: "center", padding: "2px 8px", background: section.color + "15", borderRadius: 4 }}>{section.name.toUpperCase()}</div>
                    {section.rows.slice(0, 12).map(row => (
                      <div key={row} style={{ display: "flex", alignItems: "center", marginBottom: 3 }}>
                        <div style={{ width: 24, fontSize: 9, color: "#94a3b8", textAlign: "right", marginRight: 8, flexShrink: 0 }}>{row}</div>
                        {["A","B","C","aisle1","D","E","F","G","aisle2","H","J","K"].map((col, ci) => {
                          if (col.startsWith("aisle")) return <div key={ci} style={{ width: 14, flexShrink: 0, marginRight: 3 }} />;
                          const status = getSeatStatus(row, col);
                          const isSelected = status === "selected";
                          return (
                            <div key={col} onClick={() => { if (status !== "occupied") { setChosenSeat(row+col); setSeatConfirmed(false); } }} onMouseEnter={() => setHoveredSeat(row+col)} onMouseLeave={() => setHoveredSeat(null)} style={{ width: 24, height: 20, borderRadius: "4px 4px 2px 2px", background: isSelected ? "#CC0000" : status === "occupied" ? "#e2e8f4" : section.color + "30", border: isSelected ? "2px solid #CC0000" : status === "occupied" ? "1px solid #cbd5e1" : "1px solid " + section.color + "60", flexShrink: 0, marginRight: 3, cursor: status === "occupied" ? "not-allowed" : "pointer", boxShadow: isSelected ? "0 0 0 3px rgba(204,0,0,0.3)" : "none", transition: "transform 0.1s", transform: hoveredSeat === row+col && status !== "occupied" ? "scale(1.2)" : "scale(1)" }} />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setStep(2)} style={{ padding: "11px 22px", background: "white", color: "#64748b", border: "1.5px solid #e2e8f4", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Back</button>
              <button onClick={() => { setSeatConfirmed(true); setStep(4); }} style={{ padding: "11px 28px", background: "linear-gradient(135deg,#CC0000,#a80000)", color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(204,0,0,0.3)" }}>Confirm Seat {chosenSeat} →</button>
            </div>
          </div>
        )}

        {/* STEP 4: Extras */}
        {step === 4 && (
          <div style={{ background: "white", borderRadius: 20, padding: "32px", boxShadow: "0 4px 40px rgba(0,71,171,0.08)" }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>Confirm Extras</h2>
            <p style={{ color: "#64748b", fontSize: 13, marginBottom: 24 }}>Review your meal preference and any special requirements.</p>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.1em", display: "block", marginBottom: 10 }}>MEAL PREFERENCE</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8 }}>
                {[["🍽","Standard Meal"],["☪️","Halal"],["🌱","Vegan"],["🥗","Vegetarian"],["🌾","Gluten Free"],["💊","Diabetic"]].map(([icon,label]) => (
                  <div key={label} onClick={() => setMeal(label)} style={{ padding: "10px 12px", border: meal === label ? "2px solid #0047AB" : "1.5px solid #e2e8f4", borderRadius: 10, cursor: "pointer", background: meal === label ? "#eff6ff" : "#fafcff", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{icon}</span>
                    <span style={{ fontSize: 12, fontWeight: meal === label ? 700 : 400, color: meal === label ? "#0047AB" : "#0f172a" }}>{label}</span>
                    {meal === label && <span style={{ marginLeft: "auto", color: "#0047AB", fontSize: 14 }}>✓</span>}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.1em", display: "block", marginBottom: 10 }}>CHECKED BAGS</label>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <button onClick={() => setBagCount(b => Math.max(0,b-1))} style={{ width: 36, height: 36, borderRadius: "50%", border: "1.5px solid #e2e8f4", background: "white", fontSize: 18, cursor: "pointer" }}>−</button>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>{bagCount}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>bag{bagCount !== 1 ? "s" : ""} · 23kg each</div>
                </div>
                <button onClick={() => setBagCount(b => Math.min(3,b+1))} style={{ width: 36, height: 36, borderRadius: "50%", border: "1.5px solid #e2e8f4", background: "white", fontSize: 18, cursor: "pointer" }}>+</button>
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.1em", display: "block", marginBottom: 10 }}>SPECIAL ASSISTANCE</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 }}>
                {[["♿","Wheelchair"],["👁","Visual Impairment"],["👂","Hearing Impairment"],["🏥","Medical Assistance"]].map(([icon, label]) => (
                  <div key={label} onClick={() => setAssistance(a => a.includes(label) ? a.filter(x=>x!==label) : [...a,label])} style={{ padding: "10px 12px", border: assistance.includes(label) ? "2px solid #7c3aed" : "1.5px solid #e2e8f4", borderRadius: 10, cursor: "pointer", background: assistance.includes(label) ? "#faf5ff" : "#fafcff", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{icon}</span>
                    <span style={{ fontSize: 12, fontWeight: assistance.includes(label) ? 700 : 400, color: assistance.includes(label) ? "#7c3aed" : "#0f172a" }}>{label}</span>
                    {assistance.includes(label) && <span style={{ marginLeft: "auto", color: "#7c3aed", fontSize: 14 }}>✓</span>}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setStep(3)} style={{ padding: "11px 22px", background: "white", color: "#64748b", border: "1.5px solid #e2e8f4", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Back</button>
              <button onClick={() => { setCheckedIn(true); setStep(5); }} style={{ padding: "11px 28px", background: "linear-gradient(135deg,#0047AB,#003580)", color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(0,71,171,0.3)" }}>Complete Check-In →</button>
            </div>
          </div>
        )}

        {/* STEP 5: Boarding Pass */}
        {step === 5 && booking && (
          <div>
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 16, padding: "20px 24px", marginBottom: 20, display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>✓</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#15803d" }}>Check-In Complete!</div>
                <div style={{ fontSize: 13, color: "#16a34a", marginTop: 2 }}>You are checked in for your flight. Your boarding pass is ready.</div>
              </div>
            </div>

            {/* Boarding Pass Card */}
            <div style={{ background: "white", borderRadius: 16, overflow: "hidden", border: "1px solid #e2e8f4", marginBottom: 16 }}>
              <div style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)", padding: "20px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, letterSpacing: "0.15em" }}>BOARDING PASS</div>
                  <div style={{ color: "white", fontSize: 20, fontWeight: 800, marginTop: 2 }}>{seg?.from?.code} → {lastSeg?.to?.code}</div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 3 }}>via {booking.segments?.length > 1 ? booking.segments[0].to.city : "Nonstop"}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 10 }}>STATUS</div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)", padding: "5px 12px", borderRadius: 20, marginTop: 4 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80" }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#4ade80" }}>CHECKED IN</span>
                  </div>
                </div>
              </div>
              <div style={{ borderTop: "2px dashed #e2e8f4", padding: "20px 28px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "14px 24px", marginBottom: 20 }}>
                  {[
                    ["PASSENGER", booking.passenger?.title + " " + booking.passenger?.name],
                    ["PNR", booking.pnr],
                    ["SEAT", chosenSeat],
                    ["CLASS", seg?.class],
                    ["FLIGHT", seg?.flight],
                    ["GATE", seg?.from?.gate],
                    ["DEPARTS", seg?.dep_time + " · " + seg?.departs],
                    ["MEAL", meal],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <div style={{ fontSize: 9, color: "#94a3b8", letterSpacing: "0.12em", marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{val}</div>
                    </div>
                  ))}
                </div>
                <div style={{ textAlign: "center", padding: "16px 0 8px", borderTop: "1px dashed #e2e8f4" }}>
                  <div style={{ fontSize: 11, color: "#94a3b8", letterSpacing: "0.2em", marginBottom: 6 }}>{booking.ticket_number}</div>
                  <div style={{ fontSize: 10, color: "#cbd5e1" }}>American Airlines · americanairlines.com</div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => window.print()} style={{ flex: 1, padding: "12px", background: "white", color: "#0047AB", border: "1.5px solid #0047AB", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>🖨 Print Boarding Pass</button>
              <a href={"/?pnr=" + booking.pnr} style={{ flex: 1, padding: "12px", background: "linear-gradient(135deg,#0047AB,#003580)", color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", textDecoration: "none", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>View Full Itinerary →</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
