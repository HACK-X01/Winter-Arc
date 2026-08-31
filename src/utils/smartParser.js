// Natural language parser for quick-add / voice / text input.
// Offline, regex-based, Hindi/Hinglish + English support.
// Returns structured actions the app can execute directly.

const TIME_RE = /\b(\d{1,2})\s*:\s*(\d{2})\s*(am|pm)?\b/i
const REL_TIME_RE = /\b(in|after)\s+(\d+)\s*(min|mins|minute|minutes|hr|hrs|hour|hours)\b/i
const AMOUNT_RE = /\b(\d+(?:\.\d+)?)\s*(ml|l|litres?|liters?|glasses?|glass|cups?|cup)\b/i
const CALORIE_RE = /\b(\d+)\s*(cal|kcal|calories?)\b/i
const DURATION_RE = /\b(\d+)\s*(min|mins|minute|minutes|hr|hrs|hour|hours)\b/i
const WEIGHT_RE = /\b(\d+(?:\.\d+)?)\s*(kg|lb|lbs|pounds?)\b/i

const WATER = /(water|paani|pani|drink|pee|peena|hydrate|pyaas)/i
const MEAL = /(meal|food|khana|eat|khaaya|kha|breakfast|lunch|dinner|snack|bhojan)/i
const EXER = /(workout|exercise|gym|run|running|walk|walking|yoga|stretch|strength|cardio|weights|lift|swim)/i
const WEIGH = /(weight|weigh|wazan|vazan|scale|taranj)/i
const REMIND = /(remind|reminder|alarm|yaad|notify|notification)/i

const MEAL_CATEGORIES = [
  { cat: 'Breakfast', re: /(breakfast|pre-workout|pre workout|post-workout|post workout|subah|morning)/i },
  { cat: 'Lunch', re: /(lunch|dopehar|afternoon|mid-meal|mid meal)/i },
  { cat: 'Snacks', re: /(snack|nasta)/i },
  { cat: 'Dinner', re: /(dinner|raat|night|evening|khana)/i },
]

const EXERCISE_TYPES = [
  { type: 'Gym', re: /(gym|weights|lift|strength|chest|triceps|back|biceps|leg|shoulder)/i },
  { type: 'Run', re: /(run|running|jog|jogging|cardio|hiit)/i },
  { type: 'Walk', re: /(walk|walking|steps)/i },
  { type: 'Yoga', re: /(yoga|stretch|stretching|mobility)/i },
  { type: 'Home Workout', re: /(home workout|bodyweight|calisthenics|pushup|push-up|pullup)/i },
  { type: 'Sports', re: /(sports|cricket|football|badminton)/i },
]

function detectIntent(lower) {
  if (REMIND.test(lower)) return 'reminder'
  if (WEIGH.test(lower)) return 'weight'
  if (WATER.test(lower)) return 'water'
  if (EXER.test(lower)) return 'exercise'
  if (MEAL.test(lower)) return 'meal'
  return 'unknown'
}

function parseTime(text, ref = new Date()) {
  const m = text.match(TIME_RE)
  if (m) {
    let h = Number(m[1]); const mi = Number(m[2]); const ampm = (m[3] || '').toLowerCase()
    if (ampm === 'pm' && h < 12) h += 12
    if (ampm === 'am' && h === 12) h = 0
    const d = new Date(ref); d.setHours(h, mi, 0, 0)
    return d
  }
  const rel = text.match(REL_TIME_RE)
  if (rel) {
    const val = Number(rel[2]); const unit = rel[3].toLowerCase()
    const mins = unit.startsWith('hr') ? val * 60 : val
    return new Date(ref.getTime() + mins * 60000)
  }
  return null
}

function parseAmountMl(text) {
  const m = text.match(AMOUNT_RE)
  if (!m) return null
  const val = Number(m[1]); const u = m[2].toLowerCase()
  if (u.startsWith('l') && u !== 'lb') return Math.round(val * 1000)
  if (u.startsWith('glass')) return Math.round(val * 250)
  if (u.startsWith('cup')) return Math.round(val * 200)
  return Math.round(val)
}

function parseCalories(text) {
  const m = text.match(CALORIE_RE)
  return m ? Number(m[1]) : null
}

function parseDurationMin(text) {
  const m = text.match(DURATION_RE)
  if (!m) return null
  const val = Number(m[1]); const u = m[2].toLowerCase()
  return u.startsWith('hr') ? val * 60 : val
}

function parseWeight(text) {
  const m = text.match(WEIGHT_RE)
  if (!m) return null
  const val = Number(m[1]); const u = m[2].toLowerCase()
  return { value: val, unit: u.startsWith('lb') ? 'lb' : 'kg' }
}

function detectMealCategory(lower) {
  for (const { cat, re } of MEAL_CATEGORIES) if (re.test(lower)) return cat
  const h = new Date().getHours()
  if (h < 11) return 'Breakfast'
  if (h < 17) return 'Lunch'
  return 'Dinner'
}

function detectExerciseType(lower) {
  for (const { type, re } of EXERCISE_TYPES) if (re.test(lower)) return type
  return 'Gym'
}

// Returns one of:
// { action:'logWater', amountMl, time? }
// { action:'logMeal', category, name, calories?, time? }
// { action:'logExercise', type, durationMin, notes, time? }
// { action:'logWeight', weight, unit }
// { action:'createReminder', name, time? }
// { action:'unknown', error }
export function parseNaturalLanguage(text) {
  const lower = text.toLowerCase()
  const intent = detectIntent(lower)
  const when = parseTime(lower)

  switch (intent) {
    case 'water': {
      const amountMl = parseAmountMl(lower) || 250
      return { action: 'logWater', amountMl, time: when ? toHHMM(when) : undefined }
    }
    case 'meal': {
      const category = detectMealCategory(lower)
      const calories = parseCalories(lower)
      const name = lower
        .replace(/(add|log|ate|had|khaya|khaaya|kha liya)\s+/i, '')
        .replace(/\b(at|around|approx)\s+.*$/i, '')
        .replace(/\b\d+\s*cal(?:ories)?\b/gi, '')
        .trim() || 'Meal'
      return { action: 'logMeal', category, name, calories, time: when ? toHHMM(when) : undefined }
    }
    case 'exercise': {
      const type = detectExerciseType(lower)
      const durationMin = parseDurationMin(lower) || null
      const notes = lower
        .replace(/(workout|exercise|gym|run|walk|yoga)\s*\d*\s*(min|mins|minutes|hr|hrs|hour|hours)?/gi, '')
        .replace(/\b(at|around|approx)\s+.*$/i, '')
        .trim()
      return { action: 'logExercise', type, durationMin, notes, time: when ? toHHMM(when) : undefined }
    }
    case 'weight': {
      const w = parseWeight(lower)
      if (!w) return { action: 'unknown', error: `Weight parse nahi hua. Try: "weight 72.5 kg"` }
      return { action: 'logWeight', weight: w.value, unit: w.unit }
    }
    case 'reminder': {
      let name = lower.replace(/^(remind me (to|about)|reminder:?|yaad dilao|yaad rakho)\s+/i, '')
      name = name.replace(/\b(to|that)\b/i, ' ').replace(/\s+/g, ' ').trim()
      return { action: 'createReminder', name, time: when ? toHHMM(when) : undefined }
    }
    default:
      return {
        action: 'unknown',
        error: 'Samajh nahi aaya. Try: "500ml water", "lunch 400 cal", "gym 45 min", "weight 70kg"',
      }
  }
}

function toHHMM(d) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export const EXAMPLES = [
  'drank 500ml water',
  'paani piya 300 ml',
  'add water at 10am',
  'had lunch 450 calories',
  'khana khaya 400 cal',
  'breakfast 300 cal at 8am',
  'workout 45 mins',
  'gym 1 hour at 6pm',
  'ran 30 mins',
  'yoga 20 mins',
  'weight 72.5 kg',
  'weigh in 160 lbs',
  'remind me to drink water at 3pm',
]