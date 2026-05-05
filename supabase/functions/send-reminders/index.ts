import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Get all active subscriptions
    const { data: subs, error: subError } = await supabaseClient
      .from('subscriptions')
      .select('*, user_settings:user_id(email_reminders, reminder_days_before)')
      .eq('status', 'active')

    if (subError) throw subError

    // 2. Filter subs that need reminding today
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    const toRemind = subs.filter(sub => {
      // Check if user has reminders enabled
      if (!sub.user_settings || !sub.user_settings.email_reminders) return false

      const nextPayment = new Date(sub.next_payment)
      nextPayment.setHours(0, 0, 0, 0)
      
      const diffTime = nextPayment.getTime() - now.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      // Send reminder if diffDays equals their setting
      return diffDays === sub.user_settings.reminder_days_before
    })

    if (toRemind.length === 0) {
      return new Response(JSON.stringify({ message: "No reminders to send today" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // 3. Get user emails
    const userIds = [...new Set(toRemind.map(s => s.user_id))]
    const { data: users, error: userError } = await supabaseClient.auth.admin.listUsers()
    
    if (userError) throw userError
    
    const userEmails = users.users.reduce((acc, user) => {
      acc[user.id] = user.email
      return acc
    }, {} as Record<string, string | undefined>)

    // 4. Send emails via Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) throw new Error("RESEND_API_KEY not configured")

    const emailsSent = []

    for (const sub of toRemind) {
      const email = userEmails[sub.user_id]
      if (!email) continue

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`
        },
        body: JSON.stringify({
          from: 'SubscriptionSavvy <onboarding@resend.dev>',
          to: email,
          subject: `Upcoming Payment: ${sub.name}`,
          html: `
            <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;">
              <h2 style="color: #F5A623;">Payment Reminder</h2>
              <p>Hello,</p>
              <p>This is a reminder that your <strong>${sub.name}</strong> subscription will renew on <strong>${sub.next_payment}</strong>.</p>
              <div style="background: #f4f4f4; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Amount:</strong> ${sub.cost} ${sub.currency}</p>
                <p style="margin: 5px 0 0 0;"><strong>Cycle:</strong> ${sub.billing_cycle}</p>
              </div>
              <p>If you wish to cancel, please do so before the renewal date.</p>
              <br/>
              <p style="color: #888; font-size: 12px;">Powered by SubscriptionSavvy 2.0</p>
            </div>
          `
        })
      })

      if (res.ok) {
        emailsSent.push(sub.id)
      }
    }

    return new Response(JSON.stringify({ 
      message: `Successfully processed reminders`,
      processed: toRemind.length,
      sent: emailsSent.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
