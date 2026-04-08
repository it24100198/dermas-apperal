import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const S = `${BASE}/stock`;

export const getStockOverview   = ()       => axios.get(`${S}/overview`).then(r => r.data);
export const getAdjustments     = (params) => axios.get(`${S}/adjustments`, { params }).then(r => r.data);
export const createAdjustment   = (data)   => axios.post(`${S}/adjustments`, data).then(r => r.data);
export const getIssuances       = (params) => axios.get(`${S}/issuances`, { params }).then(r => r.data);
export const createIssuance     = (data)   => axios.post(`${S}/issuances`, data).then(r => r.data);
export const getStockHistory    = (params) => axios.get(`${S}/history`, { params }).then(r => r.data);
export const getMaterialHistory = (id)     => axios.get(`${S}/history/material/${id}`).then(r => r.data);
export const barcodeLookup      = (query)  => axios.post(`${S}/barcode/lookup`, { query }).then(r => r.data);
