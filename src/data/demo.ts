import {
  buildChecklistNotifications,
  calculateChecklistProgressFromBoards,
  createDefaultChecklistBoard,
} from "@/lib/checklist";
import type { Company, SessionState, User } from "@/types/platform";

export const DEMO_COMPANY_LEGACY_ID = "empresa-demo";
export const DEMO_CHECKLIST_LEGACY_ID = `${DEMO_COMPANY_LEGACY_ID}-checklist-essencial`;

const demoBoard = createDefaultChecklistBoard(DEMO_COMPANY_LEGACY_ID, {
  checklistId: DEMO_CHECKLIST_LEGACY_ID,
});

export const DEMO_OWNER_USER_ID = DEMO_COMPANY_LEGACY_ID;
export const DEMO_COLLABORATOR_USER_ID = "colaborador-demo";
export const DEMO_ACCOUNTANT_USER_ID = "contador-demo";

export const DEMO_USERS: User[] = [
  {
    id: DEMO_OWNER_USER_ID,
    name: "Mercado Luz",
    email: "empresa@rtc.com",
    password: "demo123",
    role: "empresa",
  },
  {
    id: DEMO_COLLABORATOR_USER_ID,
    name: "Ana Ribeiro",
    email: "colaborador@rtc.com",
    password: "demo123",
    role: "colaborador",
    companyId: DEMO_COMPANY_LEGACY_ID,
  },
  {
    id: DEMO_ACCOUNTANT_USER_ID,
    name: "Clínica Contábil",
    email: "contador@rtc.com",
    password: "demo123",
    role: "contador",
  },
];

export const DEMO_COMPANY: Company = {
  id: DEMO_COMPANY_LEGACY_ID,
  name: "Mercado Luz",
  ownerId: DEMO_OWNER_USER_ID,
  regime: "Simples Nacional",
  sector: "Varejo Alimentício",
  cnpj: "12.345.678/0001-99",
  origin: "Indicação",
  maturity: "Em adaptação",
  riskLevel: "laranja",
  checklistProgress: calculateChecklistProgressFromBoards([demoBoard]),
  employees: [DEMO_COLLABORATOR_USER_ID],
  accountantIds: [],
  metadata: {
    revenueRange: "3-10mi",
    employeeSize: "21-50",
    mainGoal: "Rever precificação com a CBS",
    mainChallenge: "Centralizar obrigações acessórias em um só lugar",
  },
  checklists: [demoBoard],
  notifications: buildChecklistNotifications([demoBoard]),
};

export const DEMO_INITIAL_SESSION: SessionState | null = null;

export const INITIAL_STATE = {
  users: DEMO_USERS,
  companies: [DEMO_COMPANY],
  session: DEMO_INITIAL_SESSION,
};
