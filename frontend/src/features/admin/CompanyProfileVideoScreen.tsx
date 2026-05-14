'use client'

import { useEffect, useState } from 'react'
import { Film, Save, Upload } from 'lucide-react'
import { IconActionButton } from '@/features/admin/admin-ui'
import { fetchCompanyProfile, readProfileText, saveCompanyProfileItems } from '@/features/admin/company-profile-api'
import { CompanyProfileToast, SelectField, useCompanyProfileToast, type PublishStatus } from '@/features/admin/company-profile-shared'
import { AdminPageHeader, Button, Card, Input } from '@/shared/ui'

type VideoFormErrors = Partial<Record<'buttonTitle' | 'videoPreviewUrl' | 'form', string>>

const defaultVideoProfile = {
  videoStatus: 'active' as PublishStatus,
  buttonTitle: 'Mulai Sekarang',
  videoFileName: 'hero-bg.mp4',
  videoPreviewUrl: '/videos/hero-bg.mp4',
}

function FieldAlert({ message }: { message?: string }) {
  if (!message) return null

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
      {message}
    </div>
  )
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export default function CompanyProfileVideoScreen() {
  const { toast, showToast } = useCompanyProfileToast()
  const [isEditing, setIsEditing] = useState(false)
  const [videoStatus, setVideoStatus] = useState<PublishStatus>(defaultVideoProfile.videoStatus)
  const [buttonTitle, setButtonTitle] = useState(defaultVideoProfile.buttonTitle)
  const [videoFileName, setVideoFileName] = useState(defaultVideoProfile.videoFileName)
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(defaultVideoProfile.videoPreviewUrl)
  const [formErrors, setFormErrors] = useState<VideoFormErrors>({})

  useEffect(() => {
    let isMounted = true

    async function loadVideoProfile() {
      try {
        const profile = await fetchCompanyProfile()
        if (!isMounted) return

        const status = readProfileText(profile, 'hero_video_status', defaultVideoProfile.videoStatus)
        setVideoStatus(status === 'inactive' ? 'inactive' : 'active')
        setButtonTitle(readProfileText(profile, 'hero_video_button_title', defaultVideoProfile.buttonTitle))
        setVideoFileName(readProfileText(profile, 'hero_video_file_name', defaultVideoProfile.videoFileName))
        setVideoPreviewUrl(readProfileText(profile, 'hero_video_preview_url', defaultVideoProfile.videoPreviewUrl))
      } catch (error) {
        console.error('Error fetching hero video company profile', error)
        showToast('Gagal memuat video animasi.', 'error')
      }
    }

    loadVideoProfile()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    return () => {
      if (videoPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(videoPreviewUrl)
      }
    }
  }, [videoPreviewUrl])

  function clearFormError(field: keyof VideoFormErrors) {
    setFormErrors((current) => {
      if (!current[field] && !current.form) return current
      const next = { ...current }
      delete next[field]
      delete next.form
      return next
    })
  }

  async function handleVideoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    if (videoPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(videoPreviewUrl)
    }

    setVideoFileName(file.name)
    setVideoPreviewUrl(await fileToDataUrl(file))
    clearFormError('videoPreviewUrl')
  }

  function validateVideoSettings() {
    const nextErrors: VideoFormErrors = {}

    if (buttonTitle.trim().length < 2) {
      nextErrors.buttonTitle = 'Judul button minimal 2 karakter.'
    }
    if (!videoFileName.trim() || !videoPreviewUrl.trim()) {
      nextErrors.videoPreviewUrl = 'File video wajib dipilih.'
    }

    setFormErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function saveVideoSettings() {
    if (!validateVideoSettings()) return

    try {
      await saveCompanyProfileItems([
        { key: 'hero_video_status', value: videoStatus, type: 'text' },
        { key: 'hero_video_button_title', value: buttonTitle.trim(), type: 'text' },
        { key: 'hero_video_file_name', value: videoFileName.trim(), type: 'text' },
        { key: 'hero_video_preview_url', value: videoPreviewUrl.trim(), type: 'text' },
      ])
      setButtonTitle(buttonTitle.trim())
      setVideoFileName(videoFileName.trim())
      setIsEditing(false)
      setFormErrors({})
      showToast('Video animasi berhasil diperbarui.', 'success')
    } catch (error) {
      console.error('Error saving hero video company profile', error)
      setFormErrors({ form: 'Gagal menyimpan video animasi. Periksa data lalu coba lagi.' })
    }
  }

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Video Animasi"
        description="Kelola video animasi pada bagian atas halaman home."
      />

      <CompanyProfileToast toast={toast} />

      <Card padding="none" className="overflow-hidden border-navy-100 shadow-elevation-low">
        <div className="flex items-center justify-end gap-2 border-b border-navy-100 px-4 py-4 md:px-5">
          {isEditing ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsEditing(false)
                  setFormErrors({})
                }}
              >
                Batal
              </Button>
              <Button size="sm" onClick={saveVideoSettings}>
                <Save className="h-4 w-4" />
                Simpan
              </Button>
            </>
          ) : (
            <IconActionButton
              label="Edit video animasi"
              tone="edit"
              onClick={() => {
                setFormErrors({})
                setIsEditing(true)
              }}
            />
          )}
        </div>

        <div className="grid gap-4 p-4 md:p-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            {isEditing ? (
              <>
                <FieldAlert message={formErrors.form} />

                <SelectField
                  label="Status"
                  value={videoStatus}
                  onChange={(value) => setVideoStatus(value as PublishStatus)}
                  options={[
                    { value: 'active', label: 'Aktif' },
                    { value: 'inactive', label: 'Nonaktif' },
                  ]}
                />

                <Input
                  id="video-button-title"
                  label="Judul button"
                  value={buttonTitle}
                  error={formErrors.buttonTitle}
                  onChange={(event) => {
                    setButtonTitle(event.target.value)
                    clearFormError('buttonTitle')
                  }}
                />

                <label className="flex flex-col gap-1.5 text-sm font-medium text-navy-700">
                  <span>Upload video</span>
                  <label className={`flex min-h-28 cursor-pointer items-center justify-center rounded-2xl border border-dashed bg-navy-50 px-4 py-6 text-center transition-colors hover:border-gold-300 hover:bg-gold-50/40 ${formErrors.videoPreviewUrl ? 'border-red-400' : 'border-navy-200'}`}>
                    <input type="file" accept="video/*" className="hidden" onChange={handleVideoChange} />
                    <div className="space-y-2">
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white text-navy-500 shadow-elevation-low">
                        <Upload className="h-4 w-4" />
                      </div>
                      <p className="text-sm font-medium text-navy-900">{videoFileName || 'Pilih file video'}</p>
                      <p className="text-xs text-navy-500">Klik untuk pilih file baru</p>
                    </div>
                  </label>
                  {formErrors.videoPreviewUrl ? <p className="text-xs text-red-500">{formErrors.videoPreviewUrl}</p> : null}
                </label>
              </>
            ) : (
              <Card padding="md" className="border-navy-100">
                <div className="space-y-4 text-sm text-navy-700">
                  <div>
                    <p className="text-xs text-navy-500">Status</p>
                    <p className="mt-1 font-medium text-navy-900">{videoStatus === 'active' ? 'Aktif' : 'Nonaktif'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-navy-500">Judul button</p>
                    <p className="mt-1 font-medium text-navy-900">{buttonTitle}</p>
                  </div>
                  <div>
                    <p className="text-xs text-navy-500">File video</p>
                    <p className="mt-1 font-medium text-navy-900">{videoFileName}</p>
                  </div>
                </div>
              </Card>
            )}
          </div>

          <Card padding="md" className="border-navy-100">
            <div className="space-y-3">
              <p className="text-sm font-semibold text-navy-900">Preview video</p>
              <div className="overflow-hidden rounded-2xl bg-navy-950">
                {videoPreviewUrl ? (
                  <video controls muted playsInline className="aspect-video w-full object-cover">
                    <source src={videoPreviewUrl} />
                  </video>
                ) : (
                  <div className="flex aspect-video items-center justify-center text-navy-300">
                    <Film className="h-6 w-6" />
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </Card>
    </div>
  )
}
