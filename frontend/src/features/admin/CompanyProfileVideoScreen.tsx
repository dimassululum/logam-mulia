'use client'

import { useEffect, useState } from 'react'
import { Film, Save, Upload } from 'lucide-react'
import { CompanyProfileToast, SelectField, useCompanyProfileToast, type PublishStatus } from '@/features/admin/company-profile-shared'
import { IconActionButton } from '@/features/admin/admin-ui'
import { AdminPageHeader, Button, Card, Input } from '@/shared/ui'

export default function CompanyProfileVideoScreen() {
  const { toast, showToast } = useCompanyProfileToast()
  const [isEditing, setIsEditing] = useState(false)
  const [videoStatus, setVideoStatus] = useState<PublishStatus>('active')
  const [buttonTitle, setButtonTitle] = useState('Mulai Sekarang')
  const [videoFileName, setVideoFileName] = useState('hero-bg.mp4')
  const [videoPreviewUrl, setVideoPreviewUrl] = useState('/videos/hero-bg.mp4')

  useEffect(() => {
    return () => {
      if (videoPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(videoPreviewUrl)
      }
    }
  }, [videoPreviewUrl])

  function handleVideoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    if (videoPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(videoPreviewUrl)
    }

    setVideoFileName(file.name)
    setVideoPreviewUrl(URL.createObjectURL(file))
  }

  function saveVideoSettings() {
    if (!buttonTitle.trim()) {
      showToast('Judul button wajib diisi.', 'error')
      return
    }

    if (!videoFileName.trim()) {
      showToast('File video belum dipilih.', 'error')
      return
    }

    setIsEditing(false)
    showToast('Video animasi berhasil diperbarui.', 'success')
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
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                Batal
              </Button>
              <Button size="sm" onClick={saveVideoSettings}>
                <Save className="h-4 w-4" />
                Simpan
              </Button>
            </>
          ) : (
            <IconActionButton label="Edit video animasi" tone="edit" onClick={() => setIsEditing(true)} />
          )}
        </div>

        <div className="grid gap-4 p-4 md:p-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            {isEditing ? (
              <>
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
                  onChange={(event) => setButtonTitle(event.target.value)}
                />

                <label className="flex flex-col gap-1.5 text-sm font-medium text-navy-700">
                  <span>Upload video</span>
                  <label className="flex min-h-28 cursor-pointer items-center justify-center rounded-2xl border border-dashed border-navy-200 bg-navy-50 px-4 py-6 text-center transition-colors hover:border-gold-300 hover:bg-gold-50/40">
                    <input type="file" accept="video/*" className="hidden" onChange={handleVideoChange} />
                    <div className="space-y-2">
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white text-navy-500 shadow-elevation-low">
                        <Upload className="h-4 w-4" />
                      </div>
                      <p className="text-sm font-medium text-navy-900">{videoFileName || 'Pilih file video'}</p>
                      <p className="text-xs text-navy-500">Klik untuk pilih file baru</p>
                    </div>
                  </label>
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
