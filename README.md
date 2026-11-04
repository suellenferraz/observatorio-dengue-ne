# Observatório Dengue NE

Dashboard da incidência de dengue no Nordeste brasileiro, 2000 a 2025.

## Requisitos

- Node.js 24+
- PostgreSQL com o banco `dengue-eda` carregado pelo projeto [Dengue-eda-northeast-brazil](../Dengue-eda-northeast-brazil)

## Como rodar

```bash
npm install
cp .env.example .env
npm run dev
```

No `.env`, preencha a senha do Postgres (`PGPASSWORD`). Depois de `npm run dev`, abra http://localhost:5173.

## Estrutura

```
server/   API que lê o banco (só consultas)
src/      dashboard em React, shadcn/ui e Recharts
```

## Dados

Casos prováveis de dengue de residentes do Nordeste, sem possíveis duplicatas.
Fontes: SINAN (Ministério da Saúde) e IBGE.
