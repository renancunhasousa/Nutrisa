-- Migration: 20261017133000_add_payment_methods_to_plans_and_packages.sql
-- Adiciona suporte a múltiplas formas de pagamento e taxas calculadas em planos de contratos e pacotes clínicos

alter table if exists public.contract_plans
  add column if not exists payment_methods jsonb not null default '[]'::jsonb;

alter table if exists public.partner_packages
  add column if not exists payment_methods jsonb not null default '[]'::jsonb;
