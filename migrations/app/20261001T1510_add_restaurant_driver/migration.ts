#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/a98b30a8e34766794f71cd8c4353f09dbe6385274a89cf6b674b66bc09e7d3a5/contract';
import endContract from '../../snapshots/a98b30a8e34766794f71cd8c4353f09dbe6385274a89cf6b674b66bc09e7d3a5/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/c918fa42502e7c8061ac013fdbb8e770ec612dbea745ea032a62d89337b6f3f3/contract';
import startContract from '../../snapshots/c918fa42502e7c8061ac013fdbb8e770ec612dbea745ea032a62d89337b6f3f3/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'customers',
        columns: [
          col('created_at', 'timestamp(6)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('date_of_birth', 'date', { codecRef: { codecId: 'pg/date-string@1' } }),
          col('first_name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('gender', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('last_name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('profile_image_url', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('updated_at', 'timestamp(6)', {
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('user_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('customers_gender_check_6679dc61', "\"gender\" IN ('male', 'female')"),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'delivery_address',
        columns: [
          col('city', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('created_at', 'timestamp(6)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('customer_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('is_default', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('label', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('latitude', 'numeric', { codecRef: { codecId: 'pg/numeric@1' } }),
          col('longitude', 'numeric', { codecRef: { codecId: 'pg/numeric@1' } }),
          col('phone_number', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('postal_code', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('recipient_name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('state', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('street_address', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updated_at', 'timestamp(6)', {
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'delivery_addresses',
        columns: [
          col('city', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('created_at', 'timestamp(6)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('customer_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('is_default', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('label', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('latitude', 'numeric', { codecRef: { codecId: 'pg/numeric@1' } }),
          col('longitude', 'numeric', { codecRef: { codecId: 'pg/numeric@1' } }),
          col('phone_number', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('postal_code', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('recipient_name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('state', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('street_address', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updated_at', 'timestamp(6)', {
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'driver_assignments',
        columns: [
          col('accepted_at', 'timestamp(6)', {
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('assigned_at', 'timestamp(6)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('completed_at', 'timestamp(6)', {
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('driver_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('order_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('rejected_at', 'timestamp(6)', {
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('status', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'driver_assignments_accepted_has_timestamp_9f2633f8',
            "status <> 'accepted' OR accepted_at IS NOT NULL",
          ),
          checkExpression(
            'driver_assignments_completed_has_timestamp_c896eadb',
            "status <> 'completed' OR completed_at IS NOT NULL",
          ),
          checkExpression(
            'driver_assignments_rejected_has_timestamp_50d2adf4',
            "status <> 'rejected' OR rejected_at IS NOT NULL",
          ),
          checkExpression(
            'driver_assignments_status_check_d1f9daf7',
            "\"status\" IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'driver_documents',
        columns: [
          col('created_at', 'timestamp(6)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('document_type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('driver_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('expiry_date', 'date', { codecRef: { codecId: 'pg/date-string@1' } }),
          col('file_url', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('status', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('verified_at', 'timestamp(6)', {
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'driver_documents_document_type_check_daeff94a',
            "\"document_type\" IN ('driver_license', 'national_id', 'passport', 'insurance', 'vehicle_registration', 'background_check', 'medical_certificate', 'other')",
          ),
          checkExpression(
            'driver_documents_status_check_e6196992',
            "\"status\" IN ('pending', 'submitted', 'verified', 'rejected', 'expired')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'driver_locations',
        columns: [
          col('driver_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('heading', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('latitude', 'numeric(9,6)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 9, scale: 6 } },
          }),
          col('longitude', 'numeric(9,6)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 9, scale: 6 } },
          }),
          col('recorded_at', 'timestamp(6)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('speed', 'numeric(5,2)', {
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 5, scale: 2 } },
          }),
        ],
        constraints: [
          primaryKey(['driver_id', 'recorded_at']),
          checkExpression(
            'driver_locations_coordinates_valid_b9fb9d9c',
            'latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180',
          ),
          checkExpression(
            'driver_locations_heading_speed_valid_f7372d64',
            'heading BETWEEN 0 AND 359 AND speed >= 0',
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'driver_payouts',
        columns: [
          col('amount', 'numeric(10,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 10, scale: 2 } },
          }),
          col('driver_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('paid_at', 'timestamp(6)', {
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('period_end', 'date', { notNull: true, codecRef: { codecId: 'pg/date-string@1' } }),
          col('period_start', 'date', { notNull: true, codecRef: { codecId: 'pg/date-string@1' } }),
          col('status', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('driver_payouts_amount_non_negative_2ce36fec', 'amount >= 0'),
          checkExpression(
            'driver_payouts_completed_has_paid_at_2c4f6732',
            "status <> 'completed' OR paid_at IS NOT NULL",
          ),
          checkExpression('driver_payouts_period_valid_d78e3c45', 'period_start <= period_end'),
          checkExpression(
            'driver_payouts_status_check_661d2859',
            "\"status\" IN ('pending', 'processing', 'completed', 'failed', 'on_hold', 'cancelled')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'driver_reviews',
        columns: [
          col('comment', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('created_at', 'timestamp(6)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('customer_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('driver_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('is_edited', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('order_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('published_at', 'timestamp(6)', {
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('rating', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('pending'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('title', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('updated_at', 'timestamp(6)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('driver_reviews_rating_range_5123b83d', 'rating BETWEEN 1 AND 5'),
          checkExpression(
            'driver_reviews_status_check_a4564f9b',
            "\"status\" IN ('pending', 'published', 'hidden', 'deleted')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'driver_vehicles',
        columns: [
          col('brand', 'character varying(100)', {
            notNull: true,
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 100 } },
          }),
          col('color', 'character varying(50)', {
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 50 } },
          }),
          col('created_at', 'timestamp(6)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('driver_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('insurance_expiry_date', 'date', { codecRef: { codecId: 'pg/date-string@1' } }),
          col('is_active', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('manufacture_year', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('model', 'character varying(100)', {
            notNull: true,
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 100 } },
          }),
          col('plate_number', 'character varying(30)', {
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 30 } },
          }),
          col('vehicle_type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'driver_vehicles_vehicle_type_check_7c62dfbb',
            "\"vehicle_type\" IN ('car', 'motorcycle', 'scooter', 'bicycle', 'van', 'truck')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'drivers',
        columns: [
          col('availability_status', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('created_at', 'timestamp(6)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('date_of_birth', 'date', {
            notNull: true,
            codecRef: { codecId: 'pg/date-string@1' },
          }),
          col('first_name', 'character varying(100)', {
            notNull: true,
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 100 } },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('last_name', 'character varying(100)', {
            notNull: true,
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 100 } },
          }),
          col('license_expiry_date', 'date', {
            notNull: true,
            codecRef: { codecId: 'pg/date-string@1' },
          }),
          col('license_number', 'character varying(50)', {
            notNull: true,
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 50 } },
          }),
          col('national_id', 'character varying(30)', {
            notNull: true,
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 30 } },
          }),
          col('profile_image_url', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('rating', 'numeric(3,2)', {
            default: fn("'0'::numeric(3,2)"),
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 3, scale: 2 } },
          }),
          col('status', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('total_deliveries', 'int4', { default: lit(0), codecRef: { codecId: 'pg/int4@1' } }),
          col('updated_at', 'timestamp(6)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('user_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'drivers_availability_status_check_b28db45f',
            "\"availability_status\" IN ('available', 'busy', 'offline', 'on_break')",
          ),
          checkExpression(
            'drivers_rating_cache_valid_fcaded61',
            'rating BETWEEN 0 AND 5 AND total_deliveries >= 0',
          ),
          checkExpression(
            'drivers_status_check_149c787a',
            "\"status\" IN ('active', 'inactive', 'pending')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'earnings',
        columns: [
          col('base_fee', 'numeric(10,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 10, scale: 2 } },
          }),
          col('bonus', 'numeric(10,2)', {
            notNull: true,
            default: fn("'0'::numeric(10,2)"),
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 10, scale: 2 } },
          }),
          col('created_at', 'timestamp(6)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('deduction', 'numeric(10,2)', {
            notNull: true,
            default: fn("'0'::numeric(10,2)"),
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 10, scale: 2 } },
          }),
          col('driver_assignment_id', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('driver_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('driver_payout_id', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('net_amount', 'numeric(10,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 10, scale: 2 } },
          }),
          col('order_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('status', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('tip', 'numeric(10,2)', {
            notNull: true,
            default: fn("'0'::numeric(10,2)"),
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 10, scale: 2 } },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'earnings_amounts_non_negative_e5fc8437',
            'base_fee >= 0 AND bonus >= 0 AND tip >= 0 AND deduction >= 0',
          ),
          checkExpression(
            'earnings_net_amount_matches_components_2458ecce',
            'net_amount = base_fee + bonus + tip - deduction',
          ),
          checkExpression(
            'earnings_status_check_661d2859',
            "\"status\" IN ('pending', 'processing', 'completed', 'failed', 'on_hold', 'cancelled')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'menu_categories',
        columns: [
          col('created_at', 'timestamp(6)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('display_order', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
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
          col('restaurant_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'menu_item_images',
        columns: [
          col('display_order', 'int4', { default: lit(0), codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('image_url', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('menu_item_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'menu_item_option_groups',
        columns: [
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('is_required', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('max_selection', 'int4', {
            notNull: true,
            default: lit(1),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('menu_item_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('min_selection', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'menu_item_option_groups_required_implies_min_2c621243',
            'NOT is_required OR min_selection >= 1',
          ),
          checkExpression(
            'menu_item_option_groups_selection_range_valid_645f1a7a',
            'min_selection >= 0 AND max_selection >= 1 AND max_selection >= min_selection',
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'menu_item_option_values',
        columns: [
          col('display_order', 'int4', { default: lit(0), codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('option_group_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('price_adjustment', 'numeric', {
            notNull: true,
            default: lit('0'),
            codecRef: { codecId: 'pg/numeric@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'menu_items',
        columns: [
          col('base_price', 'numeric(10,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 10, scale: 2 } },
          }),
          col('category_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('created_at', 'timestamp(6)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('is_active', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('is_available', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('name', 'character varying(150)', {
            notNull: true,
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 150 } },
          }),
          col('preparation_time', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('restaurant_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('updated_at', 'timestamp(6)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('menu_items_base_price_non_negative_d41b7da2', 'base_price >= 0'),
          checkExpression(
            'menu_items_preparation_time_non_negative_f2935a7b',
            'preparation_time >= 0',
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'order_item_options',
        columns: [
          col('created_at', 'timestamp(6)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('option_group_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('option_group_name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('option_value_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('option_value_name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('order_item_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('price_adjustment', 'numeric', {
            notNull: true,
            default: lit('0'),
            codecRef: { codecId: 'pg/numeric@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'order_items',
        columns: [
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('menu_item_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('order_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('quantity', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('special_instructions', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('total_price', 'numeric', { notNull: true, codecRef: { codecId: 'pg/numeric@1' } }),
          col('unit_price', 'numeric', { notNull: true, codecRef: { codecId: 'pg/numeric@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'order_item_amounts_valid_f646bbd9',
            'quantity > 0 AND unit_price >= 0 AND total_price >= 0',
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'order_status_history',
        columns: [
          col('changed_at', 'timestamp(6)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('changed_by_user_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('note', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('order_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('status', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'order_status_history_status_check_ee5b41f9',
            "\"status\" IN ('pending', 'accepted', 'rejected', 'preparing', 'ready_for_pickup', 'picked_up', 'out_for_delivery', 'delivered', 'cancelled')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'orders',
        columns: [
          col('accepted_at', 'timestamp(6)', {
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('cancelled_at', 'timestamp(6)', {
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('created_at', 'timestamp(6)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('customer_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('customer_note', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('delivered_at', 'timestamp(6)', {
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('delivery_address_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('delivery_fee', 'numeric', { notNull: true, codecRef: { codecId: 'pg/numeric@1' } }),
          col('discount_amount', 'numeric', {
            notNull: true,
            default: lit('0'),
            codecRef: { codecId: 'pg/numeric@1' },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('order_number', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('out_for_delivery_at', 'timestamp(6)', {
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('picked_up_at', 'timestamp(6)', {
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('placed_at', 'timestamp(6)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('prepared_at', 'timestamp(6)', {
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('ready_for_pickup_at', 'timestamp(6)', {
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('rejected_at', 'timestamp(6)', {
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('restaurant_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('status', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('subtotal', 'numeric', { notNull: true, codecRef: { codecId: 'pg/numeric@1' } }),
          col('tax_amount', 'numeric', { notNull: true, codecRef: { codecId: 'pg/numeric@1' } }),
          col('total_amount', 'numeric', { notNull: true, codecRef: { codecId: 'pg/numeric@1' } }),
          col('updated_at', 'timestamp(6)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'order_amounts_non_negative_838cb358',
            'subtotal >= 0 AND delivery_fee >= 0 AND tax_amount >= 0 AND discount_amount >= 0 AND total_amount >= 0',
          ),
          checkExpression(
            'order_total_matches_components_26b1d004',
            'total_amount = subtotal + delivery_fee + tax_amount - discount_amount',
          ),
          checkExpression(
            'orders_status_check_ee5b41f9',
            "\"status\" IN ('pending', 'accepted', 'rejected', 'preparing', 'ready_for_pickup', 'picked_up', 'out_for_delivery', 'delivered', 'cancelled')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'payment_refunds',
        columns: [
          col('amount', 'numeric', { notNull: true, codecRef: { codecId: 'pg/numeric@1' } }),
          col('created_at', 'timestamp(6)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('payment_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('processed_at', 'timestamp(6)', {
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('reason', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('payment_refund_amount_non_negative_2ce36fec', 'amount >= 0'),
          checkExpression(
            'payment_refunds_status_check_9ee5994c',
            "\"status\" IN ('pending', 'completed', 'failed', 'cancelled')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'payments',
        columns: [
          col('amount', 'numeric', { notNull: true, codecRef: { codecId: 'pg/numeric@1' } }),
          col('created_at', 'timestamp(6)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('currency', 'character(3)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 3 } },
          }),
          col('failure_reason', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('order_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('paid_at', 'timestamp(6)', {
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('payment_method', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('transaction_reference', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('updated_at', 'timestamp(6)', {
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('payment_amount_non_negative_2ce36fec', 'amount >= 0'),
          checkExpression(
            'payments_payment_method_check_0ec4f984',
            "\"payment_method\" IN ('cash', 'credit_card', 'debit_card', 'apple_pay', 'google_pay', 'wallet')",
          ),
          checkExpression(
            'payments_status_check_ae752e9c',
            "\"status\" IN ('pending', 'processing', 'paid', 'failed', 'refunded', 'partially_refunded')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'restaurant_addresses',
        columns: [
          col('building', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('city', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('country', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('created_at', 'timestamp(6)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
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
            'restaurant_addresses_coordinates_valid_b9fb9d9c',
            'latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180',
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'restaurant_categories',
        columns: [
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
          col('name', 'character varying(150)', {
            notNull: true,
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 150 } },
          }),
          col('restaurant_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('updated_at', 'timestamp(6)', {
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'restaurant_operating_hours',
        columns: [
          col('closes_at', 'time(6)', {
            codecRef: { codecId: 'pg/time-string@1', typeParams: { precision: 6 } },
          }),
          col('created_at', 'timestamp(6)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('day_of_week', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('is_closed', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('opens_at', 'time(6)', {
            codecRef: { codecId: 'pg/time-string@1', typeParams: { precision: 6 } },
          }),
          col('restaurant_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('updated_at', 'timestamp(6)', {
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'restaurant_operating_hours_day_of_week_valid_270d6122',
            'day_of_week BETWEEN 0 AND 6',
          ),
          checkExpression(
            'restaurant_operating_hours_open_day_has_hours_6f3be340',
            'is_closed OR (opens_at IS NOT NULL AND closes_at IS NOT NULL)',
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'restaurant_promotions',
        columns: [
          col('created_at', 'timestamp(6)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('discount_type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('discount_value', 'numeric', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1' },
          }),
          col('ends_at', 'timestamp(6)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('is_active', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('restaurant_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('starts_at', 'timestamp(6)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('title', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updated_at', 'timestamp(6)', {
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('restaurant_promotions_date_range_valid_3fd1ae5c', 'starts_at < ends_at'),
          checkExpression(
            'restaurant_promotions_discount_type_check_4ccb5f06',
            "\"discount_type\" IN ('percentage', 'fixed', 'free_shipping', 'buy_one_get_one')",
          ),
          checkExpression(
            'restaurant_promotions_discount_value_non_negative_579ef29a',
            'discount_value >= 0',
          ),
          checkExpression(
            'restaurant_promotions_percentage_max_100_06a7f201',
            "discount_type <> 'percentage' OR discount_value <= 100",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'restaurant_review_images',
        columns: [
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('image_url', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('review_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('sort_order', 'int4', { default: lit(0), codecRef: { codecId: 'pg/int4@1' } }),
          col('uploaded_at', 'timestamp(6)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'restaurant_review_replies',
        columns: [
          col('created_at', 'timestamp(6)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('reply', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('restaurant_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('review_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('updated_at', 'timestamp(6)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'restaurant_reviews',
        columns: [
          col('comment', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('created_at', 'timestamp(6)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('customer_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('is_edited', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('order_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('published_at', 'timestamp(6)', {
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('rating', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('restaurant_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('pending'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('title', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('updated_at', 'timestamp(6)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('restaurant_reviews_rating_range_5123b83d', 'rating BETWEEN 1 AND 5'),
          checkExpression(
            'restaurant_reviews_status_check_a4564f9b',
            "\"status\" IN ('pending', 'published', 'hidden', 'deleted')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'restaurants',
        columns: [
          col('availability_status', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('cover_image_url', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('created_at', 'timestamp(6)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('delivery_fee', 'numeric(10,2)', {
            default: fn("'0'::numeric(10,2)"),
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 10, scale: 2 } },
          }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('email', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('estimated_delivery_time', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('logo_url', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('minimum_order_amount', 'numeric(10,2)', {
            default: fn("'0'::numeric(10,2)"),
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 10, scale: 2 } },
          }),
          col('name', 'character varying(150)', {
            notNull: true,
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 150 } },
          }),
          col('phone_number', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('rating_average', 'numeric(3,2)', {
            default: fn("'0'::numeric(3,2)"),
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 3, scale: 2 } },
          }),
          col('rating_count', 'int4', { default: lit(0), codecRef: { codecId: 'pg/int4@1' } }),
          col('status', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('updated_at', 'timestamp(6)', {
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('user_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'restaurants_amounts_non_negative_2f084d6f',
            'minimum_order_amount >= 0 AND delivery_fee >= 0',
          ),
          checkExpression(
            'restaurants_availability_status_check_315ae2ed',
            "\"availability_status\" IN ('open', 'closed', 'busy')",
          ),
          checkExpression(
            'restaurants_delivery_time_non_negative_f6b1d51b',
            'estimated_delivery_time >= 0',
          ),
          checkExpression(
            'restaurants_rating_cache_valid_b9d9571a',
            'rating_average BETWEEN 0 AND 5 AND rating_count >= 0',
          ),
          checkExpression(
            'restaurants_status_check_19a2b525',
            "\"status\" IN ('pending', 'approved', 'rejected')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'shopping_cart',
        columns: [
          col('created_at', 'timestamp(6)', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
          col('customer_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('restaurant_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('subtotal', 'numeric', { notNull: true, codecRef: { codecId: 'pg/numeric@1' } }),
          col('updated_at', 'timestamp(6)', {
            codecRef: { codecId: 'pg/timestamp-string@1', typeParams: { precision: 6 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'shopping_cart_items',
        columns: [
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('menu_item_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('quantity', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('shopping_cart_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('total_price', 'numeric', { notNull: true, codecRef: { codecId: 'pg/numeric@1' } }),
          col('unit_price', 'numeric', { notNull: true, codecRef: { codecId: 'pg/numeric@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'shopping_cart_item_amounts_valid_f646bbd9',
            'quantity > 0 AND unit_price >= 0 AND total_price >= 0',
          ),
        ],
      }),
      this.addUnique({
        schema: 'public',
        table: 'customers',
        constraint: 'customers_user_id_key',
        columns: ['user_id'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'driver_assignments',
        constraint: 'driver_assignments_id_order_id_driver_id_key',
        columns: ['id', 'order_id', 'driver_id'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'driver_payouts',
        constraint: 'driver_payouts_id_driver_id_key',
        columns: ['id', 'driver_id'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'driver_reviews',
        constraint: 'driver_reviews_order_id_key',
        columns: ['order_id'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'driver_vehicles',
        constraint: 'driver_vehicles_plate_number_key',
        columns: ['plate_number'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'drivers',
        constraint: 'drivers_user_id_key',
        columns: ['user_id'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'drivers',
        constraint: 'drivers_national_id_key',
        columns: ['national_id'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'drivers',
        constraint: 'drivers_license_number_key',
        columns: ['license_number'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'earnings',
        constraint: 'earnings_driver_assignment_id_key',
        columns: ['driver_assignment_id'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'menu_categories',
        constraint: 'menu_categories_id_restaurant_id_key',
        columns: ['id', 'restaurant_id'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'menu_item_option_groups',
        constraint: 'menu_item_option_groups_menu_item_id_name_key',
        columns: ['menu_item_id', 'name'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'menu_item_option_values',
        constraint: 'menu_item_option_values_option_group_id_name_key',
        columns: ['option_group_id', 'name'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'orders',
        constraint: 'orders_order_number_key',
        columns: ['order_number'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'orders',
        constraint: 'orders_id_customer_id_restaurant_id_key',
        columns: ['id', 'customer_id', 'restaurant_id'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'payments',
        constraint: 'payments_transaction_reference_key',
        columns: ['transaction_reference'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'restaurant_categories',
        constraint: 'restaurant_categories_restaurant_id_name_key',
        columns: ['restaurant_id', 'name'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'restaurant_operating_hours',
        constraint: 'restaurant_operating_hours_restaurant_id_day_of_week_key',
        columns: ['restaurant_id', 'day_of_week'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'restaurant_review_replies',
        constraint: 'restaurant_review_replies_review_id_key',
        columns: ['review_id'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'restaurant_reviews',
        constraint: 'restaurant_reviews_order_id_key',
        columns: ['order_id'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'restaurant_reviews',
        constraint: 'restaurant_reviews_id_restaurant_id_key',
        columns: ['id', 'restaurant_id'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'restaurants',
        constraint: 'restaurants_user_id_key',
        columns: ['user_id'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'shopping_cart',
        constraint: 'shopping_cart_customer_id_key',
        columns: ['customer_id'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'shopping_cart_items',
        constraint: 'shopping_cart_items_shopping_cart_id_menu_item_id_key',
        columns: ['shopping_cart_id', 'menu_item_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'delivery_addresses',
        index: 'delivery_addresses_customer_id_idx_e16dfa6b',
        columns: ['customer_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'delivery_addresses',
        index: 'delivery_addresses_one_default_per_customer_88b947c5',
        columns: ['customer_id'],
        extras: { where: 'is_default = true', unique: true },
      }),
      this.createIndex({
        schema: 'public',
        table: 'driver_assignments',
        index: 'driver_assignments_active_order_unique_2537766a',
        columns: ['order_id'],
        extras: { where: "status IN ('pending', 'accepted', 'completed')", unique: true },
      }),
      this.createIndex({
        schema: 'public',
        table: 'driver_assignments',
        index: 'driver_assignments_driver_id_idx_56c848ae',
        columns: ['driver_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'driver_assignments',
        index: 'driver_assignments_order_id_idx_39ad19ad',
        columns: ['order_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'driver_documents',
        index: 'driver_documents_driver_id_idx_56c848ae',
        columns: ['driver_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'driver_locations',
        index: 'driver_locations_driver_id_idx_56c848ae',
        columns: ['driver_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'driver_payouts',
        index: 'driver_payouts_driver_id_idx_56c848ae',
        columns: ['driver_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'driver_reviews',
        index: 'driver_reviews_customer_id_idx_e16dfa6b',
        columns: ['customer_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'driver_reviews',
        index: 'driver_reviews_driver_id_idx_56c848ae',
        columns: ['driver_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'driver_vehicles',
        index: 'driver_vehicles_driver_id_idx_56c848ae',
        columns: ['driver_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'driver_vehicles',
        index: 'driver_vehicles_one_active_per_driver_3a0393c4',
        columns: ['driver_id'],
        extras: { where: 'is_active = true', unique: true },
      }),
      this.createIndex({
        schema: 'public',
        table: 'earnings',
        index: 'earnings_driver_assignment_id_order_id_driver_id_idx_c26e54e6',
        columns: ['driver_assignment_id', 'order_id', 'driver_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'earnings',
        index: 'earnings_driver_id_idx_56c848ae',
        columns: ['driver_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'earnings',
        index: 'earnings_driver_payout_id_driver_id_idx_3d3ecc49',
        columns: ['driver_payout_id', 'driver_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'earnings',
        index: 'earnings_driver_payout_id_idx_ef994560',
        columns: ['driver_payout_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'earnings',
        index: 'earnings_order_id_idx_39ad19ad',
        columns: ['order_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'menu_categories',
        index: 'menu_categories_active_name_unique_a241d28a',
        columns: ['restaurant_id', 'name'],
        extras: { where: 'is_active = true', unique: true },
      }),
      this.createIndex({
        schema: 'public',
        table: 'menu_categories',
        index: 'menu_categories_restaurant_id_idx_5fa03bd5',
        columns: ['restaurant_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'menu_item_images',
        index: 'menu_item_images_menu_item_id_idx_039fe39b',
        columns: ['menu_item_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'menu_item_option_groups',
        index: 'menu_item_option_groups_menu_item_id_idx_039fe39b',
        columns: ['menu_item_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'menu_item_option_values',
        index: 'menu_item_option_values_option_group_id_idx_28929bf2',
        columns: ['option_group_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'menu_items',
        index: 'menu_items_active_name_unique_a241d28a',
        columns: ['restaurant_id', 'name'],
        extras: { where: 'is_active = true', unique: true },
      }),
      this.createIndex({
        schema: 'public',
        table: 'menu_items',
        index: 'menu_items_category_id_restaurant_id_idx_e5b987af',
        columns: ['category_id', 'restaurant_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'menu_items',
        index: 'menu_items_restaurant_id_idx_5fa03bd5',
        columns: ['restaurant_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'order_item_options',
        index: 'order_item_options_option_group_id_idx_28929bf2',
        columns: ['option_group_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'order_item_options',
        index: 'order_item_options_option_value_id_idx_46da301b',
        columns: ['option_value_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'order_item_options',
        index: 'order_item_options_order_item_id_idx_92934215',
        columns: ['order_item_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'order_items',
        index: 'order_items_menu_item_id_idx_039fe39b',
        columns: ['menu_item_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'order_items',
        index: 'order_items_order_id_idx_39ad19ad',
        columns: ['order_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'order_status_history',
        index: 'order_status_history_changed_by_user_id_idx_01d65e87',
        columns: ['changed_by_user_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'order_status_history',
        index: 'order_status_history_order_id_idx_39ad19ad',
        columns: ['order_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'orders',
        index: 'orders_customer_id_idx_e16dfa6b',
        columns: ['customer_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'orders',
        index: 'orders_delivery_address_id_idx_db598ff5',
        columns: ['delivery_address_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'orders',
        index: 'orders_restaurant_id_idx_5fa03bd5',
        columns: ['restaurant_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'payment_refunds',
        index: 'payment_refunds_payment_id_idx_7931cf41',
        columns: ['payment_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'payments',
        index: 'payments_order_id_idx_39ad19ad',
        columns: ['order_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'restaurant_addresses',
        index: 'restaurant_addresses_restaurant_id_idx_5fa03bd5',
        columns: ['restaurant_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'restaurant_categories',
        index: 'restaurant_categories_restaurant_id_idx_5fa03bd5',
        columns: ['restaurant_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'restaurant_operating_hours',
        index: 'restaurant_operating_hours_restaurant_id_idx_5fa03bd5',
        columns: ['restaurant_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'restaurant_promotions',
        index: 'restaurant_promotions_restaurant_id_idx_5fa03bd5',
        columns: ['restaurant_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'restaurant_review_images',
        index: 'restaurant_review_images_review_id_idx_af4d2e86',
        columns: ['review_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'restaurant_review_replies',
        index: 'restaurant_review_replies_restaurant_id_idx_5fa03bd5',
        columns: ['restaurant_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'restaurant_review_replies',
        index: 'restaurant_review_replies_review_id_restaurant_id_idx_130aef64',
        columns: ['review_id', 'restaurant_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'restaurant_reviews',
        index: 'restaurant_reviews_customer_id_idx_e16dfa6b',
        columns: ['customer_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'restaurant_reviews',
        index: 'restaurant_reviews_order_id_customer_id_restaurant_id__2c8da930',
        columns: ['order_id', 'customer_id', 'restaurant_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'restaurant_reviews',
        index: 'restaurant_reviews_restaurant_id_idx_5fa03bd5',
        columns: ['restaurant_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'shopping_cart',
        index: 'shopping_cart_restaurant_id_idx_5fa03bd5',
        columns: ['restaurant_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'shopping_cart_items',
        index: 'shopping_cart_items_menu_item_id_idx_039fe39b',
        columns: ['menu_item_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'shopping_cart_items',
        index: 'shopping_cart_items_shopping_cart_id_idx_8767fb65',
        columns: ['shopping_cart_id'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'customers',
        foreignKey: {
          name: 'customers_user_id_fkey',
          columns: ['user_id'],
          references: { schema: 'identity', table: 'users', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'delivery_addresses',
        foreignKey: {
          name: 'delivery_addresses_customer_id_fkey',
          columns: ['customer_id'],
          references: { schema: 'public', table: 'customers', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'driver_assignments',
        foreignKey: {
          name: 'driver_assignments_order_id_fkey',
          columns: ['order_id'],
          references: { schema: 'public', table: 'orders', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'driver_assignments',
        foreignKey: {
          name: 'driver_assignments_driver_id_fkey',
          columns: ['driver_id'],
          references: { schema: 'public', table: 'drivers', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'driver_documents',
        foreignKey: {
          name: 'driver_documents_driver_id_fkey',
          columns: ['driver_id'],
          references: { schema: 'public', table: 'drivers', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'driver_locations',
        foreignKey: {
          name: 'driver_locations_driver_id_fkey',
          columns: ['driver_id'],
          references: { schema: 'public', table: 'drivers', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'driver_payouts',
        foreignKey: {
          name: 'driver_payouts_driver_id_fkey',
          columns: ['driver_id'],
          references: { schema: 'public', table: 'drivers', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'driver_reviews',
        foreignKey: {
          name: 'driver_reviews_customer_id_fkey',
          columns: ['customer_id'],
          references: { schema: 'public', table: 'customers', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'driver_reviews',
        foreignKey: {
          name: 'driver_reviews_driver_id_fkey',
          columns: ['driver_id'],
          references: { schema: 'public', table: 'drivers', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'driver_reviews',
        foreignKey: {
          name: 'driver_reviews_order_id_fkey',
          columns: ['order_id'],
          references: { schema: 'public', table: 'orders', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'driver_vehicles',
        foreignKey: {
          name: 'driver_vehicles_driver_id_fkey',
          columns: ['driver_id'],
          references: { schema: 'public', table: 'drivers', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'drivers',
        foreignKey: {
          name: 'drivers_user_id_fkey',
          columns: ['user_id'],
          references: { schema: 'identity', table: 'users', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'earnings',
        foreignKey: {
          name: 'earnings_driver_id_fkey',
          columns: ['driver_id'],
          references: { schema: 'public', table: 'drivers', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'earnings',
        foreignKey: {
          name: 'earnings_order_id_fkey',
          columns: ['order_id'],
          references: { schema: 'public', table: 'orders', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'earnings',
        foreignKey: {
          name: 'earnings_driver_assignment_id_order_id_driver_id_fkey',
          columns: ['driver_assignment_id', 'order_id', 'driver_id'],
          references: {
            schema: 'public',
            table: 'driver_assignments',
            columns: ['id', 'order_id', 'driver_id'],
          },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'earnings',
        foreignKey: {
          name: 'earnings_driver_payout_id_driver_id_fkey',
          columns: ['driver_payout_id', 'driver_id'],
          references: { schema: 'public', table: 'driver_payouts', columns: ['id', 'driver_id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'menu_categories',
        foreignKey: {
          name: 'menu_categories_restaurant_id_fkey',
          columns: ['restaurant_id'],
          references: { schema: 'public', table: 'restaurants', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'menu_item_images',
        foreignKey: {
          name: 'menu_item_images_menu_item_id_fkey',
          columns: ['menu_item_id'],
          references: { schema: 'public', table: 'menu_items', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'menu_item_option_groups',
        foreignKey: {
          name: 'menu_item_option_groups_menu_item_id_fkey',
          columns: ['menu_item_id'],
          references: { schema: 'public', table: 'menu_items', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'menu_item_option_values',
        foreignKey: {
          name: 'menu_item_option_values_option_group_id_fkey',
          columns: ['option_group_id'],
          references: { schema: 'public', table: 'menu_item_option_groups', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'menu_items',
        foreignKey: {
          name: 'menu_items_restaurant_id_fkey',
          columns: ['restaurant_id'],
          references: { schema: 'public', table: 'restaurants', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'menu_items',
        foreignKey: {
          name: 'menu_items_category_id_restaurant_id_fkey',
          columns: ['category_id', 'restaurant_id'],
          references: {
            schema: 'public',
            table: 'menu_categories',
            columns: ['id', 'restaurant_id'],
          },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'order_item_options',
        foreignKey: {
          name: 'order_item_options_order_item_id_fkey',
          columns: ['order_item_id'],
          references: { schema: 'public', table: 'order_items', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'order_item_options',
        foreignKey: {
          name: 'order_item_options_option_group_id_fkey',
          columns: ['option_group_id'],
          references: { schema: 'public', table: 'menu_item_option_groups', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'order_item_options',
        foreignKey: {
          name: 'order_item_options_option_value_id_fkey',
          columns: ['option_value_id'],
          references: { schema: 'public', table: 'menu_item_option_values', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'order_items',
        foreignKey: {
          name: 'order_items_order_id_fkey',
          columns: ['order_id'],
          references: { schema: 'public', table: 'orders', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'order_items',
        foreignKey: {
          name: 'order_items_menu_item_id_fkey',
          columns: ['menu_item_id'],
          references: { schema: 'public', table: 'menu_items', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'order_status_history',
        foreignKey: {
          name: 'order_status_history_order_id_fkey',
          columns: ['order_id'],
          references: { schema: 'public', table: 'orders', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'order_status_history',
        foreignKey: {
          name: 'order_status_history_changed_by_user_id_fkey',
          columns: ['changed_by_user_id'],
          references: { schema: 'identity', table: 'users', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'orders',
        foreignKey: {
          name: 'orders_customer_id_fkey',
          columns: ['customer_id'],
          references: { schema: 'public', table: 'customers', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'orders',
        foreignKey: {
          name: 'orders_restaurant_id_fkey',
          columns: ['restaurant_id'],
          references: { schema: 'public', table: 'restaurants', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'orders',
        foreignKey: {
          name: 'orders_delivery_address_id_fkey',
          columns: ['delivery_address_id'],
          references: { schema: 'public', table: 'delivery_address', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'payment_refunds',
        foreignKey: {
          name: 'payment_refunds_payment_id_fkey',
          columns: ['payment_id'],
          references: { schema: 'public', table: 'payments', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'payments',
        foreignKey: {
          name: 'payments_order_id_fkey',
          columns: ['order_id'],
          references: { schema: 'public', table: 'orders', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'restaurant_addresses',
        foreignKey: {
          name: 'restaurant_addresses_restaurant_id_fkey',
          columns: ['restaurant_id'],
          references: { schema: 'public', table: 'restaurants', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'restaurant_categories',
        foreignKey: {
          name: 'restaurant_categories_restaurant_id_fkey',
          columns: ['restaurant_id'],
          references: { schema: 'public', table: 'restaurants', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'restaurant_operating_hours',
        foreignKey: {
          name: 'restaurant_operating_hours_restaurant_id_fkey',
          columns: ['restaurant_id'],
          references: { schema: 'public', table: 'restaurants', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'restaurant_promotions',
        foreignKey: {
          name: 'restaurant_promotions_restaurant_id_fkey',
          columns: ['restaurant_id'],
          references: { schema: 'public', table: 'restaurants', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'restaurant_review_images',
        foreignKey: {
          name: 'restaurant_review_images_review_id_fkey',
          columns: ['review_id'],
          references: { schema: 'public', table: 'restaurant_reviews', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'restaurant_review_replies',
        foreignKey: {
          name: 'restaurant_review_replies_review_id_restaurant_id_fkey',
          columns: ['review_id', 'restaurant_id'],
          references: {
            schema: 'public',
            table: 'restaurant_reviews',
            columns: ['id', 'restaurant_id'],
          },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'restaurant_review_replies',
        foreignKey: {
          name: 'restaurant_review_replies_restaurant_id_fkey',
          columns: ['restaurant_id'],
          references: { schema: 'public', table: 'restaurants', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'restaurant_reviews',
        foreignKey: {
          name: 'restaurant_reviews_customer_id_fkey',
          columns: ['customer_id'],
          references: { schema: 'public', table: 'customers', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'restaurant_reviews',
        foreignKey: {
          name: 'restaurant_reviews_restaurant_id_fkey',
          columns: ['restaurant_id'],
          references: { schema: 'public', table: 'restaurants', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'restaurant_reviews',
        foreignKey: {
          name: 'restaurant_reviews_order_id_customer_id_restaurant_id_fkey',
          columns: ['order_id', 'customer_id', 'restaurant_id'],
          references: {
            schema: 'public',
            table: 'orders',
            columns: ['id', 'customer_id', 'restaurant_id'],
          },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'restaurants',
        foreignKey: {
          name: 'restaurants_user_id_fkey',
          columns: ['user_id'],
          references: { schema: 'identity', table: 'users', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'shopping_cart',
        foreignKey: {
          name: 'shopping_cart_customer_id_fkey',
          columns: ['customer_id'],
          references: { schema: 'public', table: 'customers', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'shopping_cart',
        foreignKey: {
          name: 'shopping_cart_restaurant_id_fkey',
          columns: ['restaurant_id'],
          references: { schema: 'public', table: 'restaurants', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'shopping_cart_items',
        foreignKey: {
          name: 'shopping_cart_items_shopping_cart_id_fkey',
          columns: ['shopping_cart_id'],
          references: { schema: 'public', table: 'shopping_cart', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'shopping_cart_items',
        foreignKey: {
          name: 'shopping_cart_items_menu_item_id_fkey',
          columns: ['menu_item_id'],
          references: { schema: 'public', table: 'menu_items', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
