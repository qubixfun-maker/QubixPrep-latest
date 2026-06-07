
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://brchhyvacvwnfjpqokvj.supabase.co'
const supabaseKey = 'sb_publishable_4zQTOesPmTz1kvKVIih5Nw_nF7Do0nY'

export const supabase = createClient(supabaseUrl, supabaseKey)
