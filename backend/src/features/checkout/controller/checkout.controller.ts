import { Request, Response } from 'express';
import * as checkoutService from '../service/checkout.service';
import { sendSuccess } from '../../../core/utils/response';
import {
  checkoutCustomerBodySchema,
  checkoutCustomerQuerySchema,
  cityByProvinceSchema,
  destinationSearchSchema,
  districtByCitySchema,
  shippingRatesSchema,
  subdistrictByDistrictSchema,
} from '../schema/checkout.schema';

export async function lookupCustomer(req: Request, res: Response) {
  const query = checkoutCustomerQuerySchema.parse(req.query);
  const customer = await checkoutService.lookupCheckoutCustomer(query.email);
  sendSuccess({ res, data: customer });
}

export async function saveCustomer(req: Request, res: Response) {
  const body = checkoutCustomerBodySchema.parse(req.body);
  const customer = await checkoutService.saveCheckoutCustomer(body, req.file);
  sendSuccess({ res, message: 'Data checkout berhasil disimpan', data: customer });
}

export async function getShippingRates(req: Request, res: Response) {
  const query = shippingRatesSchema.parse(req.query);
  const rates = await checkoutService.getShippingRates({
    destinationCity: query.destinationCity,
    destinationDistrict: query.destinationDistrict,
    destinationVillage: query.destinationVillage,
    destinationPostalCode: query.destinationPostalCode,
    weightGram: query.weightGram,
  });
  sendSuccess({ res, data: rates });
}

export async function searchDestinations(req: Request, res: Response) {
  const query = destinationSearchSchema.parse(req.query);
  const destinations = await checkoutService.searchRajaOngkirDestinations(query.search);
  sendSuccess({ res, data: destinations });
}

export async function getProvinces(req: Request, res: Response) {
  void req;
  const provinces = await checkoutService.getRajaOngkirProvinces();
  sendSuccess({ res, data: provinces });
}

export async function getCities(req: Request, res: Response) {
  const query = cityByProvinceSchema.parse(req.query);
  const cities = await checkoutService.getRajaOngkirCities(query.provinceId);
  sendSuccess({ res, data: cities });
}

export async function getDistricts(req: Request, res: Response) {
  const query = districtByCitySchema.parse(req.query);
  const districts = await checkoutService.getRajaOngkirDistricts(query.cityId);
  sendSuccess({ res, data: districts });
}

export async function getSubdistricts(req: Request, res: Response) {
  const query = subdistrictByDistrictSchema.parse(req.query);
  const subdistricts = await checkoutService.getRajaOngkirSubdistricts(query.districtId);
  sendSuccess({ res, data: subdistricts });
}
