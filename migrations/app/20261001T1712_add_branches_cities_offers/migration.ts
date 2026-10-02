#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/4f9dd61b93174f3147e0cd0315c867174f5535cc7d8cd8234fe73dc0bb19b759/contract';
import startContract from '../../snapshots/4f9dd61b93174f3147e0cd0315c867174f5535cc7d8cd8234fe73dc0bb19b759/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/501087c1758dd8de5456a39323546d09ad38317508442062f7836c56e1f3d83f/contract';
import endContract from '../../snapshots/501087c1758dd8de5456a39323546d09ad38317508442062f7836c56e1f3d83f/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
} from '@prisma/orm-postgres/migration';
import postgres from '@prisma/orm-postgres/runtime';

// Data transforms run against the end contract. The façade connects lazily, so no database connection is opened here.
const { sql: db, contract } = postgres<End>({ contractJson: endContract });

// Every table touched by a transform below was empty when this migration was written (2026-10-01, local dev
// database), so no row needs a real city, branch or coordinate. The `backfill-*` and `handle-nulls-*` checks look for
// rows that still violate the new NOT NULL column, and their `run` is a deliberate no-op that matches no row. On a
// database that does have rows the post-check therefore fails and the whole migration rolls back, instead of guessing
// a city or a branch. The `typechange-*` checks never match: converting decimal to numeric(9,6) needs no row fix.
const NEVER = (f: any, fns: any) => fns.eq(f.id, null);
const NIL_UUID = '00000000-0000-0000-0000-000000000000';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropColumn({ schema: 'public', table: 'delivery_addresses', column: 'city' }),
      this.dropTable({ schema: 'public', table: 'restaurant_addresses' }),
      this.dropConstraint({
        schema: 'public',
        table: 'restaurant_operating_hours',
        constraint: 'restaurant_operating_hours_restaurant_id_fkey',
        kind: 'foreignKey',
      }),
      this.dropIndex({
        schema: 'public',
        table: 'restaurant_operating_hours',
        index: 'restaurant_operating_hours_restaurant_id_idx_5fa03bd5',
      }),
      this.dropConstraint({
        schema: 'public',
        table: 'restaurant_operating_hours',
        constraint: 'restaurant_operating_hours_restaurant_id_day_of_week_key',
      }),
      this.dropColumn({
        schema: 'public',
        table: 'restaurant_operating_hours',
        column: 'restaurant_id',
      }),
      this.dropCheckConstraint({
        schema: 'public',
        table: 'restaurants',
        constraint: 'restaurants_availability_status_check_315ae2ed',
      }),
      this.dropColumn({ schema: 'public', table: 'restaurants', column: 'availability_status' }),
      this.createTable({
        schema: 'public',
        table: 'cities',
        columns: [
          col('country', 'character varying(100)', {
            notNull: true,
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 100 } },
          }),
          col('created_at', 'timestamp(6)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('is_active', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('name', 'character varying(100)', {
            notNull: true,
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 100 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'delivery_offers',
        columns: [
          col('driver_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('expires_at', 'timestamp(6)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('offered_at', 'timestamp(6)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('order_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('responded_at', 'timestamp(6)', {
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('status', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('delivery_offers_expiry_after_offer_8c9937b1', 'expires_at > offered_at'),
          checkExpression(
            'delivery_offers_response_has_timestamp_97831090',
            "status NOT IN ('accepted', 'rejected') OR responded_at IS NOT NULL",
          ),
          checkExpression(
            'delivery_offers_status_check_90df915c',
            "\"status\" IN ('offered', 'accepted', 'rejected', 'expired', 'withdrawn')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'restaurant_branches',
        columns: [
          col('availability_status', 'text', {
            notNull: true,
            default: lit('closed'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('building', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('city_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('created_at', 'timestamp(6)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('is_active', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('label', 'character varying(100)', {
            notNull: true,
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 100 } },
          }),
          col('latitude', 'numeric(9,6)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 9, scale: 6 } },
          }),
          col('longitude', 'numeric(9,6)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 9, scale: 6 } },
          }),
          col('restaurant_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('street', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updated_at', 'timestamp(6)', {
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'restaurant_branches_availability_status_check_315ae2ed',
            "\"availability_status\" IN ('open', 'closed', 'busy')",
          ),
          checkExpression(
            'restaurant_branches_coordinates_valid_b9fb9d9c',
            'latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180',
          ),
        ],
      }),
      this.addColumn({
        schema: 'public',
        table: 'delivery_address',
        column: col('city_id', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
      }),
      this.dataTransform(contract, 'backfill-delivery_address-city_id', {
        check: () => db.public.delivery_address.select('id').where((f, fns) => fns.eq(f.city_id, null)).limit(1),
        run: () => db.public.delivery_address.update({ city_id: NIL_UUID }).where(NEVER),
      }),
      this.setNotNull({ schema: 'public', table: 'delivery_address', column: 'city_id' }),
      this.addColumn({
        schema: 'public',
        table: 'delivery_addresses',
        column: col('city_id', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
      }),
      this.dataTransform(contract, 'backfill-delivery_addresses-city_id', {
        check: () => db.public.delivery_addresses.select('id').where((f, fns) => fns.eq(f.city_id, null)).limit(1),
        run: () => db.public.delivery_addresses.update({ city_id: NIL_UUID }).where(NEVER),
      }),
      this.setNotNull({ schema: 'public', table: 'delivery_addresses', column: 'city_id' }),
      this.addColumn({
        schema: 'public',
        table: 'drivers',
        column: col('working_city_id', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
      }),
      this.dataTransform(contract, 'backfill-drivers-working_city_id', {
        check: () => db.public.drivers.select('id').where((f, fns) => fns.eq(f.working_city_id, null)).limit(1),
        run: () => db.public.drivers.update({ working_city_id: NIL_UUID }).where(NEVER),
      }),
      this.setNotNull({ schema: 'public', table: 'drivers', column: 'working_city_id' }),
      this.addColumn({
        schema: 'public',
        table: 'orders',
        column: col('restaurant_branch_id', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
      }),
      this.dataTransform(contract, 'backfill-orders-restaurant_branch_id', {
        check: () => db.public.orders.select('id').where((f, fns) => fns.eq(f.restaurant_branch_id, null)).limit(1),
        run: () => db.public.orders.update({ restaurant_branch_id: NIL_UUID }).where(NEVER),
      }),
      this.setNotNull({ schema: 'public', table: 'orders', column: 'restaurant_branch_id' }),
      this.addColumn({
        schema: 'public',
        table: 'restaurant_operating_hours',
        column: col('branch_id', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
      }),
      this.dataTransform(contract, 'backfill-restaurant_operating_hours-branch_id', {
        check: () => db.public.restaurant_operating_hours.select('id').where((f, fns) => fns.eq(f.branch_id, null)).limit(1),
        run: () => db.public.restaurant_operating_hours.update({ branch_id: NIL_UUID }).where(NEVER),
      }),
      this.setNotNull({
        schema: 'public',
        table: 'restaurant_operating_hours',
        column: 'branch_id',
      }),
      this.dataTransform(contract, 'typechange-delivery_address-latitude', {
        check: () => db.public.delivery_address.select('id').where(NEVER).limit(1),
        run: () => db.public.delivery_address.update({ latitude: 0 }).where(NEVER),
      }),
      this.alterColumnType({
        schema: 'public',
        table: 'delivery_address',
        column: 'latitude',
        options: {
          qualifiedTargetType: 'numeric(9,6)',
          formatTypeExpected: 'numeric(9,6)',
          rawTargetTypeForLabel: 'numeric(9,6)',
        },
      }),
      this.dataTransform(contract, 'handle-nulls-delivery_address-latitude', {
        check: () => db.public.delivery_address.select('id').where((f, fns) => fns.eq(f.latitude, null)).limit(1),
        run: () => db.public.delivery_address.update({ latitude: 0 }).where(NEVER),
      }),
      this.setNotNull({ schema: 'public', table: 'delivery_address', column: 'latitude' }),
      this.dataTransform(contract, 'typechange-delivery_address-longitude', {
        check: () => db.public.delivery_address.select('id').where(NEVER).limit(1),
        run: () => db.public.delivery_address.update({ longitude: 0 }).where(NEVER),
      }),
      this.alterColumnType({
        schema: 'public',
        table: 'delivery_address',
        column: 'longitude',
        options: {
          qualifiedTargetType: 'numeric(9,6)',
          formatTypeExpected: 'numeric(9,6)',
          rawTargetTypeForLabel: 'numeric(9,6)',
        },
      }),
      this.dataTransform(contract, 'handle-nulls-delivery_address-longitude', {
        check: () => db.public.delivery_address.select('id').where((f, fns) => fns.eq(f.longitude, null)).limit(1),
        run: () => db.public.delivery_address.update({ longitude: 0 }).where(NEVER),
      }),
      this.setNotNull({ schema: 'public', table: 'delivery_address', column: 'longitude' }),
      this.dataTransform(contract, 'typechange-delivery_addresses-latitude', {
        check: () => db.public.delivery_addresses.select('id').where(NEVER).limit(1),
        run: () => db.public.delivery_addresses.update({ latitude: 0 }).where(NEVER),
      }),
      this.alterColumnType({
        schema: 'public',
        table: 'delivery_addresses',
        column: 'latitude',
        options: {
          qualifiedTargetType: 'numeric(9,6)',
          formatTypeExpected: 'numeric(9,6)',
          rawTargetTypeForLabel: 'numeric(9,6)',
        },
      }),
      this.dataTransform(contract, 'handle-nulls-delivery_addresses-latitude', {
        check: () => db.public.delivery_addresses.select('id').where((f, fns) => fns.eq(f.latitude, null)).limit(1),
        run: () => db.public.delivery_addresses.update({ latitude: 0 }).where(NEVER),
      }),
      this.setNotNull({ schema: 'public', table: 'delivery_addresses', column: 'latitude' }),
      this.dataTransform(contract, 'typechange-delivery_addresses-longitude', {
        check: () => db.public.delivery_addresses.select('id').where(NEVER).limit(1),
        run: () => db.public.delivery_addresses.update({ longitude: 0 }).where(NEVER),
      }),
      this.alterColumnType({
        schema: 'public',
        table: 'delivery_addresses',
        column: 'longitude',
        options: {
          qualifiedTargetType: 'numeric(9,6)',
          formatTypeExpected: 'numeric(9,6)',
          rawTargetTypeForLabel: 'numeric(9,6)',
        },
      }),
      this.dataTransform(contract, 'handle-nulls-delivery_addresses-longitude', {
        check: () => db.public.delivery_addresses.select('id').where((f, fns) => fns.eq(f.longitude, null)).limit(1),
        run: () => db.public.delivery_addresses.update({ longitude: 0 }).where(NEVER),
      }),
      this.setNotNull({ schema: 'public', table: 'delivery_addresses', column: 'longitude' }),
      this.addUnique({
        schema: 'public',
        table: 'cities',
        constraint: 'cities_name_country_key',
        columns: ['name', 'country'],
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'delivery_address',
        constraint: 'delivery_address_coordinates_valid_b9fb9d9c',
        expression: 'latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180',
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'delivery_addresses',
        constraint: 'delivery_addresses_coordinates_valid_b9fb9d9c',
        expression: 'latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180',
      }),
      this.addUnique({
        schema: 'public',
        table: 'delivery_offers',
        constraint: 'delivery_offers_order_id_driver_id_key',
        columns: ['order_id', 'driver_id'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'restaurant_branches',
        constraint: 'restaurant_branches_id_restaurant_id_key',
        columns: ['id', 'restaurant_id'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'restaurant_branches',
        constraint: 'restaurant_branches_restaurant_id_label_key',
        columns: ['restaurant_id', 'label'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'restaurant_operating_hours',
        constraint: 'restaurant_operating_hours_branch_id_day_of_week_key',
        columns: ['branch_id', 'day_of_week'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'delivery_address',
        index: 'delivery_address_city_id_idx_79640ef2',
        columns: ['city_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'delivery_addresses',
        index: 'delivery_addresses_city_id_idx_79640ef2',
        columns: ['city_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'delivery_offers',
        index: 'delivery_offers_driver_id_idx_56c848ae',
        columns: ['driver_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'delivery_offers',
        index: 'delivery_offers_driver_id_status_idx_fd70f38e',
        columns: ['driver_id', 'status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'delivery_offers',
        index: 'delivery_offers_order_id_idx_39ad19ad',
        columns: ['order_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'drivers',
        index: 'drivers_working_city_id_idx_1d57165f',
        columns: ['working_city_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'orders',
        index: 'orders_restaurant_branch_id_restaurant_id_idx_780a8e01',
        columns: ['restaurant_branch_id', 'restaurant_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'restaurant_branches',
        index: 'restaurant_branches_city_id_idx_79640ef2',
        columns: ['city_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'restaurant_branches',
        index: 'restaurant_branches_restaurant_id_idx_5fa03bd5',
        columns: ['restaurant_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'restaurant_operating_hours',
        index: 'restaurant_operating_hours_branch_id_idx_b5212172',
        columns: ['branch_id'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'delivery_addresses',
        foreignKey: {
          name: 'delivery_addresses_city_id_fkey',
          columns: ['city_id'],
          references: { schema: 'public', table: 'cities', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'delivery_offers',
        foreignKey: {
          name: 'delivery_offers_order_id_fkey',
          columns: ['order_id'],
          references: { schema: 'public', table: 'orders', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'delivery_offers',
        foreignKey: {
          name: 'delivery_offers_driver_id_fkey',
          columns: ['driver_id'],
          references: { schema: 'public', table: 'drivers', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'drivers',
        foreignKey: {
          name: 'drivers_working_city_id_fkey',
          columns: ['working_city_id'],
          references: { schema: 'public', table: 'cities', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'restaurant_branches',
        foreignKey: {
          name: 'restaurant_branches_restaurant_id_fkey',
          columns: ['restaurant_id'],
          references: { schema: 'public', table: 'restaurants', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'restaurant_branches',
        foreignKey: {
          name: 'restaurant_branches_city_id_fkey',
          columns: ['city_id'],
          references: { schema: 'public', table: 'cities', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'orders',
        foreignKey: {
          name: 'orders_restaurant_branch_id_restaurant_id_fkey',
          columns: ['restaurant_branch_id', 'restaurant_id'],
          references: {
            schema: 'public',
            table: 'restaurant_branches',
            columns: ['id', 'restaurant_id'],
          },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'restaurant_operating_hours',
        foreignKey: {
          name: 'restaurant_operating_hours_branch_id_fkey',
          columns: ['branch_id'],
          references: { schema: 'public', table: 'restaurant_branches', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
