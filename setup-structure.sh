#!/bin/bash

# Public extra
mkdir -p public
touch public/favicon.ico

# src e subpastas
mkdir -p src/assets
mkdir -p src/components/layout
mkdir -p src/components/ui
mkdir -p src/components/common
mkdir -p src/db
mkdir -p src/store
mkdir -p src/i18n/translations
mkdir -p src/hooks
mkdir -p src/pages/auth

# Componentes globais
touch src/components/layout/Sidebar.tsx
touch src/components/layout/Topbar.tsx
touch src/components/layout/MobileMenu.tsx
touch src/components/layout/ProtectedRoute.tsx

touch src/components/ui/Modal.tsx
touch src/components/ui/Button.tsx
touch src/components/ui/Input.tsx
touch src/components/ui/Card.tsx
touch src/components/ui/Toast.tsx

touch src/components/common/ThemeToggle.tsx

# Outros
touch src/db/indexedDB.ts
touch src/store/useAppStore.ts

touch src/i18n/translations/pt-BR.ts
touch src/i18n/translations/en.ts
touch src/i18n/useTranslation.ts

touch src/hooks/useAuth.ts
touch src/hooks/useTheme.ts
touch src/hooks/useLanguage.ts

# Páginas
touch src/pages/auth/Login.tsx
touch src/pages/auth/Signup.tsx
touch src/pages/auth/ForgotPassword.tsx
touch src/pages/Dashboard.tsx
touch src/pages/Inbox.tsx
touch src/pages/Projetos.tsx
touch src/pages/Kanban.tsx
touch src/pages/DemandaDetail.tsx
touch src/pages/Calendario.tsx
touch src/pages/Gantt.tsx
touch src/pages/TimeTracker.tsx
touch src/pages/AIStudio.tsx
touch src/pages/Notas.tsx
touch src/pages/Templates.tsx
touch src/pages/Objetivos.tsx
touch src/pages/Relatorios.tsx
touch src/pages/Equipe.tsx
touch src/pages/ChatGlobal.tsx
touch src/pages/Configuracoes.tsx
touch src/pages/NotFound.tsx

echo "Estrutura SaaS criada com sucesso 🚀"