import { useEffect } from 'react'
import OneSignal from 'react-onesignal'
import { useAuth } from '../context/AuthContext'

export function OneSignalSetup() {
  const { user } = useAuth()

  useEffect(() => {
    const initOneSignal = async () => {
      try {
        await OneSignal.init({
          appId: import.meta.env.VITE_ONESIGNAL_APP_ID || '',
          allowLocalhostAsSecureOrigin: true,
        })
        console.log('OneSignal initialized')
      } catch (error) {
        console.error('OneSignal initialization failed:', error)
      }
    }

    initOneSignal()
  }, [])

  // Set external user ID when user logs in
  useEffect(() => {
    if (user?.id) {
      OneSignal.login(String(user.id))
      console.log('OneSignal external user ID set:', user.id)
    }
  }, [user?.id])

  return null
}
