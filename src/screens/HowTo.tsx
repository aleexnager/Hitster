import { Modal } from '../components/Modal';

export function HowTo({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Cómo se juega" onClose={onClose}>
      <div className="stack small">
        <p>
          <strong>Objetivo:</strong> ser el primer equipo en reunir las cartas necesarias (10 por defecto) en su línea del tiempo, ordenadas por año.
        </p>
        <ol style={{ paddingLeft: 20, margin: 0, display: 'grid', gap: 8 }}>
          <li>Cada equipo empieza con una carta boca arriba.</li>
          <li>En tu turno suena una canción misteriosa. Escuchad y decidid en qué hueco de vuestra línea del tiempo va: antes, entre o después de vuestras cartas.</li>
          <li>Si aciertas, la carta se queda en tu línea. Si fallas, se descarta.</li>
          <li>
            <strong>Desafíos:</strong> antes de revelar, otros equipos pueden gastar 1 ficha ● para apostar por otro hueco. Si el equipo activo falla y el desafiante acierta, la carta es para el desafiante.
          </li>
          <li>
            <strong>Fichas ●:</strong> si además aciertas título y artista, ganas 1 ficha (máx. 5). Úsalas para saltar una canción (1 ●), desafiar (1 ●) o comprar una carta directamente (3 ●).
          </li>
        </ol>
        <p className="muted">
          El año de cada carta es el de la primera publicación de la canción. Las canciones suenan como vista previa de 30 segundos desde iTunes o Deezer, así que hace falta conexión a internet.
        </p>
        <p className="muted">
          <strong>Con móviles:</strong> el anfitrión abre una sala y el resto escanea el QR. La música suena en el dispositivo anfitrión (conéctalo a un altavoz) y cada equipo juega desde su móvil.
        </p>
      </div>
    </Modal>
  );
}
