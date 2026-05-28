import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useFormContext } from 'react-hook-form'
import { formatCurrency } from '@/lib/formatters'
import { ChangeEvent, useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Calendar as CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'

export function DatePickerInput({ name, defaultValue, value, onChange, className }: any) {
  const [date, setDate] = useState<Date | undefined>(
    value ? new Date(value) : defaultValue ? new Date(defaultValue) : undefined,
  )

  useEffect(() => {
    if (value) setDate(new Date(value))
  }, [value])

  const handleSelect = (d: Date | undefined) => {
    setDate(d)
    if (onChange) onChange(d)
  }

  return (
    <>
      <input type="hidden" name={name} value={date ? date.toISOString() : ''} />
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={'outline'}
            className={cn(
              'w-full justify-start text-left font-normal bg-white',
              !date && 'text-muted-foreground',
              className,
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, 'dd/MM/yyyy', { locale: ptBR }) : <span>Selecione uma data</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-white" align="start">
          <Calendar mode="single" selected={date} onSelect={handleSelect} initialFocus />
        </PopoverContent>
      </Popover>
    </>
  )
}

export function MaskedInput({
  maskType,
  value,
  defaultValue,
  onChange,
  name,
  className,
  ...props
}: {
  maskType: 'cpf' | 'cnpj' | 'phone' | 'cep' | 'cpf_cnpj'
  value?: string
  defaultValue?: string
  onChange?: (val: string) => void
  name?: string
  className?: string
  [key: string]: any
}) {
  const formatValue = (val: string) => {
    let v = val.replace(/\D/g, '')
    if (maskType === 'cpf') {
      v = v.replace(/(\d{3})(\d)/, '$1.$2')
      v = v.replace(/(\d{3})(\d)/, '$1.$2')
      v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    } else if (maskType === 'cnpj') {
      v = v.replace(/(\d{2})(\d)/, '$1.$2')
      v = v.replace(/(\d{3})(\d)/, '$1.$2')
      v = v.replace(/(\d{3})(\d)/, '$1/$2')
      v = v.replace(/(\d{4})(\d{1,2})$/, '$1-$2')
    } else if (maskType === 'cpf_cnpj') {
      if (v.length <= 11) {
        v = v.replace(/(\d{3})(\d)/, '$1.$2')
        v = v.replace(/(\d{3})(\d)/, '$1.$2')
        v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      } else {
        v = v.replace(/(\d{2})(\d)/, '$1.$2')
        v = v.replace(/(\d{3})(\d)/, '$1.$2')
        v = v.replace(/(\d{3})(\d)/, '$1/$2')
        v = v.replace(/(\d{4})(\d{1,2})$/, '$1-$2')
      }
    } else if (maskType === 'phone') {
      v = v.replace(/(\d{2})(\d)/, '($1) $2')
      v = v.replace(/(\d{4,5})(\d{4})$/, '$1-$2')
    } else if (maskType === 'cep') {
      v = v.replace(/(\d{5})(\d)/, '$1-$2')
    }
    return v
  }

  const [internalValue, setInternalValue] = useState(() => formatValue(value ?? defaultValue ?? ''))

  useEffect(() => {
    if (value !== undefined) setInternalValue(formatValue(value))
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatValue(e.target.value)
    setInternalValue(formatted)
    if (onChange) onChange(formatted)
  }

  const maxLength =
    maskType === 'cpf'
      ? 14
      : maskType === 'cnpj'
        ? 18
        : maskType === 'cep'
          ? 9
          : maskType === 'cpf_cnpj'
            ? 18
            : 15

  return (
    <Input
      {...props}
      name={name}
      value={internalValue}
      onChange={handleChange}
      maxLength={maxLength}
      className={className}
    />
  )
}

export function CurrencyInput({
  value,
  defaultValue,
  onChange,
  name,
  ...props
}: {
  value?: string | number
  defaultValue?: string | number
  onChange?: (val: string) => void
  name?: string
  [key: string]: any
}) {
  const [internalValue, setInternalValue] = useState(() => formatCurrency(value ?? defaultValue))

  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(formatCurrency(value))
    }
  }, [value])

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value)
    setInternalValue(formatted)
    if (onChange) {
      onChange(formatted)
    }
  }

  return <Input {...props} name={name} type="text" value={internalValue} onChange={handleChange} />
}

export function FormInput({
  name,
  label,
  placeholder,
  type = 'text',
  disabled,
  required,
}: {
  name: string
  label: string
  placeholder?: string
  type?: string
  disabled?: boolean
  required?: boolean
}) {
  const {
    control,
    formState: { errors },
  } = useFormContext()
  const error = errors[name]

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className={cn(error && 'text-red-500')}>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </FormLabel>
          <FormControl>
            <Input
              type={type}
              placeholder={placeholder}
              {...field}
              value={field.value || ''}
              disabled={disabled}
              className={cn(
                error && 'border-red-500 focus-visible:ring-red-500',
                disabled && 'opacity-70 bg-slate-100',
              )}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function FormCurrencyInput({
  name,
  label,
  placeholder = 'R$ 0,00',
  disabled,
  required,
}: {
  name: string
  label: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
}) {
  const {
    control,
    formState: { errors },
  } = useFormContext()
  const error = errors[name]

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
          const formatted = formatCurrency(e.target.value)
          field.onChange(formatted)
        }

        return (
          <FormItem>
            <FormLabel className={cn(error && 'text-red-500')}>
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </FormLabel>
            <FormControl>
              <Input
                {...field}
                value={
                  field.value !== undefined && field.value !== null && field.value !== ''
                    ? formatCurrency(field.value)
                    : ''
                }
                onChange={handleChange}
                placeholder={placeholder}
                disabled={disabled}
                className={cn(
                  error && 'border-red-500 focus-visible:ring-red-500',
                  disabled && 'opacity-70 bg-slate-100',
                )}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}

export function FormMaskedInput({
  name,
  label,
  placeholder,
  maskType,
  disabled,
  required,
}: {
  name: string
  label: string
  placeholder?: string
  maskType: 'cpf' | 'cnpj' | 'phone' | 'cep'
  disabled?: boolean
  required?: boolean
}) {
  const {
    control,
    formState: { errors },
  } = useFormContext()
  const error = errors[name]

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          let val = e.target.value.replace(/\D/g, '')
          if (maskType === 'cpf') {
            val = val.replace(/(\d{3})(\d)/, '$1.$2')
            val = val.replace(/(\d{3})(\d)/, '$1.$2')
            val = val.replace(/(\d{3})(\d{1,2})$/, '$1-$2')
          } else if (maskType === 'cnpj') {
            val = val.replace(/(\d{2})(\d)/, '$1.$2')
            val = val.replace(/(\d{3})(\d)/, '$1.$2')
            val = val.replace(/(\d{3})(\d)/, '$1/$2')
            val = val.replace(/(\d{4})(\d{1,2})$/, '$1-$2')
          } else if (maskType === 'phone') {
            val = val.replace(/(\d{2})(\d)/, '($1) $2')
            val = val.replace(/(\d{4,5})(\d{4})$/, '$1-$2')
          } else if (maskType === 'cep') {
            val = val.replace(/(\d{5})(\d)/, '$1-$2')
          }
          field.onChange(val)
        }
        return (
          <FormItem>
            <FormLabel className={cn(error && 'text-red-500')}>
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </FormLabel>
            <FormControl>
              <Input
                {...field}
                value={field.value || ''}
                onChange={handleChange}
                placeholder={placeholder}
                maxLength={
                  maskType === 'cpf' ? 14 : maskType === 'cnpj' ? 18 : maskType === 'cep' ? 9 : 15
                }
                disabled={disabled}
                className={cn(
                  error && 'border-red-500 focus-visible:ring-red-500',
                  disabled && 'opacity-70 bg-slate-100',
                )}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}

export function FormFileInput({
  name,
  label,
  accept,
  required,
}: {
  name: string
  label: string
  accept?: string
  required?: boolean
}) {
  const {
    control,
    formState: { errors },
  } = useFormContext()
  const error = errors[name]

  return (
    <FormField
      control={control}
      name={name}
      render={({ field: { value, onChange, ...field } }) => (
        <FormItem>
          <FormLabel className={cn(error && 'text-red-500')}>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </FormLabel>
          <FormControl>
            <Input
              type="file"
              accept={accept}
              onChange={(e) => {
                const file = e.target.files?.[0]
                onChange(file)
              }}
              {...field}
              value={undefined}
              className={cn(error && 'border-red-500 focus-visible:ring-red-500')}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function FormSelect({
  name,
  label,
  options,
  placeholder = 'Selecione...',
  disabled,
  required,
}: {
  name: string
  label: string
  options: { label: string; value: string }[]
  placeholder?: string
  disabled?: boolean
  required?: boolean
}) {
  const {
    control,
    formState: { errors },
  } = useFormContext()
  const error = errors[name]

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className={cn(error && 'text-red-500')}>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </FormLabel>
          <Select onValueChange={field.onChange} value={field.value} disabled={disabled}>
            <FormControl>
              <SelectTrigger
                className={cn(
                  error && 'border-red-500 focus-visible:ring-red-500',
                  disabled && 'opacity-70 bg-slate-100',
                )}
              >
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
