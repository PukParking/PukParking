import { useEffect, useState } from "react";

import "./ThemeToggle.css";

function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme =
      localStorage.getItem("pukparking-theme");

    if (savedTheme) {
      return savedTheme === "dark";
    }

    return window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
  });

  useEffect(() => {
    document.body.classList.toggle(
      "dark-mode",
      darkMode
    );

    localStorage.setItem(
      "pukparking-theme",
      darkMode ? "dark" : "light"
    );
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode((currentMode) => !currentMode);
  };

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={toggleTheme}
      aria-label={
        darkMode
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
      title={
        darkMode
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
    >
      <span className="theme-toggle-icon">
        {darkMode ? "☀" : "☾"}
      </span>

      <span className="theme-tooltip">
        {darkMode
          ? "Light mode"
          : "Dark mode"}
      </span>
    </button>
  );
}

export default ThemeToggle;