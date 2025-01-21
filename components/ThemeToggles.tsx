"use client";

import { Moon, Sun, Laptop } from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-lg bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
          theme === "light" ? "bg-yellow-300 hover:text-yellow-300" : ""
        }`}
      >
        {theme === "dark" && <Moon className="h-5 w-5" />}
        {theme === "light" && <Sun className="h-5 w-5" />}
        {theme === "system" && <Laptop className="h-5 w-5" />}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700">
          {[
            { theme: "light", Icon: Sun, label: "Light" },
            { theme: "dark", Icon: Moon, label: "Dark" },
            { theme: "system", Icon: Laptop, label: "System" },
          ].map(({ theme, Icon, label }) => (
            <button
              key={theme}
              onClick={() => {
                setTheme(theme);
                setIsOpen(false);
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Icon className="h-4 w-4 mr-2" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
