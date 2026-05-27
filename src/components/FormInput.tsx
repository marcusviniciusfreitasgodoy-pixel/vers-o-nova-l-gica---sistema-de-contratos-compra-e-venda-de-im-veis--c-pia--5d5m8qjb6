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
import { ChangeEvent } from 'react'
import { cn } from '@/lib/utils'

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
                value={field.value || ''}
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
