-- Policies de RLS para as 9 tabelas habilitadas em 0004_enable_rls.sql.
--
-- A aplicação hoje acessa o banco via DATABASE_URL (role owner do Postgres),
-- que faz bypass de RLS por padrão — a autorização real continua sendo feita
-- na camada de aplicação (src/lib/auth.ts: requireUser / requireFormOwner).
-- Estas policies existem como defesa em profundidade, para o caso de uma
-- conexão com role "anon"/"authenticated" (Supabase client direto, dashboard
-- SQL, MCP) tentar acessar os dados: elas espelham exatamente o modelo de
-- ownership já usado no código (dono do form = forms.created_by_id).
--
-- workspace_members existe no schema mas não é usada em nenhuma checagem de
-- autorização hoje (não há colaboração multiusuário ativa) — a policy abaixo
-- só cobre a própria membership do usuário.

-- ─── users ───────────────────────────────────────────────────────────────
CREATE POLICY "users_select_own" ON "users"
  FOR SELECT TO authenticated
  USING (auth.uid()::text = supabase_auth_id);

CREATE POLICY "users_update_own" ON "users"
  FOR UPDATE TO authenticated
  USING (auth.uid()::text = supabase_auth_id)
  WITH CHECK (auth.uid()::text = supabase_auth_id);

-- ─── workspaces ──────────────────────────────────────────────────────────
CREATE POLICY "workspaces_all_own" ON "workspaces"
  FOR ALL TO authenticated
  USING (
    owner_id IN (SELECT id FROM users WHERE supabase_auth_id = auth.uid()::text)
  )
  WITH CHECK (
    owner_id IN (SELECT id FROM users WHERE supabase_auth_id = auth.uid()::text)
  );

-- ─── workspace_members ───────────────────────────────────────────────────
CREATE POLICY "workspace_members_select_own" ON "workspace_members"
  FOR SELECT TO authenticated
  USING (
    user_id IN (SELECT id FROM users WHERE supabase_auth_id = auth.uid()::text)
  );

-- ─── forms ───────────────────────────────────────────────────────────────
CREATE POLICY "forms_all_own" ON "forms"
  FOR ALL TO authenticated
  USING (
    created_by_id IN (SELECT id FROM users WHERE supabase_auth_id = auth.uid()::text)
  )
  WITH CHECK (
    created_by_id IN (SELECT id FROM users WHERE supabase_auth_id = auth.uid()::text)
  );

CREATE POLICY "forms_select_published" ON "forms"
  FOR SELECT
  USING (status = 'published');

-- ─── questions ───────────────────────────────────────────────────────────
CREATE POLICY "questions_all_own" ON "questions"
  FOR ALL TO authenticated
  USING (
    form_id IN (
      SELECT id FROM forms WHERE created_by_id IN (
        SELECT id FROM users WHERE supabase_auth_id = auth.uid()::text
      )
    )
  )
  WITH CHECK (
    form_id IN (
      SELECT id FROM forms WHERE created_by_id IN (
        SELECT id FROM users WHERE supabase_auth_id = auth.uid()::text
      )
    )
  );

CREATE POLICY "questions_select_published_form" ON "questions"
  FOR SELECT
  USING (
    form_id IN (SELECT id FROM forms WHERE status = 'published')
  );

-- ─── responses ───────────────────────────────────────────────────────────
CREATE POLICY "responses_select_update_delete_own_form" ON "responses"
  FOR ALL TO authenticated
  USING (
    form_id IN (
      SELECT id FROM forms WHERE created_by_id IN (
        SELECT id FROM users WHERE supabase_auth_id = auth.uid()::text
      )
    )
  )
  WITH CHECK (
    form_id IN (
      SELECT id FROM forms WHERE created_by_id IN (
        SELECT id FROM users WHERE supabase_auth_id = auth.uid()::text
      )
    )
  );

CREATE POLICY "responses_insert_published_form" ON "responses"
  FOR INSERT
  WITH CHECK (
    form_id IN (SELECT id FROM forms WHERE status = 'published')
  );

-- ─── answers ─────────────────────────────────────────────────────────────
CREATE POLICY "answers_all_own_form" ON "answers"
  FOR ALL TO authenticated
  USING (
    response_id IN (
      SELECT id FROM responses WHERE form_id IN (
        SELECT id FROM forms WHERE created_by_id IN (
          SELECT id FROM users WHERE supabase_auth_id = auth.uid()::text
        )
      )
    )
  )
  WITH CHECK (
    response_id IN (
      SELECT id FROM responses WHERE form_id IN (
        SELECT id FROM forms WHERE created_by_id IN (
          SELECT id FROM users WHERE supabase_auth_id = auth.uid()::text
        )
      )
    )
  );

CREATE POLICY "answers_insert_published_form" ON "answers"
  FOR INSERT
  WITH CHECK (
    response_id IN (
      SELECT id FROM responses WHERE form_id IN (
        SELECT id FROM forms WHERE status = 'published'
      )
    )
  );

-- ─── integrations ────────────────────────────────────────────────────────
-- Sem policy pública: config pode conter segredos (secret, apiKey, tokens).
CREATE POLICY "integrations_all_own_form" ON "integrations"
  FOR ALL TO authenticated
  USING (
    form_id IN (
      SELECT id FROM forms WHERE created_by_id IN (
        SELECT id FROM users WHERE supabase_auth_id = auth.uid()::text
      )
    )
  )
  WITH CHECK (
    form_id IN (
      SELECT id FROM forms WHERE created_by_id IN (
        SELECT id FROM users WHERE supabase_auth_id = auth.uid()::text
      )
    )
  );

-- ─── credit_transactions ─────────────────────────────────────────────────
-- Apenas leitura pelo próprio usuário; escrita é feita só pela aplicação
-- (role owner), sem policy de insert/update/delete para anon/authenticated.
CREATE POLICY "credit_transactions_select_own" ON "credit_transactions"
  FOR SELECT TO authenticated
  USING (
    user_id IN (SELECT id FROM users WHERE supabase_auth_id = auth.uid()::text)
  );
