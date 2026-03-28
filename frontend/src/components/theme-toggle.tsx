'use client';

import { MoonIcon, SunIcon, MonitorIcon } from 'lucide-react';
import { useTheme } from '@/components/providers/theme-provider';
import { Button } from '@/components/ui/button';

export default function ThemeToggle() {
  const { theme, setTheme, effectiveTheme } = useTheme();

  const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
  const currentIndex = themes.indexOf(theme);
  const nextTheme = themes[(currentIndex + 1) % themes.length];

  const icons = {
    light: SunIcon,
    dark: MoonIcon,
    system: MonitorIcon,
  };

  const CurrentIcon = icons[theme];

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(nextTheme)}
      title={`Current: ${theme} - Click to change`}
    >
      <CurrentIcon data-icon="only" />
      <span className="sr-only">Toggle theme (current: {theme})</span>
    </Button>
  );
}
