import { useForm, type UseFormReturn, type UseFormProps } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { z } from "zod"

export function useFormValidation<T extends Record<string, unknown>>(
  schema: { parse: (data: unknown) => T },
  options?: Omit<UseFormProps<T>, "resolver">
): UseFormReturn<T> {
  return useForm({
    resolver: zodResolver(schema as any) as any,
    ...options,
  }) as UseFormReturn<T>
}
