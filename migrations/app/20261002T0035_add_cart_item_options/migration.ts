#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/501087c1758dd8de5456a39323546d09ad38317508442062f7836c56e1f3d83f/contract';
import startContract from '../../snapshots/501087c1758dd8de5456a39323546d09ad38317508442062f7836c56e1f3d83f/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/c0f7632f4e179314a360fcf417f5370eb6b0987b5edd22ec8787df585a9aa3d9/contract';
import endContract from '../../snapshots/c0f7632f4e179314a360fcf417f5370eb6b0987b5edd22ec8787df585a9aa3d9/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropConstraint({
        schema: 'public',
        table: 'shopping_cart_items',
        constraint: 'shopping_cart_items_shopping_cart_id_menu_item_id_key',
      }),
      this.createTable({
        schema: 'public',
        table: 'shopping_cart_item_options',
        columns: [
          col('created_at', 'timestamp(6)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('option_group_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('option_value_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('shopping_cart_item_id', 'uuid', {
            notNull: true,
            codecRef: { codecId: 'pg/uuid@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addColumn({
        schema: 'public',
        table: 'shopping_cart_items',
        column: col('special_instructions', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addUnique({
        schema: 'public',
        table: 'shopping_cart_item_options',
        constraint: 'shopping_cart_item_options_shopping_cart_item_id_option_value_id_key',
        columns: ['shopping_cart_item_id', 'option_value_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'shopping_cart_item_options',
        index: 'shopping_cart_item_options_option_group_id_idx_28929bf2',
        columns: ['option_group_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'shopping_cart_item_options',
        index: 'shopping_cart_item_options_option_value_id_idx_46da301b',
        columns: ['option_value_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'shopping_cart_item_options',
        index: 'shopping_cart_item_options_shopping_cart_item_id_idx_1c134ee5',
        columns: ['shopping_cart_item_id'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'shopping_cart_item_options',
        foreignKey: {
          name: 'shopping_cart_item_options_shopping_cart_item_id_fkey',
          columns: ['shopping_cart_item_id'],
          references: { schema: 'public', table: 'shopping_cart_items', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'shopping_cart_item_options',
        foreignKey: {
          name: 'shopping_cart_item_options_option_group_id_fkey',
          columns: ['option_group_id'],
          references: { schema: 'public', table: 'menu_item_option_groups', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'shopping_cart_item_options',
        foreignKey: {
          name: 'shopping_cart_item_options_option_value_id_fkey',
          columns: ['option_value_id'],
          references: { schema: 'public', table: 'menu_item_option_values', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
