'use client'

import { Building2, MapPin, Save, Share2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { adminSelectClassName } from '@/features/admin/admin-management-shared'
import { IconActionButton } from '@/features/admin/admin-ui'
import { fetchCompanyProfile, readProfileJson, readProfileText, saveCompanyProfileItems } from '@/features/admin/company-profile-api'
import { CompanyProfileToast, TextareaField, useCompanyProfileToast, type PublishStatus } from '@/features/admin/company-profile-shared'
import { AdminPageHeader, Badge, Button, Card, Input, Modal } from '@/shared/ui'
import { formatLocalWhatsAppPhone, isValidWhatsAppPhone } from '@/core/lib/contact'

interface SocialMediaRecord {
  id: string
  name: string
  status: PublishStatus
  link: string
}

type GeneralErrors = Partial<Record<'companyName' | 'companyDescription' | 'companyLogoPreview' | 'form', string>>
type ContactErrors = Partial<Record<'address' | 'googleMapsLink' | 'whatsAppContact' | 'form', string>>
type SocialErrors = Partial<Record<'link' | 'form', string>>

const initialSocialMedia: SocialMediaRecord[] = [
  { id: 'social-instagram', name: 'Instagram', status: 'active', link: 'https://instagram.com/logammuliaantam' },
  { id: 'social-tiktok', name: 'TikTok', status: 'inactive', link: 'https://tiktok.com/@logammuliaantam' },
  { id: 'social-facebook', name: 'Facebook', status: 'active', link: 'https://facebook.com/logammuliaantam' },
  { id: 'social-shopee', name: 'Shopee', status: 'active', link: 'https://shopee.co.id/logammuliaantam' },
  { id: 'social-tokopedia', name: 'Tokopedia', status: 'active', link: 'https://tokopedia.com/logammuliaantam' },
]

const defaultFooter = {
  companyName: 'Logam Mulia Antam',
  companyDescription: 'Distributor resmi logam mulia Antam, menyediakan solusi investasi emas yang aman dan transparan.',
  companyLogoName: 'logo-antam-gold.png',
  companyLogoPreview: '/images/logo.png',
  address: 'Unit Bisnis Pengolahan dan Pemurnian Logam Mulia Gedung Graha Dipta. Jalan Pemuda, No.1 Jatinegara Kaum, Pulo Gadung, Jakarta 13250',
  googleMapsLink: 'https://maps.google.com/?q=Graha+Dipta+Pulogadung',
  whatsAppContact: '081212345678',
}

function SectionCard({
  title,
  icon,
  actions,
  children,
}: {
  title: string
  icon: React.ReactNode
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Card padding="md" className="border-navy-100 shadow-elevation-low">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gold-50 text-gold-700">
            {icon}
          </div>
          <h2 className="text-lg font-semibold text-navy-900">{title}</h2>
        </div>
        {actions}
      </div>
      {children}
    </Card>
  )
}

function MetaRow({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="grid gap-1 sm:grid-cols-[170px_minmax(0,1fr)] sm:gap-3">
      <p className="text-sm text-navy-500">{label}</p>
      <div className="break-words text-sm text-navy-800">{value}</div>
    </div>
  )
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

function normalizeUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return trimmed
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(normalizeUrl(value))
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export default function CompanyProfileFooterScreen() {
  const { toast, showToast } = useCompanyProfileToast()
  const [isEditingGeneral, setIsEditingGeneral] = useState(false)
  const [isEditingContact, setIsEditingContact] = useState(false)
  const [companyName, setCompanyName] = useState(defaultFooter.companyName)
  const [companyDescription, setCompanyDescription] = useState(defaultFooter.companyDescription)
  const [companyLogoName, setCompanyLogoName] = useState(defaultFooter.companyLogoName)
  const [companyLogoPreview, setCompanyLogoPreview] = useState(defaultFooter.companyLogoPreview)
  const [address, setAddress] = useState(defaultFooter.address)
  const [googleMapsLink, setGoogleMapsLink] = useState(defaultFooter.googleMapsLink)
  const [whatsAppContact, setWhatsAppContact] = useState(defaultFooter.whatsAppContact)
  const [socialMediaRows, setSocialMediaRows] = useState(initialSocialMedia)
  const [editingSocial, setEditingSocial] = useState<SocialMediaRecord | null>(null)
  const [generalErrors, setGeneralErrors] = useState<GeneralErrors>({})
  const [contactErrors, setContactErrors] = useState<ContactErrors>({})
  const [socialErrors, setSocialErrors] = useState<SocialErrors>({})

  useEffect(() => {
    let isMounted = true

    async function loadFooterProfile() {
      try {
        const profile = await fetchCompanyProfile()
        if (!isMounted) return

        setCompanyName(readProfileText(profile, 'footer_company_name', defaultFooter.companyName))
        setCompanyDescription(readProfileText(profile, 'footer_company_description', defaultFooter.companyDescription))
        setCompanyLogoName(readProfileText(profile, 'footer_company_logo_name', defaultFooter.companyLogoName))
        setCompanyLogoPreview(readProfileText(profile, 'footer_company_logo_preview', defaultFooter.companyLogoPreview))
        setAddress(readProfileText(profile, 'footer_address', defaultFooter.address))
        setGoogleMapsLink(readProfileText(profile, 'footer_google_maps_link', defaultFooter.googleMapsLink))
        setWhatsAppContact(formatLocalWhatsAppPhone(readProfileText(profile, 'footer_whatsapp_contact', defaultFooter.whatsAppContact)))
        setSocialMediaRows(readProfileJson(profile, 'footer_social_media', initialSocialMedia))
      } catch (error) {
        console.error('Error fetching footer company profile', error)
        showToast('Gagal memuat informasi perusahaan.', 'error')
      }
    }

    loadFooterProfile()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    return () => {
      if (companyLogoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(companyLogoPreview)
      }
    }
  }, [companyLogoPreview])

  const activeSocialCount = useMemo(
    () => socialMediaRows.filter((item) => item.status === 'active').length,
    [socialMediaRows],
  )

  function clearGeneralError(field: keyof GeneralErrors) {
    setGeneralErrors((current) => {
      if (!current[field] && !current.form) return current
      const next = { ...current }
      delete next[field]
      delete next.form
      return next
    })
  }

  function clearContactError(field: keyof ContactErrors) {
    setContactErrors((current) => {
      if (!current[field] && !current.form) return current
      const next = { ...current }
      delete next[field]
      delete next.form
      return next
    })
  }

  function clearSocialError(field: keyof SocialErrors) {
    setSocialErrors((current) => {
      if (!current[field] && !current.form) return current
      const next = { ...current }
      delete next[field]
      delete next.form
      return next
    })
  }

  async function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    if (companyLogoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(companyLogoPreview)
    }

    setCompanyLogoName(file.name)
    setCompanyLogoPreview(await fileToDataUrl(file))
    clearGeneralError('companyLogoPreview')
  }

  function validateGeneralInformation() {
    const nextErrors: GeneralErrors = {}

    if (companyName.trim().length < 2) {
      nextErrors.companyName = 'Nama perusahaan minimal 2 karakter.'
    }
    if (companyDescription.trim().length < 10) {
      nextErrors.companyDescription = 'Deskripsi perusahaan minimal 10 karakter.'
    }
    if (!companyLogoPreview.trim()) {
      nextErrors.companyLogoPreview = 'Logo perusahaan wajib dipilih.'
    }

    setGeneralErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function validateContactInformation() {
    const nextErrors: ContactErrors = {}

    if (address.trim().length < 5) {
      nextErrors.address = 'Alamat minimal 5 karakter.'
    }
    if (!isValidHttpUrl(googleMapsLink)) {
      nextErrors.googleMapsLink = 'Link GMaps harus berupa URL yang valid.'
    }
    if (!isValidWhatsAppPhone(whatsAppContact)) {
      nextErrors.whatsAppContact = 'Masukkan nomor WhatsApp valid, contoh: 085812345678.'
    }

    setContactErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function validateSocialMedia() {
    const nextErrors: SocialErrors = {}

    if (!editingSocial?.link.trim()) {
      nextErrors.link = 'Link media sosial wajib diisi.'
    } else if (!isValidHttpUrl(editingSocial.link)) {
      nextErrors.link = 'Link media sosial harus berupa URL yang valid.'
    }

    setSocialErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function saveGeneralInformation() {
    if (!validateGeneralInformation()) return

    try {
      await saveCompanyProfileItems([
        { key: 'footer_company_name', value: companyName.trim(), type: 'text' },
        { key: 'footer_company_description', value: companyDescription.trim(), type: 'text' },
        { key: 'footer_company_logo_name', value: companyLogoName.trim() || 'logo-perusahaan', type: 'text' },
        { key: 'footer_company_logo_preview', value: companyLogoPreview.trim(), type: 'image' },
      ])
      setCompanyName(companyName.trim())
      setCompanyDescription(companyDescription.trim())
      setCompanyLogoName(companyLogoName.trim() || 'logo-perusahaan')
      setIsEditingGeneral(false)
      setGeneralErrors({})
      showToast('Informasi umum berhasil diperbarui.', 'success')
    } catch (error) {
      console.error('Error saving general company profile', error)
      setGeneralErrors({ form: 'Gagal menyimpan informasi umum. Periksa data lalu coba lagi.' })
    }
  }

  async function saveContactInformation() {
    if (!validateContactInformation()) return

    const normalizedGoogleMapsLink = normalizeUrl(googleMapsLink)
    const normalizedWhatsAppContact = formatLocalWhatsAppPhone(whatsAppContact)

    try {
      await saveCompanyProfileItems([
        { key: 'footer_address', value: address.trim(), type: 'text' },
        { key: 'footer_google_maps_link', value: normalizedGoogleMapsLink, type: 'text' },
        { key: 'footer_whatsapp_contact', value: normalizedWhatsAppContact, type: 'text' },
      ])
      setAddress(address.trim())
      setGoogleMapsLink(normalizedGoogleMapsLink)
      setWhatsAppContact(normalizedWhatsAppContact)
      setIsEditingContact(false)
      setContactErrors({})
      showToast('Alamat dan kontak berhasil diperbarui.', 'success')
    } catch (error) {
      console.error('Error saving contact company profile', error)
      setContactErrors({ form: 'Gagal menyimpan alamat dan kontak. Periksa data lalu coba lagi.' })
    }
  }

  async function saveSocialMedia() {
    if (!editingSocial || !validateSocialMedia()) return

    const normalizedSocial: SocialMediaRecord = {
      ...editingSocial,
      link: normalizeUrl(editingSocial.link),
    }
    const nextRows = socialMediaRows.map((item) => (item.id === normalizedSocial.id ? normalizedSocial : item))

    try {
      await saveCompanyProfileItems([
        { key: 'footer_social_media', value: JSON.stringify(nextRows), type: 'list' },
      ])
      setSocialMediaRows(nextRows)
      setEditingSocial(null)
      setSocialErrors({})
      showToast('Media sosial berhasil diperbarui.', 'success')
    } catch (error) {
      console.error('Error saving social media company profile', error)
      setSocialErrors({ form: 'Gagal menyimpan media sosial. Periksa data lalu coba lagi.' })
    }
  }

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Informasi Perusahaan"
        description="Kelola informasi perusahaan yang ditampilkan pada bagian footer halaman home."
      />

      <CompanyProfileToast toast={toast} />

      <div className="space-y-4">
        <SectionCard
          title="Informasi Umum"
          icon={<Building2 className="h-5 w-5" />}
          actions={
            isEditingGeneral ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsEditingGeneral(false)
                    setGeneralErrors({})
                  }}
                >
                  Batal
                </Button>
                <Button size="sm" onClick={saveGeneralInformation}>
                  <Save className="h-4 w-4" />
                  Simpan
                </Button>
              </div>
            ) : (
              <IconActionButton
                label="Edit informasi umum"
                tone="edit"
                onClick={() => {
                  setGeneralErrors({})
                  setIsEditingGeneral(true)
                }}
              />
            )
          }
        >
          {isEditingGeneral ? (
            <div className="space-y-4">
              <FieldAlert message={generalErrors.form} />

              <Input
                id="company-name"
                label="Nama perusahaan"
                value={companyName}
                error={generalErrors.companyName}
                onChange={(event) => {
                  setCompanyName(event.target.value)
                  clearGeneralError('companyName')
                }}
              />

              <TextareaField
                label="Deskripsi perusahaan"
                value={companyDescription}
                error={generalErrors.companyDescription}
                onChange={(value) => {
                  setCompanyDescription(value)
                  clearGeneralError('companyDescription')
                }}
                rows={4}
              />

              <label className="flex flex-col gap-1.5 text-sm font-medium text-navy-700">
                <span>Logo perusahaan</span>
                <label className={`flex min-h-28 cursor-pointer items-center justify-center rounded-2xl border border-dashed bg-navy-50 px-4 py-6 text-center transition-colors hover:border-gold-300 hover:bg-gold-50/40 ${generalErrors.companyLogoPreview ? 'border-red-400' : 'border-navy-200'}`}>
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-navy-900">{companyLogoName || 'Pilih logo perusahaan'}</p>
                    <p className="text-xs text-navy-500">Klik untuk upload atau ganti logo</p>
                  </div>
                </label>
                {generalErrors.companyLogoPreview ? <p className="text-xs text-red-500">{generalErrors.companyLogoPreview}</p> : null}
              </label>

              {companyLogoPreview && (
                <Card padding="sm" className="border-navy-100">
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-navy-900">Preview logo</p>
                    <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-navy-100 bg-navy-50">
                      <img src={companyLogoPreview} alt={companyName} className="h-full w-full object-contain" />
                    </div>
                  </div>
                </Card>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <MetaRow label="Nama perusahaan" value={companyName} />
              <MetaRow label="Deskripsi perusahaan" value={companyDescription} />
              <MetaRow
                label="Logo perusahaan"
                value={
                  <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-navy-100 bg-navy-50">
                    <img src={companyLogoPreview} alt={companyName} className="h-full w-full object-contain" />
                  </div>
                }
              />
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Alamat dan Kontak"
          icon={<MapPin className="h-5 w-5" />}
          actions={
            isEditingContact ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsEditingContact(false)
                    setContactErrors({})
                  }}
                >
                  Batal
                </Button>
                <Button size="sm" onClick={saveContactInformation}>
                  <Save className="h-4 w-4" />
                  Simpan
                </Button>
              </div>
            ) : (
              <IconActionButton
                label="Edit alamat dan kontak"
                tone="edit"
                onClick={() => {
                  setContactErrors({})
                  setIsEditingContact(true)
                }}
              />
            )
          }
        >
          {isEditingContact ? (
            <div className="space-y-4">
              <FieldAlert message={contactErrors.form} />

              <TextareaField
                label="Alamat"
                value={address}
                error={contactErrors.address}
                onChange={(value) => {
                  setAddress(value)
                  clearContactError('address')
                }}
                rows={4}
              />
              <Input
                id="company-gmaps"
                label="Link GMaps"
                value={googleMapsLink}
                error={contactErrors.googleMapsLink}
                onChange={(event) => {
                  setGoogleMapsLink(event.target.value)
                  clearContactError('googleMapsLink')
                }}
              />
              <Input
                id="company-whatsapp"
                label="Kontak WhatsApp admin/CS"
                placeholder="085812345678"
                type="tel"
                value={whatsAppContact}
                error={contactErrors.whatsAppContact}
                onChange={(event) => {
                  setWhatsAppContact(event.target.value)
                  clearContactError('whatsAppContact')
                }}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <MetaRow label="Alamat" value={address} />
              <MetaRow label="Link GMaps" value={googleMapsLink} />
              <MetaRow label="Kontak WhatsApp admin/CS" value={whatsAppContact} />
            </div>
          )}
        </SectionCard>

        <SectionCard title="Media Sosial" icon={<Share2 className="h-5 w-5" />}>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-navy-500">Total aktif: {activeSocialCount} dari {socialMediaRows.length}</p>
            </div>

            <div className="hidden overflow-x-auto rounded-2xl border border-navy-100 bg-white md:block">
              <table className="w-full min-w-[680px] divide-y divide-navy-100">
                <thead className="bg-navy-50/80">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-navy-500">Nama Sosmed</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-navy-500">Status</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-navy-500">Link</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-navy-500">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-100">
                  {socialMediaRows.map((item) => (
                    <tr key={item.id} className="hover:bg-gold-50/40">
                      <td className="px-5 py-4 text-sm font-semibold text-navy-900">{item.name}</td>
                      <td className="px-5 py-4"><Badge variant={item.status} /></td>
                      <td className="max-w-[360px] break-words px-5 py-4 text-sm text-navy-700">{item.link}</td>
                      <td className="px-5 py-4">
                        <IconActionButton
                          label={`Edit ${item.name}`}
                          tone="edit"
                          onClick={() => {
                            setSocialErrors({})
                            setEditingSocial(item)
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 md:hidden">
              {socialMediaRows.map((item) => (
                <Card key={item.id} padding="sm" className="border-navy-100">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-navy-900">{item.name}</p>
                        <p className="mt-1 break-words text-sm text-navy-500">{item.link}</p>
                      </div>
                      <Badge variant={item.status} />
                    </div>
                    <div className="flex justify-end">
                      <IconActionButton
                        label={`Edit ${item.name}`}
                        tone="edit"
                        onClick={() => {
                          setSocialErrors({})
                          setEditingSocial(item)
                        }}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </SectionCard>
      </div>

      <Modal
        isOpen={editingSocial !== null}
        onClose={() => {
          setEditingSocial(null)
          setSocialErrors({})
        }}
        title="Edit Media Sosial"
        size="md"
      >
        <div className="space-y-4">
          <FieldAlert message={socialErrors.form} />

          <Input
            id="social-name"
            label="Nama sosmed"
            value={editingSocial?.name ?? ''}
            disabled
          />

          <label className="flex flex-col gap-1.5 text-sm font-medium text-navy-700">
            Status
            <div className="relative">
              <select
                value={editingSocial?.status ?? 'inactive'}
                onChange={(event) =>
                  setEditingSocial((current) => current ? { ...current, status: event.target.value as PublishStatus } : current)
                }
                className={adminSelectClassName}
              >
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
              </select>
            </div>
          </label>

          <Input
            id="social-link"
            label="Link"
            value={editingSocial?.link ?? ''}
            error={socialErrors.link}
            onChange={(event) => {
              setEditingSocial((current) => current ? { ...current, link: event.target.value } : current)
              clearSocialError('link')
            }}
          />

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="ghost"
              onClick={() => {
                setEditingSocial(null)
                setSocialErrors({})
              }}
            >
              Batal
            </Button>
            <Button onClick={saveSocialMedia}>
              <Save className="h-4 w-4" />
              Simpan
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
