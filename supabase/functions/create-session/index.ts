import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"
import { corsHeaders } from "../_shared/cors.ts"
import { logger } from "../_shared/logger.ts"

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.error('Missing or invalid Authorization header')
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }
    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt)
    if (userError || !user) {
      logger.error('User not authenticated', userError)
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }
    const userId = user.id

    const { data: prevSession, error: prevSessionError } = await supabase
      .from('sessions')
      .select('id, num')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    let newNum = 1
    if (prevSession) {
      newNum = prevSession.num + 1
      const { error: updateError } = await supabase
        .from('sessions')
        .update({ status: 'completed', ended_at: new Date().toISOString() })
        .eq('id', prevSession.id)
      if (updateError) {
        logger.error('Failed to update previous session', updateError)
        return new Response(JSON.stringify({ error: 'Failed to update previous session' }), { status: 500, headers: corsHeaders })
      }
    } else {
      const { data: maxNumRow, error: maxNumError } = await supabase
        .from('sessions')
        .select('num')
        .eq('user_id', userId)
        .order('num', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (maxNumRow && maxNumRow.num) {
        newNum = maxNumRow.num + 1
      }
    }

    const { data: newSession, error: insertError } = await supabase
      .from('sessions')
      .insert({
        user_id: userId,
        num: newNum,
        status: 'active',
        started_at: new Date().toISOString(),
        ended_at: null,
        summary: null,
        summary_embedding: null,
        patterns: null,
        patterns_embedding: null
      })
      .select('id')
      .single()
    if (insertError) {
      logger.error('Failed to create new session', insertError)
      return new Response(JSON.stringify({ error: 'Failed to create new session' }), { status: 500, headers: corsHeaders })
    }
    return new Response(JSON.stringify({ sessionId: newSession.id }), { status: 200, headers: corsHeaders })
  } catch (error) {
    logger.error('Unhandled error in create-session', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: corsHeaders })
  }
}) 