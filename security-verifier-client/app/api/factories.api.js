import axiosClient from "./axiosClient";
import { getCache, setCache, invalidateCache } from "@/lib/cache";

const CACHE_KEY = "factories";
const CACHE_TTL = 300; // 5 minutes

/* GET all factories — cached 5 min so navigating between pages skips re-fetch */
export const getFactories = async () => {
  const cached = getCache(CACHE_KEY);
  if (cached) return { data: cached };
  const res = await axiosClient.get("/factories");
  setCache(CACHE_KEY, res.data, CACHE_TTL);
  return res;
};

/* GET factory by ID */
export const getFactoryById = (id) =>
  axiosClient.get(`/factories/${id}`);

/* CREATE factory — busts cache */
export const createFactory = async (data) => {
  const res = await axiosClient.post("/factories", data);
  invalidateCache(CACHE_KEY);
  return res;
};

/* UPDATE factory — busts cache */
export const updateFactory = async (id, data) => {
  const res = await axiosClient.put(`/factories/${id}`, data);
  invalidateCache(CACHE_KEY);
  return res;
};

/* DELETE factory — busts cache */
export const deleteFactory = async (id) => {
  const res = await axiosClient.delete(`/factories/${id}`);
  invalidateCache(CACHE_KEY);
  return res;
};

