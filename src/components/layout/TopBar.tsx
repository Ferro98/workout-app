interface Props {
    title: string
    subtitle?: string
    right?: React.ReactNode
}

export function TopBar({ title, subtitle, right }: Props) {
    return (
        <header className="px-4 pt-5 pb-3 bg-white dark:bg-neutral-950
                       border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h1 className="text-[18px] font-medium text-neutral-900 dark:text-neutral-100 leading-tight">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="text-[12px] text-neutral-400 mt-0.5">{subtitle}</p>
                    )}
                </div>
                {right && <div className="shrink-0">{right}</div>}
            </div>
        </header>
    )
}