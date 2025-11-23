-- Create group_invitations table for friend invitations to groups
CREATE TABLE IF NOT EXISTS public.group_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(group_id, invitee_id)
);

-- Create group_challenges table for daily study hour goals
CREATE TABLE IF NOT EXISTS public.group_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE UNIQUE,
  daily_hours_goal INTEGER NOT NULL DEFAULT 2,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.group_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_challenges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for group_invitations
CREATE POLICY "Users can view invitations they sent or received"
  ON public.group_invitations
  FOR SELECT
  USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

CREATE POLICY "Group admins can invite members"
  ON public.group_invitations
  FOR INSERT
  WITH CHECK (
    auth.uid() = inviter_id AND
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = group_invitations.group_id
        AND user_id = auth.uid()
        AND role = 'admin'
    )
  );

CREATE POLICY "Invitees can update their invitations"
  ON public.group_invitations
  FOR UPDATE
  USING (auth.uid() = invitee_id);

CREATE POLICY "Inviters can delete their invitations"
  ON public.group_invitations
  FOR DELETE
  USING (auth.uid() = inviter_id);

-- RLS Policies for group_challenges
CREATE POLICY "Group members can view group challenges"
  ON public.group_challenges
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = group_challenges.group_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Group admins can manage challenges"
  ON public.group_challenges
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = group_challenges.group_id
        AND user_id = auth.uid()
        AND role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_group_invitations_invitee ON public.group_invitations(invitee_id);
CREATE INDEX IF NOT EXISTS idx_group_invitations_status ON public.group_invitations(status);
CREATE INDEX IF NOT EXISTS idx_group_challenges_group ON public.group_challenges(group_id);