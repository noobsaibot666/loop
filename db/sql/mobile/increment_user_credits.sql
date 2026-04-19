-- Atomic credit increment for purchase webhooks (RevenueCat and Stripe).
-- Applied after credits_atomic.sql which creates the user_credits table.

CREATE OR REPLACE FUNCTION public.increment_user_credits(p_user_id uuid, p_increment integer)
RETURNS TABLE (credits_after integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_credits (user_id, free_used, credits)
  VALUES (p_user_id, 0, p_increment)
  ON CONFLICT (user_id) DO UPDATE
    SET credits = public.user_credits.credits + p_increment,
        updated_at = now();
  RETURN QUERY SELECT credits FROM public.user_credits WHERE user_id = p_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_user_credits(uuid, integer) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_user_credits(uuid, integer) TO service_role;
