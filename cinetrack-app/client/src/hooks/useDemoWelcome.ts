import { useState, useEffect } from "react";

const DEMO_WELCOME_SHOWN_KEY = "scenestack_demo_welcome_shown";

export const useDemoWelcome = (isDemo: boolean | undefined) => {
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (isDemo === true && !sessionStorage.getItem(DEMO_WELCOME_SHOWN_KEY)) {
      setShowWelcome(true);
    } else if (isDemo === false) {
      setShowWelcome(false);
    }
  }, [isDemo]);

  return {
    showWelcome,
    closeWelcome: () => setShowWelcome(false),
  };
};
