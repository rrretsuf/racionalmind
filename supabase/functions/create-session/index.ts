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

    if (prevSessionError) {
      logger.error('Error fetching previous session', prevSessionError)
    }

    let newNum = 1
    if (prevSession) {
      newNum = prevSession.num + 1
      const { error: updateError } = await supabase
        .from('sessions')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', prevSession.id)

      if (updateError) {
        logger.error('Failed to update previous session', updateError)
      } else {
        logger.info(`Previous session ${prevSession.id} marked as completed. Triggering post-processing.`)
        supabase.functions.invoke('process-session-end', {
          body: { session_id: prevSession.id, user_id: userId },
        }).then(({ data, error }) => {
          if (error) {
            logger.error('Error invoking process-session-end:', error)
          } else {
            logger.info('process-session-end invoked successfully:', data)
          }
        }).catch(invokeError => {
          logger.error('Caught error during supabase.functions.invoke for process-session-end:', invokeError)
        })
      }
    }

    if (!prevSession) {
      const { data: maxNumRow, error: maxNumError } = await supabase
        .from('sessions')
        .select('num')
        .eq('user_id', userId)
        .order('num', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (maxNumError) {
        logger.error('Error fetching max session number', maxNumError)
      }

      if (maxNumRow && maxNumRow.num) {
        newNum = maxNumRow.num + 1
      } else {
        newNum = 1
      }
    } else if (prevSession && prevSession.num) {
      newNum = prevSession.num + 1
    }

    const newSessionPayload = {
      user_id: userId,
      num: newNum,
      status: 'active',
      started_at: new Date().toISOString(),
      updated_at: null,
      summary: null,
      summary_embedding: null,
      patterns: null,
      patterns_embedding: null
    }

    logger.debug("Attempting to insert new session with payload:", newSessionPayload)

    const { data: newSession, error: insertError } = await supabase
      .from('sessions')
      .insert(newSessionPayload)
      .select('id')
      .single()

    if (insertError) {
      logger.error('Failed to create new session', insertError)
      return new Response(JSON.stringify({ error: 'Failed to create new session' }), { status: 500, headers: corsHeaders })
    }

    logger.info(`New session ${newSession.id} created for user ${userId}`)
    return new Response(JSON.stringify({ sessionId: newSession.id }), { status: 200, headers: corsHeaders })
  } catch (error) {
    logger.error('Unhandled error in create-session', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: corsHeaders })
  }
}) 