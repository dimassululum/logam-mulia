'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckCircle2, HeadphonesIcon, Lock, Mail, MapPin, Plus, Search, Store, Truck, UploadCloud, ChevronDown, ChevronUp } from 'lucide-react'
import { formatRupiah } from '@/core/lib/utils'
import AppBar from '@/shared/ui/AppBar'
import Button from '@/shared/ui/Button'
import RadioCard from '@/shared/ui/RadioCard'
import Modal from '@/shared/ui/Modal'
import Input from '@/shared/ui/Input'
import Card from '@/shared/ui/Card'
import {
  GuestCheckoutAddress,
  GuestCheckoutProfile,
  readGuestCheckoutProfile,
} from '@/features/checkout/guestCheckout'

// ── Types ─────────────────────────────────────────────────────────────────────
interface EkspedisiOption {
  id: string
  name: string
  time: string
  price: number
}

interface ButikOption {
  id: string
  name: string
  address: string
}

// ── Static data ───────────────────────────────────────────────────────────────
const EMPTY_ADDRESS: GuestCheckoutAddress = {
  fullName: '',
  phone: '',
  address: '',
  city: '',
  province: '',
  postalCode: '',
}

const EKSPEDISI_OPTIONS: EkspedisiOption[] = [
  { id: 'jne',   name: 'JNE Reguler',   time: '2-3 hari', price: 150000 },
  { id: 'jnt',   name: 'J&T Express',   time: '2-4 hari', price: 145000 },
  { id: 'paxel', name: 'Paxel Next Day', time: '1-2 hari', price: 160000 },
]

const BUTIK_OPTIONS: ButikOption[] = [
  { id: 'btk-jkt', name: 'Butik Emas LM - Graha Dipta', address: 'Jl. Pemuda No.1, Pulo Gadung, Jakarta Timur' },
  { id: 'btk-sby', name: 'Butik Emas LM - Surabaya',    address: 'Jl. Pemuda No.109, Embong Kaliasin, Surabaya' },
  { id: 'btk-bdg', name: 'Butik Emas LM - Bandung',     address: 'Jl. Ir. H. Juanda No.81, Dago, Bandung' },
]

const BANKS = [
  { id: 'bri',     name: 'BRI Virtual Account',     label: 'BRI' },
  { id: 'bca',     name: 'BCA Virtual Account',     label: 'BCA' },
  { id: 'mandiri', name: 'Mandiri Virtual Account', label: 'MANDIRI' },
  { id: 'bni',     name: 'BNI Virtual Account',     label: 'BNI' },
]

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const router = useRouter()
  const [paymentBank, setPaymentBank] = useState('bca')
  const [showEkspedisiModal, setShowEkspedisiModal] = useState(false)
  const [showButikModal, setShowButikModal] = useState(false)
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [showAddressFormModal, setShowAddressFormModal] = useState(false)
  const [showTotalDetails, setShowTotalDetails] = useState(false)
  const [deliveryType, setDeliveryType] = useState<'ekspedisi' | 'butik' | null>(null)
  const [selectedEkspedisi, setSelectedEkspedisi] = useState<EkspedisiOption | null>(null)
  const [selectedButik, setSelectedButik] = useState<ButikOption | null>(null)
  const [butikSearch, setButikSearch] = useState('')
  const [guestProfile, setGuestProfile] = useState<GuestCheckoutProfile | null>(null)
  const [ordererName, setOrdererName] = useState('')
  const [addressHistory, setAddressHistory] = useState<GuestCheckoutAddress[]>([])
  const [selectedAddress, setSelectedAddress] = useState<GuestCheckoutAddress | null>(null)
  const [addressForm, setAddressForm] = useState<GuestCheckoutAddress>(EMPTY_ADDRESS)

  useEffect(() => {
    const storedProfile = readGuestCheckoutProfile()

    if (!storedProfile) {
      router.replace(`/checkout/email${window.location.search}`)
      return
    }

    setGuestProfile(storedProfile)
    const storedAddresses = storedProfile.addresses ?? (storedProfile.address ? [storedProfile.address] : [])
    setOrdererName(storedProfile.ordererName ?? storedAddresses[0]?.fullName ?? '')
    setAddressHistory(storedAddresses)
    setSelectedAddress(storedAddresses[0] ?? null)
  }, [router])

  const handleSelectEkspedisi = (opt: EkspedisiOption) => {
    setSelectedEkspedisi(opt)
    setDeliveryType('ekspedisi')
    setShowEkspedisiModal(false)
  }

  const handleSelectButik = (opt: ButikOption) => {
    setSelectedButik(opt)
    setDeliveryType('butik')
    setShowButikModal(false)
  }

  const handleAddressChange = (field: keyof GuestCheckoutAddress, value: string) => {
    setAddressForm((current) => ({ ...current, [field]: value }))
  }

  const openNewAddressModal = () => {
    setAddressForm(EMPTY_ADDRESS)
    setShowAddressModal(false)
    setShowAddressFormModal(true)
  }

  const handleSaveAddress = () => {
    setAddressHistory((current) => [addressForm, ...current])
    setSelectedAddress(addressForm)
    setShowAddressFormModal(false)
    setShowAddressModal(false)
  }

  const shippingFee = deliveryType === 'ekspedisi' && selectedEkspedisi ? selectedEkspedisi.price : 0
  const total = 25400200 + shippingFee - 150000
  const canPay =
    deliveryType === 'ekspedisi'
      ? Boolean(selectedAddress && selectedEkspedisi)
      : deliveryType === 'butik'
        ? Boolean(selectedButik)
        : false

  const filteredButik = BUTIK_OPTIONS.filter(
    (b) =>
      b.name.toLowerCase().includes(butikSearch.toLowerCase()) ||
      b.address.toLowerCase().includes(butikSearch.toLowerCase()),
  )

  return (
    <div className="bg-surface min-h-screen pb-28">

      {/* ── AppBar ───────────────────────────────────────────────────────── */}
      <AppBar
        title="Checkout"
        rightSlot={
          <button className="text-gold-400 hover:text-gold-300 [transition-duration:var(--transition-fast)] transition-colors">
            <HeadphonesIcon className="w-6 h-6" />
          </button>
        }
      />

      <main className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-6">

        {/* ── Customer Data ───────────────────────────────────────────── */}
        <Card className="shadow-elevation-low">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="font-heading text-xl font-bold text-navy-900">Data Pemesan</h2>
            {guestProfile?.found && (
              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                Ditemukan
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              id="checkout-orderer-name"
              label="Nama Pemesan"
              placeholder="Nama pemesan"
              value={ordererName}
              onChange={(event) => setOrdererName(event.target.value)}
              required
            />
            <Input
              id="checkout-email"
              label="Email"
              value={guestProfile?.email ?? ''}
              leftIcon={<Mail className="h-4 w-4" />}
              readOnly
              className="bg-navy-50"
              required
            />
            <div className="sm:col-span-2">
              {guestProfile?.hasKtp ? (
                <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-success" />
                  <p className="font-semibold text-green-800">KTP tersimpan</p>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-navy-300 bg-surface p-6 text-center transition-colors [transition-duration:var(--transition-fast)] hover:bg-navy-50">
                  <UploadCloud className="mb-3 h-9 w-9 text-navy-400" />
                  <p className="mb-1 font-bold text-navy-900">Unggah KTP</p>
                  <p className="text-sm text-navy-500">JPG, PNG, atau PDF</p>
                  <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" />
                </label>
              )}
            </div>
          </div>
        </Card>

        {/* ── Order Summary ────────────────────────────────────────────── */}
        <section className="bg-white rounded-xl border border-navy-200 p-6 shadow-elevation-low">
          <h2 className="font-heading text-xl font-bold text-navy-900 mb-4">Ringkasan Pesanan</h2>
          <div className="flex flex-col gap-2">
            {[
              { src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCYse2pFYrKBwoXwWPZdjNppHX-bCm42fEe7U0ZlAGtNinGmJ8HKEQfjT0zjDM_iPTccYhgA_XWnFE7wmgcJlHuGvTcE1Q2EIS8tA5IEW3StZs_cQly7B0cFkrCX30j-hb6p-ekagP03NrUKy9WYBS6qr6Bvx8IVxONcfNpGg0ixlIZcRkt46k90Nzda2b6epBCVnjpdG6ZaZY2Ad-tQC0_CLnhCK73epy76qH9Yaca23EEg8-z0OaBC_LhCrUWsyLhvapSWQh8z5i6', name: 'Antam Logam Mulia 10 Gram', qty: 1, price: 12800000 },
              { src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDAgPrmzcyf6Ha9-Irt1r-tT2PrYhpibSq24d1wVcDzQyCZmwtrNqSeGxhTW5BaeJSTt3k5PLDiLPNyuMa_thb7qkWA5MiCpMNBaW-c_7mw_tbRIIZFG35yWfg-N9Of5NUNDON-ofUaUPZrJh0rMmX_eDk49A5_S9olw5QmL62ZdZxQBtZwVnVK9uskPwLhMipcQAZmRZfNnf0fY5oNsMjonOiTzUFOvlogS7Gb2G1aAh040aT20x89swrbzqJEOgLGpnvzIZphjx4Q', name: 'Antam Logam Mulia 5 Gram',  qty: 2, price: 12900000 },
            ].map((item, i) => (
              <div key={i} className={`flex items-start gap-3 py-3 ${i === 0 ? 'border-b border-navy-100' : ''}`}>
                <div className="w-16 h-16 bg-surface rounded-lg overflow-hidden border border-navy-200 flex-shrink-0 p-1">
                  <Image src={item.src} alt={item.name} width={64} height={64} className="object-contain w-full h-full" />
                </div>
                <div className="flex-grow">
                  <h3 className="font-bold text-navy-900 text-sm leading-tight">{item.name}</h3>
                  <p className="text-navy-500 text-xs mt-0.5">Jumlah: {item.qty}</p>
                </div>
                <p className="font-bold text-navy-900 text-sm">{formatRupiah(item.price)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Delivery Options ─────────────────────────────────────────── */}
        <section className="bg-white rounded-xl border border-navy-200 p-6 shadow-elevation-low">
          <h2 className="font-heading text-xl font-bold text-navy-900 mb-6">Opsi Penerimaan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RadioCard
              selected={deliveryType === 'ekspedisi'}
              onClick={() => setDeliveryType('ekspedisi')}
            >
              <div className="flex items-center gap-3 mb-2">
                <Truck className={`w-6 h-6 ${deliveryType === 'ekspedisi' ? 'text-gold-600' : 'text-navy-400'}`} />
                <span className="font-bold text-navy-900">Pengiriman Ekspedisi</span>
              </div>
              <p className="text-sm text-navy-500 mt-1">Kirim ke alamat tujuan.</p>
            </RadioCard>

            <RadioCard
              selected={deliveryType === 'butik'}
              onClick={() => setDeliveryType('butik')}
            >
              <div className="flex items-center gap-3 mb-2">
                <Store className={`w-6 h-6 ${deliveryType === 'butik' ? 'text-gold-600' : 'text-navy-400'}`} />
                <span className="font-bold text-navy-900">Ambil di Butik</span>
              </div>
              <p className="text-sm text-navy-500 mt-1">Ambil langsung di butik LM.</p>
            </RadioCard>
          </div>

          {deliveryType === 'ekspedisi' && (
            <div className="mt-5 space-y-4 rounded-xl border border-navy-200 bg-navy-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-bold text-navy-900">Alamat Pengiriman</h3>
                {addressHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowAddressModal(true)}
                    className="text-sm font-bold text-gold-600 transition-colors [transition-duration:var(--transition-fast)] hover:text-gold-500"
                  >
                    Ubah
                  </button>
                )}
              </div>

              {selectedAddress ? (
                <div className="flex items-start gap-3 rounded-xl border border-navy-200 bg-white p-4">
                  <MapPin className="mt-1 h-5 w-5 flex-shrink-0 text-navy-400" />
                  <div>
                    <p className="font-bold text-navy-900">{selectedAddress.fullName}</p>
                    <p className="mt-1 text-sm text-navy-600">{selectedAddress.phone}</p>
                    <p className="mt-2 text-sm text-navy-600">{selectedAddress.address}</p>
                    <p className="text-sm text-navy-600">
                      {selectedAddress.city}, {selectedAddress.province} {selectedAddress.postalCode}
                    </p>
                  </div>
                </div>
              ) : (
                <Button type="button" variant="secondary" fullWidth onClick={openNewAddressModal}>
                  <Plus className="h-4 w-4" />
                  Tambah Alamat Baru
                </Button>
              )}

              {selectedAddress && (
                <div className="rounded-xl border border-navy-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-navy-900">Ekspedisi</p>
                      {selectedEkspedisi ? (
                        <p className="mt-1 text-sm text-navy-600">
                          {selectedEkspedisi.name} · {selectedEkspedisi.time} · {formatRupiah(selectedEkspedisi.price)}
                        </p>
                      ) : (
                        <p className="mt-1 text-sm text-navy-500">Belum dipilih</p>
                      )}
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setShowEkspedisiModal(true)}>
                      Pilih
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {deliveryType === 'butik' && (
            <div className="mt-5 rounded-xl border border-navy-200 bg-navy-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-bold text-navy-900">Pilih Butik</h3>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowButikModal(true)}>
                  {selectedButik ? 'Ubah' : 'Pilih'}
                </Button>
              </div>

              {selectedButik && (
                <div className="mt-4 rounded-xl border border-navy-200 bg-white p-4">
                  <p className="font-bold text-gold-600">{selectedButik.name}</p>
                  <p className="mt-1 text-sm text-navy-600">{selectedButik.address}</p>
                  <p className="mt-2 text-sm font-bold text-green-600">Gratis biaya</p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── Payment Method ───────────────────────────────────────────── */}
        <section className="bg-white rounded-xl border border-navy-200 p-6 shadow-elevation-low">
          <h2 className="font-heading text-xl font-bold text-navy-900 mb-6">Metode Pembayaran</h2>
          <p className="font-bold text-navy-900 mb-4 text-sm uppercase tracking-wider">Virtual Account</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {BANKS.map((bank) => (
              <RadioCard
                key={bank.id}
                id={`bank-${bank.id}`}
                selected={paymentBank === bank.id}
                onClick={() => setPaymentBank(bank.id)}
              >
                <div className="flex items-center gap-3">
                  {/* Radio indicator */}
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 [transition-duration:var(--transition-fast)] transition-colors ${
                    paymentBank === bank.id ? 'border-gold-500 bg-gold-500' : 'border-navy-300'
                  }`}>
                    {paymentBank === bank.id && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  {/* Bank logo placeholder */}
                  <div className="w-14 h-8 bg-surface rounded border border-navy-100 flex items-center justify-center text-[10px] font-bold text-navy-600 flex-shrink-0">
                    {bank.label}
                  </div>
                  <span className="font-bold text-navy-900 text-sm">{bank.name}</span>
                </div>
              </RadioCard>
            ))}
          </div>
        </section>
      </main>

      {/* ── Ekspedisi Modal ──────────────────────────────────────────────── */}
      <Modal
        isOpen={showEkspedisiModal}
        onClose={() => setShowEkspedisiModal(false)}
        title="Pilih Ekspedisi"
        size="md"
      >
        <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto -mx-1 px-1">
          {EKSPEDISI_OPTIONS.map((opt) => (
            <RadioCard
              key={opt.id}
              selected={selectedEkspedisi?.id === opt.id}
              onClick={() => handleSelectEkspedisi(opt)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-navy-900">{opt.name}</p>
                  <p className="text-sm text-navy-500 mt-1">Estimasi: {opt.time}</p>
                </div>
                <p className="font-bold text-gold-600">{formatRupiah(opt.price)}</p>
              </div>
            </RadioCard>
          ))}
        </div>
      </Modal>

      {/* ── Butik Modal ──────────────────────────────────────────────────── */}
      <Modal
        isOpen={showButikModal}
        onClose={() => setShowButikModal(false)}
        title="Pilih Butik LM"
        size="md"
      >
        <div className="flex flex-col gap-4">
          <Input
            placeholder="Cari lokasi butik..."
            value={butikSearch}
            onChange={(e) => setButikSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
          <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto -mx-1 px-1">
            {filteredButik.map((opt) => (
              <RadioCard
                key={opt.id}
                selected={selectedButik?.id === opt.id}
                onClick={() => handleSelectButik(opt)}
              >
                <p className="font-bold text-navy-900">{opt.name}</p>
                <p className="text-sm text-navy-600 mt-2">{opt.address}</p>
              </RadioCard>
            ))}
          </div>
        </div>
      </Modal>

      {/* ── Address History Modal ───────────────────────────────────────── */}
      <Modal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        title="Pilih Alamat"
        size="md"
      >
        <div className="space-y-4">
          <div className="max-h-[55vh] space-y-3 overflow-y-auto px-1">
            {addressHistory.map((address, index) => (
              <RadioCard
                key={`${address.phone}-${index}`}
                selected={selectedAddress === address}
                onClick={() => {
                  setSelectedAddress(address)
                  setShowAddressModal(false)
                }}
              >
                <p className="font-bold text-navy-900">{address.fullName}</p>
                <p className="mt-1 text-sm text-navy-600">{address.phone}</p>
                <p className="mt-2 text-sm text-navy-600">{address.address}</p>
                <p className="text-sm text-navy-600">
                  {address.city}, {address.province} {address.postalCode}
                </p>
              </RadioCard>
            ))}
          </div>

          <Button type="button" variant="secondary" fullWidth onClick={openNewAddressModal}>
            <Plus className="h-4 w-4" />
            Tambah Alamat Baru
          </Button>
        </div>
      </Modal>

      {/* ── New Address Modal ───────────────────────────────────────────── */}
      <Modal
        isOpen={showAddressFormModal}
        onClose={() => setShowAddressFormModal(false)}
        title="Alamat Baru"
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              id="new-address-fullname"
              label="Nama Penerima"
              placeholder="Nama lengkap"
              value={addressForm.fullName}
              onChange={(event) => handleAddressChange('fullName', event.target.value)}
              required
            />
            <Input
              id="new-address-phone"
              label="Nomor HP"
              type="tel"
              placeholder="08xxxxxxxxxx"
              value={addressForm.phone}
              onChange={(event) => handleAddressChange('phone', event.target.value)}
              required
            />
            <Input
              id="new-address-city"
              label="Kota / Kabupaten"
              placeholder="Nama kota"
              value={addressForm.city}
              onChange={(event) => handleAddressChange('city', event.target.value)}
              required
            />
            <Input
              id="new-address-province"
              label="Provinsi"
              placeholder="Nama provinsi"
              value={addressForm.province}
              onChange={(event) => handleAddressChange('province', event.target.value)}
              required
            />
            <Input
              id="new-address-postal"
              label="Kode Pos"
              placeholder="12345"
              value={addressForm.postalCode}
              onChange={(event) => handleAddressChange('postalCode', event.target.value)}
              maxLength={5}
              required
            />
            <div className="sm:col-span-2">
              <label htmlFor="new-address-detail" className="mb-1.5 block text-sm font-medium text-navy-700">
                Alamat Lengkap <span className="text-red-500">*</span>
              </label>
              <textarea
                id="new-address-detail"
                rows={3}
                placeholder="Nama jalan, nomor rumah, RT/RW"
                className="input-base resize-none"
                value={addressForm.address}
                onChange={(event) => handleAddressChange('address', event.target.value)}
              />
            </div>
          </div>

          <Button type="button" size="lg" fullWidth onClick={handleSaveAddress}>
            Simpan Alamat
          </Button>
        </div>
      </Modal>

      {/* ── Sticky Bottom Total Summary ──────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 w-full z-30 bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.06)] border-t border-navy-200 transition-all duration-300">

        {/* Collapsible details */}
        <div className={`overflow-hidden [transition-duration:var(--transition-slow)] transition-all ${showTotalDetails ? 'max-h-64' : 'max-h-0'}`}>
          <div className="p-5 pb-2 border-b border-navy-100 bg-surface space-y-3">
            <h3 className="font-bold text-navy-900 mb-2">Rincian Pembayaran</h3>
            {[
              { label: 'Subtotal (3 item)', value: formatRupiah(25700000) },
              { label: 'Biaya Pengiriman', value: shippingFee ? formatRupiah(shippingFee) : 'Rp 0' },
              { label: 'Asuransi (0.2%)',  value: formatRupiah(50200) },
            ].map((row) => (
              <div key={row.label} className="flex justify-between text-navy-600 text-sm">
                <span>{row.label}</span><span>{row.value}</span>
              </div>
            ))}
            <div className="flex justify-between text-green-600 font-medium text-sm">
              <span>Potongan Voucher</span><span>-{formatRupiah(500000)}</span>
            </div>
          </div>
        </div>

        {/* Bar */}
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div
            className="flex flex-grow justify-between sm:justify-start items-center w-full sm:w-auto cursor-pointer hover:bg-navy-50 p-2 -mx-2 rounded-lg [transition-duration:var(--transition-fast)] transition-colors group"
            onClick={() => setShowTotalDetails(!showTotalDetails)}
          >
            <div className="flex flex-col">
              <span className="text-[11px] text-navy-500 font-bold uppercase tracking-wider mb-0.5">Total Keseluruhan</span>
              <span className="font-heading text-xl font-bold text-gold-600 leading-none">{formatRupiah(total)}</span>
            </div>
            <div className="flex items-center gap-1.5 sm:ml-6">
              <span className="text-[10px] font-bold text-gold-600 bg-gold-50 px-2 py-1 rounded border border-gold-200 group-hover:bg-gold-100 [transition-duration:var(--transition-fast)] transition-colors">
                {showTotalDetails ? 'Tutup Rincian' : 'Lihat Rincian'}
              </span>
              {showTotalDetails
                ? <ChevronDown className="w-5 h-5 text-navy-400 group-hover:text-navy-700" />
                : <ChevronUp className="w-5 h-5 text-navy-400 group-hover:text-navy-700" />
              }
            </div>
          </div>

          <Link href="/payment" className="w-full sm:w-auto">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={!canPay}
              className={!canPay ? 'opacity-50 cursor-not-allowed' : ''}
            >
              <Lock className="w-4 h-4" />
              Bayar Sekarang
            </Button>
          </Link>
        </div>
      </div>

    </div>
  )
}
