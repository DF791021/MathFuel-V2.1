-- The previous migration revoked EXECUTE from anon/authenticated directly,
-- but these roles still inherit EXECUTE from the PUBLIC pseudo-role.
-- Revoke from PUBLIC to fully close the exposure.

REVOKE EXECUTE ON FUNCTION public.handle_auth_user_sync() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.mark_session_question_answered() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.refresh_session_aggregates(integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_practice_event(integer, integer, public.practice_event_type, jsonb) FROM PUBLIC;
