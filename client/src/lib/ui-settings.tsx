import React, { createContext, useContext, useEffect, useState, PropsWithChildren } from 'react';

type UISettings = {
  theme: 'light' | 'dark' | 'system';
  compactMode: boolean;
  showAdvancedMetrics: boolean;
  setTheme: (t: 'light' | 'dark' | 'system') => void;
  toggleCompact: (v?: boolean) => void;
  toggleAdvanced: (v?: boolean) => void;
};

const defaultValues: UISettings = {
  theme: 'system',
  compactMode: false,
  showAdvancedMetrics: false,
  setTheme: () => {},
  toggleCompact: () => {},
  toggleAdvanced: () => {},
};

const UISettingsContext = createContext<UISettings>(defaultValues);

export function UISettingsProvider({ children }: PropsWithChildren) {
  const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('theme') as any) || 'system';
  });
  const [compactMode, setCompactMode] = useState<boolean>(() => {
    return localStorage.getItem('compactMode') === 'true';
  });
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState<boolean>(() => {
    return localStorage.getItem('showAdvancedMetrics') === 'true';
  });

  useEffect(() => {
    // apply theme to document
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    if (theme === 'dark') root.classList.add('dark');
    if (theme === 'light') root.classList.add('light');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    if (compactMode) {
      root.setAttribute('data-compact', 'true');
    } else {
      root.removeAttribute('data-compact');
    }
    localStorage.setItem('compactMode', compactMode ? 'true' : 'false');
  }, [compactMode]);

  useEffect(() => {
    localStorage.setItem('showAdvancedMetrics', showAdvancedMetrics ? 'true' : 'false');
  }, [showAdvancedMetrics]);

  const setTheme = (t: 'light' | 'dark' | 'system') => setThemeState(t);
  const toggleCompact = (v?: boolean) => setCompactMode(prev => typeof v === 'boolean' ? v : !prev);
  const toggleAdvanced = (v?: boolean) => setShowAdvancedMetrics(prev => typeof v === 'boolean' ? v : !prev);

  return (
    <UISettingsContext.Provider value={{ theme, compactMode, showAdvancedMetrics, setTheme, toggleCompact, toggleAdvanced }}>
      {children}
    </UISettingsContext.Provider>
  );
}

export function useUISettings() {
  return useContext(UISettingsContext);
}
