'use client'

import { Building2, MapPin, Save, Share2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { adminSelectClassName } from '@/features/admin/admin-management-shared'
import { CompanyProfileToast, TextareaField, useCompanyProfileToast, type PublishStatus } from '@/features/admin/company-profile-shared'
import { IconActionButton } from '@/features/admin/admin-ui'
import { AdminPageHeader, Badge, Button, Card, Input, Modal } from '@/shared/ui'

interface SocialMediaRecord {
  id: string
  name: string
  status: PublishStatus
  link: string
}

const initialSocialMedia: SocialMediaRecord[] = [
  { id: 'social-instagram', name: 'Instagram', status: 'active', link: 'https://instagram.com/logammuliaantam' },
  { id: 'social-tiktok', name: 'TikTok', status: 'inactive', link: 'https://tiktok.com/@logammuliaantam' },
  { id: 'social-facebook', name: 'Facebook', status: 'active', link: 'https://facebook.com/logammuliaantam' },
  { id: 'social-shopee', name: 'Shopee', status: 'active', link: 'https://shopee.co.id/logammuliaantam' },
  { id: 'social-tokopedia', name: 'Tokopedia', status: 'active', link: 'https://tokopedia.com/logammuliaantam' },
]

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
      <div className="text-sm text-navy-800">{value}</div>
    </div>
  )
}

export default function CompanyProfileFooterScreen() {
  const { toast, showToast } = useCompanyProfileToast()
  const [isEditingGeneral, setIsEditingGeneral] = useState(false)
  const [isEditingContact, setIsEditingContact] = useState(false)
  const [companyName, setCompanyName] = useState('Logam Mulia Antam')
  const [companyDescription, setCompanyDescription] = useState(
    'Distributor resmi logam mulia Antam, menyediakan solusi investasi emas yang aman dan transparan.',
  )
  const [companyLogoName, setCompanyLogoName] = useState('logo-antam-gold.png')
  const [companyLogoPreview, setCompanyLogoPreview] = useState('/images/logo.png')
  const [address, setAddress] = useState(
    'Unit Bisnis Pengolahan dan Pemurnian Logam Mulia Gedung Graha Dipta. Jalan Pemuda, No.1 Jatinegara Kaum, Pulo Gadung, Jakarta 13250',
  )
  const [googleMapsLink, setGoogleMapsLink] = useState('https://maps.google.com/?q=Graha+Dipta+Pulogadung')
  const [whatsAppContact, setWhatsAppContact] = useState('https://wa.me/6281212345678')
  const [socialMediaRows, setSocialMediaRows] = useState(initialSocialMedia)
  const [editingSocial, setEditingSocial] = useState<SocialMediaRecord | null>(null)

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

  function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    if (companyLogoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(companyLogoPreview)
    }

    setCompanyLogoName(file.name)
    setCompanyLogoPreview(URL.createObjectURL(file))
  }

  function saveGeneralInformation() {
    if (!companyName.trim() || !companyDescription.trim()) {
      showToast('Lengkapi nama dan deskripsi perusahaan terlebih dahulu.', 'error')
      return
    }

    setIsEditingGeneral(false)
    showToast('Informasi umum berhasil diperbarui.', 'success')
  }

  function saveContactInformation() {
    if (!address.trim() || !googleMapsLink.trim() || !whatsAppContact.trim()) {
      showToast('Lengkapi alamat, link GMaps, dan kontak WhatsApp.', 'error')
      return
    }

    setIsEditingContact(false)
    showToast('Alamat dan kontak berhasil diperbarui.', 'success')
  }

  function saveSocialMedia() {
    if (!editingSocial) return
    if (!editingSocial.link.trim()) {
      showToast('Link media sosial wajib diisi.', 'error')
      return
    }

    setSocialMediaRows((current) =>
      current.map((item) => (item.id === editingSocial.id ? editingSocial : item)),
    )
    setEditingSocial(null)
    showToast('Media sosial berhasil diperbarui.', 'success')
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
                <Button variant="ghost" size="sm" onClick={() => setIsEditingGeneral(false)}>
                  Batal
                </Button>
                <Button size="sm" onClick={saveGeneralInformation}>
                  <Save className="h-4 w-4" />
                  Simpan
                </Button>
              </div>
            ) : (
              <IconActionButton label="Edit informasi umum" tone="edit" onClick={() => setIsEditingGeneral(true)} />
            )
          }
        >
            {isEditingGeneral ? (
              <div className="space-y-4">
                <Input
                  id="company-name"
                  label="Nama perusahaan"
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                />

                <TextareaField
                  label="Deskripsi perusahaan"
                  value={companyDescription}
                  onChange={setCompanyDescription}
                  rows={4}
                />

                <label className="flex flex-col gap-1.5 text-sm font-medium text-navy-700">
                  <span>Logo perusahaan</span>
                  <label className="flex min-h-28 cursor-pointer items-center justify-center rounded-2xl border border-dashed border-navy-200 bg-navy-50 px-4 py-6 text-center transition-colors hover:border-gold-300 hover:bg-gold-50/40">
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-navy-900">{companyLogoName || 'Pilih logo perusahaan'}</p>
                      <p className="text-xs text-navy-500">Klik untuk upload atau ganti logo</p>
                    </div>
                  </label>
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
                <Button variant="ghost" size="sm" onClick={() => setIsEditingContact(false)}>
                  Batal
                </Button>
                <Button size="sm" onClick={saveContactInformation}>
                  <Save className="h-4 w-4" />
                  Simpan
                </Button>
              </div>
            ) : (
              <IconActionButton label="Edit alamat dan kontak" tone="edit" onClick={() => setIsEditingContact(true)} />
            )
          }
        >
            {isEditingContact ? (
              <div className="space-y-4">
                <TextareaField
                  label="Alamat"
                  value={address}
                  onChange={setAddress}
                  rows={4}
                />
                <Input
                  id="company-gmaps"
                  label="Link GMaps"
                  value={googleMapsLink}
                  onChange={(event) => setGoogleMapsLink(event.target.value)}
                />
                <Input
                  id="company-whatsapp"
                  label="Kontak WhatsApp admin/CS"
                  value={whatsAppContact}
                  onChange={(event) => setWhatsAppContact(event.target.value)}
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
                        <td className="px-5 py-4 text-sm text-navy-700">{item.link}</td>
                        <td className="px-5 py-4">
                          <IconActionButton label={`Edit ${item.name}`} tone="edit" onClick={() => setEditingSocial(item)} />
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
                          <p className="mt-1 text-sm text-navy-500">{item.link}</p>
                        </div>
                        <Badge variant={item.status} />
                      </div>
                      <div className="flex justify-end">
                        <IconActionButton label={`Edit ${item.name}`} tone="edit" onClick={() => setEditingSocial(item)} />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
        </SectionCard>
      </div>

      <Modal isOpen={editingSocial !== null} onClose={() => setEditingSocial(null)} title="Edit Media Sosial" size="md">
        <div className="space-y-4">
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
            onChange={(event) =>
              setEditingSocial((current) => current ? { ...current, link: event.target.value } : current)
            }
          />

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setEditingSocial(null)}>Batal</Button>
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
