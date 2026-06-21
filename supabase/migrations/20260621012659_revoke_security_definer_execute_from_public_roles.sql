-- Revoke EXECUTE on SECURITY DEFINER functions from anon and authenticated roles.
-- These functions are used internally (triggers, server-side calls) and must not
-- be callable via the PostgREST /rpc/ endpoint.

REVOKE EXECUTE ON FUNCTION public.handle_auth_user_sync() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.mark_session_question_answered() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refresh_session_aggregates(integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_practice_event(integer, integer, public.practice_event_type, jsonb) FROM anon, authenticated;
