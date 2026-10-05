import { useMemo, useState } from 'react';
import { GameView } from './components/GameView';
import { stopAudio } from './components/Player';
import { useHostGame } from './host/useHostGame';
import { GuestRoom, JoinForm } from './screens/Guest';
import { Home } from './screens/Home';
import { Setup } from './screens/Setup';

type Screen =
  | { name: 'home' }
  | { name: 'setup' }
  | { name: 'game' }
  | { name: 'join'; code?: string }
  | { name: 'guest'; code: string; playerName: string };

function initialScreen(): Screen {
  const code = new URLSearchParams(location.search).get('join');
  if (code) {
    history.replaceState(null, '', location.pathname);
    return { name: 'join', code };
  }
  return { name: 'home' };
}

export function App() {
  const host = useHostGame();
  const [screen, setScreen] = useState<Screen>(initialScreen);

  const extraMembers = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const p of host.room.players) if (p.teamId) (map[p.teamId] ??= []).push(p.name);
    return map;
  }, [host.room.players]);

  const resumable = host.game && host.game.phase !== 'finished';

  return (
    <main className="app">
      {screen.name === 'home' && (
        <Home
          onCreate={() => setScreen({ name: 'setup' })}
          onJoin={() => setScreen({ name: 'join' })}
          onResume={resumable ? () => setScreen({ name: 'game' }) : undefined}
        />
      )}
      {screen.name === 'setup' && (
        <Setup
          host={host}
          onBack={() => setScreen({ name: 'home' })}
          onStart={() => {
            host.startGame();
            setScreen({ name: 'game' });
          }}
        />
      )}
      {screen.name === 'game' && host.game && (
        <GameView
          game={host.game}
          myTeamId={null}
          isHost
          dispatch={host.dispatch}
          extraMembers={extraMembers}
          onRematch={host.rematch}
          onExit={() => {
            stopAudio();
            host.endGame();
            setScreen({ name: 'setup' });
          }}
        />
      )}
      {screen.name === 'join' && (
        <JoinForm
          initialCode={screen.code}
          onBack={() => setScreen({ name: 'home' })}
          onJoin={(code, playerName) => setScreen({ name: 'guest', code, playerName })}
        />
      )}
      {screen.name === 'guest' && (
        <GuestRoom code={screen.code} name={screen.playerName} onLeave={() => setScreen({ name: 'home' })} />
      )}
    </main>
  );
}
