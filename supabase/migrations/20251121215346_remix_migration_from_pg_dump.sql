CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  
  INSERT INTO public.study_preferences (user_id)
  VALUES (new.id);
  
  RETURN new;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: friendships; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.friendships (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    friend_id uuid NOT NULL,
    status text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT friendships_check CHECK ((user_id <> friend_id)),
    CONSTRAINT friendships_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text])))
);


--
-- Name: homeworks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.homeworks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    subject text NOT NULL,
    title text NOT NULL,
    description text,
    due_date date NOT NULL,
    completed boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    duration integer
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    full_name text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: study_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.study_preferences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    daily_study_hours integer DEFAULT 2,
    preferred_start_time time without time zone DEFAULT '09:00:00'::time without time zone,
    preferred_end_time time without time zone DEFAULT '17:00:00'::time without time zone,
    study_days jsonb DEFAULT '["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]'::jsonb,
    break_duration integer DEFAULT 15,
    session_duration integer DEFAULT 45,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: study_streaks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.study_streaks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    date date NOT NULL,
    sessions_completed integer DEFAULT 0 NOT NULL,
    minutes_studied integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: subjects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subjects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    exam_board text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: test_dates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.test_dates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    subject_id uuid NOT NULL,
    test_date date NOT NULL,
    test_type text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: timetables; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.timetables (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    schedule jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    subjects jsonb,
    topics jsonb,
    test_dates jsonb,
    preferences jsonb
);


--
-- Name: topics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.topics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    subject_id uuid NOT NULL,
    name text NOT NULL,
    difficulty text,
    confidence_level integer,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT topics_confidence_level_check CHECK (((confidence_level >= 1) AND (confidence_level <= 5))),
    CONSTRAINT topics_difficulty_check CHECK ((difficulty = ANY (ARRAY['easy'::text, 'medium'::text, 'hard'::text])))
);


--
-- Name: weekly_goals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.weekly_goals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    week_start date NOT NULL,
    target_hours integer NOT NULL,
    current_hours integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: friendships friendships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friendships
    ADD CONSTRAINT friendships_pkey PRIMARY KEY (id);


--
-- Name: friendships friendships_user_id_friend_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friendships
    ADD CONSTRAINT friendships_user_id_friend_id_key UNIQUE (user_id, friend_id);


--
-- Name: homeworks homeworks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.homeworks
    ADD CONSTRAINT homeworks_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: study_preferences study_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.study_preferences
    ADD CONSTRAINT study_preferences_pkey PRIMARY KEY (id);


--
-- Name: study_preferences study_preferences_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.study_preferences
    ADD CONSTRAINT study_preferences_user_id_key UNIQUE (user_id);


--
-- Name: study_streaks study_streaks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.study_streaks
    ADD CONSTRAINT study_streaks_pkey PRIMARY KEY (id);


--
-- Name: study_streaks study_streaks_user_id_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.study_streaks
    ADD CONSTRAINT study_streaks_user_id_date_key UNIQUE (user_id, date);


--
-- Name: subjects subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_pkey PRIMARY KEY (id);


--
-- Name: test_dates test_dates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_dates
    ADD CONSTRAINT test_dates_pkey PRIMARY KEY (id);


--
-- Name: timetables timetables_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.timetables
    ADD CONSTRAINT timetables_pkey PRIMARY KEY (id);


--
-- Name: topics topics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.topics
    ADD CONSTRAINT topics_pkey PRIMARY KEY (id);


--
-- Name: weekly_goals weekly_goals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.weekly_goals
    ADD CONSTRAINT weekly_goals_pkey PRIMARY KEY (id);


--
-- Name: weekly_goals weekly_goals_user_id_week_start_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.weekly_goals
    ADD CONSTRAINT weekly_goals_user_id_week_start_key UNIQUE (user_id, week_start);


--
-- Name: friendships update_friendships_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_friendships_updated_at BEFORE UPDATE ON public.friendships FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: homeworks update_homeworks_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_homeworks_updated_at BEFORE UPDATE ON public.homeworks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: study_preferences update_study_preferences_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_study_preferences_updated_at BEFORE UPDATE ON public.study_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: weekly_goals update_weekly_goals_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_weekly_goals_updated_at BEFORE UPDATE ON public.weekly_goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: study_preferences study_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.study_preferences
    ADD CONSTRAINT study_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: subjects subjects_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: test_dates test_dates_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_dates
    ADD CONSTRAINT test_dates_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;


--
-- Name: timetables timetables_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.timetables
    ADD CONSTRAINT timetables_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: topics topics_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.topics
    ADD CONSTRAINT topics_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;


--
-- Name: profiles Authenticated users can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);


--
-- Name: friendships Users can accept/reject friend requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can accept/reject friend requests" ON public.friendships FOR UPDATE USING ((auth.uid() = friend_id));


--
-- Name: friendships Users can create friend requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create friend requests" ON public.friendships FOR INSERT WITH CHECK (((auth.uid() = user_id) AND (status = 'pending'::text)));


--
-- Name: friendships Users can delete friendships; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete friendships" ON public.friendships FOR DELETE USING (((auth.uid() = user_id) OR (auth.uid() = friend_id)));


--
-- Name: profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: weekly_goals Users can manage own goals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own goals" ON public.weekly_goals USING ((auth.uid() = user_id));


--
-- Name: homeworks Users can manage own homeworks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own homeworks" ON public.homeworks USING ((auth.uid() = user_id));


--
-- Name: study_preferences Users can manage own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own preferences" ON public.study_preferences USING ((auth.uid() = user_id));


--
-- Name: study_streaks Users can manage own streaks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own streaks" ON public.study_streaks USING ((auth.uid() = user_id));


--
-- Name: subjects Users can manage own subjects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own subjects" ON public.subjects USING ((auth.uid() = user_id));


--
-- Name: timetables Users can manage own timetables; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own timetables" ON public.timetables USING ((auth.uid() = user_id));


--
-- Name: test_dates Users can manage test dates for their subjects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage test dates for their subjects" ON public.test_dates USING ((EXISTS ( SELECT 1
   FROM public.subjects
  WHERE ((subjects.id = test_dates.subject_id) AND (subjects.user_id = auth.uid())))));


--
-- Name: topics Users can manage topics for their subjects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage topics for their subjects" ON public.topics USING ((EXISTS ( SELECT 1
   FROM public.subjects
  WHERE ((subjects.id = topics.subject_id) AND (subjects.user_id = auth.uid())))));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: friendships Users can view own friendships; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own friendships" ON public.friendships FOR SELECT USING (((auth.uid() = user_id) OR (auth.uid() = friend_id)));


--
-- Name: friendships; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

--
-- Name: homeworks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.homeworks ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: study_preferences; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.study_preferences ENABLE ROW LEVEL SECURITY;

--
-- Name: study_streaks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.study_streaks ENABLE ROW LEVEL SECURITY;

--
-- Name: subjects; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

--
-- Name: test_dates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.test_dates ENABLE ROW LEVEL SECURITY;

--
-- Name: timetables; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.timetables ENABLE ROW LEVEL SECURITY;

--
-- Name: topics; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

--
-- Name: weekly_goals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.weekly_goals ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


