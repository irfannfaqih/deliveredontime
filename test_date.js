
const toLocalYMD = (d) => {
  if (!d) return "";
  const s = String(d);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // Handle ISO string by taking the date part directly (CURRENT IMPLEMENTATION)
  if (s.includes('T')) return s.split('T')[0];
  try {
    const dt = new Date(d);
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  } catch { return s.slice(0,10); }
};

const toLocalYMD_Fixed = (d) => {
  if (!d) return "";
  const s = String(d);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // REMOVED THE ISO SPLIT HACK
  try {
    const dt = new Date(d);
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  } catch { return s.slice(0,10); }
};

// Simulation: 2025-12-17 00:00:00 WIB is 2025-12-16 17:00:00 UTC
const dateISO = "2025-12-16T17:00:00.000Z"; 

console.log("Input:", dateISO);
console.log("Current toLocalYMD:", toLocalYMD(dateISO));
console.log("Fixed toLocalYMD:  ", toLocalYMD_Fixed(dateISO));

const dateString = "2025-12-17";
console.log("\nInput:", dateString);
console.log("Current toLocalYMD:", toLocalYMD(dateString));
console.log("Fixed toLocalYMD:  ", toLocalYMD_Fixed(dateString));
