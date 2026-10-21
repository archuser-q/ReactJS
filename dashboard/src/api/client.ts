import axios from 'axios'

export type ApiError = {
    status?: number;
    message: string;
}

// Mặc định gọi cùng origin qua '/api' (Vite dev và nginx trong Docker đều proxy sang backend),
// nên cookie đăng nhập httpOnly luôn là cookie cùng site. Muốn gọi thẳng backend thì đặt VITE_API_URL.
export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    withCredentials: true,
})

api.interceptors.response.use(
    (res)=>res,
    (err)=>{
        const error: ApiError={
            status: err.response?.status,
            message: err.response?.data?.message || 'Không kết nối được máy chủ',
        }
        return Promise.reject(error)
    }
)
