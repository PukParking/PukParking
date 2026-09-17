import { useEffect, useState } from "react";

import "./ScrollToTop.css";

function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 250);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!visible) {
    return null;
  }

  return (
    <button
      className="scroll-to-top"
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      title="Back to top"
    >
      ↑
    </button>
  );
}

export default ScrollToTop;