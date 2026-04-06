import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://7048964b77b715c46288eb43fddb4129@o4511175376437248.ingest.us.sentry.io/4511175379517440",
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === "production",
  tracesSampleRate: 0.1,
});
// Test de Sentry — borrar después de verificar
setTimeout(() => {
  throw new Error("Test Sentry Luderis");
}, 3000);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);
