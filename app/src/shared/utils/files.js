/**
 * Utilitários para leitura de arquivos (TXT e PDF) no navegador.
 * PDFs são processados com pdfjs-dist carregado sob demanda.
 * PDFs sem texto selecionável lançam um erro orientando o usuário — não há OCR local.
 */

const MAX_FILE_SIZE = 15_000_000; // 15 MB

/**
 * Lê um arquivo TXT ou PDF e retorna o conteúdo como string.
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function readDocument(file) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('O documento deve ter até 15 MB.');
  }

  const isPdf =
    file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

  if (!isPdf) {
    return file.text();
  }

  const pdfjs = await import('pdfjs-dist');
  const { default: workerUrl } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const task = pdfjs.getDocument({ data: await file.arrayBuffer() });
  try {
    const document = await task.promise;
    const pages = [];
    for (let page = 1; page <= document.numPages; page++) {
      const content = await (await document.getPage(page)).getTextContent();
      pages.push(content.items.map(item => item.str || '').join(' '));
    }
    const text = pages.join('\n');
    if (!text.trim()) {
      throw new Error(
        'Este PDF não contém texto selecionável. Use um PDF com texto ou cole o conteúdo.',
      );
    }
    return text;
  } finally {
    await task.destroy();
  }
}
