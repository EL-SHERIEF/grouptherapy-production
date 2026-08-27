"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-[80] bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogContentInner ref={ref} className={className} {...props}>
      {children}
    </DialogContentInner>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogContentInner = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, onOpenAutoFocus, ...props }, ref) => {
  const isMobile = useIsMobile()
  const closeRef = React.useRef<HTMLButtonElement | null>(null)
  const contentRef = React.useRef<HTMLDivElement | null>(null)
  const composedRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      contentRef.current = node
      if (typeof ref === "function") ref(node as any)
      else if (ref && typeof ref === "object") (ref as any).current = node
    },
    [ref]
  )

  const rafRef = React.useRef<number | null>(null)
  const yRef = React.useRef(0)
  const upPullRef = React.useRef(0)
  const velocityRef = React.useRef(0)
  const lastYRef = React.useRef(0)
  const lastTRef = React.useRef(0)
  const draggingRef = React.useRef(false)
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [disableCloseAnimation, setDisableCloseAnimation] = React.useState(false)

  const applyY = React.useCallback((nextY: number) => {
    const el = contentRef.current
    if (!el) return

    if (!isMobile) {
      el.style.transform = ""
      return
    }
    yRef.current = nextY
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      const target = yRef.current
      el.style.transform = `translate3d(0, ${target}px, 0)`
    })
  }, [isMobile])

  const resetSheet = React.useCallback(() => {
    setIsExpanded(false)
    setDisableCloseAnimation(false)
    upPullRef.current = 0

    if (!isMobile) {
      const el = contentRef.current
      if (el) {
        el.style.transform = ""
        el.style.transition = ""
      }
      return
    }

    applyY(0)
  }, [applyY, isMobile])

  const animateTo = React.useCallback(
    (targetY: number, onDone?: () => void) => {
      const el = contentRef.current
      if (!el) {
        onDone?.()
        return
      }

      if (!isMobile) {
        onDone?.()
        return
      }

      const startY = yRef.current
      const delta = targetY - startY
      const duration = 220
      const startT = performance.now()

      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

      const tick = (now: number) => {
        const t = Math.min(1, (now - startT) / duration)
        const eased = easeOutCubic(t)
        const next = startY + delta * eased
        el.style.transform = `translate3d(0, ${next}px, 0)`
        yRef.current = next
        if (t < 1) requestAnimationFrame(tick)
        else onDone?.()
      }

      requestAnimationFrame(tick)
    },
    [isMobile]
  )

  const onHandlePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!isMobile) return
      const el = contentRef.current
      if (!el) return

      draggingRef.current = true
      ;(event.currentTarget as HTMLDivElement).setPointerCapture(event.pointerId)

      lastYRef.current = event.clientY
      lastTRef.current = performance.now()
      velocityRef.current = 0
      upPullRef.current = 0

      el.style.transition = "none"
    },
    [isMobile]
  )

  const onHandlePointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current || !isMobile) return
      event.preventDefault()

      const now = performance.now()
      const dy = event.clientY - lastYRef.current
      const dt = Math.max(1, now - lastTRef.current)
      const v = dy / dt

      // low-pass to stabilize
      velocityRef.current = velocityRef.current * 0.7 + v * 0.3
      lastYRef.current = event.clientY
      lastTRef.current = now

      if (dy < 0 && yRef.current <= 0) {
        upPullRef.current = Math.max(-140, upPullRef.current + dy)
        applyY(0)
        return
      }

      upPullRef.current = 0
      const next = Math.max(0, yRef.current + dy)
      applyY(next)
    },
    [applyY, isMobile]
  )

  const onHandlePointerUp = React.useCallback(() => {
    if (!draggingRef.current || !isMobile) return
    draggingRef.current = false

    const offsetY = yRef.current
    const upPull = upPullRef.current
    const velocityY = velocityRef.current * 1000

    const shouldDismiss = offsetY > 120 || velocityY > 900
    const shouldExpand = !isExpanded && (upPull < -80 || velocityY < -700)
    const shouldCollapse = isExpanded && offsetY > 80

    if (shouldDismiss) {
      setDisableCloseAnimation(true)
      const target = Math.max(window.innerHeight, 800)
      animateTo(target, () => closeRef.current?.click())
      return
    }

    if (shouldExpand) setIsExpanded(true)
    if (shouldCollapse) setIsExpanded(false)
    animateTo(0)
  }, [animateTo, isExpanded, isMobile])

  return (
    <DialogPrimitive.Content
      asChild
      onOpenAutoFocus={(event) => {
        resetSheet()
        onOpenAutoFocus?.(event)
      }}
      {...props}
    >
      <div
        ref={composedRef}
        className={cn(
          "fixed inset-x-0 bottom-0 z-[90] grid w-full translate-x-0 translate-y-0 gap-4 border bg-background p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-bottom-2 data-[state=open]:slide-in-from-bottom-2 rounded-t-2xl overflow-y-auto",
          disableCloseAnimation ? "data-[state=closed]:animate-none" : "",
          isExpanded ? "max-h-[95dvh]" : "max-h-[80dvh]",
          "sm:left-[50%] sm:right-auto sm:top-[50%] sm:bottom-auto sm:w-[calc(100vw-2rem)] sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg sm:p-6 sm:pb-6 sm:max-h-[90vh] sm:data-[state=closed]:slide-out-to-left-1/2 sm:data-[state=closed]:slide-out-to-top-[48%] sm:data-[state=open]:slide-in-from-left-1/2 sm:data-[state=open]:slide-in-from-top-[48%]",
          className
        )}
        style={
          isMobile
            ? { willChange: "transform", transform: "translate3d(0, 0px, 0)" }
            : undefined
        }
      >
        <div
          className={cn(
            "mx-auto mt-1 h-1.5 w-12 rounded-full bg-muted sm:hidden",
            isMobile ? "cursor-grab active:cursor-grabbing touch-none" : ""
          )}
          onPointerDown={onHandlePointerDown}
          onPointerMove={onHandlePointerMove}
          onPointerUp={onHandlePointerUp}
          onPointerCancel={onHandlePointerUp}
        />
        {children}
        <DialogPrimitive.Close
          ref={closeRef}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-10"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </div>
    </DialogPrimitive.Content>
  )
})
DialogContentInner.displayName = "DialogContentInner"

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
