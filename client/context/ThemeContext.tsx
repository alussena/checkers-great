import React, { createContext, useContext, useState, ReactNode } from 'react';

type Theme = 'default' | 'bw' | 'green' | 'pink';

interface ThemeContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType);
export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>('default');
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <div className={`theme-${theme}`}>{children}</div>
    </ThemeContext.Provider>
  );
};