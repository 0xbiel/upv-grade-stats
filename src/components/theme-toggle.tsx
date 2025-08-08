"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const current = (theme === "system" ? resolvedTheme : theme) ?? "light";

  const cycle = () => {
    if (current === "light") setTheme("black");
    else setTheme("light");
  };

  const label = current === "light" ? "Light" : "Black";
  const Icon = current === "light" ? Sun : Moon;

  return (
    <Button variant="outline" size="icon" aria-label={`Switch theme (${label})`} onClick={cycle} className="ml-2">
      <Icon className="h-4 w-4" />
    </Button>
  );
}
