import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest } from 'next/server'

import { createClient } from '@/lib/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/dashboard'

  if (token_hash && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    if (!error) {
      // redirect user to specified redirect URL or root of app
      redirect(next)
    }

    console.error('[auth/confirm] Invalid token_hash or type provided for email confirmation:', error.message)
    redirect(`/login?error="${error.message}"`)
  }

  console.error('[auth/confirm] Missing token_hash or type query parameters for email confirmation', 'Token:', token_hash, 'Type:', type)
  // redirect the user to an error page with some instructions
  redirect(`/login?error=invalid_token`)
}