import { useTheme } from '../context/ThemeContext';

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <select
      value={theme}
      onChange={(e) => setTheme(e.target.value as any)}
      className="border rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 dark:text-white"
    >
      <option value="default">Классическая</option>
      <option value="bw">Чёрно-белая</option>
      <option value="green">Зелёная</option>
      <option value="pink">Розовая</option>
    </select>
  );
}