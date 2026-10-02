import { useEffect, useState } from 'react'

// Chrome/Android only; not in the TS DOM lib.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'nb-photobooth-install-dismissed'

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true

// iPadOS reports itself as a Mac, so also check for touch.
const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1)

function wasDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

/** "Install app" banner: a real install button on Chrome/Android, instructions on iOS. */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(wasDismissed)
  const [iosHint] = useState(() => isIOS() && !isStandalone())

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => setDeferred(null)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (dismissed || (!deferred && !iosHint)) return null

  function dismiss() {
    setDismissed(true)
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      // Storage blocked: the banner just comes back next visit.
    }
  }

  async function install() {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
  }

  return (
    <div className="install" role="note">
      <div className="install-text">
        <strong>Use it like an app</strong>
        {deferred ? (
          <span>Install for quick access — works offline too.</span>
        ) : (
          <span>
            Tap <b>Share</b>{' '}
            <svg className="share-icon" viewBox="0 0 16 20" aria-hidden="true">
              <path d="M8 1v12M4 5l4-4 4 4M5 8H2v11h12V8h-3" />
            </svg>{' '}
            then <b>Add to Home Screen</b>.
          </span>
        )}
      </div>
      {deferred && (
        <button type="button" className="btn btn-primary btn-small" onClick={install}>
          Install
        </button>
      )}
      <button type="button" className="install-close" aria-label="Dismiss" onClick={dismiss}>
        ×
      </button>
    </div>
  )
}
