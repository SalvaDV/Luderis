import ReactGA from "react-ga4";

const GA_ID = "G-8736B9HZGL";

export const initGA = () => {
  ReactGA.initialize(GA_ID);
};

export const trackPage = (pageName) => {
  ReactGA.send({ hitType: "pageview", page: `/${pageName}`, title: pageName });
};

export const trackEvent = (category, action, label) => {
  ReactGA.event({ category, action, label });
};
