import { beforeEach, describe, expect, test, vi } from 'vitest'

const camera = vi.hoisted(() => ({ takePhoto: vi.fn(), chooseFromGallery: vi.fn() }))
const filesystem = vi.hoisted(() => ({ readFile: vi.fn(), writeFile: vi.fn(), deleteFile: vi.fn() }))
const preferences = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn() }))

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false } }))
vi.mock('@capacitor/app', () => ({ App: { addListener: vi.fn() } }))
vi.mock('@capacitor/camera', () => ({ Camera: camera, MediaTypeSelection: { Photo: 'photos' } }))
vi.mock('@capacitor/filesystem', () => ({ Directory: { Data: 'DATA' }, Filesystem: filesystem }))
vi.mock('@capacitor/preferences', () => ({ Preferences: preferences }))

import { choosePhotos, deletePhoto, loadPhotos, takePhoto } from '@/services/photoGallery'

describe('photo gallery persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    preferences.get.mockResolvedValue({ value: '[]' })
    preferences.set.mockResolvedValue(undefined)
    filesystem.writeFile.mockResolvedValue({ uri: 'photo-uri' })
    filesystem.deleteFile.mockResolvedValue(undefined)
  })

  test('captures and persists a photo', async () => {
    camera.takePhoto.mockResolvedValue({ saved: false, thumbnail: 'ZmFrZS1waG90bw==', metadata: { format: 'jpg', creationDate: '2026-09-12T10:00:00.000Z' } })
    const photo = await takePhoto()
    expect(photo.format).toBe('jpeg')
    expect(photo.webviewPath).toBe('data:image/jpeg;base64,ZmFrZS1waG90bw==')
    expect(filesystem.writeFile).toHaveBeenCalledOnce()
    expect(preferences.set).toHaveBeenCalledOnce()
  })

  test('imports multiple photos and writes one gallery index', async () => {
    camera.chooseFromGallery.mockResolvedValue({ results: [
      { saved: false, thumbnail: 'b25l', metadata: { format: 'png' } },
      { saved: false, thumbnail: 'dHdv', metadata: { format: 'jpeg' } },
    ] })
    const photos = await choosePhotos()
    expect(photos).toHaveLength(2)
    expect(filesystem.writeFile).toHaveBeenCalledTimes(2)
    expect(preferences.set).toHaveBeenCalledOnce()
  })

  test('rehydrates saved files for display', async () => {
    preferences.get.mockResolvedValue({ value: JSON.stringify([{ id: '1', fileName: '1.jpg', format: 'jpeg', createdAt: '2026-09-12T10:00:00.000Z' }]) })
    filesystem.readFile.mockResolvedValue({ data: 'c2F2ZWQ=' })
    const photos = await loadPhotos()
    expect(photos[0].webviewPath).toBe('data:image/jpeg;base64,c2F2ZWQ=')
  })

  test('deletes the file and updates the index', async () => {
    await deletePhoto({ id: '1', fileName: '1.jpg', format: 'jpeg', createdAt: '2026-09-12T10:00:00.000Z' }, [])
    expect(filesystem.deleteFile).toHaveBeenCalledOnce()
    expect(preferences.set).toHaveBeenCalledWith(expect.objectContaining({ value: '[]' }))
  })
})
