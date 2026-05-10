export type Role = 'client' | 'coach'

export type ExerciseType = 'weight' | 'bodyweight' | 'timed' | 'timed_weight'

export type DiffStatus = 'new' | 'modified' | 'removed' | 'unchanged'

export interface DiffItem {
  field: string
  label: string
  prev: string | number
  curr: string | number
}

export interface HistoryEntry {
  date: string
  detail: string
}

export interface Exercise {
  id: number
  name: string
  category: 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core'
  type: ExerciseType
}

// RPE target per singola serie (impostato dal coach)
export interface TargetSet {
  setIndex: number           // 0-based
  rpe: number                // RPE target for this series
  reps?: number              // override default reps for this set
  duration?: number          // override default duration for this set (seconds)
  restSeconds?: number       // optional rest override after this set
}

export interface ProgramExercise {
  id: number
  exerciseId: number
  name: string
  type: ExerciseType
  sets: number
  reps: number | null        // null per esercizi timed
  duration: number | null    // secondi, null per esercizi a reps
  targetSets: TargetSet[]    // RPE per singola serie
  restSeconds: number
  notes: string | null       // nota del coach sull'esercizio
  diff: DiffStatus
  diffItems: DiffItem[]
  lastWeight: string | null
  history: HistoryEntry[]
}

// Un giorno di allenamento dentro una scheda
export interface ProgramDay {
  id: number
  dayIndex: number           // 0-based
  name: string               // es. "Giorno A"
  focus: string              // es. "Petto / Tricipiti"
  exercises: ProgramExercise[]
  coachNote: string | null
}

export interface Program {
  id: number
  name: string               // es. "Scheda Settimana 1"
  clientId: number
  createdAt: string
  isActive: boolean
  coachNote: string | null   // nota generale sull'intera scheda
  days: ProgramDay[]
}

// --- Workout (sessione in corso) ---

export interface WorkoutSetState {
  completed: boolean
  actualReps: string         // stringa per input libero
  actualWeight: string       // solo numero es. "82.5"
  actualRir: string          // RIR percepito dal cliente
  note: string
}

export interface WorkoutExerciseState {
  sets: WorkoutSetState[]
  note: string
}

export interface WorkoutSession {
  id: number
  programId: number
  programDayId: number
  programName: string
  dayName: string
  date: string
  durationSeconds: number
  exercises: {
    programExerciseId: number
    sets: WorkoutSetState[]
    note: string
  }[]
  generalNote: string
}

export interface Client {
  id: number
  name: string
  initials: string
  colorBg: string
  colorText: string
  activeProgramName: string | null
  lastSessionDate: string | null
  isActive: boolean
}