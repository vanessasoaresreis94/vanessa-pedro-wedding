import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from "./config";

export const hasCloudinary =
  !!CLOUDINARY_CLOUD_NAME && !!CLOUDINARY_UPLOAD_PRESET;

// Faz upload de um ficheiro (imagem ou vídeo) para o Cloudinary
// usando um unsigned upload preset. Devolve { url, type, publicId }.
export async function uploadToCloudinary(file, onProgress) {
  if (!hasCloudinary) throw new Error("Cloudinary não configurado");

  const resourceType = file.type.startsWith("video") ? "video" : "image";
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;

  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  form.append("folder", "wedding");

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const res = JSON.parse(xhr.responseText);
        resolve({
          url: res.secure_url,
          type: resourceType,
          publicId: res.public_id,
        });
      } else {
        reject(new Error("Upload falhou: " + xhr.status));
      }
    };
    xhr.onerror = () => reject(new Error("Erro de rede no upload"));
    xhr.send(form);
  });
}
