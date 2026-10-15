import {api} from './client'

export type AdminUser = {
    id: string,
    email: string | null,
    phone: string | null,
    full_name: string,
    avatar_url: string | null,
    role: 'admin',
    status: string
}

type LoginResponse = {
    message: string, 
    user: AdminUser
}

export const login = async (identifier: string, password: string) => {
    const {data} = await api.post<LoginResponse>(
        '/admin/auth/login', {identifier, password}
    )
    return data
}

export const getMe = async() => {
    const {data} = await api.get<{user: AdminUser}>('/admin/auth/me')
    return data.user
}

export const logout = async() => {
    await api.post('/admin/auth/logout')
}