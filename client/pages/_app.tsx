import type { AppProps } from 'next/app';
import '../styles/globals.css';
import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Component {...pageProps} />
      </ThemeProvider>
    </AuthProvider>
  );
}