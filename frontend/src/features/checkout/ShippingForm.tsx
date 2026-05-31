'use client'

import { useState, useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Input from '@/shared/ui/Input'
import Button from '@/shared/ui/Button'
import { SHIPPING_CARRIERS, ShippingCarrierLogo } from '@/features/shipping/shipping-carriers'

const shippingSchema = z.object({
  fullName:   z.string().min(2, 'Nama minimal 2 karakter'),
  phone:      z.string().min(10, 'Nomor HP tidak valid').max(14),
  province:   z.string().min(1, 'Pilih provinsi'),
  city:       z.string().min(1, 'Pilih kota'),
  district:   z.string().min(1, 'Kecamatan wajib diisi'),
  postalCode: z.string().length(5, 'Kode pos 5 digit'),
  address:    z.string().min(10, 'Alamat terlalu pendek'),
  courier:    z.string().min(1, 'Pilih kurir'),
})

export type ShippingFormValues = z.infer<typeof shippingSchema>

interface ShippingFormProps {
  onSubmit: (data: ShippingFormValues) => void
  isLoading?: boolean
}

export default function ShippingForm({ onSubmit, isLoading }: ShippingFormProps) {
  const { register, handleSubmit, formState: { errors }, control, setValue } = useForm<ShippingFormValues>({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      province: '',
      city: '',
      district: ''
    }
  })

  const [provinces, setProvinces] = useState<{id: string, name: string}[]>([])
  const [cities, setCities] = useState<{id: string, name: string}[]>([])
  const [districts, setDistricts] = useState<{id: string, name: string}[]>([])

  const selectedProvince = useWatch({ control, name: 'province' })
  const selectedCity = useWatch({ control, name: 'city' })

  // Fetch Provinces on mount
  useEffect(() => {
    fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
      .then(res => res.json())
      .then(data => setProvinces(data))
      .catch(err => console.error(err))
  }, [])

  // Fetch Cities when Province changes
  useEffect(() => {
    if (selectedProvince) {
      const provinceId = provinces.find(p => p.name === selectedProvince)?.id
      if (provinceId) {
        fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provinceId}.json`)
          .then(res => res.json())
          .then(data => {
            setCities(data)
            setValue('city', '') // Reset city when province changes
            setValue('district', '') // Reset district
          })
          .catch(err => console.error(err))
      }
    } else {
      setCities([])
    }
  }, [selectedProvince, provinces, setValue])

  // Fetch Districts when City changes
  useEffect(() => {
    if (selectedCity) {
      const cityId = cities.find(c => c.name === selectedCity)?.id
      if (cityId) {
        fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${cityId}.json`)
          .then(res => res.json())
          .then(data => {
            setDistricts(data)
            setValue('district', '') // Reset district when city changes
          })
          .catch(err => console.error(err))
      }
    } else {
      setDistricts([])
    }
  }, [selectedCity, cities, setValue])

  return (
    <form onSubmit={handleSubmit(onSubmit)} id="shipping-form" className="space-y-5">
      <div className="bg-white rounded-2xl border border-[#d2c5b1] overflow-hidden">
        {/* Header */}
        <div className="bg-navy-900 px-6 py-4">
          <h3 className="font-heading text-sm font-bold text-gold-400 uppercase tracking-widest">
            Alamat Pengiriman
          </h3>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="shipping-fullname"
              label="Nama Penerima"
              placeholder="Nama lengkap"
              required
              error={errors.fullName?.message}
              {...register('fullName')}
            />
            <Input
              id="shipping-phone"
              label="Nomor HP"
              type="tel"
              placeholder="08xxxxxxxxxx"
              required
              error={errors.phone?.message}
              {...register('phone')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="shipping-province" className="text-sm font-medium text-navy-700">
                Provinsi <span className="text-red-500">*</span>
              </label>
              <select
                id="shipping-province"
                className="border border-navy-200 rounded-xl px-4 py-3 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-gold-400 bg-white"
                {...register('province')}
              >
                <option value="">Pilih Provinsi</option>
                {provinces.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
              {errors.province && <p className="text-xs text-red-500">{errors.province.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="shipping-city" className="text-sm font-medium text-navy-700">
                Kota / Kabupaten <span className="text-red-500">*</span>
              </label>
              <select
                id="shipping-city"
                disabled={!selectedProvince || cities.length === 0}
                className="border border-navy-200 rounded-xl px-4 py-3 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-gold-400 bg-white disabled:bg-gray-100 disabled:text-gray-400"
                {...register('city')}
              >
                <option value="">Pilih Kota/Kabupaten</option>
                {cities.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
              {errors.city && <p className="text-xs text-red-500">{errors.city.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="shipping-district" className="text-sm font-medium text-navy-700">
                Kecamatan / Desa <span className="text-red-500">*</span>
              </label>
              <select
                id="shipping-district"
                disabled={!selectedCity || districts.length === 0}
                className="border border-navy-200 rounded-xl px-4 py-3 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-gold-400 bg-white disabled:bg-gray-100 disabled:text-gray-400"
                {...register('district')}
              >
                <option value="">Pilih Kecamatan/Desa</option>
                {districts.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
              {errors.district && <p className="text-xs text-red-500">{errors.district.message}</p>}
            </div>

            <Input
              id="shipping-postal"
              label="Kode Pos"
              placeholder="12345"
              maxLength={5}
              required
              error={errors.postalCode?.message}
              {...register('postalCode')}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="shipping-address" className="text-sm font-medium text-navy-700">
              Alamat Lengkap <span className="text-red-500">*</span>
            </label>
            <textarea
              id="shipping-address"
              rows={3}
              placeholder="Nama jalan, nomor rumah, RT/RW, patokan..."
              className="border border-navy-200 rounded-xl px-4 py-3 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-gold-400 resize-none"
              {...register('address')}
            />
            {errors.address && <p className="text-xs text-red-500">{errors.address.message}</p>}
          </div>
        </div>
      </div>

      {/* Courier selection */}
      <div className="bg-white rounded-2xl border border-[#d2c5b1] overflow-hidden">
        <div className="bg-navy-900 px-6 py-4">
          <h3 className="font-heading text-sm font-bold text-gold-400 uppercase tracking-widest">
            Pilih Kurir
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {SHIPPING_CARRIERS.map((courier) => (
              <label
                key={courier.code}
                className="flex items-center gap-2 border border-[#d2c5b1] rounded-xl px-3 py-3 cursor-pointer hover:border-gold-400 has-[:checked]:border-gold-500 has-[:checked]:bg-gold-50 transition-all"
              >
                <input
                  type="radio"
                  value={courier.code}
                  className="accent-gold-500"
                  {...register('courier')}
                />
                <ShippingCarrierLogo carrier={courier.code} className="h-8 w-12" />
                <span className="text-sm font-medium text-navy-800">{courier.label}</span>
              </label>
            ))}
          </div>
          {errors.courier && <p className="text-xs text-red-500 mt-2">{errors.courier.message}</p>}
        </div>
      </div>

      <Button type="submit" fullWidth size="lg" isLoading={isLoading} id="checkout-submit-btn">
        Lanjut ke Pembayaran
      </Button>
    </form>
  )
}
