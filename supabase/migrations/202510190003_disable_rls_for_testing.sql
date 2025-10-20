-- ============================================================================
-- TEMPORARY: Desabilitar RLS para testes
-- ============================================================================
-- Esta migration é TEMPORÁRIA apenas para teste
-- Será removida após validar o fluxo completo

ALTER TABLE public.app_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklists DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_tasks DISABLE ROW LEVEL SECURITY;

-- Comentário: RLS foi desabilitado temporariamente para teste de funcionalidade
-- Será reabilitado com políticas corrigidas após validação
