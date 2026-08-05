import { useCallback, useEffect, useState } from 'react';
import UploadComponent from './components/UploadComponent';
import DocumentList from './components/DocumentList';
import { listDocuments, uploadDocument } from './services/documentsApi';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [listError, setListError] = useState('');

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    setListError('');

    try {
      const loadedDocuments = await listDocuments();
      setDocuments(loadedDocuments);
    } catch (error) {
      setListError(error.message || 'Falha ao listar documentos.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  async function handleUpload(file, owner) {
    setIsUploading(true);

    try {
      await uploadDocument(file, owner);
      await loadDocuments();
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
      <h1>Document Management System</h1>
      <p>Faça upload, visualize e baixe seus documentos.</p>

      <div style={{ display: 'grid', gap: '2rem' }}>
        <UploadComponent onUpload={handleUpload} isUploading={isUploading} />
        <DocumentList documents={documents} isLoading={isLoading} error={listError} />
      </div>
    </main>
  );
}
