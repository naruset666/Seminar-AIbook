import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AudioProvider } from '../../audio/AudioProvider';
import DeskScene from '../../components/reader/DeskScene';
import ReadingBoard from '../../components/reader/ReadingBoard';
import { ReaderProvider } from '../../store/ReaderContext';
import './ReadingRoomPage.css';

const PANEL_KEY = 'soundscape.panelOpen';

function readPanelOpen(): boolean {
  try {
    return localStorage.getItem(PANEL_KEY) !== 'false';
  } catch {
    return true;
  }
}

// AudioProvider sits above the board so the soundscape keeps playing while tabs
// switch, files open/close or uploads run. The speaker on the desk opens/closes the
// sound panel on the board.
export default function ReadingRoomPage() {
  const [panelOpen, setPanelOpen] = useState(readPanelOpen);
  const location = useLocation();
  const navigate = useNavigate();
  // A document picked on the home page ("อ่านต่อจากที่ค้างไว้").
  const [openDocId] = useState(() => (location.state as { openDocId?: number } | null)?.openDocId);

  // Forget the request so a page refresh does not re-open it over the user's tabs.
  useEffect(() => {
    if (openDocId !== undefined) navigate(location.pathname, { replace: true, state: null });
  }, []);

  const togglePanel = (open: boolean) => {
    setPanelOpen(open);
    try {
      localStorage.setItem(PANEL_KEY, String(open));
    } catch {
      /* storage unavailable */
    }
  };

  return (
    <ReaderProvider openDocId={openDocId}>
      <AudioProvider>
        <main className="reading-room">
          <div className="reading-board-area">
            <ReadingBoard panelOpen={panelOpen} onTogglePanel={togglePanel} />
          </div>
          <DeskScene panelOpen={panelOpen} onSpeakerClick={() => togglePanel(!panelOpen)} />
        </main>
      </AudioProvider>
    </ReaderProvider>
  );
}
