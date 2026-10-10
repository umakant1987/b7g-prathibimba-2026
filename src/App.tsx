import { LanguageProvider } from './context/LanguageContext';
import { ReactionsProvider } from './context/ReactionsContext';
import { Home } from './pages/Home';

function App() {
  return (
    <LanguageProvider>
      <ReactionsProvider>
        <Home />
      </ReactionsProvider>
    </LanguageProvider>
  );
}

export default App;
