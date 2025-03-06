interface MiniDashboardProps {
  title: string
  items: {
    label: string
    value: number | string
  }[]
}

export function MiniDashboard({ title, items }: MiniDashboardProps) {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-xs">
      <div className="p-4">
        <h3 className="text-sm font-semibold leading-none tracking-tight">
          {title}
        </h3>
        <div className="mt-4 grid grid-cols-2 gap-4">
          {items.map((item) => (
            <div key={item.label} className="space-y-1">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-lg font-semibold">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}