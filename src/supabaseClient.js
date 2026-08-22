import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://spdigcvpvwmehqogufvt.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_WaObF__vB2uwKumZl07pxA_ycctBHqN'

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
