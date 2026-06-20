import { useForm, type UseFormReturn, type UseFormProps } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

export function useFormValidation<T extends z.ZodType>(
  schema: T,
  options?: Omit<UseFormProps<z.output<T>>, "resolver">
): UseFormReturn<z.output<T>> {
  return useForm({
    resolver: zodResolver(schema),
    ...options,
  }) as UseFormReturn<z.output<T>>
}
