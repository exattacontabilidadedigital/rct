import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase";
import { calculateChecklistProgressFromBoards, createDefaultChecklistBoard } from "@/lib/checklist";
import { fetchSupabaseCompanyBoards, insertSupabaseBoardWithTasks } from "@/lib/supabase/checklists";
import type { ChecklistBoard } from "@/types/platform";

type RegisterCompanyPayload = {
  name: string;
  email: string;
  password: string;
  regime: string;
  sector: string;
  cnpj?: string;
};

type RegisterCompanySuccessResponse = {
  success: true;
  data: {
    userId: string;
    companyId: string;
    board: ChecklistBoard | null;
  };
};

type RegisterCompanyErrorResponse = {
  success: false;
  message: string;
};

const REQUIRED_FIELDS = ["name", "email", "password", "regime", "sector"] as const;

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as RegisterCompanyPayload;
    console.log("📝 Payload recebido:", JSON.stringify(payload, null, 2));

    // Validar campos obrigatórios
    const missingFields = REQUIRED_FIELDS.filter((field) => {
      const value = payload[field as keyof RegisterCompanyPayload];
      console.log(`  - Campo "${field}":`, value, "válido?", !!value);
      return !value;
    });
    
    if (missingFields.length) {
      console.error("❌ Campos ausentes:", missingFields);
      return NextResponse.json<RegisterCompanyErrorResponse>(
        { success: false, message: `Campos ausentes: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }
    
    console.log("✅ Todos os campos validados");

    // Inicializar Supabase
    let supabase;
    try {
      supabase = createSupabaseServiceClient();
      console.log("✅ Cliente Supabase inicializado");
    } catch (error) {
      console.error("❌ Erro ao inicializar Supabase:", error);
      return NextResponse.json<RegisterCompanyErrorResponse>(
        { success: false, message: "Configuração Supabase ausente" },
        { status: 500 }
      );
    }

    // Normalizar email
    const normalizedEmail = payload.email.trim().toLowerCase();

    // Validar se email já existe
    console.log("🔍 Verificando se email já existe...");
    const existingEmail = await supabase
      .from("app_users")
      .select("id, email")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existingEmail.data) {
      console.log("⚠️ Email já cadastrado:", normalizedEmail);
      return NextResponse.json<RegisterCompanyErrorResponse>(
        { 
          success: false, 
          message: "Este e-mail já está cadastrado no sistema. Use outro e-mail ou recupere sua senha." 
        },
        { status: 409 }
      );
    }

    if (existingEmail.error) {
      console.error("❌ Erro ao verificar email:", existingEmail.error);
      return NextResponse.json<RegisterCompanyErrorResponse>(
        { success: false, message: "Erro ao validar e-mail" },
        { status: 500 }
      );
    }

    console.log("✅ Email válido (não duplicado)");

    // Criar usuário no Auth
    console.log("🔐 Criando usuário no Auth...");
    const authResult = await supabase.auth.admin.createUser({
      email: payload.email.trim(),
      password: payload.password,
      email_confirm: true,
      user_metadata: {
        full_name: payload.name,
        role: "empresa",
      },
    });

    if (authResult.error || !authResult.data?.user) {
      console.error("❌ Erro ao criar usuário Auth:", authResult.error);
      return NextResponse.json<RegisterCompanyErrorResponse>(
        { success: false, message: authResult.error?.message || "Erro ao criar usuário" },
        { status: authResult.error?.status || 400 }
      );
    }

    const userId = authResult.data.user.id;
    console.log("✅ Usuário criado:", userId);

    // Criar empresa
    console.log("🏢 Criando empresa...");
    const companyId = userId;
    const sanitizedCnpj = payload.cnpj ? payload.cnpj.replace(/\D/g, "") : "";
    const normalizedCnpj = sanitizedCnpj.length ? sanitizedCnpj : null;

    const draftBoard = createDefaultChecklistBoard(companyId);
    const draftProgress = calculateChecklistProgressFromBoards([draftBoard]).toString();

    const companyInsertResult = await supabase.from("companies").insert({
      id: companyId,
      name: payload.name,
      cnpj: normalizedCnpj,
      regime: payload.regime || null,
      sector: payload.sector || null,
      origin: null,
      checklist_progress: draftProgress,
      employees: [],
      accountant_ids: [],
      metadata: {},
    });

    if (companyInsertResult.error) {
      console.error("❌ Erro ao inserir empresa:", companyInsertResult.error);
      // Limpar usuário criado
      await supabase.auth.admin.deleteUser(userId).catch(() => {});
      return NextResponse.json<RegisterCompanyErrorResponse>(
        { success: false, message: "Erro ao criar empresa" },
        { status: 400 }
      );
    }

    console.log("✅ Empresa criada:", companyId);

    // Criar usuário da app
    console.log("👤 Criando app_user...");
    console.log("  - auth_user_id:", userId);
    console.log("  - company_id:", companyId);
    console.log("  - email:", normalizedEmail);
    
    const appUserResult = await supabase.from("app_users").insert({
      auth_user_id: userId,
      company_id: companyId,
      email: normalizedEmail,
      full_name: payload.name,
      role: "empresa",
      status: "active",
      metadata: {},
    });

    if (appUserResult.error) {
      console.error("❌ Erro ao criar app_user:", appUserResult.error);
      try {
        await supabase.auth.admin.deleteUser(userId);
      } catch (e) {
        console.error("Erro ao limpar usuário:", e);
      }
      try {
        await supabase.from("companies").delete().eq("id", companyId);
      } catch (e) {
        console.error("Erro ao limpar empresa:", e);
      }
      return NextResponse.json<RegisterCompanyErrorResponse>(
        { success: false, message: "Erro ao configurar usuário" },
        { status: 400 }
      );
    }

    console.log("✅ App user criado com sucesso");
    
    // Verificar se o app_user foi realmente criado
    const verifyResult = await supabase
      .from("app_users")
      .select("id, auth_user_id, company_id, email, full_name")
      .eq("email", normalizedEmail)
      .maybeSingle();
    
    if (verifyResult.data) {
      console.log("✅ Verificação: app_user encontrado:");
      console.log("  - id:", verifyResult.data.id);
      console.log("  - auth_user_id:", verifyResult.data.auth_user_id);
      console.log("  - company_id:", verifyResult.data.company_id);
    } else {
      console.warn("⚠️ Verificação: app_user NÃO encontrado após criar!", verifyResult.error);
    }

    // Criar board de checklist
    console.log("📋 Criando board de checklist...");
    let board: ChecklistBoard | null = null;
    
    try {
      const boards = await fetchSupabaseCompanyBoards(supabase, companyId);
      if (boards.length > 0) {
        board = boards[0];
      }
    } catch (boardError) {
      console.warn("⚠️ Erro ao buscar boards existentes, criando novo:", boardError);
    }

    if (!board) {
      try {
        board = createDefaultChecklistBoard(companyId);
        await insertSupabaseBoardWithTasks(supabase, board);
      } catch (insertError) {
        console.warn("⚠️ Erro ao criar board, continuando sem board:", insertError);
        board = createDefaultChecklistBoard(companyId);
      }
    }

    console.log("✅ Board criado");

    // Atualizar progresso
    const progress = calculateChecklistProgressFromBoards([board]).toString();
    try {
      await supabase
        .from("companies")
        .update({ checklist_progress: progress })
        .eq("id", companyId);
    } catch (e) {
      console.error("Erro ao atualizar progresso:", e);
    }

    console.log("✅ Registro completado com sucesso!");
    console.log("  - userId:", userId);
    console.log("  - companyId:", companyId);
    console.log("  - board:", board ? "✅ criado" : "⚠️ nulo");

    const response: RegisterCompanySuccessResponse = {
      success: true,
      data: {
        userId,
        companyId,
        board,
      },
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("❌ ERRO NÃO TRATADO:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json<RegisterCompanyErrorResponse>(
      { success: false, message },
      { status: 500 }
    );
  }
}
