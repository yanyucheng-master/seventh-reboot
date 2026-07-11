import GameApp from './game/GameApp';
import { I18nProvider } from './i18n';

export default function App() {
  return (
    <I18nProvider>
      <GameApp />
    </I18nProvider>
  );
}
