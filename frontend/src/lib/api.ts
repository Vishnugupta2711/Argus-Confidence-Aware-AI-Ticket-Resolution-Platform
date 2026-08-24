import axios from "axios";

const API_BASE_URL = import.meta.env.DEV ? "http://localhost:8005/api" : "https://argus-okop.onrender.com/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
