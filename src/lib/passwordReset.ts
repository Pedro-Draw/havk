import { auth } from './firebase'

export type AccountLookup = 'exists' | 'missing' | 'unknown'

const CONTINUE_URI = 'https://pedro-draw.github.io/havk/'

/** A proteção contra enumeração esconde a lista de métodos. A conta existente pede captcha; a inexistente não. */
export async function lookupAccount(email: string): Promise<AccountLookup> {
  const apiKey = auth.app.options.apiKey
  if (!apiKey) return 'unknown'

  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: email,
          continueUri: CONTINUE_URI,
        }),
      }
    )
    const data = await response.json()
    if (!response.ok || data.error) return 'unknown'
    if (data.registered === true) return 'exists'
    if (Array.isArray(data.signinMethods) && data.signinMethods.length > 0) return 'exists'
    if (data.registered === false) return 'missing'
    if (data.captchaRequired === true) return 'exists'
    return 'missing'
  } catch {
    return 'unknown'
  }
}
