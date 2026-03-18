
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('id, title, status')
    .limit(5)

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('Blog Posts:', JSON.stringify(data, null, 2))
}

check()
