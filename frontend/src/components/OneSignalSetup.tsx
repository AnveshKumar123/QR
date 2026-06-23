import { useEffect } from 'react'
import OneSignal from 'react-onesignal'

export function OneSignalSetup() {
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

  return null
}
