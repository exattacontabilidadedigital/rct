export type UserRole = "empresa" | "colaborador" | "contador";

export type MaturityLevel = "Inicial" | "Em adaptação" | "Avançado";

export type NotificationSeverity = "verde" | "laranja" | "vermelho";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password: string;
  companyId?: string;
}

export type ChecklistTaskStatus = "todo" | "doing" | "done";

export type ChecklistPriority = "alta" | "media" | "baixa";

export type ChecklistPhase = "Fundamentos" | "Planejamento" | "Implementação" | "Monitoramento";

export type ChecklistPillar =
  | "Governança & Estratégia"
  | "Dados & Cadastros"
  | "Processos & Obrigações"
  | "Tecnologia & Automação"
  | "People & Change";

export interface ChecklistTaskReference {
  label: string;
  description?: string;
  url?: string;
  type?: "legislação" | "guia" | "material" | "template";
}

export interface ChecklistTaskEvidence {
  label: string;
  description?: string;
  url?: string;
  status?: "pendente" | "em revisão" | "concluída";
}

export interface ChecklistTaskNote {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface ChecklistTask {
  id: string;
  checklistId: string;
  title: string;
  description: string;
  severity: NotificationSeverity;
  status: ChecklistTaskStatus;
  owner: string;
  category: "Planejamento" | "Operações" | "Compliance";
  dueDate?: string;
  phase?: ChecklistPhase;
  pillar?: ChecklistPillar;
  priority?: ChecklistPriority;
  references?: ChecklistTaskReference[];
  evidences?: ChecklistTaskEvidence[];
  notes?: ChecklistTaskNote[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistBoard {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  tasks: ChecklistTask[];
}

export interface ChecklistNotification {
  id: string;
  checklistId: string;
  taskId: string | null;
  severity: NotificationSeverity;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  dueDate?: string;
  phase?: ChecklistPhase;
  priority?: ChecklistPriority;
  pillar?: ChecklistPillar;
}

export interface Company {
  id: string;
  name: string;
  cnpj?: string;
  regime: string;
  sector: string;
  origin?: string;
  ownerId: string;
  maturity: MaturityLevel;
  riskLevel: NotificationSeverity;
  checklistProgress: number;
  employees: string[];
  accountantIds?: string[];
  metadata?: Record<string, unknown>;
  checklists: ChecklistBoard[];
  notifications: ChecklistNotification[];
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  severity: NotificationSeverity;
  createdAt: string;
  companyId?: string;
  acknowledgedBy: string[];
}

export interface ContentItem {
  id: string;
  title: string;
  type: "curso" | "video" | "ebook" | "artigo" | "mapa mental" | "webinar";
  description: string;
  isPremium: boolean;
  url: string;
  tags: string[];
  publishedAt: string;
}

export interface SessionState {
  userId: string;
}
