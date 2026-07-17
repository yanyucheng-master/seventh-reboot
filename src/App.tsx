import GameApp from './game/GameApp';
import { NativeStartupSequence } from './game/components/NativeStartupSequence';
import { I18nProvider } from './i18n';

export default function App() {
  return (
    <I18nProvider>
      <GameApp />
      <NativeStartupSequence />
    </I18nProvider>
  );
}
