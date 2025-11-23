-- First, delete duplicate homeworks, keeping only the oldest one for each unique combination
DELETE FROM public.homeworks a
USING public.homeworks b
WHERE a.id > b.id
  AND a.user_id = b.user_id
  AND a.title = b.title
  AND a.subject = b.subject
  AND a.due_date = b.due_date;

-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('paid', 'free');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE,
    role app_role NOT NULL DEFAULT 'free',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user role (returns 'free' if not found)
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.user_roles WHERE user_id = _user_id),
    'free'::app_role
  )
$$;

-- Create usage_limits table to track free user limits
CREATE TABLE public.usage_limits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    timetable_creations integer NOT NULL DEFAULT 0,
    timetable_regenerations integer NOT NULL DEFAULT 0,
    daily_insights_used boolean NOT NULL DEFAULT false,
    ai_insights_generations integer NOT NULL DEFAULT 0,
    last_reset_date date NOT NULL DEFAULT CURRENT_DATE,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id)
);

-- Enable RLS on usage_limits
ALTER TABLE public.usage_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own role
CREATE POLICY "Users can view own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policy: Users can view and manage their own usage limits
CREATE POLICY "Users can manage own usage limits"
ON public.usage_limits
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Function to reset daily limits
CREATE OR REPLACE FUNCTION public.reset_daily_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.usage_limits
  SET 
    daily_insights_used = false,
    last_reset_date = CURRENT_DATE,
    updated_at = now()
  WHERE last_reset_date < CURRENT_DATE;
END;
$$;

-- Function to check if user can create timetable
CREATE OR REPLACE FUNCTION public.can_create_timetable(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role;
  creation_count integer;
BEGIN
  user_role := public.get_user_role(_user_id);
  
  IF user_role = 'paid' THEN
    RETURN true;
  END IF;
  
  SELECT COALESCE(timetable_creations, 0)
  INTO creation_count
  FROM public.usage_limits
  WHERE user_id = _user_id;
  
  IF creation_count IS NULL THEN
    RETURN true;
  END IF;
  
  RETURN creation_count < 1;
END;
$$;

-- Function to check if user can regenerate timetable
CREATE OR REPLACE FUNCTION public.can_regenerate_timetable(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role;
  regen_count integer;
BEGIN
  user_role := public.get_user_role(_user_id);
  
  IF user_role = 'paid' THEN
    RETURN true;
  END IF;
  
  SELECT COALESCE(timetable_regenerations, 0)
  INTO regen_count
  FROM public.usage_limits
  WHERE user_id = _user_id;
  
  IF regen_count IS NULL THEN
    RETURN true;
  END IF;
  
  RETURN regen_count < 1;
END;
$$;

-- Function to check if user can use daily insights
CREATE OR REPLACE FUNCTION public.can_use_daily_insights(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role;
  insights_used boolean;
BEGIN
  user_role := public.get_user_role(_user_id);
  
  IF user_role = 'paid' THEN
    RETURN true;
  END IF;
  
  PERFORM public.reset_daily_limits();
  
  SELECT COALESCE(daily_insights_used, false)
  INTO insights_used
  FROM public.usage_limits
  WHERE user_id = _user_id;
  
  IF insights_used IS NULL THEN
    RETURN true;
  END IF;
  
  RETURN NOT insights_used;
END;
$$;

-- Function to check if user can generate AI insights
CREATE OR REPLACE FUNCTION public.can_generate_ai_insights(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role;
  gen_count integer;
BEGIN
  user_role := public.get_user_role(_user_id);
  
  IF user_role = 'paid' THEN
    RETURN true;
  END IF;
  
  SELECT COALESCE(ai_insights_generations, 0)
  INTO gen_count
  FROM public.usage_limits
  WHERE user_id = _user_id;
  
  IF gen_count IS NULL THEN
    RETURN true;
  END IF;
  
  RETURN gen_count < 1;
END;
$$;

-- Function to increment usage counters
CREATE OR REPLACE FUNCTION public.increment_usage(
  _user_id uuid,
  _action text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.usage_limits (user_id, last_reset_date)
  VALUES (_user_id, CURRENT_DATE)
  ON CONFLICT (user_id) DO NOTHING;
  
  PERFORM public.reset_daily_limits();
  
  CASE _action
    WHEN 'timetable_creation' THEN
      UPDATE public.usage_limits
      SET timetable_creations = timetable_creations + 1,
          updated_at = now()
      WHERE user_id = _user_id;
      
    WHEN 'timetable_regeneration' THEN
      UPDATE public.usage_limits
      SET timetable_regenerations = timetable_regenerations + 1,
          updated_at = now()
      WHERE user_id = _user_id;
      
    WHEN 'daily_insights' THEN
      UPDATE public.usage_limits
      SET daily_insights_used = true,
          updated_at = now()
      WHERE user_id = _user_id;
      
    WHEN 'ai_insights' THEN
      UPDATE public.usage_limits
      SET ai_insights_generations = ai_insights_generations + 1,
          updated_at = now()
      WHERE user_id = _user_id;
  END CASE;
END;
$$;

-- Trigger to auto-create user_roles entry when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
  paid_emails text[] := ARRAY['abhiramkakarla1@gmail.com', 'dhrishiv.panjabi@gmail.com', '22UKakarlaA@qerdp.co.uk'];
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

-- Create trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();

-- Add unique constraint to homeworks to prevent duplicates
ALTER TABLE public.homeworks 
ADD CONSTRAINT homeworks_user_title_subject_due_date_key 
UNIQUE (user_id, title, subject, due_date);