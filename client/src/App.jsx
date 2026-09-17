import "./App.css";
import "./dark-mode.css";

import AppRoutes from "./routes/AppRoutes";

import ThemeToggle from "./components/ThemeToggle";
import ScrollToTop from "./components/ScrollToTop";

function App() {
  return (
    <>
      <AppRoutes />

      <ThemeToggle />

      <ScrollToTop />
    </>
  );
}

export default App;