import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface FilterMenuProps {
  label: string
  options: Record<string, string>
  selected: string[]
  onChange: (val: string[]) => void
}

export function FilterMenu({ label, options, selected, onChange }: FilterMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 border-dashed text-xs">
          {label}
          {selected.length > 0 && (
            <span className="ml-1 rounded bg-secondary px-1.5">{selected.length}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[200px]">
        {Object.entries(options).map(([k, v]) => (
          <DropdownMenuCheckboxItem
            key={k}
            checked={selected.includes(k)}
            onCheckedChange={(c) => {
              if (c) onChange([...selected, k])
              else onChange(selected.filter((s) => s !== k))
            }}
          >
            {v}
          </DropdownMenuCheckboxItem>
        ))}
        {selected.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onChange([])} className="justify-center text-xs">
              Limpar
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
