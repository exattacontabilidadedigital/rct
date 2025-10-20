-- ============================================================================
-- RLS Policies para app_users - Sem Recursão Infinita
-- ============================================================================

-- Desabilitar RLS temporariamente para limpar políticas antigas
ALTER TABLE public.app_users DISABLE ROW LEVEL SECURITY;

-- Remover políticas antigas que causam recursão
DROP POLICY IF EXISTS "Manage own app user" ON public.app_users;
DROP POLICY IF EXISTS "Users can view their own data" ON public.app_users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.app_users;
DROP POLICY IF EXISTS "Company members can view app users in their company" ON public.app_users;
DROP POLICY IF EXISTS "Admins can manage all app users" ON public.app_users;

-- Reabilitar RLS
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role has full access" ON public.app_users;
CREATE POLICY "Service role has full access"
ON public.app_users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- POLICY 2: Users - Ver Próprios Dados
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own record" ON public.app_users;
CREATE POLICY "Users can view their own record"
ON public.app_users
FOR SELECT
TO authenticated
USING (auth.uid() = auth_user_id);

-- ============================================================================
-- POLICY 3: Users - Atualizar Próprios Dados
-- ============================================================================
DROP POLICY IF EXISTS "Users can update their own record" ON public.app_users;
CREATE POLICY "Users can update their own record"
ON public.app_users
FOR UPDATE
TO authenticated
USING (auth.uid() = auth_user_id)
WITH CHECK (auth.uid() = auth_user_id);

-- ============================================================================
-- POLICY 4: Users - Inserir Próprio Registro (se necessário)
-- ============================================================================
DROP POLICY IF EXISTS "Users can insert their own record" ON public.app_users;
CREATE POLICY "Users can insert their own record"
ON public.app_users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = auth_user_id);

-- ============================================================================
-- POLICY 5: Company Members - Ver Colegas da Empresa
-- ============================================================================
-- NOTA: Usa subquery simples para evitar recursão
DROP POLICY IF EXISTS "Users can view colleagues in their company" ON public.app_users;
CREATE POLICY "Users can view colleagues in their company"
ON public.app_users
FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT company_id 
    FROM app_users 
    WHERE auth_user_id = auth.uid()
    LIMIT 1
  )
);

-- ============================================================================
-- POLICY 6: Anonymous - Acesso Nenhum
-- ============================================================================
DROP POLICY IF EXISTS "Anonymous users have no access" ON public.app_users;
CREATE POLICY "Anonymous users have no access"
ON public.app_users
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- ============================================================================
-- Índices para Performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS app_users_auth_user_id_idx ON public.app_users(auth_user_id);
CREATE INDEX IF NOT EXISTS app_users_company_id_idx ON public.app_users(company_id);
CREATE INDEX IF NOT EXISTS app_users_email_idx ON public.app_users(email);

-- ============================================================================
-- Comentários Explicativos
-- ============================================================================
COMMENT ON POLICY "Service role has full access" ON public.app_users IS 
'Permite que operações internas do servidor acessem dados sem restrição';

COMMENT ON POLICY "Users can view their own record" ON public.app_users IS 
'Usuários autenticados podem ver apenas seu próprio registro';

COMMENT ON POLICY "Users can update their own record" ON public.app_users IS 
'Usuários autenticados podem atualizar apenas seu próprio registro';

COMMENT ON POLICY "Users can insert their own record" ON public.app_users IS 
'Usuários autenticados podem criar apenas seu próprio registro';

COMMENT ON POLICY "Users can view colleagues in their company" ON public.app_users IS 
'Usuários autenticados podem ver colegas de trabalho da mesma empresa';

COMMENT ON POLICY "Anonymous users have no access" ON public.app_users IS 
'Usuários anônimos não têm acesso a nenhum dado';
