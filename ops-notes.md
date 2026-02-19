# Operations Notes

## Unpaid account cleanup
- Edge function: `supabase/functions/purge-unpaid-users/index.ts`
- Schedule this function to run daily/weekly after Stripe is connected.
- Logic: delete users created over 30 days ago with `user_metadata.paid` set to `false`.

## Stripe integration follow-up
- Once Stripe checkout is live, update `user_metadata.paid` to `true` after payment.
- Replace the email buttons on `pricing.html` with Stripe checkout links.