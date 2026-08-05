import DownloadButton from './DownloadButton';

function formatDate(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleString('pt-BR');
}

function formatSize(size) {
  if (!Number.isFinite(size)) {
    return '-';
  }

  return `${(size / 1024).toFixed(1)} KB`;
}

export default function DocumentList({ documents, isLoading, error }) {
  return (
    <section>
      <h2>Documentos</h2>
      {isLoading ? <p>Carregando documentos...</p> : null}
      {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
      {!isLoading && !error && documents.length === 0 ? <p>Nenhum documento enviado.</p> : null}

      {!isLoading && !error && documents.length > 0 ? (
        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '0.75rem' }}>
          {documents.map((document) => (
            <li key={document.id} style={{ border: '1px solid #d5d5d5', borderRadius: 8, padding: '0.75rem' }}>
              <p style={{ margin: '0 0 0.5rem', fontWeight: 600 }}>{document.originalName}</p>
              <p style={{ margin: 0 }}>Owner: {document.owner || 'anonymous'}</p>
              <p style={{ margin: 0 }}>Tamanho: {formatSize(document.size)}</p>
              <p style={{ margin: '0 0 0.5rem' }}>Enviado em: {formatDate(document.uploadedAt)}</p>
              <DownloadButton documentId={document.id} documentName={document.originalName} />
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
