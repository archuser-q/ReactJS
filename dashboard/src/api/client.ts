import axios from 'axios'

export type ApiError = {
    status?: number;
    message: string;
}

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
})

api.interceptors.response.use(
    (res)=>res,
    (err)=>{
        const error: ApiError={
            status: err.response?.status,
            message: err.response?.data?.message || 'Unable to connect to server',
        }
        return Promise.reject(error)
    }
)