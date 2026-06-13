import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { initCapacitor } from './capacitor';
import { storyNodeMap } from './game/story';
import { applyMobileStoryPatches } from './game/storyPatches';

applyMobileStoryPatches(storyNodeMap);
void initCapacitor();
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
