# Temazos

Juego de fiesta musical inspirado en la mecánica de «línea del tiempo»: suena una canción, tu equipo decide en qué punto de su línea cronológica va y, si acierta, se queda la carta. Gana quien reúna primero las cartas objetivo.

PWA instalable, sin registro y sin backend propio. Funciona en móvil y portátil.

## Funcionalidades

- **Equipos o individual**: hasta 8 equipos, con nombre, color y jugadores.
- **Salas online**: el anfitrión abre una sala (código de 4 caracteres + QR). Cada equipo coloca y desafía desde su móvil; la música suena en el anfitrión (conectarlo al altavoz).
- **Personalización de la partida**: rango de años/décadas, estilos (16 géneros), países (30, con atajos: España, Hispano, Latinoamérica, Anglo, Europa), cartas para ganar, fichas iniciales, tiempo por turno, margen de años (modo fácil) y desafíos on/off.
- **Reglas completas**: fichas para saltar canción (1), desafiar (1) y comprar carta (3); ficha extra por acertar título y artista.
- **Mis canciones**: importa tu propia lista (`Título;Artista;Año;géneros;países`) y juega solo con ella o mezclada con el catálogo.
- **Robustez**: si el anfitrión recarga la página, la partida y la sala se recuperan con el mismo código; los móviles se reconectan solos.

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # motor de juego + validación del catálogo
npm run build    # build de producción en dist/
```

## Despliegue (GitHub Pages)

El workflow `.github/workflows/deploy.yml` publica en cada push a `main`. Hay que activarlo una vez en **Settings → Pages → Source: GitHub Actions**. La app queda en `https://<usuario>.github.io/<repo>/`. Se necesita HTTPS para instalar la PWA y para WebRTC.

## Arquitectura

| Pieza | Dónde | Notas |
| --- | --- | --- |
| Motor de reglas | `src/game/engine.ts` | Reducer puro, determinista y testeado. El anfitrión es la única fuente de verdad. |
| Catálogo | `src/data/catalog.ts` | 816 canciones curadas (1954–2025). Año = primera publicación de la versión que suena. |
| Audio | `src/audio/preview.ts` | Vistas previas de 30 s vía iTunes Search API (JSONP), con Deezer de respaldo. No se aloja audio. |
| Multijugador | `src/net/session.ts` | WebRTC P2P con PeerJS. Los invitados envían intenciones; el anfitrión valida permisos (`canPerform`) y difunde el estado, ocultando la carta en juego (`redactForGuests`). |
| Anfitrión | `src/host/useHostGame.ts` | Estado persistido en `localStorage`. |

### Servidor de señalización propio (opcional)

Por defecto se usa el servidor público gratuito de PeerJS. Para producción conviene uno propio (`npx peerjs --port 9000`) y configurar en el build:

```
VITE_PEER_HOST=peer.midominio.com
VITE_PEER_PORT=443
VITE_PEER_PATH=/
```

## Limitaciones conocidas

- Requiere internet para el audio. Si una canción no tiene vista previa, se puede cambiar gratis.
- Las vistas previas de iTunes/Deezer están pensadas para uso promocional; para un lanzamiento comercial habría que revisar sus términos o integrar Spotify/Apple Music con la cuenta del usuario.
- «Hitster» es marca registrada de Jumbo; por eso la app se llama Temazos.
