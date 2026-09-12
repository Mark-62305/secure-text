import { App } from '@capacitor/app'
import { Capacitor, type PluginListenerHandle } from '@capacitor/core'
import { Camera, MediaTypeSelection, type MediaResult } from '@capacitor/camera'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Preferences } from '@capacitor/preferences'

const STORAGE_KEY = 'photo-gallery.photos'
const PHOTO_DIRECTORY = 'photos'

export interface StoredPhoto {
  id: string
  fileName: string
  format: string
  createdAt: string
}

export interface GalleryPhoto extends StoredPhoto {
  webviewPath: string
}

function normalizeFormat(format?: string): string {
  const normalized = format?.toLowerCase().replace('jpg', 'jpeg')
  return normalized && /^[a-z0-9.+-]+$/.test(normalized) ? normalized : 'jpeg'
}

function extensionFor(format: string): string {
  return format === 'jpeg' ? 'jpg' : format
}

async function blobToBase64(blob: Blob): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => resolve(String(reader.result))
    reader.readAsDataURL(blob)
  })
  return dataUrl.slice(dataUrl.indexOf(',') + 1)
}

async function mediaToBase64(media: MediaResult): Promise<string> {
  if (Capacitor.isNativePlatform() && media.uri) {
    const { data } = await Filesystem.readFile({ path: media.uri })
    return typeof data === 'string' ? data : blobToBase64(data)
  }

  if (media.thumbnail) return media.thumbnail

  if (media.webPath) {
    const response = await fetch(media.webPath)
    if (!response.ok) throw new Error('The selected photo could not be read.')
    return blobToBase64(await response.blob())
  }

  throw new Error('The camera did not return a readable photo.')
}

async function readStoredPhoto(photo: StoredPhoto): Promise<GalleryPhoto> {
  const { data } = await Filesystem.readFile({
    path: `${PHOTO_DIRECTORY}/${photo.fileName}`,
    directory: Directory.Data,
  })
  const base64 = typeof data === 'string' ? data : await blobToBase64(data)
  return {
    ...photo,
    webviewPath: `data:image/${photo.format};base64,${base64}`,
  }
}

async function readIndex(): Promise<StoredPhoto[]> {
  const { value } = await Preferences.get({ key: STORAGE_KEY })
  if (!value) return []

  try {
    const photos = JSON.parse(value) as StoredPhoto[]
    return Array.isArray(photos) ? photos : []
  } catch {
    return []
  }
}

async function writeIndex(photos: StoredPhoto[]): Promise<void> {
  const metadata = photos.map(({ id, fileName, format, createdAt }) => ({ id, fileName, format, createdAt }))
  await Preferences.set({ key: STORAGE_KEY, value: JSON.stringify(metadata) })
}

async function persistMedia(media: MediaResult): Promise<GalleryPhoto> {
  const format = normalizeFormat(media.metadata?.format)
  const id = `${Date.now()}-${crypto.randomUUID()}`
  const fileName = `${id}.${extensionFor(format)}`
  const base64 = await mediaToBase64(media)

  await Filesystem.writeFile({
    path: `${PHOTO_DIRECTORY}/${fileName}`,
    data: base64,
    directory: Directory.Data,
    recursive: true,
  })

  return {
    id,
    fileName,
    format,
    createdAt: media.metadata?.creationDate ?? new Date().toISOString(),
    webviewPath: `data:image/${format};base64,${base64}`,
  }
}

export async function loadPhotos(): Promise<GalleryPhoto[]> {
  const stored = await readIndex()
  const loaded = await Promise.allSettled(stored.map(readStoredPhoto))
  const photos = loaded
    .filter((result): result is PromiseFulfilledResult<GalleryPhoto> => result.status === 'fulfilled')
    .map((result) => result.value)

  if (photos.length !== stored.length) await writeIndex(photos)
  return photos
}

export async function takePhoto(): Promise<GalleryPhoto> {
  const media = await Camera.takePhoto({
    quality: 90,
    targetWidth: 1800,
    targetHeight: 1800,
    correctOrientation: true,
    includeMetadata: true,
    saveToGallery: false,
  })
  const photo = await persistMedia(media)
  const index = await readIndex()
  await writeIndex([photo, ...index])
  return photo
}

export async function choosePhotos(): Promise<GalleryPhoto[]> {
  const { results } = await Camera.chooseFromGallery({
    mediaType: MediaTypeSelection.Photo,
    allowMultipleSelection: true,
    limit: 12,
    includeMetadata: true,
  })
  const photos: GalleryPhoto[] = []
  for (const media of results) photos.push(await persistMedia(media))

  if (photos.length) {
    const index = await readIndex()
    await writeIndex([...photos, ...index])
  }
  return photos
}

export async function deletePhoto(photo: StoredPhoto, remaining: StoredPhoto[]): Promise<void> {
  await Filesystem.deleteFile({
    path: `${PHOTO_DIRECTORY}/${photo.fileName}`,
    directory: Directory.Data,
  })
  await writeIndex(remaining)
}

export function isCancellation(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  return /cancel|cancelled|canceled/i.test(error.message)
}

export function listenForRestoredPhotos(onPhoto: (photo: GalleryPhoto) => void): Promise<PluginListenerHandle> {
  return App.addListener('appRestoredResult', async (event) => {
    if (!event.success || event.pluginId !== 'Camera' || event.methodName !== 'takePhoto' || !event.data) return
    const photo = await persistMedia(event.data as MediaResult)
    await writeIndex([photo, ...(await readIndex())])
    onPhoto(photo)
  })
}
