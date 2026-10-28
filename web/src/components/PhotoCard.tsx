import { type Photo, photoUrl } from '../lib/api';
import { t } from '../lib/i18n';
import { HeartIcon } from './icons';

/** Tarjeta de foto redondeada con el título encima, como las del diseño de referencia. */
export function PhotoCard({ photo, onOpen, className = '' }: { photo: Photo; onOpen: () => void; className?: string }) {
  return (
    <button className={`photo-card ${className}`} onClick={onOpen} aria-label={photo.title ?? t.album.title}>
      <img src={photoUrl(photo.id)} alt="" loading="lazy" />
      <span className="photo-overlay">
        {photo.title && <span className="photo-title">{photo.title}</span>}
        <span className="photo-heart" aria-hidden>
          <HeartIcon size={12} />
        </span>
      </span>
    </button>
  );
}
