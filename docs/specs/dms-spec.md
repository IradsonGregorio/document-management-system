# Especificação Completa - Document Management System

## 1. Objetivo

Entregar um sistema web simples para upload, listagem e download de documentos por usuário, com armazenamento local de arquivos e arquitetura evolutiva.

## 2. Escopo

### Dentro do escopo

- Upload de documentos via interface web.
- Listagem de documentos enviados.
- Download de documento por identificador.
- Gestão simples por usuário por identificador lógico (owner).
- Armazenamento local em filesystem da aplicação.

### Fora do escopo

- Banco de dados relacional ou NoSQL nesta fase.
- Armazenamento externo ou em nuvem.
- Autenticação/autorização completa (JWT, OAuth, sessões).
- Versionamento de documentos.
- Exclusão e atualização de documentos.
- Antivírus, OCR ou processamento assíncrono de arquivos.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O sistema deve permitir upload de um arquivo por requisição no endpoint POST /upload usando multipart/form-data. |
| RF-02 | O sistema deve persistir o arquivo enviado em armazenamento local no diretório backend/storage. |
| RF-03 | O sistema deve gerar e armazenar em memória os metadados do documento enviado. |
| RF-04 | O sistema deve retornar os metadados do documento criado após upload bem-sucedido. |
| RF-05 | O sistema deve listar os metadados de documentos no endpoint GET /documents. |
| RF-06 | O sistema deve permitir filtro opcional por owner na listagem de documentos. |
| RF-07 | O sistema deve retornar a listagem ordenada por uploadedAt em ordem decrescente. |
| RF-08 | O sistema deve permitir download no endpoint GET /documents/:id/download usando o id do documento. |
| RF-09 | O sistema deve localizar o arquivo para download com base em metadados internos, sem aceitar caminho de arquivo vindo do cliente. |
| RF-10 | O sistema deve retornar erro de validação para requisições inválidas (arquivo ausente, formato incorreto, owner inválido). |
| RF-11 | O sistema deve retornar erro de não encontrado quando o id do documento não existir. |
| RF-12 | O frontend deve consumir os endpoints do backend usando o prefixo /api. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Backend com Clean Architecture simples: fluxo obrigatório routes -> controllers -> services -> repositories. |
| RNF-02 | Upload implementado com multer usando diskStorage, com gravação local em backend/storage. |
| RNF-03 | Metadados armazenados somente em memória nesta fase inicial. |
| RNF-04 | Configuração via variáveis de ambiente, alinhada ao 12-Factor App. |
| RNF-05 | Mensagens de erro padronizadas em JSON para facilitar consumo pelo frontend. |
| RNF-06 | Limite de tamanho de upload configurável por ambiente (valor padrão sugerido: 10 MB). |
| RNF-07 | Restringir tipos de arquivo aceitos por whitelist de MIME type e/ou extensão. |
| RNF-08 | O sistema deve mitigar path traversal no download e na gravação local. |
| RNF-09 | Código organizado com responsabilidade única por camada, mantendo KISS, DRY, SOLID e YAGNI. |
| RNF-10 | Compatibilidade com Node.js e npm do ambiente do projeto, sem dependências desnecessárias. |

## 5. Modelo de dados

### 5.1 Entidade lógica: Document

| Campo | Tipo | Obrigatório | Exposto na API | Descrição |
| --- | --- | --- | --- | --- |
| id | string | Sim | Sim | Identificador único do documento (UUID ou equivalente). |
| originalName | string | Sim | Sim | Nome original enviado pelo usuário. |
| size | number | Sim | Sim | Tamanho em bytes. |
| uploadedAt | string (ISO 8601) | Sim | Sim | Data/hora do upload. |
| owner | string | Sim | Sim | Identificador lógico do usuário dono do documento. |
| mimeType | string | Sim | Sim | Tipo MIME do arquivo aceito. |
| storedName | string | Sim | Não | Nome interno do arquivo gravado no disco. |
| relativePath | string | Sim | Não | Caminho relativo seguro dentro de backend/storage. |

### 5.2 Regras de consistência

- id deve ser único no armazenamento em memória.
- relativePath deve sempre apontar para arquivo dentro de backend/storage.
- storedName não deve ser derivado diretamente de input não sanitizado do cliente.
- uploadedAt deve ser gerado pelo backend no momento da persistência.

## 6. Contratos de API

### 6.1 Convenções gerais

- Base path no frontend: /api.
- Content-Type de respostas de erro: application/json.
- Formato padrão de erro:

{
  "error": {
    "code": "STRING_CODE",
    "message": "Mensagem legível",
    "details": {}
  }
}

- Header opcional para gestão simples por usuário: x-user-id.
- Quando x-user-id não for enviado, usar owner = anonymous.

### 6.2 POST /upload

Objetivo:
- Enviar um documento e registrar metadados.

Request:
- Método: POST
- Content-Type: multipart/form-data
- Campo de arquivo: file
- Header opcional: x-user-id

Validações:
- file obrigatório.
- Tipo de arquivo deve estar na whitelist configurada.
- Tamanho máximo respeita limite configurado.

Response sucesso:
- Status: 201 Created
- Body:

{
  "id": "doc_8f0f2a",
  "originalName": "contrato.pdf",
  "size": 245678,
  "uploadedAt": "2026-08-05T14:35:10.000Z",
  "owner": "u123",
  "mimeType": "application/pdf"
}

Erros esperados:
- 400 Bad Request: payload inválido ou arquivo ausente.
- 413 Payload Too Large: arquivo excede limite.
- 415 Unsupported Media Type: tipo de arquivo não permitido.
- 500 Internal Server Error: falha de escrita em disco ou erro inesperado.

### 6.3 GET /documents

Objetivo:
- Listar metadados dos documentos.

Request:
- Método: GET
- Query params opcionais:
  - owner: string
- Header opcional: x-user-id

Regras:
- Se owner for informado na query, filtrar por owner.
- Se owner não for informado e x-user-id estiver presente, pode-se filtrar pelo header por decisão de implementação.
- Ordenar por uploadedAt desc.

Response sucesso:
- Status: 200 OK
- Body:

[
  {
    "id": "doc_8f0f2a",
    "originalName": "contrato.pdf",
    "size": 245678,
    "uploadedAt": "2026-08-05T14:35:10.000Z",
    "owner": "u123",
    "mimeType": "application/pdf"
  }
]

Erros esperados:
- 400 Bad Request: query inválida.
- 500 Internal Server Error: falha inesperada de processamento.

### 6.4 GET /documents/:id/download

Objetivo:
- Baixar o arquivo binário de um documento existente.

Request:
- Método: GET
- Path param:
  - id: string (obrigatório)

Regras:
- Buscar metadados em memória pelo id.
- Resolver arquivo por campos internos storedName/relativePath.
- Não concatenar caminho com valores arbitrários de input externo.

Response sucesso:
- Status: 200 OK
- Headers:
  - Content-Type: mimeType do arquivo
  - Content-Disposition: attachment; filename="originalName"
- Body: binário do arquivo

Erros esperados:
- 400 Bad Request: id inválido.
- 404 Not Found: documento inexistente ou arquivo não encontrado no disco.
- 500 Internal Server Error: erro inesperado de leitura.

### 6.5 Endpoint auxiliar existente

GET /health:
- Status: 200
- Body: { "status": "ok" }

## 7. Decisões arquiteturais

1. Backend em Node.js + Express com CommonJS.
2. Organização em camadas:
   - routes: define rotas e encaminha chamadas.
   - controllers: valida entrada e compõe resposta HTTP.
   - services: aplica regra de negócio e orquestra caso de uso.
   - repositories: encapsula acesso a metadados em memória.
3. Upload local com multer diskStorage no diretório backend/storage.
4. Metadados em memória para manter o seed simples e evolutivo.
5. Frontend em React + Vite com consumo de API via proxy /api.
6. Tratamento de erros no limite HTTP (controllers/middlewares).
7. Sem dependência de armazenamento externo nesta fase.

## 8. Fluxo de alto nível

1. Cliente envia arquivo para POST /api/upload.
2. Route delega para controller de upload.
3. Controller valida request e delega ao service.
4. Service solicita persistência de arquivo via multer e registra metadados no repository.
5. Repository mantém metadados em memória.
6. Controller retorna resposta 201 com metadados públicos.
7. Para download, service localiza id no repository e retorna stream/local path seguro.

## 9. Plano de execução em etapas

### Etapa 1 - Estrutura backend e contratos

Objetivo:
- Criar wiring das rotas e camadas com contratos mínimos.

Entregas:
- Rotas para upload, listagem e download registradas no app.
- Controllers, services e repositories com interfaces claras.
- Middleware de erro padronizado.

Critérios de aceite:
- Endpoints respondem com estrutura de erro padronizada para cenários não implementados ou inválidos.

### Etapa 2 - Upload local com multer

Objetivo:
- Implementar upload funcional e gravação local.

Entregas:
- Configuração do multer com diskStorage.
- Pasta backend/storage utilizada como destino.
- Validação de tipo e tamanho de arquivo.
- Criação de metadados em memória.

Critérios de aceite:
- POST /upload retorna 201 com metadados públicos.
- Arquivo existe fisicamente em backend/storage.

### Etapa 3 - Listagem de documentos

Objetivo:
- Expor consulta de metadados.

Entregas:
- GET /documents com ordenação por uploadedAt desc.
- Filtro opcional por owner.

Critérios de aceite:
- Resposta 200 com lista consistente e ordenada.

### Etapa 4 - Download por id

Objetivo:
- Disponibilizar download do arquivo com segurança básica.

Entregas:
- GET /documents/:id/download com busca por id.
- Headers de resposta para download.
- Tratamento de 404 para id inexistente e arquivo ausente.

Critérios de aceite:
- Arquivo baixado corresponde ao documento enviado.
- Não há exposição de path interno na resposta.

### Etapa 5 - Integração frontend

Objetivo:
- Conectar interface React aos endpoints.

Entregas:
- Componente de upload.
- Lista de documentos.
- Ação de download.
- Serviço de API usando /api.

Critérios de aceite:
- Fluxo completo funcionando: upload -> listar -> download.

### Etapa 6 - Testes e qualidade

Objetivo:
- Garantir estabilidade mínima da entrega.

Entregas:
- Testes de backend para casos felizes e erros principais.
- Cobertura de cenários: upload válido, inválido, listagem e download não encontrado.
- Revisão de código e ajustes de tratamento de erro.

Critérios de aceite:
- Testes backend passando no runner nativo do Node.
- Sem regressão do endpoint /health.

## 10. Riscos e limitações da fase

- Metadados em memória são perdidos ao reiniciar o processo.
- Escalabilidade horizontal não é suportada sem camada de persistência compartilhada.
- Segurança avançada (antivírus, DLP, criptografia em repouso) não está contemplada nesta fase.
- Sem autenticação robusta, owner é identificador lógico e não prova de identidade.

## 11. Critérios gerais de pronto

- Requisitos RF-01 a RF-12 implementados e validados.
- Requisitos RNF-01 a RNF-10 respeitados.
- Contratos de API refletidos na implementação e nos testes.
- Estrutura de camadas do backend preservada sem atalhos entre camadas.
- Armazenamento local com multer em backend/storage confirmado.
