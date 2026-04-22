import React, { useEffect } from "react";

export default function LandingPage({ onEnter }) {
  useEffect(() => {
    window.location.replace('/landing/index.html');
  }, []);
  return null;
}
