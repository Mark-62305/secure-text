<template>
  <IonPage>
    <IonHeader class="ion-no-border">
      <IonToolbar>
        <IonTitle>SECTEXT</IonTitle>
        <IonButtons slot="end">
          <IonButton aria-label="Choose photos" :disabled="busy" @click="pickFromLibrary">
            <IonIcon slot="icon-only" :icon="imagesOutline" />
          </IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>

    <IonContent :fullscreen="true">
      <main class="gallery-shell">
        <section class="hero" aria-labelledby="gallery-heading">
          <div>
            <p class="eyebrow">YOUR MOMENTS</p>
            <h1 id="gallery-heading">Keep life in frame.</h1>
            <p class="hero-copy">
              Capture a new photo or bring in favourites from your device. Your photos stay stored on this device.
            </p>
          </div>
          <div class="photo-count" aria-live="polite">
            <strong>{{ photos.length }}</strong>
            <span>{{ photos.length === 1 ? 'photo' : 'photos' }}</span>
          </div>
        </section>

        <section class="actions" aria-label="Photo actions">
          <IonButton class="primary-action" :disabled="busy" @click="capturePhoto">
            <IonSpinner v-if="busyAction === 'camera'" name="crescent" />
            <IonIcon v-else slot="start" :icon="cameraOutline" />
            Take photo
          </IonButton>
          <IonButton fill="outline" class="secondary-action" :disabled="busy" @click="pickFromLibrary">
            <IonSpinner v-if="busyAction === 'library'" name="crescent" />
            <IonIcon v-else slot="start" :icon="imagesOutline" />
            Add from device
          </IonButton>
        </section>

        <section v-if="loading" class="state-card" aria-live="polite">
          <IonSpinner name="crescent" />
          <p>Opening your gallery…</p>
        </section>

        <section v-else-if="photos.length === 0" class="empty-state">
          <div class="empty-icon"><IonIcon :icon="imageOutline" /></div>
          <h2>Your gallery is ready</h2>
          <p>Take your first picture or choose one already on your device.</p>
          <IonButton fill="clear" :disabled="busy" @click="capturePhoto">
            Start with a photo
            <IonIcon slot="end" :icon="arrowForwardOutline" />
          </IonButton>
        </section>

        <section v-else class="photo-grid" aria-label="Saved photos">
          <article v-for="photo in photos" :key="photo.id" class="photo-card">
            <button class="photo-open" :aria-label="`Open photo from ${formatDate(photo.createdAt)}`" @click="selectedPhoto = photo">
              <img :src="photo.webviewPath" :alt="`Saved photo from ${formatDate(photo.createdAt)}`" loading="lazy" />
              <span class="photo-date">{{ formatDate(photo.createdAt) }}</span>
            </button>
            <IonButton
              fill="clear"
              class="delete-button"
              :aria-label="`Delete photo from ${formatDate(photo.createdAt)}`"
              @click="photoPendingDeletion = photo"
            >
              <IonIcon slot="icon-only" :icon="trashOutline" />
            </IonButton>
          </article>
        </section>
      </main>

      <IonFab v-if="photos.length" slot="fixed" vertical="bottom" horizontal="end">
        <IonFabButton aria-label="Take a photo" :disabled="busy" @click="capturePhoto">
          <IonIcon :icon="cameraOutline" />
        </IonFabButton>
      </IonFab>

      <IonModal :is-open="Boolean(selectedPhoto)" class="photo-viewer" @did-dismiss="selectedPhoto = null">
        <IonHeader class="ion-no-border">
          <IonToolbar>
            <IonTitle>{{ selectedPhoto ? formatDate(selectedPhoto.createdAt) : 'Photo' }}</IonTitle>
            <IonButtons slot="end">
              <IonButton aria-label="Close photo" @click="selectedPhoto = null">
                <IonIcon slot="icon-only" :icon="closeOutline" />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div class="viewer-content">
            <img v-if="selectedPhoto" :src="selectedPhoto.webviewPath" alt="Selected gallery photo" />
          </div>
        </IonContent>
      </IonModal>

      <IonAlert
        :is-open="Boolean(photoPendingDeletion)"
        header="Delete this photo?"
        message="This permanently removes the photo from this device."
        :buttons="deleteButtons"
        @did-dismiss="photoPendingDeletion = null"
      />

      <IonToast
        :is-open="Boolean(message)"
        :message="message"
        :color="messageColor"
        :duration="3200"
        position="bottom"
        @did-dismiss="message = ''"
      />
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  IonAlert, IonButton, IonButtons, IonContent, IonFab, IonFabButton,
  IonHeader, IonIcon, IonModal, IonPage, IonSpinner, IonTitle, IonToast, IonToolbar,
} from '@ionic/vue'
import {
  arrowForwardOutline, cameraOutline, closeOutline, imageOutline, imagesOutline, trashOutline,
} from 'ionicons/icons'
import {
  choosePhotos, deletePhoto, isCancellation, listenForRestoredPhotos, loadPhotos, takePhoto, type GalleryPhoto,
} from '@/services/photoGallery'

const photos = ref<GalleryPhoto[]>([])
const loading = ref(true)
const busyAction = ref<'camera' | 'library' | 'delete' | null>(null)
const selectedPhoto = ref<GalleryPhoto | null>(null)
const photoPendingDeletion = ref<GalleryPhoto | null>(null)
const message = ref('')
const messageColor = ref<'success' | 'danger'>('success')
const busy = computed(() => busyAction.value !== null)
const restoredPhotoListener = listenForRestoredPhotos((photo) => {
  if (!photos.value.some((item) => item.id === photo.id)) photos.value.unshift(photo)
})

const deleteButtons = [
  { text: 'Cancel', role: 'cancel' },
  { text: 'Delete', role: 'destructive', handler: () => removePendingPhoto() },
]

onMounted(async () => {
  try {
    photos.value = await loadPhotos()
  } catch (error) {
    showError(error, 'Your saved photos could not be loaded.')
  } finally {
    loading.value = false
  }
})

onUnmounted(async () => (await restoredPhotoListener).remove())

async function capturePhoto() {
  if (busy.value) return
  busyAction.value = 'camera'
  try {
    const photo = await takePhoto()
    photos.value.unshift(photo)
    showMessage('Photo saved to this device.')
  } catch (error) {
    if (!isCancellation(error)) showError(error, 'The photo could not be captured.')
  } finally {
    busyAction.value = null
  }
}

async function pickFromLibrary() {
  if (busy.value) return
  busyAction.value = 'library'
  try {
    const added = await choosePhotos()
    photos.value.unshift(...added)
    if (added.length) showMessage(`${added.length} ${added.length === 1 ? 'photo' : 'photos'} saved.`)
  } catch (error) {
    if (!isCancellation(error)) showError(error, 'Photos could not be added.')
  } finally {
    busyAction.value = null
  }
}

async function removePendingPhoto() {
  const photo = photoPendingDeletion.value
  if (!photo || busy.value) return
  busyAction.value = 'delete'
  const remaining = photos.value.filter((item) => item.id !== photo.id)
  try {
    await deletePhoto(photo, remaining)
    photos.value = remaining
    if (selectedPhoto.value?.id === photo.id) selectedPhoto.value = null
    showMessage('Photo deleted.')
  } catch (error) {
    showError(error, 'The photo could not be deleted.')
  } finally {
    busyAction.value = null
    photoPendingDeletion.value = null
  }
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

function showMessage(value: string) {
  messageColor.value = 'success'
  message.value = value
}

function showError(error: unknown, fallback: string) {
  console.error(error)
  messageColor.value = 'danger'
  message.value = error instanceof Error && error.message ? error.message : fallback
}
</script>

<style scoped>
ion-header, ion-toolbar { --background: rgba(249, 247, 242, 0.94); --color: #1c2522; }
ion-content { --background: #f9f7f2; --color: #1c2522; }
.gallery-shell { width: min(1080px, 100%); min-height: 100%; margin: 0 auto; padding: 26px 18px calc(110px + env(safe-area-inset-bottom)); }
.hero { display: flex; align-items: flex-end; justify-content: space-between; gap: 30px; padding: 28px; border-radius: 28px; color: #f9f7f2; background: linear-gradient(135deg, #183d34, #2f6c5b); box-shadow: 0 18px 45px rgba(24, 61, 52, 0.18); }
.eyebrow { margin: 0 0 10px; color: #f4c95d; font-size: .72rem; font-weight: 800; letter-spacing: .18em; }
.hero h1 { max-width: 600px; margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: clamp(2.15rem, 8vw, 4.7rem); font-weight: 500; line-height: .98; }
.hero-copy { max-width: 570px; margin: 18px 0 0; color: rgba(249,247,242,.76); line-height: 1.55; }
.photo-count { min-width: 108px; padding: 18px; border: 1px solid rgba(255,255,255,.16); border-radius: 20px; background: rgba(255,255,255,.08); text-align: center; }
.photo-count strong, .photo-count span { display: block; }
.photo-count strong { font-size: 2rem; }
.photo-count span { color: rgba(255,255,255,.65); font-size: .8rem; }
.actions { display: flex; gap: 12px; margin: 22px 0 28px; }
.actions ion-button { min-height: 50px; margin: 0; font-weight: 700; text-transform: none; --border-radius: 15px; }
.primary-action { --background: #d7663f; --background-activated: #b95031; }
.secondary-action { --border-color: #285849; --color: #285849; }
.state-card, .empty-state { display: grid; place-items: center; min-height: 310px; padding: 42px 20px; border: 1px dashed #c7c2b6; border-radius: 26px; text-align: center; }
.state-card { align-content: center; color: #68736f; }
.empty-icon { display: grid; place-items: center; width: 78px; height: 78px; border-radius: 50%; color: #2f6c5b; background: #e3eee9; font-size: 2.2rem; }
.empty-state h2 { margin: 20px 0 6px; font-family: Georgia, serif; font-size: 1.65rem; }
.empty-state p { max-width: 390px; margin: 0 0 12px; color: #68736f; line-height: 1.5; }
.empty-state ion-button { --color: #d7663f; font-weight: 700; text-transform: none; }
.photo-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
.photo-card { position: relative; aspect-ratio: 4 / 5; overflow: hidden; border-radius: 20px; background: #e7e2d8; box-shadow: 0 8px 25px rgba(38,47,43,.09); }
.photo-open { width: 100%; height: 100%; padding: 0; border: 0; background: none; cursor: pointer; }
.photo-open img { width: 100%; height: 100%; object-fit: cover; transition: transform 220ms ease; }
.photo-open:hover img { transform: scale(1.025); }
.photo-date { position: absolute; right: 12px; bottom: 12px; left: 12px; padding: 28px 10px 9px; border-radius: 0 0 12px 12px; color: white; background: linear-gradient(transparent, rgba(0,0,0,.68)); font-size: .75rem; text-align: left; }
.delete-button { position: absolute; top: 8px; right: 8px; width: 40px; height: 40px; margin: 0; --border-radius: 50%; --background: rgba(18,24,22,.68); --color: white; }
ion-fab-button { --background: #d7663f; --background-activated: #b95031; --box-shadow: 0 10px 30px rgba(215,102,63,.38); }
.photo-viewer { --background: #111614; }
.photo-viewer ion-toolbar { --background: #111614; --color: white; }
.photo-viewer ion-content { --background: #111614; }
.viewer-content { display: grid; place-items: center; min-height: 100%; padding: 16px; }
.viewer-content img { max-width: 100%; max-height: calc(100vh - 100px); border-radius: 12px; object-fit: contain; }
@media (max-width: 720px) {
  .gallery-shell { padding-top: 14px; }
  .hero { align-items: flex-start; padding: 23px; }
  .photo-count { min-width: 78px; padding: 12px 8px; }
  .hero-copy { font-size: .9rem; }
  .actions { display: grid; grid-template-columns: 1fr; }
  .photo-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .photo-card { border-radius: 15px; }
}
@media (max-width: 390px) {
  .hero { display: block; }
  .photo-count { display: flex; align-items: baseline; gap: 6px; width: fit-content; margin-top: 20px; }
  .photo-count strong, .photo-count span { display: inline; }
}
</style>
