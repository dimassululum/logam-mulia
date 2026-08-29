'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { CheckCircle2, CreditCard, HeadphonesIcon, Lock, Mail, MapPin, Plus, QrCode, Search, Store, Truck, UploadCloud, ChevronDown, ChevronUp } from 'lucide-react'
import { formatRupiah } from '@/core/lib/utils'
import { apiClient } from '@/core/lib/api-client'
import { resolvePublicApiBaseUrl, resolvePublicAssetUrl } from '@/core/lib/public-url'
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
  saveCartItems,
  saveCheckoutItems,
} from '@/features/cart/cart-storage'
import { mapStorefrontVoucher, summarizeApplicableVouchers, type StorefrontVoucher } from '@/features/products/voucher-pricing'
import { mapApiProduct } from '@/features/products/product-api'
import { useCompanyWhatsAppLink } from '@/features/company/useCompanyContact'
import { createCustomerOrder } from '@/features/orders/order-api'
import {
  fetchCheckoutPaymentMethods,
  type BankAccountConfig,
  type PaymentGatewayMode,
  type PaymentMethodRecord,
} from '@/features/payment-methods/payment-method-api'
import { getPaymentLogo } from '@/features/payment-methods/bank-assets'
import { SHIPPING_CARRIERS, ShippingCarrierLogo } from '@/features/shipping/shipping-carriers'

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

interface PaymentOption {
  id: string
  methodCode: string
  paymentAccountId?: string
  label: string
  description?: string | null
  category: PaymentMethodRecord['category']
  config: PaymentMethodRecord['config']
  gatewayMode: PaymentGatewayMode
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

const STATIC_EKSPEDISI_OPTIONS: EkspedisiOption[] = SHIPPING_CARRIERS.map((carrier) => ({
  id: `${carrier.code.toLowerCase()}-regular`,
  name: carrier.label,
  time: carrier.eta,
  price: carrier.price,
  courier: carrier.code,
  service: carrier.service,
}))

const API_URL = resolvePublicApiBaseUrl()
const MAX_KTP_FILE_SIZE_MB = 10
const MAX_KTP_FILE_SIZE_BYTES = MAX_KTP_FILE_SIZE_MB * 1024 * 1024

function isCompleteBankAccount(account: BankAccountConfig) {
  return Boolean(account.bankName?.trim() && account.accountNumber?.trim() && account.accountHolder?.trim())
}

function getGatewayPaymentDescription(method: PaymentMethodRecord, mode: PaymentGatewayMode) {
  if (method.category === 'QRIS') return 'Scan QRIS setelah pembayaran dibuat.'
  if (method.category === 'RETAIL') return 'Kode pembayaran retail akan dibuat setelah pembayaran dibuat.'
  return `${getBankDisplayName(method.label)} VA`
}

function getBankDisplayName(label: string) {
  const names: Record<string, string> = {
    BRI: 'Bank Rakyat Indonesia',
    BNI: 'Bank Negara Indonesia',
    Mandiri: 'Bank Mandiri',
    'CIMB Niaga': 'CIMB Niaga',
    BSI: 'Bank Syariah Indonesia',
    Danamon: 'Bank Danamon',
    Permata: 'Bank Permata',
    Maybank: 'Maybank',
    Sampoerna: 'Bank Sahabat Sampoerna',
    'Artha Graha International': 'Bank Artha Graha International',
    Neo: 'Bank Neo Commerce',
  }
  return names[label] || label
}

function buildPaymentOptions(methods: PaymentMethodRecord[], mode: PaymentGatewayMode): PaymentOption[] {
  if (mode !== 'manual') {
    return methods.map((method) => ({
      id: method.code,
      methodCode: method.code,
      label: method.label,
      description: getGatewayPaymentDescription(method, mode),
      category: method.category,
      config: method.config,
      gatewayMode: mode,
    }))
  }

  return methods.flatMap((method) => {
    if (method.code !== 'bank_transfer') {
      return [{
        id: method.code,
        methodCode: method.code,
        label: method.label,
        description: method.description,
        category: method.category,
        config: method.config,
        gatewayMode: mode,
      }]
    }

    const accounts = (method.config.bankAccounts ?? [])
      .filter((account) => account.isActive && isCompleteBankAccount(account))

    if (accounts.length === 0 && isCompleteBankAccount({
      id: '1',
      bankName: method.config.bankName,
      accountNumber: method.config.accountNumber,
      accountHolder: method.config.accountHolder,
      isActive: true,
    })) {
      accounts.push({
        id: '1',
        bankName: method.config.bankName,
        accountNumber: method.config.accountNumber,
        accountHolder: method.config.accountHolder,
        isActive: true,
      })
    }

    return accounts.map((account) => ({
      id: `${method.code}:${account.id}`,
      methodCode: method.code,
      paymentAccountId: account.id,
      label: account.bankName || method.label,
      description: 'Transfer ke nomor rekening, lalu upload bukti pembayaran untuk diverifikasi admin.',
      category: method.category,
      config: {
        ...method.config,
        bankName: account.bankName,
        accountNumber: account.accountNumber,
        accountHolder: account.accountHolder,
      },
      gatewayMode: mode,
    }))
  })
}

function createCheckoutRequestId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16)
    const value = character === 'x' ? random : (random & 0x3) | 0x8
    return value.toString(16)
  })
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const router = useRouter()
  const checkoutInFlightRef = useRef(false)
  const checkoutRequestIdRef = useRef(createCheckoutRequestId())
  const waLink = useCompanyWhatsAppLink('Halo admin, saya butuh bantuan terkait checkout.')
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
  const [savedCheckoutVoucher, setSavedCheckoutVoucher] = useState<ClaimedVoucher | null>(null)
  const [vouchers, setVouchers] = useState<StorefrontVoucher[]>([])
  const [ktpFile, setKtpFile] = useState<File | null>(null)
  const [ktpFileError, setKtpFileError] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')
  const [butikOptions, setButikOptions] = useState<ButikOption[]>([])
  const [ekspedisiOptions, setEkspedisiOptions] = useState<EkspedisiOption[]>(STATIC_EKSPEDISI_OPTIONS)
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
  const [paymentMode, setPaymentMode] = useState<PaymentGatewayMode>('manual')
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodRecord[]>([])
  const [selectedPaymentOptionId, setSelectedPaymentOptionId] = useState('')
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(false)
  const [paymentMethodError, setPaymentMethodError] = useState('')

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
    let alive = true

    async function loadPaymentMethods() {
      setIsLoadingPaymentMethods(true)
      setPaymentMethodError('')
      try {
        const result = await fetchCheckoutPaymentMethods()
        if (!alive) return
        setPaymentMode(result.mode)
        setPaymentMethods(result.methods)
        setSelectedPaymentOptionId((current) => {
          const options = buildPaymentOptions(result.methods, result.mode)
          if (current && options.some((option) => option.id === current)) return current
          return options.length === 1 ? options[0].id : ''
        })
      } catch (error) {
        if (!alive) return
        setPaymentMethods([])
        setSelectedPaymentOptionId('')
        setPaymentMethodError(error instanceof Error ? error.message : 'Gagal memuat metode pembayaran.')
      } finally {
        if (alive) setIsLoadingPaymentMethods(false)
      }
    }

    loadPaymentMethods()
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    let alive = true

    async function loadVouchers() {
      try {
        const response = await fetch(`${API_URL}/vouchers/public?limit=100`, { cache: 'no-store' })
        const json = await response.json()
        if (!alive || !response.ok) return
        setVouchers(Array.isArray(json.data) ? json.data.map(mapStorefrontVoucher) : [])
      } catch (error) {
        console.error('Error fetching public vouchers', error)
      }
    }

    async function loadCustomerProfile() {
      if (!localStorage.getItem('access_token')) {
        router.replace(`/login?redirect=${encodeURIComponent(`/checkout${window.location.search}`)}`)
        return
      }

      try {
        const { data } = await apiClient.get('/auth/me')
        if (!alive) return
        const user = data.data
        const addresses: GuestCheckoutAddress[] = (user.addresses || []).map((address: any) => ({
          id: address.id,
          fullName: address.fullName || user.name,
          phone: address.phone || user.phone || '',
          address: address.address,
          city: address.city,
          district: address.district || '',
          village: address.village || '',
          province: address.province,
          postalCode: address.postalCode,
          rajaOngkirDestinationId: address.rajaOngkirDestinationId,
        }))
        const nextProfile: GuestCheckoutProfile = {
          email: user.email,
          ordererName: user.name,
          phone: user.phone || '',
          found: true,
          hasKtp: Boolean(user.ktpUrl),
          ktpUrl: user.ktpUrl || null,
          addresses,
        }
        setGuestProfile(nextProfile)
        const storedProfile = readGuestCheckoutProfile()
        const storedAddresses = storedProfile?.email === user.email
          ? storedProfile.addresses ?? (storedProfile.address ? [storedProfile.address] : [])
          : []
        const nextAddresses = addresses.length > 0 ? addresses : storedAddresses
        setOrdererName(user.name)
        setAddressHistory(nextAddresses)
        setSelectedAddress(nextAddresses[0] ?? null)
      } catch {
        if (alive) router.replace(`/login?redirect=${encodeURIComponent(`/checkout${window.location.search}`)}`)
      }
    }

    loadVouchers()
    loadCustomerProfile()

    async function refreshCheckoutItemsFromProducts(items: LocalCartItem[]) {
      if (items.length === 0) return

      try {
        const response = await fetch(`${API_URL}/products?limit=1000&isActive=true`, { cache: 'no-store' })
        const json = await response.json()
        if (!response.ok || !Array.isArray(json.data)) return
        if (!alive) return

        const productsBySlug = new Map(json.data.map((product: any) => {
          const mappedProduct = mapApiProduct(product)
          return [mappedProduct.slug, mappedProduct]
        }))
        const refreshedItems = items
          .map((item) => {
            const freshProduct = productsBySlug.get(item.product.slug)
            return freshProduct ? { ...item, product: freshProduct } : null
          })
          .filter((item): item is LocalCartItem => Boolean(item))

        setCheckoutItems(refreshedItems)
        saveCheckoutItems(refreshedItems)
        saveCartItems(readCartItems()
          .map((item) => {
            const freshProduct = productsBySlug.get(item.product.slug)
            return freshProduct ? { ...item, product: freshProduct } : null
          })
          .filter((item): item is LocalCartItem => Boolean(item)))
      } catch (error) {
        console.error('Error refreshing checkout products', error)
      }
    }

    const storedCheckoutItems = readCheckoutItems()
    const checkedCartItems = readCartItems().filter((item) => item.checked)
    const isBuyNowCheckout = new URLSearchParams(window.location.search).get('mode') === 'buy-now'
    const initialCheckoutItems = isBuyNowCheckout
      ? storedCheckoutItems
      : checkedCartItems.length > 0
        ? checkedCartItems
        : storedCheckoutItems
    setCheckoutItems(initialCheckoutItems)
    saveCheckoutItems(initialCheckoutItems)
    refreshCheckoutItemsFromProducts(initialCheckoutItems)
    setSavedCheckoutVoucher(readCheckoutVoucher())

    return () => {
      alive = false
    }
  }, [router])

  useEffect(() => {
    let alive = true
    async function loadProvinces() {
      setIsLoadingDestinations(true)
      setDestinationError('')
      try {
        const response = await fetch(`${API_URL}/checkout/destinations/provinces`, { cache: 'no-store' })
        const json = await response.json()
        if (!response.ok) throw new Error(json.message || 'Gagal memuat provinsi dari database.')
        if (!alive) return
        setProvinceOptions(json.data || [])
      } catch (error) {
        if (!alive) return
        setProvinceOptions([])
        setDestinationError(error instanceof Error ? error.message : 'Gagal memuat provinsi dari database.')
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
        if (!response.ok) throw new Error(json.message || 'Gagal memuat kota/kabupaten dari database.')
        if (!alive) return
        setCityOptions(json.data || [])
      } catch (error) {
        if (!alive) return
        setCityOptions([])
        setDestinationError(error instanceof Error ? error.message : 'Gagal memuat kota/kabupaten dari database.')
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
        if (!response.ok) throw new Error(json.message || 'Gagal memuat kecamatan dari database.')
        if (!alive) return
        setDistrictOptions(json.data || [])
      } catch (error) {
        if (!alive) return
        setDistrictOptions([])
        setDestinationError(error instanceof Error ? error.message : 'Gagal memuat kecamatan dari database.')
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
        if (!response.ok) throw new Error(json.message || 'Gagal memuat kelurahan dari database.')
        if (!alive) return
        setSubdistrictOptions(json.data || [])
      } catch (error) {
        if (!alive) return
        setSubdistrictOptions([])
        setDestinationError(error instanceof Error ? error.message : 'Gagal memuat kelurahan dari database.')
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
    if (selectedProvinceId || provinceOptions.length !== 1) return
    const [province] = provinceOptions
    setSelectedProvinceId(province.id)
    setAddressForm((current) => ({
      ...current,
      province: province.name,
      city: '',
      district: '',
      village: '',
      postalCode: '',
      rajaOngkirDestinationId: undefined,
    }))
  }, [provinceOptions, selectedProvinceId])

  useEffect(() => {
    if (selectedCityId || cityOptions.length !== 1) return
    const [city] = cityOptions
    setSelectedCityId(city.id)
    setAddressForm((current) => ({
      ...current,
      city: city.name,
      district: '',
      village: '',
      postalCode: '',
      rajaOngkirDestinationId: undefined,
    }))
  }, [cityOptions, selectedCityId])

  useEffect(() => {
    if (selectedDistrictId || districtOptions.length !== 1) return
    const [district] = districtOptions
    setSelectedDistrictId(district.id)
    setAddressForm((current) => ({
      ...current,
      district: district.name,
      village: '',
      postalCode: '',
      rajaOngkirDestinationId: undefined,
    }))
  }, [districtOptions, selectedDistrictId])

  useEffect(() => {
    if (selectedSubdistrictId || subdistrictOptions.length !== 1) return
    const [subdistrict] = subdistrictOptions
    setSelectedSubdistrictId(subdistrict.id)
    setAddressForm((current) => ({
      ...current,
      village: subdistrict.name,
      postalCode: subdistrict.zipCode || '',
      rajaOngkirDestinationId: subdistrict.id,
    }))
  }, [selectedSubdistrictId, subdistrictOptions])

  useEffect(() => {
    if (deliveryType !== 'ekspedisi') return
    setEkspedisiOptions(STATIC_EKSPEDISI_OPTIONS)
    setShippingRateError('')
    setIsLoadingRates(false)
    if (!selectedAddress) setSelectedEkspedisi(null)
  }, [deliveryType, selectedAddress])

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

  const handleKtpFileChange = (file?: File | null) => {
    setCheckoutError('')
    setKtpFileError('')

    if (!file) {
      setKtpFile(null)
      return
    }

    if (file.size > MAX_KTP_FILE_SIZE_BYTES) {
      setKtpFile(null)
      setKtpFileError(`Ukuran file KTP terlalu besar. Maksimal ${MAX_KTP_FILE_SIZE_MB}MB.`)
      return
    }

    setKtpFile(file)
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
  const voucherSummary = summarizeApplicableVouchers(vouchers, checkoutItems.map((item) => ({
    productId: item.product.id,
    price: item.product.totalPrice,
    quantity: item.quantity,
  })))
  const fallbackDiscount = calculateVoucherDiscount(savedCheckoutVoucher, subtotal)
  const checkoutVoucher = voucherSummary.appliedVouchers[0]?.voucher ?? savedCheckoutVoucher
  const appliedVoucherCount = voucherSummary.appliedVouchers.length
  const discount = voucherSummary.discountAmount > 0 ? voucherSummary.discountAmount : fallbackDiscount
  const total = Math.max(0, subtotal + shippingFee - discount)
  const needsKtpUpload = !guestProfile?.hasKtp && !ktpFile
  const paymentOptions = buildPaymentOptions(paymentMethods, paymentMode)
  const selectedPaymentOption = paymentOptions.find((option) => option.id === selectedPaymentOptionId) ?? null
  const hasPaymentMethod = Boolean(selectedPaymentOption)
  const canPay =
    subtotal > 0 && ordererName.trim() && !needsKtpUpload && hasPaymentMethod && deliveryType === 'ekspedisi'
      ? Boolean(selectedAddress && selectedEkspedisi)
      : deliveryType === 'butik'
        ? subtotal > 0 && ordererName.trim() && !needsKtpUpload && hasPaymentMethod && Boolean(selectedButik)
        : false

  const filteredButik = butikOptions.filter(
    (b) =>
      b.name.toLowerCase().includes(butikSearch.toLowerCase()) ||
      b.city.toLowerCase().includes(butikSearch.toLowerCase()) ||
      b.address.toLowerCase().includes(butikSearch.toLowerCase()),
  )

  async function handlePay() {
    if (checkoutInFlightRef.current || !canPay || !guestProfile || !selectedPaymentOption) return

    checkoutInFlightRef.current = true
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
        checkoutRequestId: checkoutRequestIdRef.current,
        profile: savedProfile,
        ordererName,
        checkoutItems,
        deliveryType,
        selectedAddress,
        selectedEkspedisi,
        selectedButik,
        paymentMethodCode: selectedPaymentOption.methodCode,
        paymentAccountId: selectedPaymentOption.paymentAccountId,
        voucher: checkoutVoucher,
        discountAmount: discount,
      })
      router.push(
        selectedPaymentOption.gatewayMode === 'midtrans'
          ? '/payment/midtrans'
          : selectedPaymentOption.gatewayMode === 'duitku'
            ? '/payment/duitku'
            : '/payment'
      )
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : 'Gagal menyimpan data checkout. Coba lagi sebentar.')
      checkoutRequestIdRef.current = createCheckoutRequestId()
      checkoutInFlightRef.current = false
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
                  <p className="text-sm text-navy-500">JPG, PNG, atau WebP. Maksimal {MAX_KTP_FILE_SIZE_MB}MB.</p>
                  <input
                    type="file"
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={(event) => handleKtpFileChange(event.target.files?.[0] ?? null)}
                  />
                </label>
              )}
              {ktpFileError ? <p className="mt-2 text-sm font-semibold text-red-600">{ktpFileError}</p> : null}
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
              <div className="mb-3 grid grid-cols-3 gap-2">
                {SHIPPING_CARRIERS.map((carrier) => (
                  <ShippingCarrierLogo key={carrier.code} carrier={carrier.code} className="h-14 w-full rounded-lg p-2" />
                ))}
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
                    <div className="min-w-0">
                      <p className="font-bold text-navy-900">Ekspedisi</p>
                      {selectedEkspedisi ? (
                        <div className="mt-2 flex min-w-0 items-center gap-3">
                          <ShippingCarrierLogo carrier={selectedEkspedisi.courier || selectedEkspedisi.name} className="h-12 w-24 rounded-lg p-2" />
                          <p className="min-w-0 text-sm text-navy-600">
                            {selectedEkspedisi.name}{selectedEkspedisi.service ? ` ${selectedEkspedisi.service}` : ''} · {selectedEkspedisi.time} · {formatRupiah(selectedEkspedisi.price)}
                          </p>
                        </div>
                      ) : (
                        <p className="mt-1 text-sm text-navy-500">
                          {shippingRateError || 'Belum dipilih'}
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
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-heading text-xl font-bold text-navy-900">Metode Pembayaran</h2>
          </div>
          {isLoadingPaymentMethods ? (
            <div className="rounded-xl border border-navy-100 bg-navy-50 p-4 text-sm font-medium text-navy-600">
              Memuat metode pembayaran...
            </div>
          ) : paymentMethodError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">
              {paymentMethodError}
            </div>
          ) : paymentOptions.length === 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="font-semibold text-amber-800">Metode pembayaran belum tersedia.</p>
              <p className="mt-1 text-sm text-amber-700">Silakan hubungi admin untuk bantuan checkout.</p>
              <a href={waLink} target="_blank" rel="noreferrer" className="mt-4 inline-flex">
                <Button type="button" variant="secondary" size="sm">
                  <HeadphonesIcon className="h-4 w-4" />
                  Hubungi Admin
                </Button>
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {paymentOptions.map((option) => {
                const paymentLogo = option.methodCode === 'bank_transfer'
                  ? getPaymentLogo(option.config.bankName)
                  : getPaymentLogo(option.label) ?? resolvePublicAssetUrl(option.config.imageUrl)
                const selected = selectedPaymentOptionId === option.id
                const isGatewayOption = option.gatewayMode !== 'manual'

                return (
                  <RadioCard
                    key={option.id}
                    id={`payment-${option.id}`}
                    selected={selected}
                    onClick={() => {
                      setCheckoutError('')
                      setSelectedPaymentOptionId(option.id)
                    }}
                  >
                    <div className={`flex gap-3 ${isGatewayOption ? 'items-center' : 'items-start'}`}>
                      <div className={`flex h-12 w-16 flex-shrink-0 items-center justify-center rounded-lg border p-2 ${
                        isGatewayOption ? 'border-navy-200 bg-white' : 'border-gold-200 bg-gold-50 text-gold-700'
                      }`}>
                        {paymentLogo ? (
                          <Image src={paymentLogo} alt={option.label} width={64} height={48} unoptimized className="h-full w-full object-contain" />
                        ) : option.category === 'QRIS' ? (
                          <QrCode className="h-6 w-6" />
                        ) : (
                          <CreditCard className="h-6 w-6" />
                        )}
                      </div>
                      <div className="min-w-0">
                        {isGatewayOption ? (
                          <div>
                            <span className="font-bold text-navy-900">{option.label}</span>
                            <p className="mt-1 text-sm text-navy-600">{option.description}</p>
                          </div>
                        ) : (
                          <>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-navy-900">{option.label}</span>
                              <span className="rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-green-700">
                                {selected ? 'Dipilih' : 'Tersedia'}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-navy-600">{option.description}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </RadioCard>
                )
              })}
            </div>
          )}
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
              Memuat pilihan ekspedisi...
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
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4">
                  <ShippingCarrierLogo carrier={opt.courier || opt.name} className="h-16 w-28 rounded-lg p-2" />
                  <div className="min-w-0">
                    <p className="font-bold text-navy-900">{opt.name}</p>
                    <p className="text-sm text-navy-500 mt-1">
                      {opt.service ? `${opt.service} · ` : ''}Estimasi: {opt.time}
                    </p>
                  </div>
                </div>
                <p className="shrink-0 font-bold text-gold-600">{formatRupiah(opt.price)}</p>
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
        size="lg"
      >
        <div className="flex flex-col gap-4">
          <Input
            placeholder="Cari lokasi butik..."
            value={butikSearch}
            onChange={(e) => setButikSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
          <div className="flex flex-col gap-3">
            {filteredButik.map((opt) => (
              <RadioCard
                key={opt.id}
                selected={selectedButik?.id === opt.id}
                onClick={() => handleSelectButik(opt)}
                className="p-3.5"
              >
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-gold-600" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-navy-900">{opt.name}</p>
                      <span className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700">
                        Gratis biaya
                      </span>
                    </div>
                    <p className="text-sm font-medium text-navy-500 mt-1">{opt.city}</p>
                    <p className="text-sm text-navy-600 mt-1 leading-5">{opt.address}</p>
                  </div>
                </div>
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
        size="lg"
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
                    rajaOngkirDestinationId: undefined,
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
                    rajaOngkirDestinationId: undefined,
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
                    rajaOngkirDestinationId: undefined,
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
                    rajaOngkirDestinationId: target?.id,
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

          {addressFormError ? (
            <p className="text-sm font-medium text-red-500">{addressFormError}</p>
          ) : null}
          <div className="sticky bottom-0 -mx-4 -mb-4 bg-white px-4 pb-4 pt-3 sm:-mx-6 sm:-mb-6 sm:px-6 sm:pb-6">
            <Button type="button" size="lg" fullWidth onClick={handleSaveAddress}>
              Simpan Alamat
            </Button>
          </div>
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
              <div className="flex justify-between text-sm font-semibold text-[#2E7D32]">
                <span>
                  Hemat Voucher{appliedVoucherCount > 1 ? ` (${appliedVoucherCount} voucher)` : checkoutVoucher ? ` (${checkoutVoucher.code})` : ''}
                </span><span>-{formatRupiah(discount)}</span>
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
            {checkoutError ? (
              <div className="mb-3 text-sm">
                <p className="font-semibold text-red-500">{checkoutError}</p>
                <a href={waLink} target="_blank" rel="noreferrer" className="mt-1 inline-flex font-semibold text-gold-500 hover:text-gold-600 [transition-duration:var(--transition-fast)] transition-colors">
                  Hubungi Admin
                </a>
              </div>
            ) : null}
            <Button
              type="button"
              variant="primary"
              size="lg"
              fullWidth
              disabled={!canPay || isSavingProfile}
              isLoading={isSavingProfile}
              onClick={handlePay}
              className={!canPay ? 'opacity-50 cursor-not-allowed' : ''}
            >
              <Lock className="w-4 h-4" />
              {selectedPaymentOption?.gatewayMode !== 'manual' ? 'Lanjutkan Pembayaran' : 'Bayar Sekarang'}
            </Button>
          </div>
        </div>
      </div>

    </div>
  )
}
