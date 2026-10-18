"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "cn"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ModeToggle() {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          "relative size-8 cursor-pointer rounded-full border border-[#cdd6ec] dark:border-border/80 bg-[#fbfcff]/90 dark:bg-[#111827]/90 hover:bg-white dark:hover:bg-[#161f30] hover:border-[#2340c4]/40 text-[#141c45] dark:text-foreground shadow-xs transition-all duration-200"
        )}
      >
        <Sun className="h-[1.1rem] w-[1.1rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90 text-[#141c45]" />
        <Moon className="absolute h-[1.1rem] w-[1.1rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0 text-foreground" />
        <span className="sr-only">Toggle theme</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-36 rounded-xl border border-[#cdd6ec] dark:border-border/80 bg-[#fbfcff]/98 dark:bg-[#0b0f19]/98 shadow-xl backdrop-blur-md p-1 text-xs font-semibold"
      >
        <DropdownMenuItem onClick={() => setTheme("light")} className="rounded-lg text-xs font-semibold cursor-pointer py-1.5 px-2.5">
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className="rounded-lg text-xs font-semibold cursor-pointer py-1.5 px-2.5">
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")} className="rounded-lg text-xs font-semibold cursor-pointer py-1.5 px-2.5">
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
