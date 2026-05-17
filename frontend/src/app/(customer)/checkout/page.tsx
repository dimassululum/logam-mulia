'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { CheckCircle2, HeadphonesIcon, Lock, Mail, MapPin, Plus, Search, Store, Truck, UploadCloud, ChevronDown, ChevronUp } from 'lucide-react'
import { formatRupiah } from '@/core/lib/utils'
import { resolvePublicApiBaseUrl } from '@/core/lib/public-url'
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
  saveCheckoutCustomerProfile,
} from '@/features/checkout/guestCheckout'
import {
  calculateVoucherDiscount,
  ClaimedVoucher,
  LocalCartItem,
  readCartItems,
  readCheckoutItems,
  readCheckoutVoucher,
} from '@/features/cart/cart-storage'
import { useCompanyWhatsAppLink } from '@/features/company/useCompanyContact'
import { createCustomerOrder } from '@/features/orders/order-api'

// ── Types ─────────────────────────────────────────────────────────────────────
interface EkspedisiOption {
  id: string
  name: string
  time: string
  price: number
  courier?: string
  service?: string
}

interface ButikOption {
  id: string
  name: string
  city: string
  address: string
}

interface RajaOngkirAreaOption {
  id: number
  name: string
  zipCode?: string
}

// ── Static data ───────────────────────────────────────────────────────────────
const EMPTY_ADDRESS: GuestCheckoutAddress = {
  fullName: '',
  phone: '',
  address: '',
  city: '',
  district: '',
  village: '',
  province: '',
  postalCode: '',
}

const BANKS = [
  { id: 'bri',     name: 'BRI Virtual Account',     label: 'BRI' },
  { id: 'bca',     name: 'BCA Virtual Account',     label: 'BCA' },
  { id: 'mandiri', name: 'Mandiri Virtual Account', label: 'MANDIRI' },
  { id: 'bni',     name: 'BNI Virtual Account',     label: 'BNI' },
]

const ZERO_EKSPEDISI_OPTIONS: EkspedisiOption[] = [
  { id: 'jne-free', name: 'JNE', time: '-', price: 0, courier: 'JNE', service: 'Reguler' },
  { id: 'jnt-free', name: 'J&T Express', time: '-', price: 0, courier: 'JNT', service: 'Reguler' },
]

const API_URL = resolvePublicApiBaseUrl()

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const router = useRouter()
  const waLink = useCompanyWhatsAppLink('Halo admin, saya butuh bantuan terkait checkout.')
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
  const [checkoutItems, setCheckoutItems] = useState<LocalCartItem[]>([])
  const [checkoutVoucher, setCheckoutVoucher] = useState<ClaimedVoucher | null>(null)
  const [ktpFile, setKtpFile] = useState<File | null>(null)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')
  const [butikOptions, setButikOptions] = useState<ButikOption[]>([])
  const [ekspedisiOptions, setEkspedisiOptions] = useState<EkspedisiOption[]>(ZERO_EKSPEDISI_OPTIONS)
  const [isLoadingRates, setIsLoadingRates] = useState(false)
  const [shippingRateError, setShippingRateError] = useState('')
  const [provinceOptions, setProvinceOptions] = useState<RajaOngkirAreaOption[]>([])
  const [cityOptions, setCityOptions] = useState<RajaOngkirAreaOption[]>([])
  const [districtOptions, setDistrictOptions] = useState<RajaOngkirAreaOption[]>([])
  const [subdistrictOptions, setSubdistrictOptions] = useState<RajaOngkirAreaOption[]>([])
  const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(null)
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null)
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null)
  const [selectedSubdistrictId, setSelectedSubdistrictId] = useState<number | null>(null)
  const [isLoadingDestinations, setIsLoadingDestinations] = useState(false)
  const [destinationError, setDestinationError] = useState('')
  const [addressFormError, setAddressFormError] = useState('')

  useEffect(() => {
    let alive = true

    async function loadBoutiques() {
      try {
        const response = await fetch(`${API_URL}/boutiques?isActive=true`, { cache: 'no-store' })
        const json = await response.json()
        if (!alive) return
        setButikOptions((json.data || []).map((boutique: any) => ({
          id: boutique.id,
          name: boutique.name,
          city: boutique.city,
          address: boutique.address,
        })))
      } catch (error) {
        console.error('Error fetching boutiques', error)
      }
    }

    loadBoutiques()
    return () => {
      alive = false
    }
  }, [])

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

    const storedCheckoutItems = readCheckoutItems()
    const checkedCartItems = readCartItems().filter((item) => item.checked)
    setCheckoutItems(storedCheckoutItems.length > 0 ? storedCheckoutItems : checkedCartItems)
    setCheckoutVoucher(readCheckoutVoucher())
  }, [router])

  useEffect(() => {
    let alive = true
    async function loadProvinces() {
      setIsLoadingDestinations(true)
      setDestinationError('')
      try {
        const response = await fetch(`${API_URL}/checkout/destinations/provinces`, { cache: 'no-store' })
        const json = await response.json()
        if (!response.ok) throw new Error(json.message || 'Gagal memuat provinsi RajaOngkir.')
        if (!alive) return
        setProvinceOptions(json.data || [])
      } catch (error) {
        if (!alive) return
        setProvinceOptions([])
        setDestinationError(error instanceof Error ? error.message : 'Gagal memuat provinsi RajaOngkir.')
      } finally {
        if (alive) setIsLoadingDestinations(false)
      }
    }

    loadProvinces()
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!selectedProvinceId) {
      setCityOptions([])
      return
    }
    let alive = true
    async function loadCities() {
      setIsLoadingDestinations(true)
      setDestinationError('')
      try {
        const response = await fetch(`${API_URL}/checkout/destinations/cities?provinceId=${selectedProvinceId}`, { cache: 'no-store' })
        const json = await response.json()
        if (!response.ok) throw new Error(json.message || 'Gagal memuat kota/kabupaten RajaOngkir.')
        if (!alive) return
        setCityOptions(json.data || [])
      } catch (error) {
        if (!alive) return
        setCityOptions([])
        setDestinationError(error instanceof Error ? error.message : 'Gagal memuat kota/kabupaten RajaOngkir.')
      } finally {
        if (alive) setIsLoadingDestinations(false)
      }
    }
    loadCities()
    return () => {
      alive = false
    }
  }, [selectedProvinceId])

  useEffect(() => {
    if (!selectedCityId) {
      setDistrictOptions([])
      return
    }
    let alive = true
    async function loadDistricts() {
      setIsLoadingDestinations(true)
      setDestinationError('')
      try {
        const response = await fetch(`${API_URL}/checkout/destinations/districts?cityId=${selectedCityId}`, { cache: 'no-store' })
        const json = await response.json()
        if (!response.ok) throw new Error(json.message || 'Gagal memuat kecamatan RajaOngkir.')
        if (!alive) return
        setDistrictOptions(json.data || [])
      } catch (error) {
        if (!alive) return
        setDistrictOptions([])
        setDestinationError(error instanceof Error ? error.message : 'Gagal memuat kecamatan RajaOngkir.')
      } finally {
        if (alive) setIsLoadingDestinations(false)
      }
    }
    loadDistricts()
    return () => {
      alive = false
    }
  }, [selectedCityId])

  useEffect(() => {
    if (!selectedDistrictId) {
      setSubdistrictOptions([])
      return
    }
    let alive = true
    async function loadSubdistricts() {
      setIsLoadingDestinations(true)
      setDestinationError('')
      try {
        const response = await fetch(`${API_URL}/checkout/destinations/subdistricts?districtId=${selectedDistrictId}`, { cache: 'no-store' })
        const json = await response.json()
        if (!response.ok) throw new Error(json.message || 'Gagal memuat kelurahan RajaOngkir.')
        if (!alive) return
        setSubdistrictOptions(json.data || [])
      } catch (error) {
        if (!alive) return
        setSubdistrictOptions([])
        setDestinationError(error instanceof Error ? error.message : 'Gagal memuat kelurahan RajaOngkir.')
      } finally {
        if (alive) setIsLoadingDestinations(false)
      }
    }
    loadSubdistricts()
    return () => {
      alive = false
    }
  }, [selectedDistrictId])

  useEffect(() => {
    if (deliveryType !== 'ekspedisi') return
    setEkspedisiOptions(ZERO_EKSPEDISI_OPTIONS)
    if (!selectedAddress?.city || checkoutItems.length === 0) return
    let alive = true

    async function loadShippingRates() {
      setIsLoadingRates(true)
      setShippingRateError('')
      setSelectedEkspedisi(null)
      try {
        const weightGram = Math.max(1, Math.ceil(checkoutItems.reduce((sum, item) => sum + item.product.weightGram * item.quantity, 0)))
        const params = new URLSearchParams({
          destinationCity: selectedAddress.city,
          weightGram: String(weightGram),
        })
        if (selectedAddress.district) params.set('destinationDistrict', selectedAddress.district)
        if (selectedAddress.village) params.set('destinationVillage', selectedAddress.village)
        if (selectedAddress.postalCode) params.set('destinationPostalCode', selectedAddress.postalCode)

        const response = await fetch(`${API_URL}/checkout/shipping-rates?${params.toString()}`, { cache: 'no-store' })
        const json = await response.json()
        if (!response.ok) throw new Error(json.message)
        if (!alive) return
        const rates = (json.data || []).map((rate: any) => ({
          id: rate.id,
          name: rate.name,
          time: rate.etd,
          price: rate.price,
          courier: rate.courier,
          service: rate.service,
        }))
        setEkspedisiOptions(rates.length > 0 ? rates : ZERO_EKSPEDISI_OPTIONS)
      } catch (error) {
        if (alive) {
          setEkspedisiOptions(ZERO_EKSPEDISI_OPTIONS)
          setShippingRateError(error instanceof Error ? error.message : 'Gagal memuat ongkir RajaOngkir.')
        }
      } finally {
        if (alive) setIsLoadingRates(false)
      }
    }

    loadShippingRates()
    return () => {
      alive = false
    }
  }, [checkoutItems, deliveryType, selectedAddress])

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
    setSelectedProvinceId(null)
    setSelectedCityId(null)
    setSelectedDistrictId(null)
    setSelectedSubdistrictId(null)
    setCityOptions([])
    setDistrictOptions([])
    setSubdistrictOptions([])
    setDestinationError('')
    setAddressFormError('')
    setShowAddressModal(false)
    setShowAddressFormModal(true)
  }

  const handleSaveAddress = () => {
    if (
      !addressForm.fullName.trim()
      || !addressForm.phone.trim()
      || !addressForm.address.trim()
      || !addressForm.province.trim()
      || !addressForm.city.trim()
      || !addressForm.district.trim()
      || !addressForm.village.trim()
      || !addressForm.postalCode.trim()
      || !selectedSubdistrictId
    ) {
      setAddressFormError('Semua field alamat wajib diisi.')
      return
    }
    setAddressFormError('')
    setAddressHistory((current) => [addressForm, ...current])
    setSelectedAddress(addressForm)
    setShowAddressFormModal(false)
    setShowAddressModal(false)
  }

  const shippingFee = deliveryType === 'ekspedisi' && selectedEkspedisi ? selectedEkspedisi.price : 0
  const subtotal = checkoutItems.reduce((sum, item) => sum + item.product.totalPrice * item.quantity, 0)
  const discount = calculateVoucherDiscount(checkoutVoucher, subtotal)
  const total = Math.max(0, subtotal + shippingFee - discount)
  const needsKtpUpload = !guestProfile?.hasKtp && !ktpFile
  const canPay =
    subtotal > 0 && ordererName.trim() && !needsKtpUpload && deliveryType === 'ekspedisi'
      ? Boolean(selectedAddress && selectedEkspedisi)
      : deliveryType === 'butik'
        ? subtotal > 0 && ordererName.trim() && !needsKtpUpload && Boolean(selectedButik)
        : false

  const filteredButik = butikOptions.filter(
    (b) =>
      b.name.toLowerCase().includes(butikSearch.toLowerCase()) ||
      b.city.toLowerCase().includes(butikSearch.toLowerCase()) ||
      b.address.toLowerCase().includes(butikSearch.toLowerCase()),
  )

  async function handlePay() {
    if (!canPay || !guestProfile) return

    setIsSavingProfile(true)
    setCheckoutError('')
    try {
      const selectedPhone = selectedAddress?.phone || guestProfile.phone || ''
      const savedProfile = await saveCheckoutCustomerProfile({
        email: guestProfile.email,
        name: ordererName,
        phone: selectedPhone,
        address: deliveryType === 'ekspedisi' ? selectedAddress : null,
        ktpFile,
      })
      setGuestProfile(savedProfile)
      await createCustomerOrder({
        profile: savedProfile,
        ordererName,
        checkoutItems,
        deliveryType,
        selectedAddress,
        selectedEkspedisi,
        selectedButik,
        voucher: checkoutVoucher,
        discountAmount: discount,
      })
      router.push('/payment')
    } catch {
      setCheckoutError('Gagal menyimpan data checkout. Coba lagi sebentar.')
    } finally {
      setIsSavingProfile(false)
    }
  }

  return (
    <div className="bg-surface min-h-screen pb-28">

      {/* ── AppBar ───────────────────────────────────────────────────────── */}
      <AppBar
        title="Checkout"
        rightSlot={
          <a href={waLink} target="_blank" rel="noreferrer" className="text-gold-400 hover:text-gold-300 [transition-duration:var(--transition-fast)] transition-colors" aria-label="Hubungi CS">
            <HeadphonesIcon className="w-6 h-6" />
          </a>
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
              disabled={Boolean(guestProfile?.found)}
              className={guestProfile?.found ? 'bg-navy-50' : undefined}
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
                  <p className="mb-1 font-bold text-navy-900">{ktpFile ? ktpFile.name : 'Unggah KTP'}</p>
                  <p className="text-sm text-navy-500">JPG, PNG, atau WebP</p>
                  <input
                    type="file"
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={(event) => setKtpFile(event.target.files?.[0] ?? null)}
                  />
                </label>
              )}
            </div>
          </div>
        </Card>

        {/* ── Order Summary ────────────────────────────────────────────── */}
        <section className="bg-white rounded-xl border border-navy-200 p-6 shadow-elevation-low">
          <h2 className="font-heading text-xl font-bold text-navy-900 mb-4">Ringkasan Pesanan</h2>
          <div className="flex flex-col gap-2">
            {checkoutItems.length === 0 ? (
              <div className="rounded-xl border border-navy-200 bg-navy-50 p-4 text-sm text-navy-600">
                Belum ada item checkout. Kembali ke katalog untuk memilih produk.
              </div>
            ) : null}
            {checkoutItems.map((item, i) => (
              <div key={item.product.id} className={`flex items-start gap-3 py-3 ${i < checkoutItems.length - 1 ? 'border-b border-navy-100' : ''}`}>
                <div className="w-16 h-16 bg-surface rounded-lg overflow-hidden border border-navy-200 flex-shrink-0 p-1">
                  {item.product.imageUrl ? (
                    <Image src={item.product.imageUrl} alt={item.product.name} width={64} height={64} className="object-contain w-full h-full" />
                  ) : null}
                </div>
                <div className="flex-grow">
                  <h3 className="font-bold text-navy-900 text-sm leading-tight">{item.product.name}</h3>
                  <p className="text-navy-500 text-xs mt-0.5">Jumlah: {item.quantity}</p>
                </div>
                <p className="font-bold text-navy-900 text-sm">{formatRupiah(item.product.totalPrice * item.quantity)}</p>
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
                      {selectedAddress.village ? `${selectedAddress.village}, ` : ''}{selectedAddress.district ? `${selectedAddress.district}, ` : ''}{selectedAddress.city}, {selectedAddress.province} {selectedAddress.postalCode}
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
                          {selectedEkspedisi.name}{selectedEkspedisi.service ? ` ${selectedEkspedisi.service}` : ''} · {selectedEkspedisi.time} · {formatRupiah(selectedEkspedisi.price)}
                        </p>
                      ) : (
                        <p className="mt-1 text-sm text-navy-500">
                          {isLoadingRates ? 'Memuat ongkir RajaOngkir...' : shippingRateError || 'Belum dipilih'}
                        </p>
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
                  <p className="mt-1 text-sm text-navy-600">{selectedButik.city}</p>
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
          {isLoadingRates ? (
            <div className="rounded-xl border border-navy-200 bg-navy-50 p-4 text-sm text-navy-600">
              Memuat ongkir dari RajaOngkir...
            </div>
          ) : shippingRateError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">
              {shippingRateError}
            </div>
          ) : null}
          {!isLoadingRates && !shippingRateError && ekspedisiOptions.length === 0 ? (
            <div className="rounded-xl border border-navy-200 bg-navy-50 p-4 text-sm text-navy-600">
              Belum ada layanan ekspedisi untuk kota tujuan ini.
            </div>
          ) : null}
          {ekspedisiOptions.map((opt) => (
            <RadioCard
              key={opt.id}
              selected={selectedEkspedisi?.id === opt.id}
              onClick={() => handleSelectEkspedisi(opt)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-navy-900">{opt.name}</p>
                  <p className="text-sm text-navy-500 mt-1">
                    {opt.service ? `${opt.service} · ` : ''}Estimasi: {opt.time}
                  </p>
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
                <p className="text-sm text-navy-500 mt-1">{opt.city}</p>
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
                  {address.village ? `${address.village}, ` : ''}{address.district ? `${address.district}, ` : ''}{address.city}, {address.province} {address.postalCode}
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
            <div className="flex flex-col gap-1.5">
              <label htmlFor="new-address-province" className="text-sm font-medium text-navy-700">
                Provinsi <span className="text-red-500">*</span>
              </label>
              <select
                id="new-address-province"
                className="input-base bg-white disabled:bg-gray-100 disabled:text-gray-400"
                value={selectedProvinceId ? String(selectedProvinceId) : ''}
                onChange={(event) => {
                  const nextId = Number(event.target.value)
                  const selected = provinceOptions.find((item) => item.id === nextId)
                  setSelectedProvinceId(Number.isFinite(nextId) ? nextId : null)
                  setSelectedCityId(null)
                  setSelectedDistrictId(null)
                  setSelectedSubdistrictId(null)
                  setCityOptions([])
                  setDistrictOptions([])
                  setSubdistrictOptions([])
                  setAddressForm((current) => ({
                    ...current,
                    province: selected?.name || '',
                    city: '',
                    district: '',
                    village: '',
                    postalCode: '',
                  }))
                }}
                disabled={isLoadingDestinations}
                required
              >
                <option value="">{isLoadingDestinations ? 'Memuat provinsi...' : 'Pilih provinsi'}</option>
                {provinceOptions.map((province) => (
                  <option key={province.id} value={province.id}>{province.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="new-address-city-select" className="text-sm font-medium text-navy-700">
                Kota / Kabupaten <span className="text-red-500">*</span>
              </label>
              <select
                id="new-address-city-select"
                className="input-base bg-white disabled:bg-gray-100 disabled:text-gray-400"
                value={selectedCityId ? String(selectedCityId) : ''}
                onChange={(event) => {
                  const nextId = Number(event.target.value)
                  const selected = cityOptions.find((item) => item.id === nextId)
                  setSelectedCityId(Number.isFinite(nextId) ? nextId : null)
                  setSelectedDistrictId(null)
                  setSelectedSubdistrictId(null)
                  setDistrictOptions([])
                  setSubdistrictOptions([])
                  setAddressForm((current) => ({
                    ...current,
                    city: selected?.name || '',
                    district: '',
                    village: '',
                    postalCode: '',
                  }))
                }}
                disabled={!selectedProvinceId || cityOptions.length === 0}
                required
              >
                <option value="">Pilih kota/kabupaten</option>
                {cityOptions.map((city) => (
                  <option key={city.id} value={city.id}>{city.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="new-address-district-select" className="text-sm font-medium text-navy-700">
                Kecamatan <span className="text-red-500">*</span>
              </label>
              <select
                id="new-address-district-select"
                className="input-base bg-white disabled:bg-gray-100 disabled:text-gray-400"
                value={selectedDistrictId ? String(selectedDistrictId) : ''}
                onChange={(event) => {
                  const nextId = Number(event.target.value)
                  const selected = districtOptions.find((item) => item.id === nextId)
                  setSelectedDistrictId(Number.isFinite(nextId) ? nextId : null)
                  setSelectedSubdistrictId(null)
                  setSubdistrictOptions([])
                  setAddressForm((current) => ({
                    ...current,
                    district: selected?.name || '',
                    village: '',
                    postalCode: '',
                  }))
                }}
                disabled={!selectedCityId || districtOptions.length === 0}
                required
              >
                <option value="">Pilih kecamatan</option>
                {districtOptions.map((district) => (
                  <option key={district.id} value={district.id}>{district.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="new-address-village-select" className="text-sm font-medium text-navy-700">
                Kelurahan <span className="text-red-500">*</span>
              </label>
              <select
                id="new-address-village-select"
                className="input-base bg-white disabled:bg-gray-100 disabled:text-gray-400"
                value={selectedSubdistrictId ? String(selectedSubdistrictId) : ''}
                onChange={(event) => {
                  const nextId = Number(event.target.value)
                  const target = subdistrictOptions.find((item) => item.id === nextId)
                  setSelectedSubdistrictId(Number.isFinite(nextId) ? nextId : null)
                  setAddressForm((current) => ({
                    ...current,
                    village: target?.name || '',
                    postalCode: target?.zipCode || '',
                  }))
                }}
                disabled={!selectedDistrictId || subdistrictOptions.length === 0}
                required
              >
                <option value="">Pilih kelurahan</option>
                {subdistrictOptions.map((village) => (
                  <option key={village.id} value={village.id}>{village.name}</option>
                ))}
              </select>
              {destinationError ? <p className="text-xs font-medium text-red-500">{destinationError}</p> : null}
            </div>
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
          {addressFormError ? (
            <p className="text-sm font-medium text-red-500">{addressFormError}</p>
          ) : null}
        </div>
      </Modal>

      {/* ── Sticky Bottom Total Summary ──────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 w-full z-30 bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.06)] border-t border-navy-200 transition-all duration-300">

        {/* Collapsible details */}
        <div className={`overflow-hidden [transition-duration:var(--transition-slow)] transition-all ${showTotalDetails ? 'max-h-64' : 'max-h-0'}`}>
          <div className="p-5 pb-2 border-b border-navy-100 bg-surface space-y-3">
            <h3 className="font-bold text-navy-900 mb-2">Rincian Pembayaran</h3>
            {[
              { label: `Subtotal (${checkoutItems.reduce((sum, item) => sum + item.quantity, 0)} item)`, value: formatRupiah(subtotal) },
              { label: 'Biaya Pengiriman', value: shippingFee ? formatRupiah(shippingFee) : 'Rp 0' },
            ].map((row) => (
              <div key={row.label} className="flex justify-between text-navy-600 text-sm">
                <span>{row.label}</span><span>{row.value}</span>
              </div>
            ))}
            {discount > 0 ? (
              <div className="flex justify-between text-green-600 font-medium text-sm">
                <span>Potongan Voucher{checkoutVoucher ? ` (${checkoutVoucher.code})` : ''}</span><span>-{formatRupiah(discount)}</span>
              </div>
            ) : null}
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

          <div className="w-full sm:w-auto">
            {checkoutError ? <p className="mb-2 text-sm font-semibold text-red-500">{checkoutError}</p> : null}
            <Button
              type="button"
              variant="primary"
              size="lg"
              fullWidth
              disabled={!canPay}
              isLoading={isSavingProfile}
              onClick={handlePay}
              className={!canPay ? 'opacity-50 cursor-not-allowed' : ''}
            >
              <Lock className="w-4 h-4" />
              Bayar Sekarang
            </Button>
          </div>
        </div>
      </div>

    </div>
  )
}
