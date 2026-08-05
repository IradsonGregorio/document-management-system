import { useState } from 'react';

export default function UploadComponent({ onUpload, isUploading }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [owner, setOwner] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();

    if (!selectedFile) {
      setError('Selecione um arquivo para upload.');
      return;
    }

    setError('');

    try {
      await onUpload(selectedFile, owner);
      setSelectedFile(null);
      setOwner('');
      event.currentTarget.reset();
    } catch (uploadError) {
      setError(uploadError.message || 'Falha no upload do documento.');
    }
  }

  return (
    <section>
      <h2>Upload</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gap: '0.5rem', maxWidth: 420 }}>
          <label htmlFor="owner">Usuário (opcional)</label>
          <input
            id="owner"
            type="text"
            value={owner}
            onChange={(event) => setOwner(event.target.value)}
            placeholder="ex.: maria"
            disabled={isUploading}
          />

          <label htmlFor="document-file">Arquivo</label>
          <input
            id="document-file"
            type="file"
            onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
            disabled={isUploading}
          />

          <button type="submit" disabled={isUploading}>
            {isUploading ? 'Enviando...' : 'Enviar documento'}
          </button>
        </div>
      </form>
      {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
    </section>
  );
}
