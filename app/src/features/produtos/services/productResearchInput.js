const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_SOURCE_BYTES = 12 * 1024 * 1024;
const MAX_INLINE_BYTES = 2_450_000;
const MAX_DIMENSION = 2_000;

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem da tabela nutricional.'));
    reader.readAsDataURL(blob);
  });
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('A imagem selecionada não pôde ser aberta.'));
    };
    image.src = objectUrl;
  });
}

function canvasToBlob(canvas, quality) {
  return new Promise((resolve, reject) => canvas.toBlob(
    (blob) => blob ? resolve(blob) : reject(new Error('Não foi possível preparar a imagem para análise.')),
    'image/jpeg',
    quality,
  ));
}

async function compressImage(file) {
  const image = await loadImage(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext('2d');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  let blob;
  for (const quality of [0.9, 0.82, 0.72]) {
    blob = await canvasToBlob(canvas, quality);
    if (blob.size <= MAX_INLINE_BYTES) break;
  }
  if (!blob || blob.size > MAX_INLINE_BYTES) throw new Error('A foto ficou grande demais. Recorte somente a tabela nutricional e tente novamente.');
  return blob;
}

export async function prepareNutritionLabelImage(file) {
  if (!file) return null;
  if (!ALLOWED_TYPES.has(file.type)) throw new Error('Use uma foto JPG, PNG ou WebP da tabela nutricional.');
  if (file.size > MAX_SOURCE_BYTES) throw new Error('A foto original deve ter no máximo 12 MB.');
  const prepared = file.size <= MAX_INLINE_BYTES ? file : await compressImage(file);
  return { data: await blobToBase64(prepared), mimeType: prepared.type || 'image/jpeg' };
}
