import { useMemo, useState } from 'react'
import {
    IconChartBar,
    IconPencil,
    IconPlus,
    IconSearch,
    IconTrash
} from '@tabler/icons-react'
import { EXERCISES_DB } from '../../data/mock'
import { TopBar } from '../../components/layout/TopBar'

export type ExerciseType =
    | 'weight'
    | 'bodyweight'
    | 'timed'
    | 'timed_weight'

export interface Exercise {
    id: number
    name: string
    category:
    | 'chest'
    | 'back'
    | 'legs'
    | 'shoulders'
    | 'arms'
    | 'core'
    type: ExerciseType
}

const TYPES: ExerciseType[] = [
    'weight',
    'bodyweight',
    'timed',
    'timed_weight'
]

const CATEGORIES: Exercise['category'][] = [
    'chest',
    'back',
    'legs',
    'shoulders',
    'arms',
    'core'
]

const TYPE_LABELS: Record<ExerciseType, string> = {
    weight: 'Weight',
    bodyweight: 'Bodyweight',
    timed: 'Timed',
    timed_weight: 'Timed + Weight'
}

const CATEGORY_LABELS: Record<Exercise['category'], string> = {
    chest: 'Chest',
    back: 'Back',
    legs: 'Legs',
    shoulders: 'Shoulders',
    arms: 'Arms',
    core: 'Core'
}

function ExerciseRow({
    exercise,
    onSave,
    onDelete,
    onHistory
}: {
    exercise: Exercise
    onSave: (exercise: Exercise) => void
    onDelete: () => void
    onHistory: () => void
}) {
    const [editing, setEditing] = useState(false)

    const [draft, setDraft] = useState<Exercise>(exercise)

    const handleSave = () => {
        if (!draft.name.trim()) return

        onSave({
            ...draft,
            name: draft.name.trim()
        })

        setEditing(false)
    }

    const handleDelete = () => {
        const confirmed = window.confirm(
            `Eliminare "${exercise.name}"?`
        )

        if (confirmed) {
            onDelete()
        }
    }

    if (editing) {
        return (
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-4 space-y-3">
                <input
                    value={draft.name}
                    onChange={e =>
                        setDraft(prev => ({
                            ...prev,
                            name: e.target.value
                        }))
                    }
                    placeholder="Nome esercizio"
                    className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700
                    bg-white dark:bg-neutral-900
                    px-3 py-2 text-[13px]
                    text-neutral-900 dark:text-neutral-100
                    outline-none"
                />

                <div className="grid grid-cols-2 gap-2">
                    <select
                        value={draft.category}
                        onChange={e =>
                            setDraft(prev => ({
                                ...prev,
                                category: e.target.value as Exercise['category']
                            }))
                        }
                        className="rounded-lg border border-neutral-200 dark:border-neutral-700
                        bg-white dark:bg-neutral-900
                        px-3 py-2 text-[13px]
                        text-neutral-900 dark:text-neutral-100
                        outline-none"
                    >
                        {CATEGORIES.map(category => (
                            <option
                                key={category}
                                value={category}
                                className="bg-white dark:bg-neutral-900"
                            >
                                {CATEGORY_LABELS[category]}
                            </option>
                        ))}
                    </select>

                    <select
                        value={draft.type}
                        onChange={e =>
                            setDraft(prev => ({
                                ...prev,
                                type: e.target.value as ExerciseType
                            }))
                        }
                        className="rounded-lg border border-neutral-200 dark:border-neutral-700
                        bg-white dark:bg-neutral-900
                        px-3 py-2 text-[13px]
                        text-neutral-900 dark:text-neutral-100
                        outline-none"
                    >
                        {TYPES.map(type => (
                            <option
                                key={type}
                                value={type}
                                className="bg-white dark:bg-neutral-900"
                            >
                                {TYPE_LABELS[type]}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleSave}
                        className="px-3 py-1.5 rounded-lg text-[12px] font-medium
                        bg-neutral-900 text-white
                        dark:bg-neutral-100 dark:text-neutral-900"
                    >
                        Salva
                    </button>

                    <button
                        onClick={() => setEditing(false)}
                        className="px-3 py-1.5 rounded-lg text-[12px]
                        text-neutral-700 dark:text-neutral-300
                        border border-neutral-200 dark:border-neutral-700
                        hover:bg-neutral-100 dark:hover:bg-neutral-800
                        transition-colors"
                    >
                        Annulla
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <h3 className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                        {exercise.name}
                    </h3>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    <button
                        onClick={onHistory}
                        className="p-1.5 rounded-md text-neutral-400 hover:text-blue-500 transition-colors"
                    >
                        <IconChartBar size={15} />
                    </button>

                    <button
                        onClick={() => setEditing(true)}
                        className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-700
                        dark:hover:text-neutral-200 transition-colors"
                    >
                        <IconPencil size={15} />
                    </button>

                    <button
                        onClick={handleDelete}
                        className="p-1.5 rounded-md text-neutral-400 hover:text-red-500 transition-colors"
                    >
                        <IconTrash size={15} />
                    </button>
                </div>
            </div>

            <div className="flex items-center justify-between mt-3">
                <span
                    className='inline-flex items-center rounded-full border border-neutral-300
                    bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-700
                    dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200'>
                    {CATEGORY_LABELS[exercise.category]}
                </span>

                <span
                    className='inline-flex items-center rounded-full bg-neutral-900
                    px-2.5 py-1 text-[11px] font-medium text-white
                    dark:bg-neutral-100 dark:text-neutral-900'>
                    {TYPE_LABELS[exercise.type]}
                </span>
            </div>
        </div>
    )
}

export default function EserciziPage() {
    const [exercises, setExercises] = useState<Exercise[]>(EXERCISES_DB)

    const [search, setSearch] = useState('')

    const [categoryFilter, setCategoryFilter] = useState<
        Exercise['category'] | 'all'
    >('all')

    const [typeFilter, setTypeFilter] = useState<
        ExerciseType | 'all'
    >('all')

    const filteredExercises = useMemo(() => {
        return exercises.filter(exercise => {
            const matchesSearch =
                exercise.name
                    .toLowerCase()
                    .includes(search.toLowerCase())

            const matchesCategory =
                categoryFilter === 'all' ||
                exercise.category === categoryFilter

            const matchesType =
                typeFilter === 'all' ||
                exercise.type === typeFilter

            return (
                matchesSearch &&
                matchesCategory &&
                matchesType
            )
        })
    }, [
        exercises,
        search,
        categoryFilter,
        typeFilter
    ])

    const handleAddExercise = () => {
        const newExercise: Exercise = {
            id: Date.now(),
            name: 'Nuovo esercizio',
            category: 'chest',
            type: 'weight'
        }

        setExercises(prev => [
            newExercise,
            ...prev
        ])
    }

    return (
        <div className="flex flex-col h-full bg-neutral-50 dark:bg-neutral-950">
            <TopBar
                title="Esercizi"
                right={
                    <button
                        onClick={handleAddExercise}
                        className="flex items-center gap-1.5 rounded-lg
                            bg-neutral-900 dark:bg-neutral-100
                            text-white dark:text-neutral-900
                            px-3 py-1.5 text-[12px] font-medium
                            shadow-sm active:scale-95 transition"
                    >
                        <IconPlus size={14} />
                        Nuovo
                    </button>
                }
            />

            <div className="sticky top-0 z-10 bg-neutral-50 dark:bg-neutral-950 px-4 pb-3 space-y-2 mt-2">
                <div className="relative">
                    <IconSearch
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                    />

                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Cerca esercizio..."
                        className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800
                        bg-white dark:bg-neutral-900
                        pl-9 pr-3 py-2 text-[13px]
                        text-neutral-900 dark:text-neutral-100
                        placeholder:text-neutral-400
                        outline-none"
                    />
                </div>

                <div className="flex gap-2">
                    <select
                        value={categoryFilter}
                        onChange={e =>
                            setCategoryFilter(
                                e.target.value as Exercise['category'] | 'all'
                            )
                        }
                        className="flex-1 rounded-lg border border-neutral-200 dark:border-neutral-800
                        bg-white dark:bg-neutral-900
                        px-3 py-2 text-[12px]
                        text-neutral-900 dark:text-neutral-100"
                    >
                        <option value="all">
                            Tutte le categorie
                        </option>

                        {CATEGORIES.map(category => (
                            <option
                                key={category}
                                value={category}
                            >
                                {CATEGORY_LABELS[category]}
                            </option>
                        ))}
                    </select>

                    <select
                        value={typeFilter}
                        onChange={e =>
                            setTypeFilter(
                                e.target.value as ExerciseType | 'all'
                            )
                        }
                        className="flex-1 rounded-lg border border-neutral-200 dark:border-neutral-800
                        bg-white dark:bg-neutral-900
                        px-3 py-2 text-[12px]
                        text-neutral-900 dark:text-neutral-100"
                    >
                        <option value="all">
                            Tutti i tipi
                        </option>

                        {TYPES.map(type => (
                            <option
                                key={type}
                                value={type}
                            >
                                {TYPE_LABELS[type]}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
                {filteredExercises.map(exercise => (
                    <ExerciseRow
                        key={exercise.id}
                        exercise={exercise}
                        onSave={(updated) => {
                            setExercises(prev =>
                                prev.map(ex =>
                                    ex.id === updated.id
                                        ? updated
                                        : ex
                                )
                            )
                        }}
                        onDelete={() => {
                            setExercises(prev =>
                                prev.filter(ex => ex.id !== exercise.id)
                            )
                        }}
                        onHistory={() => {
                            console.log(
                                'Open history for:',
                                exercise.name
                            )
                        }}
                    />
                ))}
            </div>
        </div>
    )
}