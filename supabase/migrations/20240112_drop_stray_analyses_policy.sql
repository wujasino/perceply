-- "Users see own analyses" (ALL, role public) is a stray policy that predates
-- the 20240104 hardening migration and was never targeted by its cleanup —
-- it survived because it has a different name than the policies that
-- migration knew to drop. It's redundant: the specific SELECT/INSERT/DELETE
-- policies for `authenticated` (plus the service_role ALL policy) already
-- cover every access path the app uses. Nothing relies on `public`-role
-- access to this table. Drop it to keep the policy set minimal and unambiguous.

DROP POLICY IF EXISTS "Users see own analyses" ON public.analyses;
