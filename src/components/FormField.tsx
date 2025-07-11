"use client"

import * as React from "react"
import { Control, Controller, FieldPath, FieldValues } from "react-hook-form"
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface FormFieldProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  label: string
  placeholder?: string
  description?: string
  type?: string
  className?: string
  disabled?: boolean
  required?: boolean
}

const FormField = <T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  description,
  type = "text",
}: FormFieldProps<T>) => {
  return (
    <Controller
    control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn("space-y-2")}>
          <FormLabel className={cn( "after:content-['*'] after:ml-0.5 after:text-destructive")}>
            {label}
          </FormLabel>
          <FormControl>
            <Input
              type={type}
              placeholder={placeholder}
              {...field}
            />
          </FormControl>
          {description && (
            <FormDescription>
              {description}
            </FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export { FormField }
export type { FormFieldProps }
