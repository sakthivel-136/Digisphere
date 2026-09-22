import axiosClient from "./axiosClient";
// fetchFactories removed — use getFactories from factories.api.js (cached, single source of truth)
export { getFactories as fetchFactories } from "./factories.api";

// ----------------- QR Data (Response Model) -----------------
export interface QRData {
  qr_id: number;
  qr_name: string;
  lat: number;
  lon: number;
  factory_code: string;
  status?: string;
  waiting_time: number;
  created_at?: string;
}

// ----------------- Factory Data -----------------
export interface Factory {
  factory_code: string;
  factory_name: string;
}

// ----------------- Request Models -----------------

// For CREATE (backend generates qr_id + created_at)
export type CreateQRPayload = Omit<QRData, "qr_id" | "created_at">;

// For UPDATE (partial allowed, exclude immutable fields)
export type UpdateQRPayload = Partial<Omit<QRData, "qr_id" | "created_at">>;

// ----------------- CREATE QR -----------------
export const createQR = async (
  data: CreateQRPayload
): Promise<QRData> => {

  const payload: CreateQRPayload = {
    ...data,
    waiting_time: data.waiting_time ?? 15,
  };

  const res = await axiosClient.post("/qr/", payload);
  return res.data;
};

// ----------------- GET QR BY FACTORY -----------------
export const fetchQRByFactory = async (
  factoryCode: string
): Promise<QRData[]> => {
  const res = await axiosClient.get(`/qr/factory/${factoryCode}`);
  return res.data;
};

// ----------------- GET QR BY ID -----------------
export const fetchQRById = async (
  qrId: number
): Promise<QRData> => {
  const res = await axiosClient.get(`/qr/${qrId}`);
  return res.data;
};

// ----------------- UPDATE QR -----------------
export const updateQR = async (
  qrId: number,
  data: UpdateQRPayload
): Promise<QRData> => {

  const payload: UpdateQRPayload = {
    ...data,
    waiting_time: data.waiting_time ?? 15,
  };

  const res = await axiosClient.put(`/qr/${qrId}`, payload);

  // Handle cases where backend returns array
  return Array.isArray(res.data) ? res.data[0] : res.data;
};

// ----------------- DELETE QR -----------------
export const deleteQR = async (qrId: number): Promise<void> => {
  await axiosClient.delete(`/qr/${qrId}`);
};

// fetchFactories is re-exported from ./factories.api (see top of file)

