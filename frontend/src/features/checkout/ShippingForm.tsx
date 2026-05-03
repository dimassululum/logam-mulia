'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Input from '@/shared/ui/Input'
import Button from '@/shared/ui/Button'

const shippingSchema = z.object({
  fullName:   z.string().min(2, 'Nama minimal 2 karakter'),
  phone:      z.string().min(10, 'Nomor HP tidak valid').max(14),
  province:   z.string().min(1, 'Pilih provinsi'),
  city:       z.string().min(1, 'Pilih kota'),
  district:   z.string().min(2, 'Kecamatan wajib diisi'),
  postalCode: z.string().length(5, 'Kode pos 5 digit'),
  address:    z.string().min(10, 'Alamat terlalu pendek'),
  courier:    z.string().min(1, 'Pilih kurir'),
})

export type ShippingFormValues = z.infer<typeof shippingSchema>

interface ShippingFormProps {
  onSubmit: (data: ShippingFormValues) => void
  isLoading?: boolean
}

const COURIERS = ['JNE', 'J&T Express', 'SiCepat', 'Anteraja', 'Gojek Instant']

export default function ShippingForm({ onSubmit, isLoading }: ShippingFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<ShippingFormValues>({
    resolver: zodResolver(shippingSchema),
  })

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
                <option value="DKI Jakarta">DKI Jakarta</option>
                <option value="Jawa Barat">Jawa Barat</option>
                <option value="Jawa Tengah">Jawa Tengah</option>
                <option value="Jawa Timur">Jawa Timur</option>
                <option value="Bali">Bali</option>
                <option value="Sumatera Utara">Sumatera Utara</option>
              </select>
              {errors.province && <p className="text-xs text-red-500">{errors.province.message}</p>}
            </div>

            <Input
              id="shipping-city"
              label="Kota / Kabupaten"
              placeholder="Nama kota"
              required
              error={errors.city?.message}
              {...register('city')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="shipping-district"
              label="Kecamatan"
              placeholder="Nama kecamatan"
              required
              error={errors.district?.message}
              {...register('district')}
            />
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
            {COURIERS.map((courier) => (
              <label
                key={courier}
                className="flex items-center gap-2 border border-[#d2c5b1] rounded-xl px-3 py-3 cursor-pointer hover:border-gold-400 has-[:checked]:border-gold-500 has-[:checked]:bg-gold-50 transition-all"
              >
                <input
                  type="radio"
                  value={courier}
                  className="accent-gold-500"
                  {...register('courier')}
                />
                <span className="text-sm font-medium text-navy-800">{courier}</span>
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
