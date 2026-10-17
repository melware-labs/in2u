import { useEffect, useRef, useState } from 'react';

import { ApiError, api, type Me, type Photo, photoUrl } from '../api';
import { t } from '../i18n';
import { ChevronIcon, HeartIcon, PlusCircleIcon } from '../icons';
import { firstName, resizeImage } from '../lib';

/** Hoja para subir una foto nueva o editar título y descripción de una existente. */
function PhotoSheet({
  file,
  photo,
  onClose,
  onSaved,
}: {
  file?: File;
  photo?: Photo;
  onClose: () => void;
  onSaved: (p: Photo) => void;
}) {
  const [title, setTitle] = useState(photo?.title ?? '');
  const [description, setDescription] = useState(photo?.description ?? '');
  const [preview, setPreview] = useState<string | null>(photo ? photoUrl(photo.id) : null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const saved = photo
        ? await api.describePhoto(photo.id, title, description)
        : await api.uploadPhoto(await resizeImage(file!), title, description);
      onSaved(saved);
    } catch (e) {
      setError(e instanceof ApiError && e.status < 500 && !e.message.startsWith('Error') ? e.message : t.album.uploadError);
      setSaving(false);
    }
  }

  return (
    <div className="sheet-bg" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={photo ? t.album.edit : t.album.newPhoto}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="row between">
          <button className="btn link" onClick={onClose}>
            {t.album.cancel}
          </button>
        </div>
        <h1>{photo ? t.album.edit : t.album.newPhoto}</h1>
        {preview && <img className="sheet-preview" src={preview} alt="" />}
        <label className="stack" style={{ gap: 6 }}>
          <span className="kicker">{t.album.photoTitle}</span>
          <input
            className="input"
            maxLength={80}
            value={title}
            placeholder={t.album.titlePlaceholder}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label className="stack" style={{ gap: 6 }}>
          <span className="kicker">{t.album.description}</span>
          <textarea
            className="input"
            rows={3}
            maxLength={500}
            value={description}
            placeholder={t.album.descriptionPlaceholder}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn" disabled={saving} onClick={save}>
          {saving ? t.album.saving : t.album.save}
        </button>
      </div>
    </div>
  );
}

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

function PhotoDetail({
  me,
  photo,
  onBack,
  onEdit,
  onDeleted,
}: {
  me: Me;
  photo: Photo;
  onBack: () => void;
  onEdit: () => void;
  onDeleted: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const date = new Date(photo.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });

  async function remove() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    await api.deletePhoto(photo.id);
    onDeleted();
  }

  return (
    <article className="photo-detail">
      <img className="photo-hero" src={photoUrl(photo.id)} alt={photo.title ?? ''} />
      <div className="stack photo-text">
        <h1 className="photo-heading">{photo.title || t.album.title}</h1>
        <p className="muted small">
          {date} · {photo.mine ? t.album.byMe : t.album.by(firstName(me.partner?.name, '—'))}
        </p>
        {photo.description && <p className="photo-description">{photo.description}</p>}
        <div className="row" style={{ flexWrap: 'wrap' }}>
          <button className="btn pill-dark" onClick={onBack}>
            <ChevronIcon dir="left" /> {t.album.back}
          </button>
          <button className="btn secondary small-btn" onClick={onEdit}>
            {t.album.edit}
          </button>
        </div>
        <button className="btn link danger" onClick={remove} style={{ alignSelf: 'flex-start', paddingLeft: 0 }}>
          {confirming ? t.album.confirmRemove : t.album.remove}
        </button>
      </div>
    </article>
  );
}

export function Album({
  me,
  version,
  focus,
  onFocus,
}: {
  me: Me;
  /** Cambia cuando la pareja sube, edita o borra una foto. */
  version: number;
  focus: string | null;
  onFocus: (id: string | null) => void;
}) {
  const [photos, setPhotos] = useState<Photo[] | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [editing, setEditing] = useState<Photo | null>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.photos().then(setPhotos, () => setPhotos([]));
  }, [version]);

  const open = photos?.find((p) => p.id === focus);

  const picker = (
    <input
      ref={input}
      type="file"
      accept="image/*"
      hidden
      onChange={(e) => {
        const f = e.target.files?.[0];
        if (f) setFile(f);
        e.target.value = '';
      }}
    />
  );

  const sheet = (file || editing) && (
    <PhotoSheet
      file={file ?? undefined}
      photo={editing ?? undefined}
      onClose={() => {
        setFile(null);
        setEditing(null);
      }}
      onSaved={(saved) => {
        setPhotos((list) => [saved, ...(list ?? []).filter((p) => p.id !== saved.id)]);
        setFile(null);
        setEditing(null);
      }}
    />
  );

  if (open) {
    return (
      <>
        <PhotoDetail
          me={me}
          photo={open}
          onBack={() => onFocus(null)}
          onEdit={() => setEditing(open)}
          onDeleted={() => {
            setPhotos((list) => (list ?? []).filter((p) => p.id !== open.id));
            onFocus(null);
          }}
        />
        {sheet}
      </>
    );
  }

  return (
    <>
      <header className="row between" style={{ alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div className="stack" style={{ gap: 4 }}>
          <h1>{t.album.title}</h1>
          <p className="muted">{t.album.subtitle}</p>
        </div>
        <button className="btn small-btn" onClick={() => input.current?.click()}>
          <PlusCircleIcon /> {t.album.add}
        </button>
      </header>
      {picker}

      {photos && photos.length === 0 && (
        <button className="card photo-empty" onClick={() => input.current?.click()}>
          <PlusCircleIcon />
          <span>{t.album.empty}</span>
        </button>
      )}

      <div className="album-grid">
        {photos?.map((p) => <PhotoCard key={p.id} photo={p} onOpen={() => onFocus(p.id)} />)}
      </div>
      {sheet}
    </>
  );
}
