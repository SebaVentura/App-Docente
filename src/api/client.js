import axios from 'axios'
import { getToken, clearSession } from './authStorage'

const baseURL = import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? 'https://api.appdocentes.com' : 'http://localhost:8000')

const isDev = !import.meta.env.PROD

function maskHeaders(headers) {
  if (!headers) return headers
  const safe = { ...headers }
  if (typeof safe.Authorization === 'string') {
    const auth = safe.Authorization
    const prefix = auth.slice(0, 7)
    const suffix = auth.slice(-4)
    safe.Authorization = `${prefix}***${suffix}`
  }
  return safe
}

function maskBody(data) {
  if (!data) return data
  let body = data
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      return body
    }
  }
  if (typeof body !== 'object' || body === null) return body
  const clone = { ...body }
  if (Object.prototype.hasOwnProperty.call(clone, 'password')) {
    clone.password = '***masked***'
  }
  return clone
}

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

apiClient.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  if (isDev) {
    try {
      const finalBaseURL = config.baseURL || baseURL || ''
      const url = `${finalBaseURL}${config.url || ''}`
      const method = (config.method || 'get').toUpperCase()
      console.info('[apiClient][request]', {
        url,
        method,
        headers: maskHeaders(config.headers),
        data: maskBody(config.data),
        withCredentials: config.withCredentials ?? false
      })
    } catch (e) {
      console.warn('[apiClient][request][debug-error]', e)
    }
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => {
    if (isDev) {
      try {
        const { config, status, statusText, headers, data, request } = response
        const finalBaseURL = config.baseURL || baseURL || ''
        const url = `${finalBaseURL}${config.url || ''}`
        const responseURL = request && request.responseURL
        console.info('[apiClient][response]', {
          url,
          status,
          statusText,
          headers,
          data,
          responseURL,
          redirected: Boolean(responseURL && responseURL !== url)
        })
      } catch (e) {
        console.warn('[apiClient][response][debug-error]', e)
      }
    }
    return response
  },
  (error) => {
    if (isDev) {
      try {
        const cfg = error.config || {}
        const finalBaseURL = cfg.baseURL || baseURL || ''
        const url = `${finalBaseURL}${cfg.url || ''}`
        console.error('[apiClient][error]', {
          message: error.message,
          code: error.code,
          isAxiosError: error.isAxiosError,
          config: {
            url,
            method: cfg.method,
            headers: maskHeaders(cfg.headers),
            withCredentials: cfg.withCredentials ?? false
          },
          hasResponse: Boolean(error.response),
          response: error.response && {
            status: error.response.status,
            statusText: error.response.statusText,
            headers: error.response.headers,
            data: error.response.data
          },
          hasRequest: Boolean(error.request),
          requestType: error.request && error.request.constructor && error.request.constructor.name
        })
      } catch (e) {
        console.warn('[apiClient][error][debug-error]', e)
      }
    }

    if (error.response?.status === 401) {
      clearSession()
      window.location.hash = '/login'
    }
    return Promise.reject(error)
  }
)
