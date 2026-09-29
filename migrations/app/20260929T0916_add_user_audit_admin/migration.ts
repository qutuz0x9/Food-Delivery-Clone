#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/c918fa42502e7c8061ac013fdbb8e770ec612dbea745ea032a62d89337b6f3f3/contract';
import endContract from '../../snapshots/c918fa42502e7c8061ac013fdbb8e770ec612dbea745ea032a62d89337b6f3f3/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'identity' }),
      this.createSchema({ schema: 'public' }),
      this.createTable({
        schema: 'identity',
        table: 'audit_log',
        columns: [
          col('action', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('actor_email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('created_at', 'timestamp(6)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('entity_id', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('entity_name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('ip_address', 'inet', { notNull: true, codecRef: { codecId: 'pg/inet@1' } }),
          col('new_value', 'jsonb', { codecRef: { codecId: 'pg/jsonb@1' } }),
          col('old_value', 'jsonb', { codecRef: { codecId: 'pg/jsonb@1' } }),
          col('request_id', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('user_agent', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('user_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'identity',
        table: 'password_reset_tokens',
        columns: [
          col('created_at', 'timestamp(6)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('device_id', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('expires_at', 'timestamp(6)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('ip_address', 'inet', { codecRef: { codecId: 'pg/inet@1' } }),
          col('token_hash', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('used_at', 'timestamp(6)', {
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('user_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'identity',
        table: 'refresh_tokens',
        columns: [
          col('created_at', 'timestamp(6)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('device_id', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('expires_at', 'timestamp(6)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('ip_address', 'inet', { codecRef: { codecId: 'pg/inet@1' } }),
          col('replaced_by_token', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('revoked_at', 'timestamp(6)', {
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('revoked_reason', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('token_hash', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('user_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'identity',
        table: 'role_claims',
        columns: [
          col('claim_type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('claim_value', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('created_at', 'timestamp(6)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('role_id', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'identity',
        table: 'roles',
        columns: [
          col('created_at', 'timestamp(6)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('deleted_at', 'timestamp(6)', {
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('normalized_name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updated_at', 'timestamp(6)', {
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'identity',
        table: 'user_claims',
        columns: [
          col('claim_type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('claim_value', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('created_at', 'timestamp(6)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('user_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'identity',
        table: 'user_logins',
        columns: [
          col('created_at', 'timestamp(6)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('expires_at', 'timestamp(6)', {
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('login_provider', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('name', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('user_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('value', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['login_provider', 'value'])],
      }),
      this.createTable({
        schema: 'identity',
        table: 'user_roles',
        columns: [
          col('role_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('user_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [primaryKey(['user_id', 'role_id'])],
      }),
      this.createTable({
        schema: 'identity',
        table: 'user_tokens',
        columns: [
          col('created_at', 'timestamp(6)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('expires_at', 'timestamp(6)', {
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('login_provider', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('token_name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('user_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('value', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['user_id', 'login_provider', 'token_name'])],
      }),
      this.createTable({
        schema: 'identity',
        table: 'users',
        columns: [
          col('account_status', 'text', {
            notNull: true,
            default: lit('active'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('created_at', 'timestamp(6)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('deleted_at', 'timestamp(6)', {
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('email_verified_at', 'timestamp(6)', {
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('normalized_email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('password_hash', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('phone_number', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('phone_verified_at', 'timestamp(6)', {
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('updated_at', 'timestamp(6)', {
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'users_account_status_check_6d1da24a',
            "\"account_status\" IN ('active', 'inactive', 'locked', 'suspended')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'admins',
        columns: [
          col('created_at', 'timestamp(6)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('first_name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('last_name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('profile_image_url', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('updated_at', 'timestamp(6)', {
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('user_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'identity',
        table: 'password_reset_tokens',
        constraint: 'password_reset_tokens_token_hash_key',
        columns: ['token_hash'],
      }),
      this.addUnique({
        schema: 'identity',
        table: 'refresh_tokens',
        constraint: 'refresh_tokens_token_hash_key',
        columns: ['token_hash'],
      }),
      this.addUnique({
        schema: 'identity',
        table: 'roles',
        constraint: 'roles_name_key',
        columns: ['name'],
      }),
      this.addUnique({
        schema: 'identity',
        table: 'roles',
        constraint: 'roles_normalized_name_key',
        columns: ['normalized_name'],
      }),
      this.addUnique({
        schema: 'identity',
        table: 'users',
        constraint: 'users_email_key',
        columns: ['email'],
      }),
      this.addUnique({
        schema: 'identity',
        table: 'users',
        constraint: 'users_normalized_email_key',
        columns: ['normalized_email'],
      }),
      this.addUnique({
        schema: 'identity',
        table: 'users',
        constraint: 'users_phone_number_key',
        columns: ['phone_number'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'admins',
        constraint: 'admins_user_id_key',
        columns: ['user_id'],
      }),
      this.createIndex({
        schema: 'identity',
        table: 'audit_log',
        index: 'audit_log_created_at_idx_225d8c0f',
        columns: ['created_at'],
      }),
      this.createIndex({
        schema: 'identity',
        table: 'audit_log',
        index: 'audit_log_entity_name_entity_id_idx_9c0357fa',
        columns: ['entity_name', 'entity_id'],
      }),
      this.createIndex({
        schema: 'identity',
        table: 'audit_log',
        index: 'audit_log_user_id_idx_6c952402',
        columns: ['user_id'],
      }),
      this.createIndex({
        schema: 'identity',
        table: 'password_reset_tokens',
        index: 'password_reset_tokens_user_id_idx_6c952402',
        columns: ['user_id'],
      }),
      this.createIndex({
        schema: 'identity',
        table: 'refresh_tokens',
        index: 'refresh_tokens_user_id_idx_6c952402',
        columns: ['user_id'],
      }),
      this.createIndex({
        schema: 'identity',
        table: 'role_claims',
        index: 'role_claims_role_id_idx_d9467c50',
        columns: ['role_id'],
      }),
      this.createIndex({
        schema: 'identity',
        table: 'user_claims',
        index: 'user_claims_user_id_idx_6c952402',
        columns: ['user_id'],
      }),
      this.createIndex({
        schema: 'identity',
        table: 'user_logins',
        index: 'user_logins_user_id_idx_6c952402',
        columns: ['user_id'],
      }),
      this.createIndex({
        schema: 'identity',
        table: 'user_roles',
        index: 'user_roles_role_id_idx_d9467c50',
        columns: ['role_id'],
      }),
      this.createIndex({
        schema: 'identity',
        table: 'user_roles',
        index: 'user_roles_user_id_idx_6c952402',
        columns: ['user_id'],
      }),
      this.createIndex({
        schema: 'identity',
        table: 'user_tokens',
        index: 'user_tokens_user_id_idx_6c952402',
        columns: ['user_id'],
      }),
      this.addForeignKey({
        schema: 'identity',
        table: 'audit_log',
        foreignKey: {
          name: 'audit_log_user_id_fkey',
          columns: ['user_id'],
          references: { schema: 'identity', table: 'users', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'identity',
        table: 'password_reset_tokens',
        foreignKey: {
          name: 'password_reset_tokens_user_id_fkey',
          columns: ['user_id'],
          references: { schema: 'identity', table: 'users', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'identity',
        table: 'refresh_tokens',
        foreignKey: {
          name: 'refresh_tokens_user_id_fkey',
          columns: ['user_id'],
          references: { schema: 'identity', table: 'users', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'identity',
        table: 'role_claims',
        foreignKey: {
          name: 'role_claims_role_id_fkey',
          columns: ['role_id'],
          references: { schema: 'identity', table: 'roles', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'identity',
        table: 'user_claims',
        foreignKey: {
          name: 'user_claims_user_id_fkey',
          columns: ['user_id'],
          references: { schema: 'identity', table: 'users', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'identity',
        table: 'user_logins',
        foreignKey: {
          name: 'user_logins_user_id_fkey',
          columns: ['user_id'],
          references: { schema: 'identity', table: 'users', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'identity',
        table: 'user_roles',
        foreignKey: {
          name: 'user_roles_user_id_fkey',
          columns: ['user_id'],
          references: { schema: 'identity', table: 'users', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'identity',
        table: 'user_roles',
        foreignKey: {
          name: 'user_roles_role_id_fkey',
          columns: ['role_id'],
          references: { schema: 'identity', table: 'roles', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'identity',
        table: 'user_tokens',
        foreignKey: {
          name: 'user_tokens_user_id_fkey',
          columns: ['user_id'],
          references: { schema: 'identity', table: 'users', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'admins',
        foreignKey: {
          name: 'admins_user_id_fkey',
          columns: ['user_id'],
          references: { schema: 'identity', table: 'users', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
