import { useState, useEffect, useRef } from "react";
import CheckIn from "./CheckIn.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const DEPART_DATE = new Date(Date.now() + 23 * 24 * 60 * 60 * 1000);
DEPART_DATE.setHours(23, 45, 0, 0);
const CHECKIN_OPEN = new Date(DEPART_DATE.getTime() - 24 * 60 * 60 * 1000);

const BOOKING = {
  pnr: "AA7X4K2",
  passenger: { name: "James O. Mitchell", title: "MR", frequent_flyer: "AA-9284710", passport: "***4821" },
  status: "CONFIRMED",
  booking_date: "May 18, 2026",
  ticket_number: "001-2847192034",
  segments: [
    {
      flight: "AA 0081",
      from: { code: "LOS", city: "Lagos", terminal: "Terminal 2", gate: "G14", lat: 6.5774, lng: 3.3212 },
      to: { code: "LHR", city: "London Heathrow", terminal: "Terminal 3", gate: "B22", lat: 51.470, lng: -0.4543 },
      departs: "Jun 14, 2026", dep_time: "23:45",
      arrives: "Jun 15, 2026", arr_time: "06:30",
      duration: "6h 45m", aircraft: "Boeing 777-300ER",
      seat: "14A", class: "Economy", meal: "Dinner + Breakfast", status: "On Time",
    },
    {
      flight: "AA 0100",
      from: { code: "LHR", city: "London Heathrow", terminal: "Terminal 3", gate: "C09", lat: 51.470, lng: -0.4543 },
      to: { code: "JFK", city: "New York JFK", terminal: "Terminal 8", gate: "A31", lat: 40.6413, lng: -73.7781 },
      departs: "Jun 15, 2026", dep_time: "10:10",
      arrives: "Jun 15, 2026", arr_time: "13:05",
      duration: "7h 55m", aircraft: "Boeing 787-9 Dreamliner",
      seat: "14A", class: "Economy", meal: "Snack + Beverage", status: "On Time",
    },
  ],
  baggage: { carry_on: "1 x 10kg", checked: "1 x 23kg", personal: "1 personal item" },
  fare: {
    basis: "YLOWUS",
    cabin_class: "Economy (N)",
    ticket_fare: "USD 842.00",
    fuel_surcharge: "USD 312.40",
    taxes: "USD 98.60",
    service_charge: "USD 24.00",
    aviation_levy: "USD 18.50",
    total: "USD 1,295.50",
    payment: "CREDIT CARD ·············7842",
    purchase_date: "May 18, 2026",
    tour_code: "USNG001",
    valid_before: "Jun 14, 2026",
    valid_after: "-",
    not_valid_note: "Non-refundable after departure",
    fare_conditions: {
      changes_before: "USD 150.00",
      changes_after: "USD 200.00",
      cancel_before: "USD 250.00",
      cancel_after: "Non-refundable",
      no_show: "USD 350.00",
    },
    co2: "1,842 kg per person",
  },
  alerts: [
    { type: "info", icon: "ℹ️", message: "Online check-in opens 24 hours before departure. Have your passport ready." },
    { type: "success", icon: "✅", message: "Flight AA 0081 is on time. No disruptions reported at Lagos Airport." },
    { type: "warning", icon: "⚠️", message: "LHR Terminal 3: Allow extra time for connections — security queues expected." },
  ],
};

const CLOCK_ZONES = [
  { code: "LOS", city: "Lagos", country: "Nigeria", tz: "Africa/Lagos", role: "Departure City", color: "#f97316" },
  { code: "LHR", city: "London", country: "United Kingdom", tz: "Europe/London", role: "Layover City", color: "#64748b" },
  { code: "JFK", city: "New York", country: "United States", tz: "America/New_York", role: "Destination", color: "#0047AB" },
];

const WX_LOCATIONS = [
  { code: "LOS", city: "Lagos", country: "Nigeria", lat: 6.5774, lng: 3.3212, bg: "linear-gradient(135deg,#f97316,#ea580c)", date: "Jun 14" },
  { code: "LHR", city: "London", country: "United Kingdom", lat: 51.470, lng: -0.4543, bg: "linear-gradient(135deg,#64748b,#475569)", date: "Jun 15" },
  { code: "JFK", city: "New York", country: "United States", lat: 40.6413, lng: -73.7781, bg: "linear-gradient(135deg,#0047AB,#003580)", date: "Jun 15" },
];

const WX_ICONS = { 0:"☀️",1:"🌤",2:"⛅",3:"☁️",45:"🌫",48:"🌫",51:"🌦",53:"🌦",61:"🌧",63:"🌧",65:"🌧",71:"🌨",73:"❄️",80:"🌦",95:"⛈" };
const WX_LABELS = { 0:"Clear Sky",1:"Mainly Clear",2:"Partly Cloudy",3:"Overcast",45:"Foggy",48:"Icy Fog",51:"Light Drizzle",53:"Drizzle",61:"Light Rain",63:"Rain",65:"Heavy Rain",71:"Light Snow",73:"Snow",80:"Showers",95:"Thunderstorm" };

function loadScript(src) {
  return new Promise((resolve) => {
    if (document.querySelector('script[src="' + src + '"]')) { resolve(); return; }
    const s = document.createElement("script");
    s.src = src; s.onload = resolve;
    document.head.appendChild(s);
  });
}

// =========================================================
// VISA & ENTRY REQUIREMENTS
// =========================================================
const VISA_DATA = [
  {
    country: "United Kingdom",
    code: "LHR",
    flag: "🇬🇧",
    purpose: "Airside Transit",
    status: "warning",
    statusLabel: "VISA MAY BE REQUIRED",
    statusColor: "#d97706",
    statusBg: "#fffbeb",
    statusBorder: "#fde68a",
    summary: "Nigerian passport holders may require a Direct Airside Transit Visa (DATV) to transit through UK airports, even without passing through UK border control.",
    requirements: [
      { label: "Visa Type", value: "Direct Airside Transit Visa (DATV)" },
      { label: "Cost", value: "£35 (approx)" },
      { label: "Processing Time", value: "3–8 weeks" },
      { label: "Valid For", value: "Single entry transit only" },
      { label: "Apply At", value: "gov.uk/transit-visa" },
    ],
    exemptions: [
      "You hold a valid US visa or Green Card",
      "You hold a valid Schengen visa",
      "You hold a valid Irish visa",
      "You have leave to enter/remain in UK",
    ],
    tip: "If you hold a valid US visa (which you likely do for this trip), you are EXEMPT from the UK DATV requirement.",
    tipType: "success",
  },
  {
    country: "United States",
    code: "JFK",
    flag: "🇺🇸",
    purpose: "Entry / Tourism / Business",
    status: "required",
    statusLabel: "VISA REQUIRED",
    statusColor: "#dc2626",
    statusBg: "#fef2f2",
    statusBorder: "#fecaca",
    summary: "Nigerian passport holders require a nonimmigrant visa to enter the United States. The most common type for tourism or business is the B-1/B-2 visa.",
    requirements: [
      { label: "Visa Type", value: "B-1/B-2 Nonimmigrant Visa" },
      { label: "Application Fee", value: "USD $185 (MRV fee)" },
      { label: "Processing Time", value: "Varies — can be months in Nigeria" },
      { label: "Interview", value: "Required at US Embassy/Consulate" },
      { label: "Apply At", value: "ceac.state.gov (DS-160 form)" },
    ],
    exemptions: [
      "US Citizens & Permanent Residents (Green Card holders)",
      "Travelers from Visa Waiver Program (VWP) countries",
    ],
    checklist: [
      "Valid passport (6+ months validity beyond stay)",
      "DS-160 confirmation page",
      "Visa appointment confirmation",
      "Passport photo (2x2 inches)",
      "Proof of ties to Nigeria (job, property, family)",
      "Bank statements / financial evidence",
      "Travel itinerary (this document qualifies)",
      "ESTA not applicable for Nigerian passport",
    ],
    tip: "Apply for your US visa as early as possible. Interview wait times at the US Embassy Lagos can exceed several months.",
    tipType: "warning",
  },
];

function VisaCard({ visa }) {
  const [expanded, setExpanded] = useState(false);
  const isWarning = visa.status === "warning";
  const isRequired = visa.status === "required";

  return (
    <div style={{ border: "1px solid #e2e8f4", borderRadius: 14, overflow: "hidden", marginBottom: 12 }}>
      {/* Country header */}
      <div style={{ padding: "16px 22px", background: "linear-gradient(135deg,#f8faff,#f0f4ff)", borderBottom: "1px solid #e2e8f4", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 28 }}>{visa.flag}</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{visa.country}</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>Purpose: {visa.purpose} · {visa.code}</div>
          </div>
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: visa.statusBg, border: "1px solid " + visa.statusBorder, padding: "5px 12px", borderRadius: 20 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: visa.statusColor }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: visa.statusColor, letterSpacing: "0.06em" }}>{visa.statusLabel}</span>
        </div>
      </div>

      <div style={{ padding: "16px 22px" }}>
        {/* Summary */}
        <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, marginBottom: 14 }}>{visa.summary}</p>

        {/* Tip box */}
        <div style={{ padding: "10px 14px", background: visa.tipType === "success" ? "#f0fdf4" : "#fffbeb", border: "1px solid " + (visa.tipType === "success" ? "#bbf7d0" : "#fde68a"), borderRadius: 10, display: "flex", gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 16 }}>{visa.tipType === "success" ? "✅" : "⚠️"}</span>
          <div style={{ fontSize: 12, color: visa.tipType === "success" ? "#15803d" : "#b45309", lineHeight: 1.5 }}>{visa.tip}</div>
        </div>

        {/* Requirements table */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.12em", marginBottom: 8 }}>REQUIREMENTS</div>
          <div style={{ border: "1px solid #e2e8f4", borderRadius: 10, overflow: "hidden" }}>
            {visa.requirements.map((r, i) => (
              <div key={i} style={{ display: "flex", padding: "9px 14px", background: i % 2 === 0 ? "#fafcff" : "white", borderBottom: i < visa.requirements.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                <div style={{ fontSize: 12, color: "#94a3b8", width: 140, flexShrink: 0 }}>{r.label}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{r.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Toggle exemptions / checklist */}
        <button onClick={() => setExpanded(e => !e)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "#0047AB", fontSize: 12, fontWeight: 600, padding: 0, marginBottom: expanded ? 12 : 0 }}>
          <span>{expanded ? "▾" : "▸"}</span>
          {expanded ? "Hide" : "Show"} {visa.checklist ? "Entry Checklist" : "Exemptions"} {visa.checklist ? "(" + visa.checklist.length + " items)" : "(" + visa.exemptions.length + ")"}
        </button>

        {expanded && visa.exemptions && (
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "12px 16px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#16a34a", letterSpacing: "0.1em", marginBottom: 8 }}>EXEMPT IF:</div>
            {visa.exemptions.map((e, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: i < visa.exemptions.length - 1 ? 6 : 0 }}>
                <span style={{ color: "#22c55e", fontSize: 12, flexShrink: 0, marginTop: 1 }}>✓</span>
                <span style={{ fontSize: 12, color: "#166534" }}>{e}</span>
              </div>
            ))}
          </div>
        )}

        {expanded && visa.checklist && (
          <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10, padding: "12px 16px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#c2410c", letterSpacing: "0.1em", marginBottom: 8 }}>BRING TO INTERVIEW / ENTRY:</div>
            {visa.checklist.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: i < visa.checklist.length - 1 ? 6 : 0 }}>
                <span style={{ color: "#f97316", fontSize: 12, flexShrink: 0, marginTop: 1 }}>□</span>
                <span style={{ fontSize: 12, color: "#7c2d12" }}>{item}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function VisaRequirements({ entries }) {
  const visaData = entries || VISA_DATA;
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "#94a3b8", marginBottom: 12, paddingLeft: 4 }}>VISA & ENTRY REQUIREMENTS</div>
      <div style={{ background: "white", border: "1px solid #e2e8f4", borderRadius: 16, overflow: "hidden" }}>

        {/* Header */}
        <div style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)", padding: "18px 28px", display: "flex", gap: 14, alignItems: "center" }}>
          <span style={{ fontSize: 28 }}>🇺🇸</span>
<div>
  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.15em", marginBottom: 3 }}>PASSPORT</div>
  <div style={{ fontSize: 15, fontWeight: 700, color: "white" }}>US Passport Holder</div>
  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>Route: HOU → DFW (layover) → FRA (entry)</div>
</div>
          <div style={{ marginLeft: "auto", fontSize: 10, color: "rgba(255,255,255,0.3)", textAlign: "right", lineHeight: 1.6 }}>
            ⚠ Not legal advice.<br />Verify with official sources.
          </div>
        </div>

        <div style={{ padding: "22px 28px" }}>
          {visaData.map((visa, i) => <VisaCard key={i} visa={visa} />)}

          {/* Disclaimer */}
          <div style={{ padding: "12px 16px", background: "#f8faff", border: "1px solid #e2e8f4", borderRadius: 10, fontSize: 11, color: "#94a3b8", lineHeight: 1.6 }}>
            📋 <strong>Disclaimer:</strong> Visa requirements change frequently. Always verify current requirements with the official embassy or consulate website before travel. This information is provided as a general guide only.
          </div>
        </div>
      </div>
    </div>
  );
}

// =========================================================
// SPECIAL ASSISTANCE
// =========================================================
const ASSISTANCE_OPTIONS = [
  { id: "wchr", icon: "♿", label: "Wheelchair (Ramp)", desc: "Assistance to/from aircraft door via ramp", category: "Mobility" },
  { id: "wchs", icon: "🦽", label: "Wheelchair (Steps)", desc: "Assistance up/down aircraft stairs", category: "Mobility" },
  { id: "wchc", icon: "🛗", label: "Wheelchair (Full)", desc: "Fully immobile — carried to/from seat", category: "Mobility" },
  { id: "blnd", icon: "👁", label: "Visual Impairment", desc: "Guide assistance through airport & boarding", category: "Sensory" },
  { id: "deaf", icon: "👂", label: "Hearing Impairment", desc: "Visual & written communication support", category: "Sensory" },
  { id: "meda", icon: "🏥", label: "Medical Clearance", desc: "Travelling with a medical condition — MEDIF required", category: "Medical" },
  { id: "oxyg", icon: "🫁", label: "Oxygen Required", desc: "In-flight supplemental oxygen needed", category: "Medical" },
  { id: "stcr", icon: "🛏", label: "Stretcher", desc: "Must travel lying down — advance notice required", category: "Medical" },
  { id: "exst", icon: "💺", label: "Extra Seat", desc: "Additional seat for comfort or medical device", category: "Seating" },
  { id: "bulk", icon: "🎯", label: "Bulkhead Seat", desc: "Front-row seating with extra legroom", category: "Seating" },
  { id: "umnr", icon: "🧒", label: "Unaccompanied Minor", desc: "Child 5–14 travelling alone — escort service", category: "Family" },
  { id: "petc", icon: "🐾", label: "Pet in Cabin", desc: "Small pet in approved carrier under seat", category: "Pets" },
];

const CATEGORIES = ["Mobility", "Sensory", "Medical", "Seating", "Family", "Pets"];
const CAT_COLORS = { Mobility: "#7c3aed", Sensory: "#0047AB", Medical: "#dc2626", Seating: "#059669", Family: "#d97706", Pets: "#db2777" };

function SpecialAssistance({ options }) {
  const [selected, setSelected] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const toggle = (id) => {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
    setSubmitted(false);
  };

  const baseOptions = options || ASSISTANCE_OPTIONS;
  const filtered = activeCategory === "All" ? baseOptions : baseOptions.filter(o => o.category === activeCategory);

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => { setSubmitting(false); setSubmitted(true); }, 1400);
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "#94a3b8", marginBottom: 12, paddingLeft: 4 }}>SPECIAL ASSISTANCE</div>
      <div style={{ background: "white", border: "1px solid #e2e8f4", borderRadius: 16, overflow: "hidden" }}>

        {/* Header */}
        <div style={{ background: "linear-gradient(135deg,#f8faff,#f0f4ff)", padding: "18px 28px", borderBottom: "1px solid #e2e8f4" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Special Assistance Requests</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>Select any assistance you require. Applies to all flight segments unless noted.</div>
        </div>

        <div style={{ padding: "22px 28px" }}>

          {/* Category filter tabs */}
          <div style={{ display: "flex", gap: 6, marginBottom: 18, overflowX: "auto", paddingBottom: 4, WebkitOverflowScrolling: "touch" }}>
            {["All", ...CATEGORIES].map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                padding: "5px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, flexShrink: 0,
                background: activeCategory === cat ? (CAT_COLORS[cat] || "#0f172a") : "#f1f5f9",
                color: activeCategory === cat ? "white" : "#64748b",
                transition: "all 0.15s",
              }}>{cat}</button>
            ))}
          </div>

          {/* Options grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8, marginBottom: 20 }}>
            {filtered.map(opt => {
              const isSelected = selected.includes(opt.id);
              const catColor = CAT_COLORS[opt.category];
              return (
                <div key={opt.id} onClick={() => toggle(opt.id)} style={{
                  padding: "12px 14px", borderRadius: 12, cursor: "pointer",
                  border: isSelected ? "2px solid " + catColor : "1.5px solid #e2e8f4",
                  background: isSelected ? catColor + "10" : "#fafcff",
                  transition: "all 0.15s", position: "relative",
                }}>
                  {isSelected && (
                    <div style={{ position: "absolute", top: 8, right: 8, width: 18, height: 18, borderRadius: "50%", background: catColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ color: "white", fontSize: 10, fontWeight: 800 }}>✓</span>
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{opt.icon}</span>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: isSelected ? catColor : "#0f172a" }}>{opt.label}</div>
                        <div style={{ fontSize: 8, fontWeight: 700, color: catColor, background: catColor + "20", padding: "1px 5px", borderRadius: 3 }}>{opt.id.toUpperCase()}</div>
                      </div>
                      <div style={{ fontSize: 10, color: "#94a3b8", lineHeight: 1.4 }}>{opt.desc}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected summary chips */}
          {selected.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8 }}>SELECTED REQUESTS ({selected.length})</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {selected.map(id => {
                  const opt = (options || ASSISTANCE_OPTIONS).find(o => o.id === id);
                  return (
                    <div key={id} onClick={() => toggle(id)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", background: CAT_COLORS[opt.category] + "15", border: "1px solid " + CAT_COLORS[opt.category] + "40", borderRadius: 20, cursor: "pointer", fontSize: 12 }}>
                      <span>{opt.icon}</span>
                      <span style={{ fontWeight: 600, color: CAT_COLORS[opt.category] }}>{opt.label}</span>
                      <span style={{ color: CAT_COLORS[opt.category], opacity: 0.6, marginLeft: 2 }}>×</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, color: "#94a3b8", letterSpacing: "0.1em", marginBottom: 6 }}>ADDITIONAL NOTES (OPTIONAL)</div>
            <textarea
              value={notes}
              onChange={e => { setNotes(e.target.value); setSubmitted(false); }}
              placeholder="Any additional details about your assistance needs..."
              rows={3}
              style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", border: "1.5px solid #e2e8f4", borderRadius: 10, fontSize: 12, color: "#0f172a", fontFamily: "inherit", resize: "vertical", outline: "none", background: "#fafcff" }}
            />
          </div>

          {/* Submit */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>
              {selected.length === 0 ? "No assistance selected — select options above" : selected.length + " request(s) ready to submit"}
            </div>
            {submitted ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, color: "#16a34a", fontSize: 13, fontWeight: 600 }}>
                ✅ Assistance requests submitted
              </div>
            ) : (
              <button onClick={handleSubmit} disabled={submitting || selected.length === 0} style={{
                padding: "10px 24px", background: submitting || selected.length === 0 ? "#94a3b8" : "linear-gradient(135deg,#7c3aed,#6d28d9)",
                color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700,
                cursor: submitting || selected.length === 0 ? "not-allowed" : "pointer",
                boxShadow: selected.length > 0 && !submitting ? "0 4px 14px rgba(124,58,237,0.3)" : "none",
              }}>
                {submitting ? "Submitting..." : "Submit Requests →"}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

// =========================================================
// BAGGAGE TRACKER
// =========================================================
const BAG_STAGES = [
  { id: "checked_in", label: "Checked In", icon: "🏷", desc: "Bag tagged at LOS check-in counter", time: "Jun 14, 20:15" },
  { id: "security", label: "Security Scan", icon: "🔍", desc: "Cleared security screening at LOS", time: "Jun 14, 21:05" },
  { id: "loaded", label: "Loaded", icon: "✈️", desc: "Loaded onto AA 0081 at LOS Terminal 2", time: "Jun 14, 22:40" },
  { id: "transfer", label: "LHR Transfer", icon: "🔄", desc: "Transferred to AA 0100 at LHR baggage hub", time: "Jun 15, 07:20" },
  { id: "loaded2", label: "Loaded (LHR)", icon: "✈️", desc: "Loaded onto AA 0100 at LHR Terminal 3", time: "Jun 15, 09:30" },
  { id: "arrived", label: "Arrived JFK", icon: "📍", desc: "Arrived at JFK Terminal 8 baggage carousel 4", time: "Jun 15, 13:20" },
  { id: "ready", label: "Ready for Pickup", icon: "✅", desc: "Available at JFK Carousel 4 — please collect", time: "Jun 15, 13:35" },
];

const BAGS = [
  { id: "BAG-001", label: "Checked Bag", weight: "22.4 kg", tag: "AA204817", color: "#0047AB", current_stage: 2 },
];

function BaggageTracker({ stages }) {
  const [selectedBag, setSelectedBag] = useState(0);
  const bag = BAGS[selectedBag];
  const completedUpTo = stages ? stages.findIndex(s => s.isCurrent) : bag.current_stage;
  const displayStages = stages || BAG_STAGES.map(s => ({ label: s.label, icon: s.icon, desc: s.desc, time: s.time, isCurrent: false }));
  const progressPct = displayStages.length > 1 ? (completedUpTo / (displayStages.length - 1)) * 100 : 0;

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "#94a3b8", marginBottom: 12, paddingLeft: 4 }}>BAGGAGE TRACKER</div>
      <div style={{ background: "white", border: "1px solid #e2e8f4", borderRadius: 16, overflow: "hidden" }}>

        {/* Header */}
        <div style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)", padding: "18px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ fontSize: 32 }}>🧳</div>
            <div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.15em", marginBottom: 3 }}>BAGGAGE TAG</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "white", letterSpacing: "0.1em" }}>{bag.tag}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{bag.label} · {bag.weight}</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em", marginBottom: 4 }}>CURRENT STATUS</div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)", padding: "6px 14px", borderRadius: 20 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 6px #4ade80" }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#4ade80" }}>{displayStages[completedUpTo]?.label || "In Progress"}</span>
            </div>
          </div>
        </div>

        <div style={{ padding: "24px 28px" }}>

          {/* Progress bar */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#94a3b8", marginBottom: 8 }}>
              <span>LOS Check-in</span>
              <span style={{ color: "#0047AB", fontWeight: 600 }}>{Math.round(progressPct)}% complete</span>
              <span>JFK Pickup</span>
            </div>
            <div style={{ height: 8, background: "#f1f5f9", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ height: "100%", width: progressPct + "%", background: "linear-gradient(90deg,#0047AB,#4ade80)", borderRadius: 10, transition: "width 0.6s ease" }} />
            </div>
          </div>

          {/* Stage timeline */}
          <div style={{ position: "relative" }}>
            {/* Vertical line */}
            <div style={{ position: "absolute", left: 19, top: 20, bottom: 20, width: 2, background: "#e2e8f4", zIndex: 0 }} />
            <div style={{ position: "absolute", left: 19, top: 20, width: 2, background: "linear-gradient(180deg,#0047AB,#4ade80)", zIndex: 1, height: (completedUpTo / (BAG_STAGES.length - 1) * 100) + "%", transition: "height 0.6s ease" }} />

            {displayStages.map((stage, i) => {
              const isDone = i <= completedUpTo;
              const isCurrent = i === completedUpTo;
              return (
                <div key={stage.id} style={{ display: "flex", gap: 16, marginBottom: i < displayStages.length - 1 ? 20 : 0, position: "relative", zIndex: 2 }}>
                  {/* Status dot */}
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                    background: isDone ? (isCurrent ? "linear-gradient(135deg,#0047AB,#4ade80)" : "#0047AB") : "#f1f5f9",
                    border: isDone ? "none" : "2px solid #e2e8f4",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: isDone ? 16 : 14,
                    boxShadow: isCurrent ? "0 0 0 4px rgba(0,71,171,0.15)" : "none",
                    transition: "all 0.3s",
                  }}>
                    {isDone ? stage.icon : <span style={{ fontSize: 10, color: "#cbd5e1" }}>○</span>}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, paddingTop: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: isDone ? "#0f172a" : "#94a3b8" }}>
                          {stage.label}
                          {isCurrent && <span style={{ marginLeft: 8, fontSize: 9, fontWeight: 700, color: "#0047AB", background: "#dbeafe", padding: "2px 6px", borderRadius: 4, letterSpacing: "0.08em" }}>CURRENT</span>}
                        </div>
                        <div style={{ fontSize: 11, color: isDone ? "#64748b" : "#cbd5e1", marginTop: 2 }}>{stage.desc}</div>
                      </div>
                      {isDone && (
                        <div style={{ fontSize: 10, color: "#94a3b8", whiteSpace: "nowrap", marginTop: 2 }}>{stage.time}</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Info note */}
          <div style={{ marginTop: 20, padding: "10px 16px", background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ fontSize: 16 }}>ℹ️</span>
            <div style={{ fontSize: 12, color: "#0369a1" }}>
              Bag is currently <strong>loaded on AA 0081</strong> and in transit to London Heathrow. Updates will reflect once the flight lands and transfer is processed.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =========================================================
// MEAL PREFERENCE SELECTOR
// =========================================================
const MEAL_OPTIONS = [
  { id: "standard", icon: "🍽", label: "Standard Meal", desc: "Balanced meal with meat, starch, vegetable & dessert", tag: null },
  { id: "vegetarian", icon: "🥗", label: "Vegetarian", desc: "Lacto-ovo vegetarian — no meat or seafood", tag: "VLML" },
  { id: "vegan", icon: "🌱", label: "Vegan", desc: "Plant-based, no animal products whatsoever", tag: "VGML" },
  { id: "halal", icon: "☪️", label: "Halal", desc: "Prepared in accordance with Islamic dietary law", tag: "MOML" },
  { id: "kosher", icon: "✡️", label: "Kosher", desc: "Certified kosher, sealed & blessed", tag: "KSML" },
  { id: "gluten_free", icon: "🌾", label: "Gluten Free", desc: "No wheat, rye, barley or oats", tag: "GFML" },
  { id: "low_calorie", icon: "🥑", label: "Low Calorie", desc: "Light meal under 400 kcal", tag: "LCML" },
  { id: "diabetic", icon: "💊", label: "Diabetic", desc: "Low sugar, low fat, high fibre", tag: "DBML" },
  { id: "child", icon: "🧒", label: "Child Meal", desc: "Kid-friendly portions — nuggets, pasta, fruit", tag: "CHML" },
];

function MealSelector({ options, segments }) {
  const flights = segments?.length
    ? segments.map(s => s.flight)
    
    : ["AA 0081", "AA 0100"];

  const routes = segments?.length
    ? segments.map(s => s.from.code + " → " + s.to.code)
    : ["LOS → LHR", "LHR → JFK"];

  const dates = segments?.length
    ? segments.map(s => s.departs + " · " + s.dep_time)
    : ["Jun 14, 2026 · 23:45", "Jun 15, 2026 · 10:10"];

  const [selected, setSelected] = useState(
    Object.fromEntries(flights.map(f => [f, "standard"]))
  );
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (segments?.length) {
      setSelected(Object.fromEntries(segments.map(s => [s.flight, "standard"])));
    }
  }, [segments]);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => { setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000); }, 1200);
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "#94a3b8", marginBottom: 12, paddingLeft: 4 }}>MEAL PREFERENCES</div>
      <div style={{ background: "white", border: "1px solid #e2e8f4", borderRadius: 16, overflow: "hidden" }}>

        {/* Header */}
        <div style={{ background: "linear-gradient(135deg,#f8faff,#f0f4ff)", padding: "18px 28px", borderBottom: "1px solid #e2e8f4", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>In-Flight Meal Selection</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Select your meal preference for each flight segment</div>
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", background: "#f1f5f9", padding: "5px 12px", borderRadius: 20 }}>
            ⚠ Must be requested 24hrs before departure
          </div>
        </div>

        <div style={{ padding: "22px 28px" }}>
          {flights.map((flight, fi) => {
            const routes = ["LOS → LHR", "LHR → JFK"];
            const dates = ["Jun 14, 2026 · 23:45", "Jun 15, 2026 · 10:10"];
            return (
              <div key={flight} style={{ marginBottom: fi === 0 ? 28 : 0 }}>
                {/* Flight label */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div style={{ background: "#0047AB", color: "white", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6, letterSpacing: "0.06em" }}>{flight}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{routes[fi]}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>· {dates[fi]}</div>
                </div>

                {/* Meal grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                  {(options || MEAL_OPTIONS).map(meal => {
                    const isSelected = selected[flight] === meal.id;
                    return (
                      <div
                        key={meal.id}
                        onClick={() => { setSelected(s => ({ ...s, [flight]: meal.id })); setSaved(false); }}
                        style={{
                          padding: "12px 14px", borderRadius: 12, cursor: "pointer",
                          border: isSelected ? "2px solid #0047AB" : "1.5px solid #e2e8f4",
                          background: isSelected ? "#eff6ff" : "#fafcff",
                          transition: "all 0.15s",
                          position: "relative",
                        }}
                      >
                        {isSelected && (
                          <div style={{ position: "absolute", top: 8, right: 8, width: 16, height: 16, borderRadius: "50%", background: "#0047AB", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <div style={{ color: "white", fontSize: 9, fontWeight: 700 }}>✓</div>
                          </div>
                        )}
                        {meal.tag && (
                          <div style={{ fontSize: 8, fontWeight: 700, color: "#0047AB", letterSpacing: "0.1em", marginBottom: 4, background: "#dbeafe", display: "inline-block", padding: "1px 5px", borderRadius: 3 }}>{meal.tag}</div>
                        )}
                        <div style={{ fontSize: 18, marginBottom: 4 }}>{meal.icon}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: isSelected ? "#0047AB" : "#0f172a", marginBottom: 3 }}>{meal.label}</div>
                        <div style={{ fontSize: 10, color: "#94a3b8", lineHeight: 1.4 }}>{meal.desc}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Selected summary */}
                <div style={{ marginTop: 10, padding: "8px 14px", background: "#f0f9ff", borderRadius: 8, border: "1px solid #bae6fd", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14 }}>{(options || MEAL_OPTIONS).find(m => m.id === selected[flight])?.icon}</span>
                  <span style={{ fontSize: 12, color: "#0369a1" }}>
                    <strong>{flight}:</strong> {(options || MEAL_OPTIONS).find(m => m.id === selected[flight])?.label} selected
                    {MEAL_OPTIONS.find(m => m.id === selected[flight])?.tag && <span style={{ marginLeft: 6, background: "#0047AB", color: "white", fontSize: 9, padding: "1px 5px", borderRadius: 3, fontWeight: 700 }}>{MEAL_OPTIONS.find(m => m.id === selected[flight])?.tag}</span>}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Save button */}
          <div style={{ marginTop: 22, display: "flex", justifyContent: "flex-end" }}>
            {saved ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 22px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, color: "#16a34a", fontSize: 13, fontWeight: 600 }}>
                ✅ Meal preferences saved successfully
              </div>
            ) : (
              <button onClick={handleSave} disabled={saving} style={{ padding: "10px 28px", background: saving ? "#94a3b8" : "linear-gradient(135deg,#0047AB,#003580)", color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", boxShadow: saving ? "none" : "0 4px 14px rgba(0,71,171,0.3)" }}>
                {saving ? "Saving..." : "Save Meal Preferences →"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// =========================================================
// SEAT MAP
// =========================================================
const CABIN_CONFIG = {
  aircraft: "Boeing 777-300ER",
  flight: "AA 0081 · LOS → LHR",
  selected_seat: "14A",
  sections: [
    { name: "Business", rows: [1,2,3,4,5,6], cols: ["A","C","D","G","H","K"], aisle_after: ["C","G"], color: "#7c3aed" },
    { name: "Premium Economy", rows: [8,9,10,11], cols: ["A","B","C","D","E","F","G","H","J","K"], aisle_after: ["C","G"], color: "#0047AB" },
    { name: "Economy", rows: Array.from({length:34},(_,i)=>i+12), cols: ["A","B","C","D","E","F","G","H","J","K"], aisle_after: ["C","G"], color: "#64748b" },
  ],
  occupied: ["12A","12B","13C","14B","14C","15A","15D","16E","17A","17B","18C","19A","20B","21C","22A","23B","24C","25A","26D","27E","28A","29B","30C","31A","32B","33A","34B","35C","36A","37B","38C","39A","40B","41C","42A","43B","1A","1D","2A","2H","3C","3K","4A","4G","5H","6C","8A","8B","9C","10D","11A"],
  exits: [1,12,30,45],
};

function SeatMap({ config }) {
  const [hoveredSeat, setHoveredSeat] = useState(null);
  const [selectedFlight, setSelectedFlight] = useState(0);

  const activeConfig = config || CABIN_CONFIG;
  const [chosenSeat, setChosenSeat] = useState(
    activeConfig.selected_seat || activeConfig.selectedSeat || "14A"
  );
  const [seatChanged, setSeatChanged] = useState(false);
  const [seatSaved, setSeatSaved] = useState(false);

  const handleSeatClick = (row, col) => {
    const seatId = row + col;
    const occupied = activeConfig.occupied || [];
    if (occupied.includes(seatId)) return;
    const original = activeConfig.selected_seat || activeConfig.selectedSeat;
    setChosenSeat(seatId);
    setSeatChanged(seatId !== original);
    setSeatSaved(false);
  };

  const cfg = config || null;
  const flights = cfg ? [{ label: cfg.flight_label, aircraft: cfg.aircraft }] : [
    { label: "AA 0081 · LOS → LHR", aircraft: "Boeing 777-300ER" },
    { label: "AA 0100 · LHR → JFK", aircraft: "Boeing 787-9 Dreamliner" },
  ];

  const getSeatStatus = (row, col) => {
    const seatId = row + col;
    if (seatId === activeConfig.selected_seat || seatId === activeConfig.selectedSeat) return "selected";
    const occupied = activeConfig.occupied || [];
    if (occupied.includes(seatId)) return "occupied";
    return "available";
  };

  const getSeatColor = (status, sectionColor) => {
    if (status === "selected") return "#CC0000";
    if (status === "occupied") return "#e2e8f4";
    return sectionColor + "30";
  };

  const getSeatBorder = (status, sectionColor) => {
    if (status === "selected") return "2px solid #CC0000";
    if (status === "occupied") return "1px solid #cbd5e1";
    return "1px solid " + sectionColor + "60";
  };

  return (<div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "#94a3b8", marginBottom: 12, paddingLeft: 4 }}>SEAT MAP</div>
      <div style={{ background: "white", border: "1px solid #e2e8f4", borderRadius: 16, overflow: "hidden" }}>

        {/* Header */}
        <div style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)", padding: "18px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.15em", marginBottom: 4 }}>SEAT ASSIGNMENT</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#CC0000", letterSpacing: "0.1em" }}>Seat {chosenSeat}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>Window · Economy · Row 14</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {flights.map((f, i) => (
              <button key={i} onClick={() => setSelectedFlight(i)} style={{ padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, background: selectedFlight === i ? "#CC0000" : "rgba(255,255,255,0.1)", color: selectedFlight === i ? "white" : "rgba(255,255,255,0.5)", transition: "all 0.2s" }}>
                {f.label.split("·")[0].trim()}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: "24px 28px" }}>
          {/* Legend */}
          <div style={{ display: "flex", gap: 20, marginBottom: 20, flexWrap: "wrap" }}>
            {[
              { color: "#CC0000", border: "2px solid #CC0000", label: "Your Seat (14A)" },
              { color: "#7c3aed30", border: "1px solid #7c3aed60", label: "Business" },
              { color: "#0047AB30", border: "1px solid #0047AB60", label: "Premium Economy" },
              { color: "#64748b30", border: "1px solid #64748b60", label: "Available" },
              { color: "#e2e8f4", border: "1px solid #cbd5e1", label: "Occupied" },
            ].map(({ color, border, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 14, height: 14, borderRadius: 3, background: color, border }} />
                <span style={{ fontSize: 11, color: "#64748b" }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Aircraft nose */}
          <div style={{ textAlign: "center", marginBottom: 8 }}>
            <div style={{ display: "inline-block", padding: "4px 20px", background: "#f1f5f9", borderRadius: 20, fontSize: 11, color: "#94a3b8", letterSpacing: "0.1em" }}>
              ✈ NOSE · {flights[selectedFlight].aircraft}
            </div>
          </div>

          {/* Seat grid — scrollable */}
          <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: 420, borderRadius: 10, border: "1px solid #e2e8f4" }}>
            <div style={{ minWidth: 360, padding: "12px 16px" }}>

              {/* Column headers */}
              <div style={{ display: "flex", alignItems: "center", marginBottom: 6, paddingLeft: 32 }}>
                {["A","B","C","","D","E","F","G","","H","J","K"].map((col, i) => (
                  <div key={i} style={{ width: col === "" ? 14 : 24, textAlign: "center", fontSize: 10, fontWeight: 700, color: "#94a3b8", flexShrink: 0, marginRight: 3 }}>
                    {col}
                  </div>
                ))}
              </div>

              {(activeConfig.sections || CABIN_CONFIG.sections).map(section => {
  const sectionColor = section.color || "#64748b";
  return (
  <div key={section.name}>
    <div style={{ fontSize: 9, fontWeight: 700, color: sectionColor, letterSpacing: "0.15em", marginBottom: 4, marginTop: 8, textAlign: "center", padding: "2px 8px", background: sectionColor + "15", borderRadius: 4 }}>
      {section.name.toUpperCase()}
    </div>
    {section.rows.map(rowItem => {
      const row = typeof rowItem === "object" ? rowItem.row : rowItem;
      return (
        <div key={row} style={{ display: "flex", alignItems: "center", marginBottom: 3 }}>
          <div style={{ width: 24, fontSize: 9, color: "#94a3b8", textAlign: "right", marginRight: 8, flexShrink: 0 }}>{row}</div>
          {["A","B","C","aisle1","D","E","F","G","aisle2","H","J","K"].map((col, ci) => {
            if (col.startsWith("aisle")) return <div key={ci} style={{ width: 14, flexShrink: 0, marginRight: 3 }} />;
            const status = getSeatStatus(row, col);
            const isSelected = status === "selected";
            const isExit = (activeConfig.exits || []).includes(row);
            return (
              <div key={col} onClick={() => handleSeatClick(row, col)} onMouseEnter={() => setHoveredSeat(row + col)} onMouseLeave={() => setHoveredSeat(null)}
                style={{ width: 24, height: 20, borderRadius: "4px 4px 2px 2px", background: getSeatColor(status, sectionColor), border: getSeatBorder(status, sectionColor), flexShrink: 0, marginRight: 3, cursor: status === "occupied" ? "not-allowed" : "pointer", position: "relative", transition: "transform 0.1s", transform: hoveredSeat === row + col && status !== "occupied" ? "scale(1.2)" : "scale(1)", boxShadow: isSelected ? "0 0 0 3px rgba(204,0,0,0.3)" : "none" }}>
                {isSelected && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 6, height: 6, borderRadius: "50%", background: "white" }} /></div>}
              </div>
            );
          })}
          {(activeConfig.exits || []).includes(row) && <div style={{ marginLeft: 8, fontSize: 8, color: "#22c55e", fontWeight: 700, letterSpacing: "0.05em" }}>← EXIT</div>}
        </div>
      );
    })}
  </div>
  );
})}
              {/* Aircraft tail */}
              <div style={{ textAlign: "center", marginTop: 10 }}>
                <div style={{ display: "inline-block", padding: "3px 20px", background: "#f1f5f9", borderRadius: 20, fontSize: 11, color: "#94a3b8", letterSpacing: "0.1em" }}>TAIL</div>
              </div>

            </div>
          </div>

          {/* Seat change bar */}
          {seatChanged && (
            <div style={{ marginTop: 14, padding: "12px 16px", background: seatSaved ? "#f0fdf4" : "#eff6ff", border: "1px solid " + (seatSaved ? "#bbf7d0" : "#bfdbfe"), borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div style={{ fontSize: 13, color: seatSaved ? "#16a34a" : "#0047AB" }}>
                {seatSaved ? "✅ Seat changed to " + chosenSeat + " successfully!" : "✈ New seat selected: " + chosenSeat + " — confirm to save"}
              </div>
              {!seatSaved && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => { setChosenSeat(activeConfig.selected_seat || activeConfig.selectedSeat); setSeatChanged(false); }} style={{ padding: "6px 14px", background: "white", color: "#64748b", border: "1px solid #e2e8f4", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                  <button onClick={() => { setSeatSaved(true); setSeatChanged(false); }} style={{ padding: "6px 16px", background: "linear-gradient(135deg,#0047AB,#003580)", color: "white", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: "0 3px 10px rgba(0,71,171,0.3)" }}>Confirm Seat {chosenSeat}</button>
                </div>
              )}
            </div>
          )}

          {/* Hover tooltip */}
          {hoveredSeat && (
            <div style={{ marginTop: 10, padding: "8px 14px", background: "#0f172a", borderRadius: 8, display: "inline-block" }}>
              <span style={{ fontSize: 12, color: "white" }}>
                Seat <strong>{hoveredSeat}</strong> · {CABIN_CONFIG.occupied.includes(hoveredSeat) ? "🔴 Occupied" : hoveredSeat === activeConfig.selected_seat || activeConfig.selectedSeat ? "✈ Your Seat" : "🟢 Available"}
              </span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// =========================================================
// LAYOVER INFO CARD
// =========================================================
const LAYOVER = {
  airport: "London Heathrow",
  code: "LHR",
  country: "United Kingdom",
  connection_time: "3h 40m",
  arrival: { flight: "AA 0081", time: "06:30", terminal: "Terminal 3", gate: "B22" },
  departure: { flight: "AA 0100", time: "10:10", terminal: "Terminal 3", gate: "C09" },
  same_terminal: true,
  transfer_walk: "~12 min walk",
  tips: [
    { icon: "🛂", title: "UK Transit Visa", text: "Nigerian passport holders may need an airside transit visa. Check gov.uk/transit-visa." },
    { icon: "🍽", title: "Dining", text: "Gordon Ramsay Plane Food & Wagamama are both in T3 landside. Grab food after landing." },
    { icon: "🛋", title: "Lounge", text: "No lounge access on Economy. Aspire Lounge available from £35 at T3." },
    { icon: "⚡", title: "Charging", text: "USB & power points available throughout T3 near gates C09–C14." },
    { icon: "🚶", title: "Gate Transfer", text: "B22 → C09 is a 12-min walk within T3. No inter-terminal transfer needed." },
    { icon: "🕐", title: "Minimum Connect", text: "LHR minimum connection time is 60 min. You have 3h 40m — very comfortable." },
  ],
};

function LayoverCard({ layover: lData }) {
  const [expanded, setExpanded] = useState(false);
  const L = lData || LAYOVER;
  const [connH, connM] = L.connection_time?.split("h ") || ["3", "40m"];
  const connMins = parseInt(connH) * 60 + parseInt(connM);
  const pct = Math.min(100, connMins / (8 * 60) * 100);

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "#94a3b8", marginBottom: 12, paddingLeft: 4 }}>LAYOVER DETAILS</div>
      <div style={{ background: "white", border: "1px solid #e2e8f4", borderRadius: 16, overflow: "hidden" }}>

        {/* Header */}
        <div style={{ background: "linear-gradient(135deg,#1e3a5f,#0f2340)", padding: "20px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 12, padding: "10px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "white", letterSpacing: "0.08em" }}>LHR</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em" }}>LAYOVER</div>
            </div>
            <div>
              <div style={{ color: "white", fontSize: 16, fontWeight: 700 }}>{L.airport}</div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 2 }}>{L.country} · {L.transfer_walk}</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em", marginBottom: 4 }}>CONNECTION TIME</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#4ade80", letterSpacing: "0.05em" }}>{L.connection_time}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
              {L.same_terminal ? "✓ Same Terminal" : "⚠ Terminal Change"}
            </div>
          </div>
        </div>

        {/* Connection timeline */}
        <div style={{ padding: "20px 28px", background: "#f8faff", borderBottom: "1px solid #e2e8f4" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
            {/* Arrival */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: "#94a3b8", letterSpacing: "0.1em", marginBottom: 4 }}>ARRIVES</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>{L.arrival.time}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{LAYOVER.arrival.flight}</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                {LAYOVER.arrival.terminal} · Gate {LAYOVER.arrival.gate}
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ flex: 2, padding: "0 16px" }}>
              <div style={{ fontSize: 10, color: "#0047AB", fontWeight: 700, textAlign: "center", marginBottom: 6, letterSpacing: "0.1em" }}>
                {LAYOVER.connection_time} LAYOVER
              </div>
              <div style={{ height: 6, background: "#e2e8f4", borderRadius: 10, overflow: "hidden", position: "relative" }}>
                <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: pct + "%", background: "linear-gradient(90deg,#0047AB,#4ade80)", borderRadius: 10 }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <span style={{ fontSize: 10, color: "#94a3b8" }}>Min: 60m</span>
                <span style={{ fontSize: 10, color: "#4ade80", fontWeight: 600 }}>✓ Comfortable</span>
              </div>
            </div>

            {/* Departure */}
            <div style={{ flex: 1, textAlign: "right" }}>
              <div style={{ fontSize: 10, color: "#94a3b8", letterSpacing: "0.1em", marginBottom: 4 }}>DEPARTS</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>{L.departure.time}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{LAYOVER.departure.flight}</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                {LAYOVER.departure.terminal} · Gate {LAYOVER.departure.gate}
              </div>
            </div>
          </div>
        </div>

        {/* Tips toggle */}
        <div style={{ padding: "14px 28px" }}>
          <button
            onClick={() => setExpanded(e => !e)}
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "#0047AB", fontSize: 13, fontWeight: 600, padding: 0 }}
          >
            <span>{expanded ? "▾" : "▸"}</span>
            {expanded ? "Hide" : "Show"} LHR Layover Tips ({L.tips.length})
          </button>

          {expanded && (
            <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {LAYOVER.tips.map((tip, i) => (
                <div key={i} style={{ background: "#f8faff", border: "1px solid #e8eef8", borderRadius: 12, padding: "14px 16px", display: "flex", gap: 12 }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{tip.icon}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", marginBottom: 3 }}>{tip.title}</div>
                    <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.5 }}>{tip.text}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// =========================================================
// ANALOG CLOCK
// =========================================================
function AnalogClock({ tz, size = 80, color = "#0047AB" }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id); }, []);
  const parts = now.toLocaleTimeString("en-US", { timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).split(":").map(Number);
  const h = parts[0] || 0, m = parts[1] || 0, s = parts[2] || 0;
  const secDeg = s * 6;
  const minDeg = m * 6 + s * 0.1;
  const hrDeg = (h % 12) * 30 + m * 0.5;
  const r = size / 2, cx = r, cy = r;
  const hand = (deg, len, width, clr) => {
    const rad = (deg - 90) * Math.PI / 180;
    return <line x1={cx} y1={cy} x2={cx + len * Math.cos(rad)} y2={cy + len * Math.sin(rad)} stroke={clr} strokeWidth={width} strokeLinecap="round" />;
  };
  return (
    <svg width={size} height={size} viewBox={"0 0 " + size + " " + size}>
      <circle cx={cx} cy={cy} r={r - 2} fill="white" stroke={color} strokeWidth={2.5} />
      <circle cx={cx} cy={cy} r={r - 5} fill="none" stroke={color} strokeWidth={0.5} opacity={0.2} />
      {[...Array(12)].map((_, i) => {
        const a = (i * 30 - 90) * Math.PI / 180;
        const isMajor = i % 3 === 0;
        const r1 = r - 5, r2 = r - (isMajor ? 13 : 9);
        return <line key={i} x1={cx + r1 * Math.cos(a)} y1={cy + r1 * Math.sin(a)} x2={cx + r2 * Math.cos(a)} y2={cy + r2 * Math.sin(a)} stroke={isMajor ? color : "#cbd5e1"} strokeWidth={isMajor ? 2 : 1} />;
      })}
      {hand(hrDeg, r * 0.48, 3.5, "#0f172a")}
      {hand(minDeg, r * 0.66, 2.5, "#0f172a")}
      {hand(secDeg, r * 0.75, 1.2, "#CC0000")}
      <circle cx={cx} cy={cy} r={4} fill={color} />
      <circle cx={cx} cy={cy} r={2} fill="white" />
    </svg>
  );
}

// =========================================================
// LOCAL CLOCKS
// =========================================================
function LocalClocks() {
  const [times, setTimes] = useState({});
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const t = {};
      CLOCK_ZONES.forEach(z => {
        const timeStr = now.toLocaleTimeString("en-US", { timeZone: z.tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
        const dateStr = now.toLocaleDateString("en-US", { timeZone: z.tz, weekday: "short", month: "short", day: "numeric" });
        const tzStr = now.toLocaleTimeString("en-US", { timeZone: z.tz, timeZoneName: "short" }).split(" ").pop();
        t[z.code] = { time: timeStr, date: dateStr, tz: tzStr };
      });
      setTimes(t);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "#94a3b8", marginBottom: 12, paddingLeft: 4 }}>LOCAL TIME AT AIRPORTS</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        {CLOCK_ZONES.map(z => {
          const t = times[z.code];
          return (
            <div key={z.code} style={{ background: "white", border: "1px solid #e2e8f4", borderRadius: 16, padding: "18px 16px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: z.color }} />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: z.color, letterSpacing: "0.08em" }}>{z.code}</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>{z.city}</div>
                <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>{z.role}</div>
              </div>
              <AnalogClock tz={z.tz} size={80} color={z.color} />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", letterSpacing: "0.04em", fontVariantNumeric: "tabular-nums" }}>{t ? t.time : "--:--:--"}</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{t ? t.date : ""}</div>
                <div style={{ display: "inline-block", marginTop: 5, padding: "2px 8px", background: z.color + "18", borderRadius: 6, fontSize: 10, fontWeight: 700, color: z.color, letterSpacing: "0.08em" }}>{t ? t.tz : ""}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =========================================================
// WEATHER CARDS
// =========================================================
function WeatherCards() {
  const [weather, setWeather] = useState({});
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function fetchAll() {
      const out = {};
      await Promise.all(WX_LOCATIONS.map(async (loc) => {
        try {
          const url = "https://api.open-meteo.com/v1/forecast?latitude=" + loc.lat + "&longitude=" + loc.lng +
            "&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max,windspeed_10m_max&timezone=auto&forecast_days=16";
          const r = await fetch(url);
          const d = await r.json();
          const idx = Math.min(14, (d.daily.time || []).length - 1);
          out[loc.code] = { max: Math.round(d.daily.temperature_2m_max[idx]), min: Math.round(d.daily.temperature_2m_min[idx]), code: d.daily.weathercode[idx], precip: d.daily.precipitation_probability_max[idx], wind: Math.round(d.daily.windspeed_10m_max[idx]) };
        } catch { out[loc.code] = null; }
      }));
      setWeather(out); setLoading(false);
    }
    fetchAll();
  }, []);
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "#94a3b8", marginBottom: 12, paddingLeft: 4 }}>WEATHER FORECAST ON TRAVEL DAY</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        {WX_LOCATIONS.map(loc => {
          const w = weather[loc.code];
          const icon = w ? (WX_ICONS[w.code] || "🌡") : null;
          const label = w ? (WX_LABELS[w.code] || "Unknown") : null;
          return (
            <div key={loc.code} style={{ background: loc.bg, borderRadius: 16, padding: "20px 22px", color: "white", position: "relative", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }}>
              <div style={{ position: "absolute", right: -20, top: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
              <div style={{ fontSize: 9, letterSpacing: "0.15em", opacity: 0.7, marginBottom: 4 }}>{loc.date}</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>{loc.code} <span style={{ fontSize: 11, fontWeight: 400, opacity: 0.65 }}>{loc.city}</span></div>
              {loading ? <div style={{ fontSize: 12, opacity: 0.5 }}>Loading forecast...</div> : w ? (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 34 }}>{icon}</span>
                    <div><div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1 }}>{w.max}°C</div><div style={{ fontSize: 11, opacity: 0.75, marginTop: 2 }}>{label}</div></div>
                  </div>
                  <div style={{ display: "flex", gap: 12, fontSize: 11, opacity: 0.85, flexWrap: "wrap" }}>
                    <span>↓ {w.min}°C</span><span>💧 {w.precip}%</span><span>💨 {w.wind} km/h</span>
                  </div>
                </>
              ) : <div style={{ fontSize: 12, opacity: 0.6 }}>Forecast unavailable</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =========================================================
// COUNTDOWN TIMER
// =========================================================
function CountdownTimer({ departDate, checkinOpen, flightLabel }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id); }, []);

  const msLeft = departDate - now;
  const checkinMsLeft = checkinOpen - now;
  const checkinReady = checkinMsLeft <= 0;
  const inTransit = msLeft <= 0;

  const days = Math.max(0, Math.floor(msLeft / 86400000));
  const hours = Math.max(0, Math.floor((msLeft % 86400000) / 3600000));
  const mins = Math.max(0, Math.floor((msLeft % 3600000) / 60000));
  const secs = Math.max(0, Math.floor((msLeft % 60000) / 1000));
  const ciH = Math.max(0, Math.floor(checkinMsLeft / 3600000));
  const ciM = Math.max(0, Math.floor((checkinMsLeft % 3600000) / 60000));
  const units = [{ label: "DAYS", val: days }, { label: "HRS", val: hours }, { label: "MIN", val: mins }, { label: "SEC", val: secs }];

  // IN TRANSIT state
  if (inTransit) {
    return (
      <div style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)", borderRadius: 16, padding: "20px 24px", marginBottom: 20, border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 4px 24px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#f59e0b", boxShadow: "0 0 8px #f59e0b", animation: "pulse 1.5s infinite", flexShrink: 0 }} />
            <span style={{ fontSize: 18, fontWeight: 800, color: "#f59e0b", letterSpacing: "0.06em" }}>IN TRANSIT</span>
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", flex: 1 }}>
            ✈ {flightLabel || "Flight"} has departed. Passenger is currently in the air.
          </div>
          <div style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 10, padding: "8px 16px", fontSize: 11, color: "#f59e0b", fontWeight: 700 }}>
            FLIGHT AIRBORNE
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)", borderRadius: 16, padding: "20px 20px", marginBottom: 20, border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 4px 24px rgba(0,0,0,0.2)" }}>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em", marginBottom: 14 }}>
        ✈ DEPARTURE COUNTDOWN — {flightLabel || ""}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Countdown units — scrollable row on mobile */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, WebkitOverflowScrolling: "touch" }}>
          {units.map(({ label, val }) => (
            <div key={label} style={{ textAlign: "center", flexShrink: 0 }}>
              <div style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 0", width: 64 }}>
                <div style={{ fontSize: 26, fontWeight: 700, color: "white", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{String(val).padStart(2, "0")}</div>
              </div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", marginTop: 5, letterSpacing: "0.1em" }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Check-in status — full width below on mobile */}
        <div style={{ background: checkinReady ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.05)", border: checkinReady ? "1px solid rgba(74,222,128,0.3)" : "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "14px 18px" }}>
          <div style={{ fontSize: 9, color: checkinReady ? "#4ade80" : "rgba(255,255,255,0.35)", letterSpacing: "0.15em", marginBottom: 6 }}>ONLINE CHECK-IN</div>
          {checkinReady ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#4ade80" }}>Open Now ✓</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>Check in at americanairlines.com</div>
              </div>
              <div style={{ padding: "7px 18px", background: "#4ade80", borderRadius: 8, color: "#0f172a", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>CHECK IN NOW →</div>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "white" }}>Opens in {ciH}h {ciM}m</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>24 hrs before departure</div>
              </div>
              <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 4, background: "linear-gradient(90deg,#0047AB,#4ade80)", width: Math.max(2, Math.min(100, ((24 * 60 - (ciH * 60 + ciM)) / (24 * 60)) * 100)) + "%", transition: "width 1s linear" }} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// =========================================================
// STATUS BANNER
// =========================================================
function StatusBanner({ alerts }) {
  const [dismissed, setDismissed] = useState([]);
  const colors = { info: { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8", dot: "#3b82f6" }, success: { bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d", dot: "#22c55e" }, warning: { bg: "#fffbeb", border: "#fde68a", text: "#b45309", dot: "#f59e0b" } };
  if (!alerts.filter((_, i) => !dismissed.includes(i)).length) return null;
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "#94a3b8", marginBottom: 10, paddingLeft: 4 }}>FLIGHT ALERTS & NOTIFICATIONS</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {alerts.map((alert, i) => {
          if (dismissed.includes(i)) return null;
          const c = colors[alert.type] || colors.info;
          return (
            <div key={i} style={{ background: c.bg, border: "1px solid " + c.border, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.dot, flexShrink: 0 }} />
              <span style={{ fontSize: 14 }}>{alert.icon}</span>
              <div style={{ flex: 1, fontSize: 13, color: c.text, fontWeight: 500 }}>{alert.message}</div>
              <button onClick={() => setDismissed(d => [...d, i])} style={{ background: "none", border: "none", cursor: "pointer", color: c.dot, fontSize: 18, lineHeight: 1, padding: "0 4px", opacity: 0.6 }}>×</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =========================================================
// QR CODE
// =========================================================
function QRCode({ value, size = 130 }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = "";
    loadScript("https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js").then(() => {
      el.innerHTML = "";
      new window.QRCode(el, { text: value, width: size, height: size, colorDark: "#0f172a", colorLight: "#ffffff", correctLevel: window.QRCode.CorrectLevel.H });
    });
  }, [value, size]);
  return <div ref={ref} style={{ width: size, height: size, borderRadius: 10, overflow: "hidden", flexShrink: 0 }} />;
}

// =========================================================
// ROUTE MAP
// =========================================================
function RouteMap({ segments }) {
  const canvasRef = useRef(null);
  const airports = segments?.length
  ? [segments[0]?.from, ...segments.map(seg => seg.to)].filter(Boolean)
  : [];
  // const airports = [segments[0].from, segments[0].to, segments[1].to];
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const lats = airports.map(a => a.lat), lngs = airports.map(a => a.lng);
    const minLat = Math.min(...lats) - 8, maxLat = Math.max(...lats) + 8;
    const minLng = Math.min(...lngs) - 10, maxLng = Math.max(...lngs) + 10;
    const proj = (lat, lng) => ({ x: ((lng - minLng) / (maxLng - minLng)) * (W - 80) + 40, y: H - ((lat - minLat) / (maxLat - minLat)) * (H - 60) - 30 });
    const pts = airports.map(a => proj(a.lat, a.lng));
    const bg = ctx.createLinearGradient(0, 0, W, H); bg.addColorStop(0, "#0a1628"); bg.addColorStop(1, "#0d1f3c");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    for (let x = 0; x < W; x += 24) for (let y = 0; y < H; y += 24) { ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI * 2); ctx.fill(); }
    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i], p2 = pts[i + 1], cpX = (p1.x + p2.x) / 2, cpY = Math.min(p1.y, p2.y) - 60;
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.quadraticCurveTo(cpX, cpY, p2.x, p2.y);
      ctx.strokeStyle = "rgba(0,120,255,0.15)"; ctx.lineWidth = 8; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.quadraticCurveTo(cpX, cpY, p2.x, p2.y);
      const g = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y); g.addColorStop(0, "#CC0000"); g.addColorStop(1, "#0047AB");
      ctx.strokeStyle = g; ctx.lineWidth = 2.5; ctx.setLineDash([6, 4]); ctx.stroke(); ctx.setLineDash([]);
      const t = 0.5, mx = (1-t)*(1-t)*p1.x+2*(1-t)*t*cpX+t*t*p2.x, my = (1-t)*(1-t)*p1.y+2*(1-t)*t*cpY+t*t*p2.y;
      ctx.save(); ctx.translate(mx, my); ctx.rotate(Math.atan2(p2.y-p1.y, p2.x-p1.x));
      ctx.fillStyle = "#fff"; ctx.font = "13px serif"; ctx.fillText("✈", -7, 5); ctx.restore();
    }
    airports.forEach((a, i) => {
      const p = pts[i], isL = i === 1;
      ctx.beginPath(); ctx.arc(p.x, p.y, 14, 0, Math.PI*2); ctx.fillStyle = isL ? "rgba(0,71,171,0.2)" : "rgba(204,0,0,0.2)"; ctx.fill();
      ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI*2); ctx.fillStyle = isL ? "#0047AB" : "#CC0000"; ctx.fill();
      ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI*2); ctx.strokeStyle = "white"; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.font = "bold 11px Arial,sans-serif"; const tw = ctx.measureText(a.code).width, lx = p.x-tw/2-5, ly = p.y-26;
      ctx.fillStyle = "rgba(10,22,40,0.85)"; ctx.beginPath(); ctx.roundRect(lx, ly, tw+10, 18, 4); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.fillText(a.code, p.x-tw/2, ly+13);
      ctx.fillStyle = "rgba(255,255,255,0.45)"; ctx.font = "9px Arial,sans-serif"; const cw = ctx.measureText(a.city).width; ctx.fillText(a.city, p.x-cw/2, p.y+22);
    });
  }, []);
  return (
    <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(0,71,171,0.2)" }}>
      <div style={{ background: "linear-gradient(90deg,#0a1628,#0d1f3c)", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ color: "white", fontSize: 12, fontWeight: 600, letterSpacing: "0.1em" }}>✈ ROUTE MAP</div>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>LOS → LHR → JFK</div>
      </div>
      <canvas ref={canvasRef} width={700} height={260} style={{ width: "100%", display: "block" }} />
    </div>
  );
}

// =========================================================
// FLIGHT SEGMENT
// =========================================================
function FlightSegment({ seg, index }) {
  return (
    <div style={{ background: "linear-gradient(135deg,#fff,#f8faff)", border: "1px solid #e2e8f4", borderRadius: 16, padding: "28px 32px", marginBottom: 16, position: "relative" }}>
      <div style={{ position: "absolute", top: 16, right: 20, background: seg.status === "On Time" ? "#dcfce7" : "#fef3c7", color: seg.status === "On Time" ? "#16a34a" : "#d97706", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>{seg.status.toUpperCase()}</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20, alignItems: "center" }}>
        <span style={{ fontSize: 13, color: "#0047AB", fontWeight: 600 }}>FLIGHT {seg.flight}</span>
        <span style={{ color: "#cbd5e1" }}>·</span>
        <span style={{ fontSize: 12, color: "#94a3b8" }}>{seg.aircraft}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 42, fontWeight: 700, color: "#0f172a", lineHeight: 1 }}>{seg.from.code}</div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>{seg.from.city}</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", marginTop: 10 }}>{seg.dep_time}</div>
          <div style={{ fontSize: 12, color: "#94a3b8" }}>{seg.departs}</div>
          <div style={{ marginTop: 8, display: "flex", gap: 12 }}>
            {[["Terminal", seg.from.terminal], ["Gate", seg.from.gate]].map(([l, v]) => (
              <div key={l} style={{ fontSize: 11, color: "#64748b" }}><span style={{ color: "#94a3b8" }}>{l}</span><br /><strong>{v}</strong></div>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "0 8px" }}>
          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>{seg.duration}</div>
          <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
            <div style={{ height: 1, flex: 1, background: "#cbd5e1" }} />
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ margin: "0 4px" }}>
              <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill="#0047AB" />
            </svg>
            <div style={{ height: 1, flex: 1, background: "#cbd5e1" }} />
          </div>
          <div style={{ fontSize: 10, color: "#0047AB", marginTop: 6, fontWeight: 600 }}>{index === 0 ? "LAYOVER: LHR" : "NONSTOP"}</div>
        </div>
        <div style={{ flex: 1, textAlign: "right" }}>
          <div style={{ fontSize: 42, fontWeight: 700, color: "#0f172a", lineHeight: 1 }}>{seg.to.code}</div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>{seg.to.city}</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", marginTop: 10 }}>{seg.arr_time}</div>
          <div style={{ fontSize: 12, color: "#94a3b8" }}>{seg.arrives}</div>
          <div style={{ marginTop: 8, display: "flex", gap: 12, justifyContent: "flex-end" }}>
            {[["Terminal", seg.to.terminal], ["Gate", seg.to.gate]].map(([l, v]) => (
              <div key={l} style={{ fontSize: 11, color: "#64748b", textAlign: "right" }}><span style={{ color: "#94a3b8" }}>{l}</span><br /><strong>{v}</strong></div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px dashed #e2e8f4", display: "flex", gap: 24, flexWrap: "wrap" }}>
        {[["Seat", seg.seat], ["Class", seg.class], ["Meal", seg.meal]].map(([l, v]) => (
          <div key={l}><div style={{ fontSize: 10, color: "#94a3b8", letterSpacing: "0.08em" }}>{l.toUpperCase()}</div><div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginTop: 2 }}>{v}</div></div>
        ))}
      </div>
    </div>
  );
}

// =========================================================
// BOARDING PASS DOWNLOAD
// =========================================================
async function downloadBoardingPass(booking) {
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
  const { jsPDF } = window.jspdf;

  // Landscape boarding pass dimensions
  const doc = new jsPDF({ unit: "pt", format: [680, 240], orientation: "landscape" });
  const W = 680, H = 240;
  const seg = booking.segments[0];

  // Background
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, W, H, "F");

  // Left colored strip
  doc.setFillColor(204, 0, 0);
  doc.rect(0, 0, 6, H, "F");

  // AA Logo area
  doc.setFillColor(204, 0, 0);
  doc.rect(0, 0, 120, H, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11); doc.setFont("helvetica", "bold");
  doc.text("AMERICAN", 14, 30);
  doc.text("AIRLINES", 14, 44);
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text("AAdvantage®", 14, 58);

  // Big plane icon area
  doc.setFontSize(40);
  doc.text("✈", 30, 120);

  doc.setFontSize(8); doc.setFont("helvetica", "bold");
  doc.text("BOARDING", 14, 160);
  doc.text("PASS", 14, 172);

  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.setTextColor(180, 180, 180);
  doc.text("ECONOMY", 14, 196);
  doc.text(seg.seat, 14, 208);

  // Dashed tear line
  doc.setDrawColor(255, 255, 255); doc.setLineDash([3, 3]); doc.setLineWidth(0.5);
  doc.line(120, 10, 120, H - 10);
  doc.setLineDash([]);

  // Main content area
  const mx = 136;

  // Passenger name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text("PASSENGER NAME", mx, 22);
  doc.setFontSize(16); doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(booking.passenger.title + " " + booking.passenger.name, mx, 40);

  // Route — big airport codes
  doc.setFontSize(48); doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(seg.from.code, mx, 110);
  doc.text(seg.to.code, mx + 220, 110);

  // Arrow
  doc.setFontSize(14);
  doc.setTextColor(204, 0, 0);
  doc.text("→", mx + 158, 100);
  doc.setFontSize(8); doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text(seg.duration, mx + 155, 114);

  // City names
  doc.setFontSize(9); doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text(seg.from.city, mx, 122);
  doc.text(seg.to.city, mx + 220, 122);

  // Details row
  const details = [
    ["FLIGHT", seg.flight],
    ["DATE", seg.departs],
    ["DEPARTS", seg.dep_time],
    ["ARRIVES", seg.arr_time],
    ["SEAT", seg.seat],
    ["CLASS", seg.class],
    ["GATE", seg.from.gate],
  ];
  details.forEach(([label, val], i) => {
    const dx = mx + i * 74;
    doc.setFontSize(7); doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(label, dx, 148);
    doc.setFontSize(10); doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(val, dx, 163);
  });

  // PNR
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("BOOKING REF", mx, 186);
  doc.setFontSize(14); doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(booking.pnr, mx, 202);

  // Ticket number
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(booking.ticket_number, mx, 225);

  // Dashed tear line before barcode
  doc.setDrawColor(71, 85, 105); doc.setLineDash([3, 3]); doc.setLineWidth(0.5);
  doc.line(W - 130, 10, W - 130, H - 10);
  doc.setLineDash([]);

  // Barcode stub area
  doc.setFillColor(255, 255, 255);
  doc.rect(W - 125, 0, 125, H, "F");
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(7); doc.setFont("helvetica", "bold");
  doc.text("GATE", W - 115, 20);
  doc.setFontSize(22); doc.setFont("helvetica", "bold");
  doc.text(seg.from.gate, W - 118, 44);

  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("SEAT", W - 115, 62);
  doc.setFontSize(16); doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(seg.seat, W - 115, 78);

  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("DEPARTS", W - 115, 96);
  doc.setFontSize(13); doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(seg.dep_time, W - 115, 112);

  // Mini barcode lines in stub
  let bx = W - 118;
  for (let i = 0; i < 28; i++) {
    const bw = Math.random() > 0.5 ? 2.5 : 1;
    doc.setFillColor(15, 23, 42);
    doc.rect(bx, 130, bw, 60, "F");
    bx += bw + (Math.random() > 0.6 ? 2.5 : 1.5);
  }
  doc.setFontSize(6); doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(booking.pnr, W - 118, 204);
  doc.text("AA · INTL", W - 118, 216);
  doc.text("ECONOMY", W - 118, 226);

  doc.save("AA_BoardingPass_" + booking.pnr + "_" + seg.from.code + seg.to.code + ".pdf");
}

// =========================================================
// E-TICKET PDF DOWNLOAD
// =========================================================
async function downloadETicket(booking) {
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const f = booking.fare;
  let y = 0;

  // ---- Header bar ----
  doc.setFillColor(204, 0, 0);
  doc.rect(0, 0, W, 5, "F");
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 5, W, 80, "F");
  doc.setDrawColor(226, 232, 244);
  doc.line(0, 85, W, 85);

  // AA Logo text
  doc.setFontSize(22); doc.setFont("helvetica", "bold");
  doc.setTextColor(204, 0, 0);
  doc.text("American", 40, 38);
  doc.setTextColor(0, 35, 100);
  doc.text("Airlines", 40, 58);
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text("AAdvantage® Member Services", 40, 72);

  // Generated date top right
  doc.setFontSize(7); doc.setTextColor(148, 163, 184);
  doc.text("Generated: " + new Date().toUTCString(), W - 40, 16, { align: "right" });

  // E-TICKET RECEIPT title
  doc.setFontSize(18); doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("E-TICKET RECEIPT", W - 40, 42, { align: "right" });
  doc.setFontSize(8); doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Booking Reference", W - 150, 57);
  doc.text("Ticket Number", W - 150, 70);
  doc.setFontSize(10); doc.setFont("helvetica", "bold");
  doc.setTextColor(204, 0, 0);
  doc.text(booking.pnr, W - 40, 57, { align: "right" });
  doc.setTextColor(15, 23, 42);
  doc.text(booking.ticket_number, W - 40, 70, { align: "right" });

  y = 100;

  // Greeting
  doc.setFontSize(10); doc.setFont("helvetica", "italic");
  doc.setTextColor(15, 23, 42);
  doc.text("Dear " + booking.passenger.title + " " + booking.passenger.name + ",", 40, y);
  doc.setFontSize(9); doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Thank you for choosing American Airlines. We look forward to welcoming you onboard.", 40, y + 14);
  y += 32;

  // ---- Flight Segments Table ----
  const tableHeaders = ["Flight", "From / Departs", "To / Arrives", "Class", "Fare Basis", "Seat", "Baggage"];
  const colWidths = [60, 108, 108, 56, 56, 36, 52];
  const tableW = colWidths.reduce((a, b) => a + b, 0);
  const startX = 40;

  // Table header
  doc.setFillColor(0, 35, 100);
  doc.rect(startX, y, tableW, 20, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5); doc.setFont("helvetica", "bold");
  let cx = startX + 5;
  tableHeaders.forEach((h, i) => { doc.text(h, cx, y + 13); cx += colWidths[i]; });
  y += 20;

  booking.segments.forEach((seg, si) => {
    const rowH = 52;
    doc.setFillColor(si % 2 === 0 ? 248 : 255, si % 2 === 0 ? 250 : 255, si % 2 === 0 ? 255 : 255);
    doc.rect(startX, y, tableW, rowH, "F");
    doc.setDrawColor(226, 232, 244);
    doc.rect(startX, y, tableW, rowH, "S");

    cx = startX + 5;
    doc.setTextColor(15, 23, 42); doc.setFontSize(8); doc.setFont("helvetica", "bold");
    doc.text(seg.flight, cx, y + 12); cx += colWidths[0];

    doc.setFont("helvetica", "normal"); doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139); doc.text(seg.from.city + " (" + seg.from.code + ")", cx, y + 12);
    doc.setTextColor(15, 23, 42); doc.setFont("helvetica", "bold");
    doc.text(seg.departs + " " + seg.dep_time, cx, y + 23);
    doc.setFont("helvetica", "normal"); doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(seg.from.terminal + " · Gate " + seg.from.gate, cx, y + 33);
    cx += colWidths[1];

    doc.setFontSize(7.5); doc.setTextColor(100, 116, 139); doc.text(seg.to.city + " (" + seg.to.code + ")", cx, y + 12);
    doc.setTextColor(15, 23, 42); doc.setFont("helvetica", "bold");
    doc.text(seg.arrives + " " + seg.arr_time, cx, y + 23);
    doc.setFont("helvetica", "normal"); doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(seg.to.terminal + " · Gate " + seg.to.gate, cx, y + 33);
    cx += colWidths[2];

    doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(15, 23, 42);
    doc.text(f.cabin_class, cx, y + 12); cx += colWidths[3];
    doc.text(f.basis, cx, y + 12); cx += colWidths[4];

    doc.setFont("helvetica", "bold"); doc.setTextColor(0, 47, 171);
    doc.text(seg.seat, cx, y + 12); cx += colWidths[5];

    doc.setFont("helvetica", "normal"); doc.setTextColor(15, 23, 42);
    doc.text("23 kg", cx, y + 12);

    // Status badge
    doc.setFillColor(220, 252, 231);
    doc.roundedRect(startX + 5, y + 38, 44, 10, 2, 2, "F");
    doc.setTextColor(22, 163, 74); doc.setFontSize(6.5); doc.setFont("helvetica", "bold");
    doc.text("CONFIRMED", startX + 10, y + 46);

    y += rowH;
  });
  y += 14;

  // ---- Receipt + Contact ----
  const halfW = (W - 80) / 2;
  const receiptX = 40, contactX = 40 + halfW + 10;

  // Receipt box
  doc.setFillColor(248, 250, 255);
  doc.roundedRect(receiptX, y, halfW, 130, 4, 4, "F");
  doc.setDrawColor(226, 232, 244);
  doc.roundedRect(receiptX, y, halfW, 130, 4, 4, "S");
  doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(15, 23, 42);
  doc.text("Receipt", receiptX + 10, y + 14);
  doc.setDrawColor(226, 232, 244); doc.line(receiptX + 10, y + 18, receiptX + halfW - 10, y + 18);

  const receiptRows = [
    ["Ticket Fare", f.ticket_fare],
    ["Fuel Surcharge (YQ)", f.fuel_surcharge],
    ["Taxes & Levies", f.taxes],
    ["Passenger Service Charge", f.service_charge],
    ["Aviation Levy", f.aviation_levy],
  ];
  receiptRows.forEach(([l, v], i) => {
    const ry = y + 28 + i * 14;
    doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 116, 139);
    doc.text(l, receiptX + 10, ry);
    doc.setTextColor(15, 23, 42);
    doc.text(v, receiptX + halfW - 10, ry, { align: "right" });
  });
  doc.setDrawColor(226, 232, 244); doc.line(receiptX + 10, y + 102, receiptX + halfW - 10, y + 102);
  doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(15, 23, 42);
  doc.text("Total", receiptX + 10, y + 114);
  doc.setFontSize(11); doc.setTextColor(0, 47, 171);
  doc.text(f.total, receiptX + halfW - 10, y + 114, { align: "right" });
  doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 116, 139);
  doc.text("Payment: " + f.payment, receiptX + 10, y + 126);

  // Contact box
  doc.setFillColor(248, 250, 255);
  doc.roundedRect(contactX, y, halfW, 130, 4, 4, "F");
  doc.setDrawColor(226, 232, 244);
  doc.roundedRect(contactX, y, halfW, 130, 4, 4, "S");
  doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(15, 23, 42);
  doc.text("Contact Details", contactX + 10, y + 14);
  doc.setDrawColor(226, 232, 244); doc.line(contactX + 10, y + 18, contactX + halfW - 10, y + 18);

  const contactRows = [
    ["Date of Purchase", f.purchase_date],
    ["Tour Code", f.tour_code],
    ["CO2 Emissions", f.co2],
    ["AAdvantage #", booking.passenger.frequent_flyer],
  ];
  contactRows.forEach(([l, v], i) => {
    const cy2 = y + 30 + i * 20;
    doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(148, 163, 184);
    doc.text(l.toUpperCase(), contactX + 10, cy2);
    doc.setFontSize(8.5); doc.setFont("helvetica", "bold"); doc.setTextColor(15, 23, 42);
    doc.text(v, contactX + 10, cy2 + 11);
  });

  y += 144;

  // ---- Valid on line ----
  doc.setFillColor(241, 245, 249);
  doc.rect(40, y, W - 80, 24, "F");
  doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(15, 23, 42);
  doc.text("VALID ON AA ONLY / " + booking.pnr + booking.booking_date.replace(/[,\s]/g, "").toUpperCase(), 50, y + 15);
  doc.setFont("helvetica", "normal"); doc.setTextColor(100, 116, 139);
  doc.text("Tour Code: " + f.tour_code, W - 50, y + 15, { align: "right" });
  y += 36;

  // ---- Fare Conditions ----
  doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(15, 23, 42);
  doc.text("FARE CONDITIONS & INFORMATION", 40, y);
  doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(100, 116, 139);
  doc.text("Fare: " + f.basis, 40, y + 12);
  y += 22;

  const fareRows = [
    ["Changes Before Departure", f.fare_conditions.changes_before],
    ["Changes After Departure", f.fare_conditions.changes_after],
    ["Cancellation Before Departure", f.fare_conditions.cancel_before],
    ["Cancellation After Departure", f.fare_conditions.cancel_after],
    ["No Show", f.fare_conditions.no_show],
  ];
  const fcW = (W - 80) / fareRows.length;
  fareRows.forEach(([l, v], i) => {
    const fx = 40 + i * fcW;
    doc.setFillColor(248, 250, 255);
    doc.roundedRect(fx, y, fcW - 6, 38, 3, 3, "F");
    doc.setDrawColor(226, 232, 244);
    doc.roundedRect(fx, y, fcW - 6, 38, 3, 3, "S");
    doc.setFontSize(6.5); doc.setFont("helvetica", "normal"); doc.setTextColor(148, 163, 184);
    doc.text(l, fx + 6, y + 12);
    doc.setFontSize(10); doc.setFont("helvetica", "bold");
    doc.setTextColor(v === "Non-refundable" ? 220 : 15, v === "Non-refundable" ? 38 : 23, v === "Non-refundable" ? 38 : 42);
    doc.text(v, fx + 6, y + 28);
  });
  y += 50;

  // ---- CO2 Notice ----
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(40, y, W - 80, 22, 3, 3, "F");
  doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(21, 128, 61);
  doc.text("NOTICE: Flight(s) calculated average CO2 emissions is " + f.co2 + " per person. Source: ICAO Carbon Emissions Calculator.", 48, y + 14);
  y += 34;

  // ---- Footer ----
  doc.setFillColor(15, 23, 42);
  doc.rect(0, y, W, 55, "F");
  doc.setFillColor(204, 0, 0);
  doc.rect(0, y + 50, W, 5, "F");
  doc.setTextColor(148, 163, 184); doc.setFontSize(7.5); doc.setFont("helvetica", "normal");
  doc.text("This e-ticket is your official receipt. Please carry this document along with valid photo ID at check-in.", 40, y + 14);
  doc.text("Carriage is subject to American Airlines Conditions of Carriage. Fares are not guaranteed until full payment is received.", 40, y + 26);
  doc.setTextColor(80, 100, 160);
  doc.text("americanairlines.com  |  AAdvantage Service: 1-800-882-8880  |  International: +1-817-786-3523", 40, y + 40);

  doc.save("AA_ETicket_" + booking.pnr + ".pdf");
}

// =========================================================
// PDF
// =========================================================
async function downloadPDF(booking) {
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth(); let y = 0;
  doc.setFillColor(204,0,0); doc.rect(0,0,W,68,"F"); doc.setFillColor(0,71,171); doc.rect(0,68,W,5,"F");
  doc.setTextColor(255,255,255); doc.setFontSize(20); doc.setFont("helvetica","bold"); doc.text("American Airlines",40,30);
  doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.text("TRAVEL ITINERARY & E-TICKET CONFIRMATION",40,46); doc.text("americanairlines.com",W-40,46,{align:"right"});
  y=95; doc.setFillColor(0,35,100); doc.roundedRect(40,y,W-80,54,5,5,"F");
  doc.setTextColor(255,255,255); doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.text("BOOKING REFERENCE (PNR)",56,y+15);
  doc.setFontSize(24); doc.setFont("helvetica","bold"); doc.text(booking.pnr,56,y+40);
  doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.text("STATUS",W-160,y+15);
  doc.setFontSize(14); doc.setFont("helvetica","bold"); doc.setTextColor(74,222,128); doc.text(booking.status,W-160,y+36); y+=66;
  doc.setTextColor(100,116,139); doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.text("Ticket: "+booking.ticket_number+"   |   Booked: "+booking.booking_date,40,y); y+=22;
  doc.setDrawColor(226,232,244); doc.line(40,y,W-40,y); y+=16;
  doc.setTextColor(148,163,184); doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.text("PASSENGER INFORMATION",40,y); y+=10;
  doc.setFillColor(248,250,255); doc.roundedRect(40,y,W-80,50,4,4,"F"); doc.setDrawColor(226,232,244); doc.roundedRect(40,y,W-80,50,4,4,"S");
  doc.setTextColor(15,23,42); doc.setFontSize(14); doc.setFont("helvetica","bold"); doc.text(booking.passenger.title+" "+booking.passenger.name,56,y+20);
  doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(100,116,139); doc.text("AAdvantage: "+booking.passenger.frequent_flyer,56,y+36); doc.text("Passport: "+booking.passenger.passport,240,y+36); y+=62;
  doc.setTextColor(148,163,184); doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.text("FLIGHT ITINERARY",40,y); y+=10;
  booking.segments.forEach((seg,i)=>{
    doc.setFillColor(255,255,255); doc.roundedRect(40,y,W-80,126,4,4,"F"); doc.setDrawColor(226,232,244); doc.roundedRect(40,y,W-80,126,4,4,"S");
    doc.setFillColor(0,47,130); doc.roundedRect(40,y,W-80,24,4,4,"F"); doc.rect(40,y+12,W-80,12,"F");
    doc.setTextColor(255,255,255); doc.setFontSize(9); doc.setFont("helvetica","bold"); doc.text("FLIGHT "+seg.flight+"  ·  "+seg.aircraft,54,y+16); doc.setTextColor(74,222,128); doc.text(seg.status,W-90,y+16); y+=32;
    doc.setTextColor(15,23,42); doc.setFontSize(24); doc.setFont("helvetica","bold"); doc.text(seg.from.code,54,y+22); doc.text(seg.to.code,W-100,y+22);
    doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(100,116,139); doc.text(seg.from.city,54,y+34); doc.text(seg.to.city,W-100,y+34);
    doc.setDrawColor(200,210,230); doc.line(W/2-35,y+14,W/2+35,y+14); doc.setTextColor(0,71,171); doc.setFontSize(8); doc.setFont("helvetica","bold");
    doc.text(seg.duration,W/2-12,y+10); doc.text(i===0?"via LHR":"NONSTOP",W/2-14,y+22);
    doc.setTextColor(15,23,42); doc.setFontSize(14); doc.setFont("helvetica","bold"); doc.text(seg.dep_time,54,y+52); doc.text(seg.arr_time,W-100,y+52);
    doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(100,116,139); doc.text(seg.departs,54,y+64); doc.text(seg.arrives,W-100,y+64); y+=72;
    doc.setDrawColor(226,232,244); doc.setLineDash([2,3]); doc.line(54,y,W-54,y); doc.setLineDash([]); y+=8;
    ["Seat: "+seg.seat,"Class: "+seg.class,"Meal: "+seg.meal,"Gate: "+seg.from.gate].forEach((d,di)=>{
      const p=d.split(": "); doc.setTextColor(100,116,139); doc.setFont("helvetica","normal"); doc.text(p[0]+":",54+di*120,y);
      doc.setTextColor(15,23,42); doc.setFont("helvetica","bold"); doc.text(p[1],54+di*120+30,y);
    }); y+=18;
  }); y+=8;
  doc.setTextColor(148,163,184); doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.text("BAGGAGE ALLOWANCE",40,y); y+=10;
  doc.setFillColor(248,250,255); doc.roundedRect(40,y,W-80,42,4,4,"F"); doc.setDrawColor(226,232,244); doc.roundedRect(40,y,W-80,42,4,4,"S");
  [["Personal Item",booking.baggage.personal],["Carry-On",booking.baggage.carry_on],["Checked Bag",booking.baggage.checked]].forEach(([l,v],i)=>{
    const bx=56+i*155; doc.setTextColor(148,163,184); doc.setFontSize(7); doc.setFont("helvetica","normal"); doc.text(l.toUpperCase(),bx,y+15);
    doc.setTextColor(15,23,42); doc.setFontSize(10); doc.setFont("helvetica","bold"); doc.text(v,bx,y+30);
  }); y+=55;
  doc.setFillColor(15,23,42); doc.rect(0,y,W,55,"F"); doc.setTextColor(148,163,184); doc.setFontSize(8); doc.setFont("helvetica","normal");
  doc.text("This document is your official travel itinerary. Present at check-in along with valid ID.",40,y+16);
  doc.text("PNR: "+booking.pnr+"   |   Ticket: "+booking.ticket_number+"   |   Issued: "+booking.booking_date,40,y+29);
  doc.setTextColor(80,100,160); doc.text("americanairlines.com  |  AAdvantage Service: 1-800-882-8880",40,y+42);
  doc.save("AA_Itinerary_"+booking.pnr+".pdf");
}

// =========================================================
// E-TICKET RECEIPT
// =========================================================
function ETicketReceipt({ booking }) {
  const [open, setOpen] = useState(false);
  const [etLoading, setEtLoading] = useState(false);
  const f = booking.fare;

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingLeft: 4 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "#94a3b8" }}>E-TICKET RECEIPT</div>
        <button onClick={async () => { setEtLoading(true); try { await downloadETicket(booking); } catch(e) { console.error(e); } finally { setEtLoading(false); } }} disabled={etLoading} style={{ padding: "7px 16px", background: etLoading ? "#94a3b8" : "linear-gradient(135deg,#0047AB,#003580)", color: "white", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: etLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: etLoading ? "none" : "0 3px 10px rgba(0,71,171,0.3)" }}>
          {etLoading ? "⏳ Generating..." : "⬇ Download E-Ticket"}
        </button>
      </div>
      <div style={{ background: "white", border: "1px solid #e2e8f4", borderRadius: 16, overflow: "hidden" }}>

        {/* Header */}
        <div style={{ background: "linear-gradient(135deg,#f8faff,#eff6ff)", padding: "18px 28px", borderBottom: "1px solid #e2e8f4", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>Dear <strong style={{ color: "#0f172a" }}>{booking.passenger.title} {booking.passenger.name},</strong></div>
            <div style={{ fontSize: 12, color: "#64748b" }}>Thank you for choosing American Airlines.</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>We look forward to welcoming you onboard.</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", letterSpacing: "0.04em" }}>E-TICKET RECEIPT</div>
            <div style={{ display: "flex", gap: 20, marginTop: 8, justifyContent: "flex-end" }}>
              <div>
                <div style={{ fontSize: 10, color: "#94a3b8" }}>Booking Reference</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#CC0000", letterSpacing: "0.1em" }}>{booking.pnr}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#94a3b8" }}>Ticket Number</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{booking.ticket_number}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Flight segments table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 600 }}>
            <thead>
              <tr style={{ background: "#f1f5f9" }}>
                {["Flight / Operated By", "Departs / Arrives", "Class", "Fare Basis", "Travel Not Valid", "Special Services"].map(h => (
                  <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", borderBottom: "1px solid #e2e8f4", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {booking.segments.map((seg, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f1f5f9", verticalAlign: "top" }}>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ fontWeight: 700, color: "#0f172a" }}>{seg.flight}</div>
                    <div style={{ color: "#64748b", fontSize: 11 }}>American Airlines</div>
                    <div style={{ marginTop: 4, display: "inline-block", background: "#dcfce7", color: "#16a34a", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>Confirmed</div>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ color: "#64748b", fontSize: 11 }}>{seg.from.city} ({seg.from.code}), {seg.from.terminal}</div>
                    <div style={{ fontWeight: 700, color: "#0f172a" }}>{seg.departs} {seg.dep_time}</div>
                    <div style={{ marginTop: 6, color: "#64748b", fontSize: 11 }}>{seg.to.city} ({seg.to.code}), {seg.to.terminal}</div>
                    <div style={{ fontWeight: 700, color: "#0f172a" }}>{seg.arrives} {seg.arr_time}</div>
                    <div style={{ marginTop: 6, fontSize: 11, color: "#64748b" }}>
                      <span style={{ fontWeight: 600 }}>Baggage Allowance</span><br />
                      {i === 0 ? "23 Kilograms" : "23 Kilograms"}
                    </div>
                  </td>
                  <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                    <div style={{ color: "#0f172a" }}>{booking.fare.cabin_class}</div>
                  </td>
                  <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                    <div style={{ fontWeight: 600, color: "#0f172a" }}>{booking.fare.basis}</div>
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: 11 }}>
                    <div><span style={{ color: "#94a3b8" }}>Before </span>{booking.fare.valid_before}</div>
                    <div><span style={{ color: "#94a3b8" }}>After </span>{booking.fare.valid_after}</div>
                  </td>
                  <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                    <div style={{ fontWeight: 600, color: "#0047AB" }}>Seat {seg.seat}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Receipt + Contact grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderTop: "1px solid #e2e8f4" }}>
          {/* Receipt */}
          <div style={{ padding: "18px 22px", borderRight: "1px solid #e2e8f4" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>Receipt</div>
            {[
              ["Ticket Fare", f.ticket_fare],
              ["Fuel Surcharge (YQ)", f.fuel_surcharge],
              ["Taxes & Levies", f.taxes],
              ["Passenger Service Charge", f.service_charge],
              ["Aviation Levy", f.aviation_levy],
            ].map(([l, v]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                <span style={{ color: "#64748b" }}>{l}</span>
                <span style={{ color: "#0f172a" }}>{v}</span>
              </div>
            ))}
            <div style={{ borderTop: "1px solid #e2e8f4", marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 700, color: "#0f172a" }}>Total</span>
              <span style={{ fontWeight: 800, color: "#0f172a", fontSize: 14 }}>{f.total}</span>
            </div>
            <div style={{ marginTop: 6, display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span style={{ color: "#64748b" }}>Payment</span>
              <span style={{ color: "#0f172a" }}>{f.payment}</span>
            </div>
          </div>

          {/* Contact */}
          <div style={{ padding: "18px 22px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>Contact Details</div>
            {[
              ["Date of Purchase", f.purchase_date],
              ["Tour Code", f.tour_code],
              ["CO2 Emissions", f.co2],
            ].map(([l, v]) => (
              <div key={l} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>{l}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{v}</div>
              </div>
            ))}
            <div style={{ marginTop: 8, padding: "8px 12px", background: "#f0f9ff", borderRadius: 8, border: "1px solid #bae6fd" }}>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>Office</div>
              <div style={{ fontSize: 11, color: "#0369a1", fontWeight: 600, marginTop: 2 }}>American Airlines Customer Service<br />1 Skyview Drive, Fort Worth, TX 76155<br />+1 800 433 7300</div>
            </div>
          </div>
        </div>

        {/* Valid on line */}
        <div style={{ padding: "10px 22px", borderTop: "1px solid #e2e8f4", background: "#f8faff" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#0f172a" }}>VALID ON AA ONLY / {booking.pnr}{booking.booking_date.replace(/,? /g, "").toUpperCase()}</div>
          <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>Tour Code: {f.tour_code}</div>
        </div>

        {/* Fare conditions toggle */}
        <div style={{ padding: "12px 22px", borderTop: "1px solid #e2e8f4" }}>
          <button onClick={() => setOpen(o => !o)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "#0047AB", fontSize: 12, fontWeight: 600, padding: 0 }}>
            <span>{open ? "▾" : "▸"}</span> {open ? "Hide" : "Show"} Fare Conditions & Change Fees
          </button>
          {open && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#0f172a", marginBottom: 8, letterSpacing: "0.06em" }}>FARE CONDITIONS — {f.basis}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 }}>
                {[
                  ["Changes Before Departure", f.fare_conditions.changes_before],
                  ["Changes After Departure", f.fare_conditions.changes_after],
                  ["Cancellation Before Departure", f.fare_conditions.cancel_before],
                  ["Cancellation After Departure", f.fare_conditions.cancel_after],
                  ["No Show Fee", f.fare_conditions.no_show],
                ].map(([l, v]) => (
                  <div key={l} style={{ padding: "10px 12px", background: "#f8faff", border: "1px solid #e2e8f4", borderRadius: 8 }}>
                    <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 3 }}>{l.toUpperCase()}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: v === "Non-refundable" ? "#dc2626" : "#0f172a" }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, padding: "10px 14px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, fontSize: 11, color: "#b45309" }}>
                ⚠ <strong>Note:</strong> {f.not_valid_note}. Most restrictive fare rules apply. Changes subject to availability at time of rebooking.
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// =========================================================
// HOTELS & CAR RENTAL DATA
// =========================================================
const HOTELS_DATA = {
  JFK: [
    { name: "JW Marriott Essex House", stars: 5, distance: "12 miles from JFK", price: "$289/night", rating: 4.7, reviews: 2841, image: "🏨", amenities: ["Free WiFi", "Pool", "Spa", "Restaurant"], address: "160 Central Park South, New York" },
    { name: "The New Yorker Hotel", stars: 4, distance: "11 miles from JFK", price: "$189/night", rating: 4.4, reviews: 5621, image: "🏩", amenities: ["Free WiFi", "Gym", "Bar", "24hr Desk"], address: "481 8th Ave, New York" },
    { name: "Hilton JFK Airport", stars: 4, distance: "0.5 miles from JFK", price: "$159/night", rating: 4.2, reviews: 3102, image: "🏪", amenities: ["Free Shuttle", "Pool", "Restaurant", "WiFi"], address: "144-02 135th Ave, Jamaica, NY" },
    { name: "TWA Hotel at JFK", stars: 4, distance: "On airport grounds", price: "$249/night", rating: 4.8, reviews: 1876, image: "✈️", amenities: ["Rooftop Pool", "6 Restaurants", "Retro Design", "WiFi"], address: "One Idlewild Drive, Jamaica, NY" },
    { name: "Hyatt Regency JFK", stars: 4, distance: "1 mile from JFK", price: "$179/night", rating: 4.3, reviews: 2234, image: "🏨", amenities: ["Free Shuttle", "Gym", "Bar", "WiFi"], address: "9100 S Service Rd, Jamaica, NY" },
  ],
  LHR: [
    { name: "Sofitel London Heathrow", stars: 5, distance: "On airport grounds", price: "$299/night", rating: 4.6, reviews: 3421, image: "🏨", amenities: ["Free WiFi", "Spa", "Restaurant", "Bar"], address: "Terminal 5, Heathrow Airport, London" },
    { name: "Hilton London Heathrow T4", stars: 4, distance: "0.3 miles from LHR", price: "$199/night", rating: 4.3, reviews: 4102, image: "🏩", amenities: ["Pool", "Gym", "Restaurant", "WiFi"], address: "Terminal 4, Heathrow Airport" },
    { name: "Marriott London Heathrow", stars: 4, distance: "0.5 miles from LHR", price: "$179/night", rating: 4.2, reviews: 2876, image: "🏪", amenities: ["Free Shuttle", "Gym", "Bar", "WiFi"], address: "Bath Rd, Harlington, Hayes" },
  ],
  LOS: [
    { name: "Eko Hotel & Suites", stars: 5, distance: "8 miles from LOS", price: "$180/night", rating: 4.5, reviews: 1243, image: "🏨", amenities: ["Pool", "Spa", "Restaurant", "WiFi"], address: "Plot 1415, Adetokunbo Ademola, VI" },
    { name: "Federal Palace Hotel", stars: 5, distance: "9 miles from LOS", price: "$165/night", rating: 4.3, reviews: 987, image: "🏩", amenities: ["Pool", "Gym", "Restaurant", "Bar"], address: "6 Catholic Mission St, Lagos Island" },
    { name: "Lagos Continental Hotel", stars: 4, distance: "7 miles from LOS", price: "$130/night", rating: 4.1, reviews: 754, image: "🏪", amenities: ["Pool", "Restaurant", "WiFi", "Gym"], address: "2-4 Kofo Abayomi St, Victoria Island" },
  ],
};

const CARS_DATA = {
  JFK: [
    { company: "Hertz", logo: "🚗", car: "Toyota Camry", category: "Mid-size", price: "$45/day", transmission: "Automatic", seats: 5, rating: 4.5, free_cancel: true },
    { company: "Enterprise", logo: "🚙", car: "Ford Explorer", category: "SUV", price: "$78/day", transmission: "Automatic", seats: 7, rating: 4.6, free_cancel: true },
    { company: "Avis", logo: "🚕", car: "Chevrolet Malibu", category: "Mid-size", price: "$42/day", transmission: "Automatic", seats: 5, rating: 4.3, free_cancel: false },
    { company: "Budget", logo: "🚌", car: "Nissan Altima", category: "Mid-size", price: "$38/day", transmission: "Automatic", seats: 5, rating: 4.2, free_cancel: false },
    { company: "National", logo: "🚐", car: "Mercedes C-Class", category: "Luxury", price: "$125/day", transmission: "Automatic", seats: 5, rating: 4.8, free_cancel: true },
  ],
  LHR: [
    { company: "Europcar", logo: "🚗", car: "Volkswagen Golf", category: "Compact", price: "£38/day", transmission: "Manual", seats: 5, rating: 4.4, free_cancel: true },
    { company: "Hertz", logo: "🚙", car: "BMW 3 Series", category: "Luxury", price: "£95/day", transmission: "Automatic", seats: 5, rating: 4.7, free_cancel: true },
    { company: "Sixt", logo: "🚕", car: "Ford Focus", category: "Compact", price: "£32/day", transmission: "Manual", seats: 5, rating: 4.3, free_cancel: false },
  ],
  LOS: [
    { company: "Avis Nigeria", logo: "🚗", car: "Toyota Corolla", category: "Compact", price: "₦35,000/day", transmission: "Automatic", seats: 5, rating: 4.3, free_cancel: true },
    { company: "Hertz Nigeria", logo: "🚙", car: "Toyota Fortuner", category: "SUV", price: "₦65,000/day", transmission: "Automatic", seats: 7, rating: 4.5, free_cancel: true },
    { company: "Drive Nigeria", logo: "🚕", car: "Honda Accord", category: "Mid-size", price: "₦28,000/day", transmission: "Automatic", seats: 5, rating: 4.1, free_cancel: false },
  ],
};

// =========================================================
// HOTELS & CAR RENTAL
// =========================================================
function HotelsCars({ segments }) {
  const [activeTab, setActiveTab] = useState("hotels");
  const destCode = segments?.[segments.length - 1]?.to?.code || "JFK";
  const hotels = HOTELS_DATA[destCode] || HOTELS_DATA["JFK"];
  const cars = CARS_DATA[destCode] || CARS_DATA["JFK"];
  const destCity = segments?.[segments.length - 1]?.to?.city || "destination";

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "#94a3b8", marginBottom: 12, paddingLeft: 4 }}>
        HOTELS & CAR RENTALS AT DESTINATION
      </div>
      <div style={{ background: "white", border: "1px solid #e2e8f4", borderRadius: 16, overflow: "hidden" }}>

        {/* Header */}
        <div style={{ background: "linear-gradient(135deg,#0047AB,#003580)", padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", letterSpacing: "0.15em", marginBottom: 3 }}>ARRIVING AT</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "white" }}>{destCity} · {destCode}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {["hotels", "cars"].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: "7px 18px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, background: activeTab === tab ? "white" : "rgba(255,255,255,0.15)", color: activeTab === tab ? "#0047AB" : "white", transition: "all 0.2s" }}>
                {tab === "hotels" ? "🏨 Hotels" : "🚗 Car Rentals"}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: "20px 24px" }}>
          {activeTab === "hotels" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {hotels.map((hotel, i) => (
                <div key={i} style={{ border: "1px solid #e2e8f4", borderRadius: 14, padding: "16px 20px", display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
                  <div style={{ fontSize: 40, flexShrink: 0 }}>{hotel.image}</div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{hotel.name}</div>
                        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{hotel.address}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                          {"⭐".repeat(hotel.stars)}
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", marginLeft: 4 }}>{hotel.rating}</span>
                          <span style={{ fontSize: 11, color: "#94a3b8" }}>({hotel.reviews.toLocaleString()} reviews)</span>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: "#0047AB" }}>{hotel.price}</div>
                        <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>per night</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                      <div style={{ fontSize: 11, color: "#64748b", display: "flex", alignItems: "center", gap: 4 }}>
                        📍 {hotel.distance}
                      </div>
                      {hotel.amenities.map(a => (
                        <span key={a} style={{ fontSize: 10, background: "#f0f4ff", color: "#0047AB", padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>{a}</span>
                      ))}
                    </div>
                    <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                      <button style={{ padding: "8px 20px", background: "linear-gradient(135deg,#0047AB,#003580)", color: "white", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Book Now</button>
                      <button style={{ padding: "8px 16px", background: "#f8faff", color: "#0047AB", border: "1px solid #0047AB", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>View Details</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
              {cars.map((car, i) => (
                <div key={i} style={{ border: "1px solid #e2e8f4", borderRadius: 14, padding: "16px", position: "relative", overflow: "hidden" }}>
                  {car.free_cancel && (
                    <div style={{ position: "absolute", top: 12, right: 12, background: "#f0fdf4", color: "#16a34a", fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 20, letterSpacing: "0.06em" }}>FREE CANCEL</div>
                  )}
                  <div style={{ fontSize: 36, marginBottom: 10 }}>{car.logo}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{car.car}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{car.company} · {car.category}</div>
                  <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
                    {[["👥", car.seats + " seats"], ["⚙️", car.transmission], ["⭐", car.rating]].map(([icon, val]) => (
                      <div key={val} style={{ fontSize: 11, color: "#64748b", display: "flex", alignItems: "center", gap: 3 }}>
                        <span>{icon}</span><span>{val}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#CC0000" }}>{car.price}</div>
                    <button style={{ padding: "8px 18px", background: "linear-gradient(135deg,#CC0000,#a80000)", color: "white", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Reserve</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =========================================================
// MAIN APP
// =========================================================
export default function App() {
  // Simple client-side routing
  const path = window.location.pathname;
  const urlParams = new URLSearchParams(window.location.search);
  if (path === "/checkin") return <CheckIn />;

  const [darkMode, setDarkMode] = useState(false);
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [bpLoading, setBpLoading] = useState(false);

  const dm = {
    bg: darkMode ? "#0f172a" : "linear-gradient(160deg,#f0f4ff,#e8eef8 50%,#f5f0ff)",
    card: darkMode ? "#1e293b" : "white",
    cardBorder: darkMode ? "#334155" : "#e2e8f4",
    text: darkMode ? "#f1f5f9" : "#0f172a",
    subtext: darkMode ? "#94a3b8" : "#64748b",
    muted: darkMode ? "#475569" : "#94a3b8",
    input: darkMode ? "#1e293b" : "#fafcff",
    inputBorder: darkMode ? "#334155" : "#e2e8f4",
    section: darkMode ? "#0f172a" : "#f8faff",
    divider: darkMode ? "#334155" : "#e2e8f4",
  };

  const firstSeg = result?.segments?.[0];
const lastSeg = result?.segments?.[result.segments.length - 1];

const qrData = result ? [
  "AMERICAN AIRLINES",
  "PNR: " + result.pnr,
  "PAX: " + (result.passenger?.title || "") + " " + (result.passenger?.name || "Passenger"),
  "FLIGHT: " + (firstSeg?.flight || "N/A"),
  "ROUTE: " + (firstSeg?.from?.code || "N/A") + "-" + (lastSeg?.to?.code || "N/A"),
  "DATE: " + (firstSeg?.departs || "N/A"),
  "SEAT: " + (firstSeg?.seat || "N/A") + " | CLASS: " + (firstSeg?.class || "N/A"),
  "TICKET: " + (result.ticket_number || "N/A"),
  "STATUS: " + (result.status || "N/A"),
].join("\n") : "";

  const normalizeBooking = (booking) => ({
  ...booking,
  passenger: booking.passenger || {
    title: "",
    name: "Passenger",
    frequent_flyer: "N/A",
    passport: "N/A",
  },
  segments: Array.isArray(booking.segments) ? booking.segments : [],
  baggage: booking.baggage || {
    personal: "N/A",
    carry_on: "N/A",
    checked: "N/A",
  },
  fare: booking.fare || {
    cabin_class: "N/A",
    basis: "N/A",
    valid_before: "N/A",
    valid_after: "N/A",
  },
  alerts: booking.alerts || [],
  baggage_stages: booking.baggage_stages || [],
  meal_options: booking.meal_options || [],
  assistance_options: booking.assistance_options || [],
  visa_entries: booking.visa_entries || [],
  seat_config: booking.seat_config || null,
});

  const handleSearch = async () => {
    if (!input.trim()) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch(API_URL + "/api/booking/" + input.trim().toUpperCase());
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking not found.");
      // Compute departure date from first segment for countdown
      const firstSeg = data.segments?.[0];
      if (firstSeg) {
        const depStr = firstSeg.departs + " " + firstSeg.dep_time;
        const parsed = new Date(depStr);
        if (!isNaN(parsed)) {
          DEPART_DATE.setTime(parsed.getTime());
          CHECKIN_OPEN.setTime(parsed.getTime() - 24 * 60 * 60 * 1000);
        }
      }
      setResult(normalizeBooking(data));
    } catch (err) {
      setError('No booking found for PNR "' + input.trim().toUpperCase() + '". ' + (err.message !== "Booking not found." ? "" : ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: dm.bg, fontFamily: "'DM Sans',sans-serif", transition: "background 0.3s", overflowX: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        @media print { body{background:white!important;} .no-print{display:none!important;} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px);} to{opacity:1;transform:translateY(0);} }
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.5;} }
        * { transition: background-color 0.25s, border-color 0.25s, color 0.15s; }
        ` + (darkMode ? `
        body { background: #0f172a !important; }
        ` : '') + `
      `}</style>

      <header className="no-print" style={{ background: "#CC0000", padding: "0 32px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 20px rgba(204,0,0,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <svg width="38" height="24" viewBox="0 0 44 28" fill="none"><path d="M4 24L12 4h4l4 12 4-12h4l8 20h-4l-6-15-4 10h-4l-4-10-6 15H4z" fill="white" /></svg>
          <div>
            <div style={{ color: "white", fontSize: 18, fontWeight: 700, lineHeight: 1 }}>American Airlines</div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 9, letterSpacing: "0.15em", marginTop: 1 }}>BOOKING MANAGEMENT</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>AAdvantage® Portal</div>
          <button onClick={() => setDarkMode(d => !d)} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 20, padding: "5px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "white", fontSize: 12, fontWeight: 600, transition: "all 0.2s" }}>
            {darkMode ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>
      </header>
      <div className="no-print" style={{ height: 4, background: "linear-gradient(90deg,#0047AB,#003580,#CC0000)" }} />

      <div style={{ maxWidth: 840, margin: "0 auto", padding: "40px 16px 60px", overflowX: "hidden" }}>

        <div className="no-print" style={{ background: dm.card, borderRadius: 20, padding: "36px 40px", boxShadow: "0 4px 40px rgba(0,71,171,0.08)", marginBottom: 32, border: "1px solid " + dm.cardBorder, transition: "background 0.3s" }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: dm.text, marginBottom: 6 }}>Manage Your Booking</h1>
          <p style={{ color: "#64748b", fontSize: 14, marginBottom: 28 }}>Enter your PNR to retrieve your itinerary and flight details.</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <input value={input} onChange={e => setInput(e.target.value.toUpperCase())} onKeyDown={e => e.key === "Enter" && handleSearch()} placeholder="e.g. AA7X4K2" maxLength={10}
              style={{ flex: 1, minWidth: 200, padding: "14px 20px", border: "1.5px solid " + dm.inputBorder, borderRadius: 12, fontSize: 16, fontWeight: 600, letterSpacing: "0.12em", color: dm.text, outline: "none", background: dm.input, fontFamily: "inherit", transition: "background 0.3s" }} />
            <button onClick={handleSearch} disabled={loading} style={{ padding: "14px 32px", background: loading ? "#94a3b8" : "linear-gradient(135deg,#CC0000,#a80000)", color: "white", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", boxShadow: loading ? "none" : "0 4px 16px rgba(204,0,0,0.3)" }}>
              {loading ? "SEARCHING..." : "FIND BOOKING"}
            </button>
          </div>
          {error && <div style={{ marginTop: 16, padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, color: "#dc2626", fontSize: 13 }}>⚠ {error}</div>}
        </div>

        {result && (
          <div style={{ animation: "fadeUp 0.5s ease forwards" }}>

            <div className="no-print" style={{ display: "flex", gap: 12, marginBottom: 20, justifyContent: "flex-end" }}>
              <button onClick={() => window.print()} style={{ padding: "10px 22px", background: darkMode ? "#1e293b" : "white", color: "#0047AB", border: "1.5px solid #0047AB", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>🖨 Print</button>
              <button onClick={() => {
                const subject = encodeURIComponent("American Airlines Itinerary – PNR " + result.pnr);
                const body = encodeURIComponent([
                  "AMERICAN AIRLINES — TRAVEL ITINERARY",
                  "=".repeat(40),
                  "",
                  "Passenger: " + result.passenger.title + " " + result.passenger.name,
                  "PNR / Booking Reference: " + result.pnr,
                  "Ticket Number: " + result.ticket_number,
                  "Booking Date: " + result.booking_date,
                  "Status: " + result.status,
                  "",
                  "— FLIGHT SEGMENTS —",
                  "",
                  "SEGMENT 1",
                  "Flight: " + result.segments[0].flight + " (" + result.segments[0].aircraft + ")",
                  "From: " + result.segments[0].from.city + " (" + result.segments[0].from.code + ") " + result.segments[0].from.terminal + " Gate " + result.segments[0].from.gate,
                  "To: " + result.segments[0].to.city + " (" + result.segments[0].to.code + ") " + result.segments[0].to.terminal + " Gate " + result.segments[0].to.gate,
                  "Departs: " + result.segments[0].departs + " at " + result.segments[0].dep_time,
                  "Arrives: " + result.segments[0].arrives + " at " + result.segments[0].arr_time,
                  "Duration: " + result.segments[0].duration,
                  "Seat: " + result.segments[0].seat + " | Class: " + result.segments[0].class,
                  "Meal: " + result.segments[0].meal,
                  "",
                  "LAYOVER: London Heathrow — 3h 40m connection",
                  "",
                  "SEGMENT 2",
                  "Flight: " + result.segments[1].flight + " (" + result.segments[1].aircraft + ")",
                  "From: " + result.segments[1].from.city + " (" + result.segments[1].from.code + ") " + result.segments[1].from.terminal + " Gate " + result.segments[1].from.gate,
                  "To: " + result.segments[1].to.city + " (" + result.segments[1].to.code + ") " + result.segments[1].to.terminal + " Gate " + result.segments[1].to.gate,
                  "Departs: " + result.segments[1].departs + " at " + result.segments[1].dep_time,
                  "Arrives: " + result.segments[1].arrives + " at " + result.segments[1].arr_time,
                  "Duration: " + result.segments[1].duration,
                  "Seat: " + result.segments[1].seat + " | Class: " + result.segments[1].class,
                  "Meal: " + result.segments[1].meal,
                  "",
                  "— BAGGAGE —",
                  "Personal Item: " + result.baggage.personal,
                  "Carry-On: " + result.baggage.carry_on,
                  "Checked Bag: " + result.baggage.checked,
                  "",
                  "=".repeat(40),
                  "This itinerary was generated via American Airlines Booking Management.",
                  "americanairlines.com | AAdvantage Service: 1-800-882-8880",
                ].join("\n"));
                window.location.href = "mailto:?subject=" + subject + "&body=" + body;
              }} style={{ padding: "10px 22px", background: "linear-gradient(135deg,#16a34a,#15803d)", color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 14px rgba(22,163,74,0.3)" }}>
                ✉ Email Itinerary
              </button>
              <button onClick={async () => { setPdfLoading(true); await downloadPDF(result); setPdfLoading(false); }} disabled={pdfLoading} style={{ padding: "10px 22px", background: pdfLoading ? "#94a3b8" : "linear-gradient(135deg,#0047AB,#003580)", color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: pdfLoading ? "not-allowed" : "pointer", boxShadow: "0 4px 14px rgba(0,71,171,0.3)" }}>
                {pdfLoading ? "⏳ Generating..." : "⬇ Download PDF"}
              </button>
            </div>

            <StatusBanner alerts={result.alerts} />
            <CountdownTimer
              departDate={DEPART_DATE}
              checkinOpen={CHECKIN_OPEN}
              flightLabel={result.segments?.[0] ? result.segments[0].flight + " · " + result.segments[0].from.code + " → " + result.segments[result.segments.length-1].to.code : ""}
            />

            {/* PNR Header */}
            <div style={{ background: "linear-gradient(135deg,#0047AB,#003580)", borderRadius: 20, padding: "28px 32px", marginBottom: 20, color: "white", boxShadow: "0 8px 32px rgba(0,71,171,0.25)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 11, letterSpacing: "0.15em", opacity: 0.7, marginBottom: 4 }}>BOOKING REFERENCE</div>
                  <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: "0.15em" }}>{result.pnr}</div>
                  <div style={{ marginTop: 8, opacity: 0.8, fontSize: 13 }}>Booked {result.booking_date} · Ticket {result.ticket_number}</div>
                </div>
                <div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", padding: "8px 18px", borderRadius: 30 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 6px #4ade80", animation: "pulse 2s infinite" }} />
                    <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.08em" }}>{result.status}</span>
                  </div>
                  <div style={{ marginTop: 10, fontSize: 12, opacity: 0.5, textAlign: "right" }}>LOS → LHR → JFK</div>
                </div>
              </div>
            </div>

            {/* Passenger */}
            <div style={{ background: dm.card, borderRadius: 16, padding: "24px 32px", marginBottom: 20, border: "1px solid " + dm.cardBorder, display: "flex", gap: 32, flexWrap: "wrap", alignItems: "center", transition: "background 0.3s" }}>
              <div>
                <div style={{ fontSize: 10, letterSpacing: "0.12em", color: "#94a3b8", marginBottom: 4 }}>PASSENGER</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a" }}>{result.passenger.title} {result.passenger.name}</div>
              </div>
              <div style={{ width: 1, height: 40, background: "#e2e8f4" }} />
              {[["AAdvantage #", result.passenger.frequent_flyer], ["Passport", result.passenger.passport], ["Booked", result.booking_date]].map(([l, v]) => (
                <div key={l}><div style={{ fontSize: 10, letterSpacing: "0.12em", color: "#94a3b8", marginBottom: 4 }}>{l.toUpperCase()}</div><div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{v}</div></div>
              ))}
            </div>

            {/* ✅ E-TICKET RECEIPT */}
            <ETicketReceipt booking={result} />

            {/* ✅ LOCAL CLOCKS */}
            <LocalClocks />

            {/* Weather */}
            <WeatherCards />

            {/* Map */}
            <div style={{ marginBottom: 20 }}><RouteMap segments={result.segments} /></div>

            {/* Segments */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "#94a3b8", marginBottom: 12, paddingLeft: 4 }}>FLIGHT ITINERARY</div>
              {result.segments.map((seg, i) => <FlightSegment key={i} seg={seg} index={i} />)}
            </div>

            {/* ✅ VISA REQUIREMENTS — only for international flights */}
            {result.visa_entries?.length > 0 && <VisaRequirements entries={result.visa_entries} />}

            {/* ✅ SPECIAL ASSISTANCE */}
            <SpecialAssistance options={result.assistance_options} />

            {/* ✅ BAGGAGE TRACKER */}
            {result.baggage_stages?.length > 0 && <BaggageTracker stages={result.baggage_stages} />}

            {/* ✅ MEAL SELECTOR */}
            <MealSelector options={result.meal_options} segments={result.segments} />

            {/* ✅ SEAT MAP */}
            <SeatMap config={result.seat_config} />

            {/* ✅ LAYOVER CARD — only when multiple segments */}
            {result.segments && result.segments.length > 1 && result.layover && <LayoverCard layover={result.layover} />}

            {/* Baggage */}
            <div style={{ background: dm.card, borderRadius: 16, padding: "24px 32px", marginBottom: 20, border: "1px solid " + dm.cardBorder, transition: "background 0.3s" }}>
              <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "#94a3b8", marginBottom: 16 }}>BAGGAGE ALLOWANCE</div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {[["✈","Personal Item",result.baggage.personal],["🧳","Carry-On",result.baggage.carry_on],["📦","Checked Bag",result.baggage.checked]].map(([icon,l,v]) => (
                  <div key={l} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", background: "#f8faff", borderRadius: 12, border: "1px solid #e8eef8" }}>
                    <span style={{ fontSize: 20 }}>{icon}</span>
                    <div><div style={{ fontSize: 10, color: "#94a3b8" }}>{l.toUpperCase()}</div><div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginTop: 1 }}>{v}</div></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hotels & Cars */}
            {result.segments?.length > 0 && <HotelsCars segments={result.segments} />}

            {/* Boarding Pass */}
            <div style={{ background: dm.card, borderRadius: 16, overflow: "hidden", border: "1px solid " + dm.cardBorder, transition: "background 0.3s" }}>
              <div style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)", padding: "20px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, letterSpacing: "0.15em" }}>BOARDING PASS</div>
                  <div style={{ color: "white", fontSize: 18, fontWeight: 700, marginTop: 2 }}>LOS → JFK</div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 4 }}>via London Heathrow</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, letterSpacing: "0.15em" }}>FLIGHTS</div>
                  <div style={{ color: "white", fontSize: 16, fontWeight: 700, marginTop: 2 }}>AA 0081 / AA 0100</div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 4 }}>Jun 14 – Jun 15, 2026</div>
                </div>
              </div>
              <div style={{ borderTop: "2px dashed #e2e8f4", padding: "24px 32px" }}>
                <div style={{ display: "flex", gap: 28, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <div style={{ background: "#f8faff", padding: 10, borderRadius: 14, border: "1px solid #e2e8f4" }}>
                      <QRCode value={qrData} size={130} />
                    </div>
                    <div style={{ fontSize: 10, color: "#94a3b8", letterSpacing: "0.1em" }}>SCAN TO VERIFY</div>
                  </div>
                  <div style={{ width: 1, height: 160, background: "#e2e8f4", flexShrink: 0 }} />
                  <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 32px" }}>
                    {[["PASSENGER",result.passenger.title+" "+result.passenger.name],["PNR",result.pnr],["SEAT",result.segments[0].seat],["CLASS",result.segments[0].class],["FROM",result.segments[0].from.code+" — "+result.segments[0].from.city],["TO",(result.segments[result.segments.length - 1]?.to?.code || "N/A") + " — " + (result.segments[result.segments.length - 1]?.to?.city || "N/A")],["DEPARTURE",result.segments[0].dep_time+" · "+result.segments[0].departs],["ARRIVAL",(result.segments[result.segments.length - 1]?.arr_time || "N/A") + " · " + (result.segments[result.segments.length - 1]?.arrives || "N/A")]].map(([l,v]) => (
                      <div key={l}><div style={{ fontSize: 9, color: "#94a3b8", letterSpacing: "0.12em", marginBottom: 2 }}>{l}</div><div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{v}</div></div>
                    ))}
                  </div>
                </div>
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px dashed #e2e8f4", textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "#94a3b8", letterSpacing: "0.25em" }}>{result.ticket_number}</div>
                  <div style={{ fontSize: 10, color: "#cbd5e1", marginTop: 4 }}>American Airlines · AAdvantage® · americanairlines.com</div>
                </div>
                <div style={{ marginTop: 16, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                  <button onClick={async () => { setBpLoading(true); try { await downloadBoardingPass(result); } catch(e) { console.error(e); } finally { setBpLoading(false); } }} disabled={bpLoading} style={{ padding: "10px 22px", background: bpLoading ? "#94a3b8" : "linear-gradient(135deg,#CC0000,#a80000)", color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: bpLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 7, boxShadow: bpLoading ? "none" : "0 4px 14px rgba(204,0,0,0.3)" }}>
                    {bpLoading ? "⏳ Generating..." : "🎫 Download Boarding Pass"}
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

        {!result && !error && !loading && (
          <div style={{ textAlign: "center", padding: "40px 0", color: dm.muted }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✈</div>
            <div style={{ fontSize: 14 }}>Enter your PNR above to view your booking</div>
            <div style={{ fontSize: 12, marginTop: 6, opacity: 0.6 }}>Demo PNR: <strong>AA7X4K2</strong></div>
          </div>
        )}
      </div>
    </div>
  );
}
