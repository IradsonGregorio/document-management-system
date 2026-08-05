import { useState } from 'react';
import { downloadDocument } from '../services/documentsApi';

export default function DownloadButton({ documentId, documentName }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState('');

  async function handleDownload() {
    setIsDownloading(true);
    setError('');

    try {
      await downloadDocument(documentId, documentName);
    } catch (downloadError) {
      setError(downloadError.message || 'Falha no download.');
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={handleDownload} disabled={isDownloading}>
        {isDownloading ? 'Baixando...' : 'Download'}
      </button>
      {error ? <p style={{ color: 'crimson', margin: '0.25rem 0 0' }}>{error}</p> : null}
    </div>
  );
}
