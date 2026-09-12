import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import HomePage from '@/views/HomePage.vue'
import { loadPhotos } from '@/services/photoGallery'

vi.mock('@/services/photoGallery', () => ({
  loadPhotos: vi.fn(),
  takePhoto: vi.fn(),
  choosePhotos: vi.fn(),
  deletePhoto: vi.fn(),
  isCancellation: vi.fn(() => false),
  listenForRestoredPhotos: vi.fn(() => Promise.resolve({ remove: vi.fn() })),
}))

describe('Photo Gallery home page', () => {
  beforeEach(() => vi.mocked(loadPhotos).mockResolvedValue([]))

  test('renders the empty gallery and capture actions', async () => {
    const wrapper = mount(HomePage)
    await flushPromises()
    expect(wrapper.text()).toContain('Keep life in frame.')
    expect(wrapper.text()).toContain('Your gallery is ready')
    expect(wrapper.text()).toContain('Take photo')
    expect(wrapper.text()).toContain('Add from device')
  })
})
