-- Update the handle_new_user_role function to include the correct paid emails
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_email text;
  paid_emails text[] := ARRAY['abhiramkakarla1@gmail.com', '22UKakarlaA@qerdp.co.uk', '22upanjabid@qerdp.co.uk'];
BEGIN
  user_email := NEW.email;
  
  IF user_email = ANY(paid_emails) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'paid');
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'free');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update existing user roles for these specific accounts
UPDATE public.user_roles
SET role = 'paid', updated_at = now()
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('abhiramkakarla1@gmail.com', '22UKakarlaA@qerdp.co.uk', '22upanjabid@qerdp.co.uk')
);