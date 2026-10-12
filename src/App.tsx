import { LanguageProvider } from './context/LanguageContext';
import { ReactionsProvider } from './context/ReactionsContext';
import { LaunchLoader } from './components/LaunchLoader';
import { Home } from './pages/Home';

function App() {
  return (
    <LanguageProvider>
      <ReactionsProvider>
        <Home />
        <LaunchLoader />
      </ReactionsProvider>
    </LanguageProvider>
  );
}

export default App;
