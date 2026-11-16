import { LanguageProvider } from './context/LanguageContext';
import { ReactionsProvider } from './context/ReactionsContext';
import { LaunchLoader } from './components/LaunchLoader';
import { Feedback } from './pages/Feedback';
import { Home } from './pages/Home';

/** Two pages: the site (/) and the feedback form (/feedback). */
const isFeedback = window.location.pathname.replace(/\/+$/, '') === '/feedback';

function App() {
  return (
    <LanguageProvider>
      <ReactionsProvider>
        {isFeedback ? (
          <Feedback />
        ) : (
          <>
            <Home />
            <LaunchLoader />
          </>
        )}
      </ReactionsProvider>
    </LanguageProvider>
  );
}

export default App;
