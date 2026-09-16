CREATE TYPE "order_status" AS ENUM (
  'pending',
  'accepted',
  'rejected',
  'preparing',
  'ready_for_pickup',
  'picked_up',
  'out_for_delivery',
  'delivered',
  'cancelled'
);

CREATE TYPE "payment_method" AS ENUM (
  'cash',
  'credit_card',
  'debit_card',
  'apple_pay',
  'google_pay',
  'wallet'
);

CREATE TYPE "payment_status" AS ENUM (
  'pending',
  'processing',
  'paid',
  'failed',
  'refunded',
  'partially_refunded'
);

CREATE TYPE "refund_status" AS ENUM (
  'pending',
  'completed',
  'failed',
  'cancelled'
);

CREATE TYPE "restaurant_status" AS ENUM (
  'pending',
  'approved',
  'rejected',
  'suspended'
);

CREATE TYPE "restaurant_availability" AS ENUM (
  'open',
  'closed',
  'busy'
);

CREATE TYPE "discount_type" AS ENUM (
  'percentage',
  'fixed',
  'free_shipping',
  'buy_one_get_one'
);

CREATE TYPE "driver_status" AS ENUM (
  'active',
  'inactive',
  'suspended',
  'pending'
);

CREATE TYPE "driver_availability_status" AS ENUM (
  'available',
  'busy',
  'offline',
  'on_break'
);

CREATE TYPE "vehicle_type" AS ENUM (
  'car',
  'motorcycle',
  'scooter',
  'bicycle',
  'van',
  'truck'
);

CREATE TYPE "driver_document_type" AS ENUM (
  'driver_license',
  'national_id',
  'passport',
  'insurance',
  'vehicle_registration',
  'background_check',
  'medical_certificate',
  'other'
);

CREATE TYPE "document_status" AS ENUM (
  'pending',
  'submitted',
  'verified',
  'rejected',
  'expired'
);

CREATE TYPE "payout_status" AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed',
  'on_hold',
  'cancelled'
);

CREATE TYPE "driver_assignments_status" AS ENUM (
  'pending',
  'accepted',
  'rejected',
  'completed',
  'cancelled'
);

CREATE TYPE "review_status" AS ENUM (
  'pending',
  'published',
  'hidden',
  'deleted'
);

CREATE TYPE "account_status" AS ENUM (
  'active',
  'inactive',
  'locked',
  'suspended'
);

CREATE TYPE "gender" AS ENUM (
  'male',
  'female'
);

CREATE TABLE "users" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "email" varchar UNIQUE NOT NULL,
  "normalized_email" varchar UNIQUE NOT NULL,
  "password_hash" text NOT NULL,
  "phone_number" varchar UNIQUE NOT NULL,
  "email_verified_at" timestamp,
  "phone_verified_at" timestamp,
  "account_status" account_status NOT NULL DEFAULT (active),
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "updated_at" timestamp,
  "deleted_at" timestamp
);

CREATE TABLE "user_claims" (
  "id" uuid PRIMARY KEY NOT NULL,
  "user_id" uuid NOT NULL,
  "claim_type" varchar NOT NULL,
  "claim_value" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "user_logins" (
  "user_id" uuid NOT NULL,
  "login_provider" varchar,
  "name" varchar,
  "value" text NOT NULL,
  "expires_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY ("login_provider", "value")
);

CREATE TABLE "user_tokens" (
  "user_id" uuid NOT NULL,
  "login_provider" varchar NOT NULL,
  "token_name" varchar NOT NULL,
  "value" text NOT NULL,
  "expires_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY ("login_provider", "token_name")
);

CREATE TABLE "roles" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT (gen_random_uuid()),
  "name" varchar UNIQUE NOT NULL,
  "normalized_name" varchar UNIQUE NOT NULL,
  "description" varchar,
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "updated_at" timestamp,
  "deleted_at" timestamp
);

CREATE TABLE "user_roles" (
  "user_id" uuid NOT NULL,
  "role_id" uuid NOT NULL,
  PRIMARY KEY ("user_id", "role_id")
);

CREATE TABLE "role_claims" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "role_id" uuid,
  "claim_type" varchar NOT NULL,
  "claim_value" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "refresh_tokens" (
  "id" uuid PRIMARY KEY NOT NULL,
  "user_id" uuid NOT NULL,
  "token_hash" text UNIQUE NOT NULL,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "revoked_at" timestamp,
  "replaced_by_token" uuid,
  "revoked_reason" text,
  "device_id" varchar,
  "ip_address" inet6
);

CREATE TABLE "password_reset_tokens" (
  "id" uuid PRIMARY KEY NOT NULL,
  "user_id" uuid NOT NULL,
  "token_hash" text UNIQUE NOT NULL,
  "expires_at" timestamp NOT NULL,
  "used_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "ip_address" inet6,
  "device_id" varchar
);

CREATE TABLE "audit_log" (
  "id" uuid PRIMARY KEY NOT NULL,
  "user_id" uuid NOT NULL,
  "action" varchar NOT NULL,
  "entity_name" varchar NOT NULL,
  "entity_id" uuid,
  "old_value" jsonb,
  "new_value" jsonb,
  "ip_address" inet6 NOT NULL,
  "request_id" varchar,
  "user_agent" text NOT NULL,
  "status" varchar,
  "created_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "customers" (
  "id" uuid PRIMARY KEY NOT NULL,
  "user_id" uuid NOT NULL,
  "first_name" varchar NOT NULL,
  "last_name" varchar NOT NULL,
  "profile_image_url" varchar,
  "date_of_birth" date,
  "gender" gender,
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "updated_at" timestamp
);

CREATE TABLE "delivery_addresses" (
  "id" uuid PRIMARY KEY NOT NULL,
  "customer_id" uuid NOT NULL,
  "label" varchar NOT NULL,
  "recipient_name" varchar NOT NULL,
  "phone_number" varchar NOT NULL,
  "street_address" varchar NOT NULL,
  "city" varchar NOT NULL,
  "state" varchar,
  "postal_code" varchar,
  "latitude" decimal,
  "longitude" decimal,
  "is_default" bool NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "updated_at" timestamp
);

CREATE TABLE "shopping_cart" (
  "id" uuid PRIMARY KEY NOT NULL,
  "customer_id" uuid NOT NULL,
  "restaurant_id" uuid NOT NULL,
  "subtotal" decimal NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "updated_at" timestamp
);

CREATE TABLE "shopping_cart_items" (
  "id" uuid PRIMARY KEY NOT NULL,
  "shopping_cart_id" uuid NOT NULL,
  "menu_item_id" integer NOT NULL,
  "quantity" integer NOT NULL,
  "unit_price" decimal NOT NULL,
  "total_price" decimal NOT NULL
);

CREATE TABLE "orders" (
  "id" uuid PRIMARY KEY NOT NULL,
  "order_number" varchar UNIQUE NOT NULL,
  "customer_id" uuid NOT NULL,
  "restaurant_id" uuid NOT NULL,
  "delivery_address_id" integer NOT NULL,
  "driver_id" uuid,
  "payment_id" uuid NOT NULL,
  "status" order_status NOT NULL,
  "subtotal" decimal NOT NULL,
  "delivery_fee" decimal NOT NULL,
  "tax_amount" decimal NOT NULL,
  "discount_amount" decimal NOT NULL DEFAULT 0,
  "total_amount" decimal NOT NULL,
  "customer_note" text,
  "placed_at" timestamp NOT NULL,
  "accepted_at" timestamp,
  "prepared_at" timestamp,
  "picked_up_at" timestamp,
  "delivered_at" timestamp,
  "cancelled_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "updated_at" timestamp NOT NULL
);

CREATE TABLE "order_status_history" (
  "id" uuid PRIMARY KEY NOT NULL,
  "order_id" uuid NOT NULL,
  "status" order_status NOT NULL,
  "changed_by_user_id" uuid NOT NULL,
  "changed_at" timestamp NOT NULL DEFAULT (now()),
  "note" text
);

CREATE TABLE "order_items" (
  "id" uuid PRIMARY KEY NOT NULL,
  "order_id" uuid NOT NULL,
  "menu_item_id" uuid NOT NULL,
  "quantity" int NOT NULL,
  "unit_price" decimal NOT NULL,
  "total_price" decimal NOT NULL,
  "special_instructions" text
);

CREATE TABLE "payments" (
  "id" uuid PRIMARY KEY NOT NULL,
  "order_id" uuid NOT NULL,
  "payment_method" payment_method NOT NULL,
  "status" payment_status NOT NULL,
  "transaction_reference" varchar UNIQUE,
  "amount" decimal NOT NULL,
  "currency" char NOT NULL,
  "paid_at" timestamp,
  "failure_reason" text,
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "updated_at" timestamp
);

CREATE TABLE "payment_refunds" (
  "id" uuid PRIMARY KEY NOT NULL,
  "payment_id" uuid NOT NULL,
  "amount" decimal NOT NULL,
  "reason" text,
  "status" refund_status NOT NULL,
  "processed_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "delivery_address" (
  "id" uuid PRIMARY KEY NOT NULL,
  "customer_id" uuid NOT NULL,
  "label" varchar NOT NULL,
  "recipient_name" varchar NOT NULL,
  "phone_number" varchar NOT NULL,
  "street_address" varchar NOT NULL,
  "city" varchar NOT NULL,
  "state" varchar,
  "postal_code" varchar,
  "latitude" decimal,
  "longitude" decimal,
  "is_default" bool NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "updated_at" timestamp
);

CREATE TABLE "restaurants" (
  "id" uuid PRIMARY KEY NOT NULL,
  "user_id" uuid NOT NULL,
  "name" varchar(150) NOT NULL,
  "description" text,
  "phone_number" varchar,
  "email" varchar,
  "logo_url" text,
  "cover_image_url" text,
  "status" restaurant_status,
  "availability_status" restaurant_availability,
  "minimum_order_amount" decimal(10,2) DEFAULT 0,
  "delivery_fee" decimal(10,2) DEFAULT 0,
  "estimated_delivery_time" integer,
  "rating_average" decimal(3,2) DEFAULT 0,
  "rating_count" integer DEFAULT 0,
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "restaurant_addresses" (
  "id" uuid PRIMARY KEY NOT NULL,
  "restaurant_id" uuid NOT NULL,
  "country" varchar NOT NULL,
  "city" varchar NOT NULL,
  "street" varchar NOT NULL,
  "building" varchar,
  "latitude" decimal(9,6) NOT NULL,
  "longitude" decimal(9,6) NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "updated_at" timestamp
);

CREATE TABLE "restaurant_operating_hours" (
  "id" uuid PRIMARY KEY NOT NULL,
  "restaurant_id" uuid NOT NULL,
  "day_of_week" smallint NOT NULL,
  "opens_at" time,
  "closes_at" time,
  "is_closed" boolean NOT NULL DEFAULT false,
  "created_at" timestamp DEFAULT (now()),
  "updated_at" timestamp
);

CREATE TABLE "restaurant_categories" (
  "id" uuid PRIMARY KEY NOT NULL,
  "restaurant_id" uuid NOT NULL,
  "name" varchar(150) NOT NULL,
  "isActive" boolean NOT NULL DEFAULT false,
  "created_at" timestamp DEFAULT (now()),
  "update_at" timestamp
);

CREATE TABLE "menu_categories" (
  "id" uuid PRIMARY KEY NOT NULL,
  "restaurant_id" uuid NOT NULL,
  "name" varchar(100) NOT NULL,
  "display_order" integer,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "menu_items" (
  "id" uuid PRIMARY KEY NOT NULL,
  "restaurant_id" uuid NOT NULL,
  "category_id" uuid NOT NULL,
  "name" varchar(150) NOT NULL,
  "description" text,
  "base_price" decimal(10,2) NOT NULL,
  "is_available" boolean NOT NULL DEFAULT true,
  "is_active" bollean NOT NULL DEFAULT true,
  "preparation_time" integer,
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "updated_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "menu_item_images" (
  "id" uuid PRIMARY KEY NOT NULL,
  "menu_item_id" uuid NOT NULL,
  "image_url" text NOT NULL,
  "display_order" integer DEFAULT 0
);

CREATE TABLE "menu_item_option_groups" (
  "id" uuid PRIMARY KEY NOT NULL,
  "menu_item_id" uuid NOT NULL,
  "name" varchar NOT NULL,
  "min_selection" integer NOT NULL DEFAULT 0,
  "max_selection" integer NOT NULL DEFAULT 1,
  "is_required" boolean NOT NULL DEFAULT false
);

CREATE TABLE "menu_item_option_values" (
  "id" uuid PRIMARY KEY NOT NULL,
  "option_group_id" uuid NOT NULL,
  "name" varchar NOT NULL,
  "price_adjustment" decimal NOT NULL DEFAULT 0,
  "display_order" integer DEFAULT 0
);

CREATE TABLE "restaurant_promotions" (
  "id" uuid PRIMARY KEY NOT NULL,
  "restaurant_id" uuid NOT NULL,
  "title" varchar NOT NULL,
  "discount_type" discount_type NOT NULL,
  "discount_value" decimal NOT NULL,
  "starts_at" timestamp NOT NULL,
  "ends_at" timestamp NOT NULL,
  "is_active" boolean NOT NULL DEFAULT true
);

CREATE TABLE "drivers" (
  "id" uuid PRIMARY KEY NOT NULL,
  "user_id" uuid NOT NULL,
  "first_name" varchar(100) NOT NULL,
  "last_name" varchar(100) NOT NULL,
  "date_of_birth" date NOT NULL,
  "profile_image_url" text,
  "national_id" varchar(30) UNIQUE NOT NULL,
  "license_number" varchar(50) UNIQUE NOT NULL,
  "license_expiry_date" date NOT NULL,
  "status" driver_status NOT NULL,
  "availability_status" driver_availability_status NOT NULL,
  "rating" decimal(3,2) DEFAULT 0,
  "total_deliveries" integer DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "updated_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "driver_vehicles" (
  "id" uuid PRIMARY KEY NOT NULL,
  "driver_id" uuid NOT NULL,
  "vehicle_type" vehicle_type NOT NULL,
  "brand" varchar(100) NOT NULL,
  "model" varchar(100) NOT NULL,
  "color" varchar(50),
  "plate_number" varchar(30) UNIQUE,
  "manufacture_year" smallint,
  "insurance_expiry_date" date,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "driver_documents" (
  "id" uuid PRIMARY KEY NOT NULL,
  "driver_id" uuid NOT NULL,
  "document_type" driver_document_type NOT NULL,
  "file_url" text NOT NULL,
  "status" document_status NOT NULL,
  "expiry_date" date,
  "verified_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "earnings" (
  "id" uuid PRIMARY KEY NOT NULL,
  "driver_id" uuid NOT NULL,
  "order_id" uuid NOT NULL,
  "base_fee" decimal(10,2) NOT NULL,
  "bonus" decimal(10,2) NOT NULL DEFAULT 0,
  "tip" decimal(10,2) NOT NULL DEFAULT 0,
  "deduction" decimal(10,2) NOT NULL DEFAULT 0,
  "net_amount" decimal(10,2) NOT NULL,
  "status" payout_status NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "driver_locations" (
  "driver_id" uuid NOT NULL,
  "latitude" decimal(9,6) NOT NULL,
  "longitude" decimal(9,6) NOT NULL,
  "heading" smallint,
  "speed" decimal(5,2),
  "recorded_at" timestamp NOT NULL,
  "primary" key(driver_id,recorded_at)
);

CREATE TABLE "driver_assignments" (
  "id" uuid PRIMARY KEY NOT NULL,
  "order_id" uuid NOT NULL,
  "driver_id" uuid NOT NULL,
  "status" driver_assignments_status NOT NULL,
  "assigned_at" timestamp NOT NULL DEFAULT (now()),
  "accepted_at" timestamp,
  "rejected_at" timestamp,
  "completed_at" timestamp
);

CREATE TABLE "driver_payouts" (
  "id" uuid PRIMARY KEY NOT NULL,
  "driver_id" uuid NOT NULL,
  "period_start" date NOT NULL,
  "period_end" date NOT NULL,
  "amount" decimal(10,2) NOT NULL,
  "status" payout_status NOT NULL,
  "paid_at" timestamp
);

CREATE TABLE "restaurant_reviews" (
  "id" uuid PRIMARY KEY NOT NULL,
  "customer_id" uuid NOT NULL,
  "restaurant_id" uuid NOT NULL,
  "order_id" uuid NOT NULL,
  "rating" integer NOT NULL,
  "title" varchar,
  "comment" text,
  "status" review_status NOT NULL DEFAULT (pending),
  "is_edited" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "updated_at" timestamp NOT NULL DEFAULT (now()),
  "published_at" timestamp
);

CREATE TABLE "restaurant_review_images" (
  "id" uuid PRIMARY KEY NOT NULL,
  "review_id" uuid NOT NULL,
  "image_url" text NOT NULL,
  "sort_order" integer DEFAULT 0,
  "uploaded_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "restaurant_review_replies" (
  "id" uuid PRIMARY KEY NOT NULL,
  "review_id" uuid NOT NULL,
  "restaurant_id" uuid NOT NULL,
  "reply" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "updated_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "driver_reviews" (
  "id" uuid PRIMARY KEY NOT NULL,
  "customer_id" uuid NOT NULL,
  "driver_id" uuid NOT NULL,
  "order_id" uuid NOT NULL,
  "rating" integer NOT NULL,
  "title" varchar,
  "comment" text,
  "status" review_status NOT NULL DEFAULT (pending),
  "is_edited" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "updated_at" timestamp NOT NULL DEFAULT (now()),
  "published_at" timestamp
);

CREATE UNIQUE INDEX ON "shopping_cart_items" ("shopping_cart_id", "menu_item_id");

CREATE UNIQUE INDEX ON "menu_categories" ("restaurant_id", "name");

CREATE UNIQUE INDEX ON "menu_items" ("restaurant_id", "name");

CREATE UNIQUE INDEX ON "menu_item_option_values" ("option_group_id", "name");

COMMENT ON COLUMN "customers"."user_id" IS 'This for Identity Table';

ALTER TABLE "user_claims" ADD CONSTRAINT "user_claims_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "user_logins" ADD CONSTRAINT "user_logins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "user_tokens" ADD CONSTRAINT "user_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "role_claims" ADD CONSTRAINT "role_claims_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "customers" ADD CONSTRAINT "customer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "delivery_addresses" ADD CONSTRAINT "delivery_address_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "shopping_cart" ADD CONSTRAINT "shopping_cart_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "shopping_cart" ADD CONSTRAINT "shopping_cart_restuarant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "shopping_cart_items" ADD CONSTRAINT "shopping_cart_items_shopping_cart_id" FOREIGN KEY ("shopping_cart_id") REFERENCES "shopping_cart" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "orders" ADD CONSTRAINT "orders_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "orders" ADD CONSTRAINT "order_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "orders" ADD CONSTRAINT "order_delivery_address_id" FOREIGN KEY ("delivery_address_id") REFERENCES "delivery_address" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_changed_by_user_id_fkey" FOREIGN KEY ("changed_by_user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "order_items" ADD CONSTRAINT "order_item_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "order_items" ADD CONSTRAINT "order_item_menu_item_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "payments" ADD CONSTRAINT "payment_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "payment_refunds" ADD CONSTRAINT "payment_refund_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "restaurants" ADD CONSTRAINT "restaurant_owner_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "restaurant_addresses" ADD CONSTRAINT "restaurant_address_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "restaurant_operating_hours" ADD CONSTRAINT "restaurant_operating_hours_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "restaurant_categories" ADD CONSTRAINT "restaurant_categories_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "menu_categories" ADD CONSTRAINT "menu_categories_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "menu_categories" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "menu_item_images" ADD CONSTRAINT "menu_item_images_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "menu_item_option_groups" ADD CONSTRAINT "menu_item_options_menu_i tem_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "menu_item_option_values" ADD CONSTRAINT "menu_item_option_values_option_group_id_fkey" FOREIGN KEY ("option_group_id") REFERENCES "menu_item_option_groups" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "restaurant_promotions" ADD CONSTRAINT "restaurant_promotions_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "drivers" ADD CONSTRAINT "driver_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "driver_vehicles" ADD CONSTRAINT "driver_vehicles_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "driver_documents" ADD CONSTRAINT "driver_documents_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "earnings" ADD CONSTRAINT "earnings_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "earnings" ADD CONSTRAINT "earnings_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "driver_locations" ADD CONSTRAINT "driver_locations_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "driver_assignments" ADD CONSTRAINT "driver_assignments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "driver_assignments" ADD CONSTRAINT "driver_assignments_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "driver_payouts" ADD CONSTRAINT "driver_payouts_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "restaurant_reviews" ADD CONSTRAINT "restaurant_reviews_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "restaurant_reviews" ADD CONSTRAINT "restaurant_reviews_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "restaurant_reviews" ADD CONSTRAINT "restaurant_reviews_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "restaurant_review_images" ADD CONSTRAINT "review_images_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "restaurant_reviews" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "restaurant_review_replies" ADD CONSTRAINT "review_replies_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "restaurant_reviews" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "restaurant_review_replies" ADD CONSTRAINT "review_replies_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "driver_reviews" ADD CONSTRAINT "driver_reviews_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "driver_reviews" ADD CONSTRAINT "driver_reviews_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "driver_reviews" ADD CONSTRAINT "driver_reviews_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders" ("id") DEFERRABLE INITIALLY IMMEDIATE;
