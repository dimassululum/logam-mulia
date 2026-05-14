'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, Link2, Mail, Phone, Save, Video } from 'lucide-react'
import { adminSelectClassName, ManagementSection } from '@/features/admin/admin-management-shared'
import { InlineToast, type ToastTone } from '@/features/admin/admin-ui'
import { AdminPageHeader, Button, Card, Input } from '@/shared/ui'

export type PublishStatus = 'active' | 'inactive'

export function useCompanyProfileToast() {
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null)

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(null), 2200)
    return () => window.clearTimeout(timeout)
  }, [toast])

  return {
    toast,
    showToast: (message: string, tone: ToastTone) => setToast({ message, tone }),
  }
}

export function CompanyProfileHeader({
  title,
  description,
  onSave,
  saveLabel = 'Simpan',
}: {
  title: string
  description: string
  onSave: () => void
  saveLabel?: string
}) {
  return (
    <AdminPageHeader
      title={title}
      description={description}
      actions={
        <Button onClick={onSave}>
          <Save className="h-4 w-4" />
          {saveLabel}
        </Button>
      }
    />
  )
}

export function CompanyProfileToast({
  toast,
}: {
  toast: { message: string; tone: ToastTone } | null
}) {
  return <InlineToast toast={toast} />
}

export function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-navy-700">
      <span>{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${adminSelectClassName} appearance-none pr-12`}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
      </div>
    </label>
  )
}

export function TextareaField({
  label,
  value,
  rows = 4,
  error,
  onChange,
}: {
  label: string
  value: string
  rows?: number
  error?: string
  onChange: (value: string) => void
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-navy-700">
      <span>{label}</span>
      <textarea
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm text-navy-700 outline-none transition focus:ring-2 ${
          error
            ? 'border-red-400 focus:border-red-400 focus:ring-red-400/30'
            : 'border-navy-200 focus:border-gold-400 focus:ring-gold-400/30'
        }`}
      />
      {error ? <p className="text-xs text-red-500">{error}</p> : null}
    </label>
  )
}

export function UploadPlaceholder({
  title,
  caption,
}: {
  title: string
  caption: string
}) {
  return (
    <Card padding="md" className="border-dashed border-navy-200">
      <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl bg-navy-50 text-center">
        <Video className="h-6 w-6 text-navy-400" />
        <p className="mt-3 text-sm font-medium text-navy-700">{title}</p>
        <p className="mt-1 max-w-[240px] text-xs leading-5 text-navy-500">{caption}</p>
      </div>
    </Card>
  )
}

export function VideoSettingsSection({
  heroStatus,
  heroVideoUrl,
  heroPosterUrl,
  heroCtaLabel,
  heroCtaHref,
  onHeroStatusChange,
  onHeroVideoUrlChange,
  onHeroPosterUrlChange,
  onHeroCtaLabelChange,
  onHeroCtaHrefChange,
  onSave,
}: {
  heroStatus: PublishStatus
  heroVideoUrl: string
  heroPosterUrl: string
  heroCtaLabel: string
  heroCtaHref: string
  onHeroStatusChange: (value: PublishStatus) => void
  onHeroVideoUrlChange: (value: string) => void
  onHeroPosterUrlChange: (value: string) => void
  onHeroCtaLabelChange: (value: string) => void
  onHeroCtaHrefChange: (value: string) => void
  onSave: () => void
}) {
  return (
    <ManagementSection
      title="Video Awal"
      actions={
        <Button size="sm" onClick={onSave}>
          <Save className="h-4 w-4" />
          Simpan
        </Button>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-4 md:grid-cols-2">
          <SelectField
            label="Status"
            value={heroStatus}
            onChange={(value) => onHeroStatusChange(value as PublishStatus)}
            options={[
              { value: 'active', label: 'Aktif' },
              { value: 'inactive', label: 'Nonaktif' },
            ]}
          />
          <Input
            id="hero-cta-label"
            label="Label tombol"
            value={heroCtaLabel}
            onChange={(event) => onHeroCtaLabelChange(event.target.value)}
          />
          <Input
            id="hero-video-url"
            label="URL video"
            value={heroVideoUrl}
            onChange={(event) => onHeroVideoUrlChange(event.target.value)}
          />
          <Input
            id="hero-poster-url"
            label="URL poster / fallback"
            value={heroPosterUrl}
            onChange={(event) => onHeroPosterUrlChange(event.target.value)}
          />
          <Input
            id="hero-cta-href"
            label="Link tombol"
            value={heroCtaHref}
            onChange={(event) => onHeroCtaHrefChange(event.target.value)}
          />
        </div>

        <UploadPlaceholder
          title="Upload video awal"
          caption="Mock URL dan poster sudah cukup untuk review. Integrasi uploader bisa disambungkan nanti."
        />
      </div>
    </ManagementSection>
  )
}

export function FooterPreviewCard({
  brandName,
  phone,
  email,
  instagram,
  facebook,
  mapsEmbed,
}: {
  brandName: string
  phone: string
  email: string
  instagram: string
  facebook: string
  mapsEmbed: string
}) {
  return (
    <Card padding="md" className="border-navy-100">
      <div className="space-y-4">
        <p className="text-sm font-semibold text-navy-900">Field yang dikelola</p>
        <div className="space-y-3">
          <div className="rounded-2xl bg-navy-50 px-4 py-3 text-sm text-navy-700">{brandName || 'Nama brand'}</div>
          <div className="flex items-center gap-3 rounded-2xl bg-navy-50 px-4 py-3">
            <Phone className="h-4 w-4 text-navy-500" />
            <span className="text-sm text-navy-700">{phone || 'Nomor telepon'}</span>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-navy-50 px-4 py-3">
            <Mail className="h-4 w-4 text-navy-500" />
            <span className="text-sm text-navy-700">{email || 'Alamat email'}</span>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-navy-50 px-4 py-3">
            <Link2 className="h-4 w-4 text-navy-500" />
            <span className="truncate text-sm text-navy-700">{instagram || 'Link instagram'}</span>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-navy-50 px-4 py-3">
            <Link2 className="h-4 w-4 text-navy-500" />
            <span className="truncate text-sm text-navy-700">{facebook || 'Link facebook'}</span>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-navy-50 px-4 py-3">
            <Link2 className="h-4 w-4 text-navy-500" />
            <span className="truncate text-sm text-navy-700">{mapsEmbed || 'Link maps'}</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
