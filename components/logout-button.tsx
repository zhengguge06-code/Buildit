"use client"

import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button, type ButtonProps } from "@/components/ui/button"

type LogoutButtonProps = ButtonProps & {
  redirectTo?: string
}

export function LogoutButton({
  children = "退出登录",
  redirectTo = "/auth/login",
  ...props
}: LogoutButtonProps) {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push(redirectTo)
    router.refresh()
  }

  return (
    <Button onClick={handleLogout} type="button" {...props}>
      {children}
    </Button>
  )
}
