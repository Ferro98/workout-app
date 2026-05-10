import { IconMessageCircle } from '@tabler/icons-react'

interface Props {
    note: string
}

export function CoachNoteBanner({ note }: Props) {
    return (
        <div className="flex gap-3 bg-violet-50 dark:bg-violet-950/40 rounded-xl px-4 py-3 mb-4">
            <IconMessageCircle
                size={16}
                className="text-violet-700 dark:text-violet-300 shrink-0 mt-0.5"
                aria-hidden
            />
            <div>
                <p className="text-[11px] font-medium text-violet-700 dark:text-violet-300 mb-0.5">
                    Nota del coach
                </p>
                <p className="text-[13px] text-violet-800 dark:text-violet-200 leading-snug">
                    {note}
                </p>
            </div>
        </div>
    )
}