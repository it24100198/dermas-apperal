import { api } from './client';

const S = '/stock';

export const getStockOverview   = ()       => api.get(`${S}/overview`).then(r => r.data);
export const getAdjustments     = (params) => api.get(`${S}/adjustments`, { params }).then(r => r.data);
export const createAdjustment   = (data)   => api.post(`${S}/adjustments`, data).then(r => r.data);
export const getIssuances       = (params) => api.get(`${S}/issuances`, { params }).then(r => r.data);
export const createIssuance     = (data)   => api.post(`${S}/issuances`, data).then(r => r.data);
export const getStockHistory    = (params) => api.get(`${S}/history`, { params }).then(r => r.data);
export const getMaterialHistory = (id)     => api.get(`${S}/history/material/${id}`).then(r => r.data);
export const barcodeLookup      = (query)  => api.post(`${S}/barcode/lookup`, { query }).then(r => r.data);
