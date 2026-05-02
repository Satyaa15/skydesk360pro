import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({ theme: 'dark', toggleTheme: () => {}, isDark: true });

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('skydesk-theme') || 'dark'; } catch { return 'dark'; }
  });

  useEffect(() => {
    const html = document.documentElement;
    if (theme === 'light') html.classList.add('light-theme');
    else html.classList.remove('light-theme');
    try { localStorage.setItem('skydesk-theme', theme); } catch {}
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

const DARK = {
  bg: '#020204',
  bgAlt: 'rgba(0,0,0,0.3)',
  bgDeep: 'rgba(0,0,0,0.2)',
  bgCard: 'rgba(15,23,42,0.6)',
  bgCardSolid: '#0f172a',
  bgInput: 'rgba(255,255,255,0.03)',
  bgBrand: 'linear-gradient(145deg,#020204 0%,#0a0a14 50%,#060610 100%)',
  bgMarquee: 'rgba(0,0,0,0.4)',
  bgNav: 'rgba(2,2,4,0.94)',
  bgMobile: 'rgba(2,2,4,0.98)',
  text: '#e2e8f0',
  textMuted: '#64748b',
  textDim: '#475569',
  textSubtle: '#334155',
  textFaint: '#1e293b',
  border: 'rgba(255,255,255,0.07)',
  borderStrong: 'rgba(255,255,255,0.12)',
  borderSubtle: 'rgba(255,255,255,0.05)',
  borderMarquee: 'rgba(255,255,255,0.04)',
  inputBorder: 'rgba(255,255,255,0.08)',
  inputBorderFocus: 'rgba(0,242,254,0.4)',
  inputFocusShadow: '0 0 0 3px rgba(0,242,254,0.06)',
  navBorder: 'none',
  navShadow: '0 4px 40px rgba(0,0,0,0.5)',
};

const LIGHT = {
  bg: '#f1f5f9',
  bgAlt: 'rgba(226,232,240,0.5)',
  bgDeep: 'rgba(241,245,249,0.6)',
  bgCard: 'rgba(255,255,255,0.92)',
  bgCardSolid: '#ffffff',
  bgInput: 'rgba(255,255,255,0.9)',
  bgBrand: 'linear-gradient(145deg,#eef2ff 0%,#f8fafc 50%,#e8edf5 100%)',
  bgMarquee: 'rgba(226,232,240,0.6)',
  bgNav: 'rgba(248,250,252,0.97)',
  bgMobile: 'rgba(248,250,252,0.99)',
  text: '#0f172a',
  textMuted: '#475569',
  textDim: '#64748b',
  textSubtle: '#94a3b8',
  textFaint: '#cbd5e1',
  border: 'rgba(0,0,0,0.08)',
  borderStrong: 'rgba(0,0,0,0.14)',
  borderSubtle: 'rgba(0,0,0,0.05)',
  borderMarquee: 'rgba(0,0,0,0.07)',
  inputBorder: 'rgba(0,0,0,0.1)',
  inputBorderFocus: 'rgba(0,150,200,0.5)',
  inputFocusShadow: '0 0 0 3px rgba(0,242,254,0.1)',
  navBorder: '1px solid rgba(0,0,0,0.07)',
  navShadow: '0 4px 24px rgba(0,0,0,0.06)',
};

export function useColors() {
  const { isDark } = useTheme();
  return isDark ? DARK : LIGHT;
}
