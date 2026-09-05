import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('adminToken') || '')

  function setToken(t: string) {
    token.value = t
    localStorage.setItem('adminToken', t)
  }

  function logout() {
    token.value = ''
    localStorage.removeItem('adminToken')
  }

  function isLoggedIn() {
    return !!token.value
  }

  return { token, setToken, logout, isLoggedIn }
})
