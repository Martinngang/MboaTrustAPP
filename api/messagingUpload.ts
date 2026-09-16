import { api } from './client';
import type { BackendAttachment } from './messaging';

/** Real multipart upload to POST /messages/upload (messageController.uploadAttachment).
 * Generic across every attachment kind the backend accepts — images, videos,
 * voice notes, and documents are all just `{ uri, fileName, mimeType }`; the
 * server infers `type` from the mimetype it receives. */
export async function uploadChatAttachment(file: {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
}): Promise<BackendAttachment> {
  const form = new FormData();
  form.append('file', {
    uri: file.uri,
    name: file.fileName ?? 'attachment',
    type: file.mimeType ?? 'application/octet-stream',
  } as unknown as Blob);
  const { data } = await api.post<{ data: BackendAttachment }>('/messages/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
}
