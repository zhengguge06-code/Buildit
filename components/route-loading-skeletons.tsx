import type React from "react"
import { Skeleton } from "@/components/ui/skeleton"

function LoadingShell({
  children,
  className,
}: {
  children: React.ReactNode
  className: string
}) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className={className}>
      <span className="sr-only">Loading</span>
      {children}
    </div>
  )
}

function ToolCardSkeleton() {
  return (
    <div className="rounded-lg border border-border/70 bg-card/70 p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="h-12 w-12 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1 space-y-3">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>
      </div>
      <div className="mt-5 flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  )
}

export function ChannelPageSkeleton() {
  return (
    <LoadingShell className="container mx-auto px-4 py-10 md:py-14">
      <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-end">
        <div className="space-y-5">
          <Skeleton className="h-4 w-24 rounded-full" />
          <Skeleton className="h-12 w-full max-w-xl" />
          <Skeleton className="h-12 w-4/5 max-w-lg" />
          <div className="max-w-2xl space-y-3 pt-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
        <Skeleton className="hidden aspect-[16/10] rounded-lg md:block" />
      </div>

      <div className="mt-10 flex gap-3 overflow-hidden">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-9 w-28 shrink-0 rounded-full" />
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }, (_, index) => (
          <ToolCardSkeleton key={index} />
        ))}
      </div>
    </LoadingShell>
  )
}

export function ToolDetailSkeleton() {
  return (
    <LoadingShell className="container mx-auto px-4 py-10 md:py-14">
      <Skeleton className="h-8 w-32 rounded-full" />
      <Skeleton className="mx-auto mt-6 aspect-[16/9] w-full max-w-5xl rounded-lg" />

      <div className="mx-auto mt-10 max-w-3xl">
        <div className="flex items-center gap-5">
          <Skeleton className="h-20 w-20 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-11/12" />
          <Skeleton className="h-5 w-2/3" />
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="rounded-lg border border-border/70 bg-card/70 p-4">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="mt-3 h-6 w-24" />
            </div>
          ))}
        </div>

        <div className="mt-12 space-y-4 border-t border-border/60 pt-10">
          <Skeleton className="h-7 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>
    </LoadingShell>
  )
}

export function UserContentSkeleton() {
  return (
    <LoadingShell className="max-w-3xl">
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-start">
        <Skeleton className="h-20 w-20 shrink-0 rounded-full" />
        <div className="w-full space-y-4">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
      </div>

      <div className="space-y-4 border-t border-border/60 pt-6">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="flex items-center justify-between gap-6">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-40" />
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-lg border border-border/70 bg-card/70 p-4">
        <Skeleton className="h-5 w-32" />
        <div className="mt-5 space-y-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </LoadingShell>
  )
}

export function SubmitFormSkeleton() {
  return (
    <LoadingShell className="max-w-3xl">
      <div className="mb-8 rounded-lg border border-border/70 bg-card/70 p-6">
        <Skeleton className="h-3 w-24 rounded-full" />
        <Skeleton className="mt-4 h-8 w-44" />
        <Skeleton className="mt-4 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-3/4" />
      </div>

      <div className="space-y-7">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
        <div className="space-y-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-10 w-28 rounded-md" />
      </div>
    </LoadingShell>
  )
}

export function AuthPageSkeleton() {
  return (
    <LoadingShell className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-lg border border-border/70 bg-card/70 p-6">
        <Skeleton className="mx-auto h-8 w-40" />
        <Skeleton className="mx-auto mt-3 h-4 w-64 max-w-full" />
        <div className="mt-8 space-y-5">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </div>
    </LoadingShell>
  )
}
