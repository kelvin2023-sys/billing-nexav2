SET NAMES utf8mb4;

SET FOREIGN_KEY_CHECKS=0;

DROP TABLE IF EXISTS `webhook_payment_notifs`;

DROP TABLE IF EXISTS `wa_chat_messages`;

DROP TABLE IF EXISTS `vouchers`;

DROP TABLE IF EXISTS `voucher_packages`;

DROP TABLE IF EXISTS `voucher_batches`;

DROP TABLE IF EXISTS `tickets`;

DROP TABLE IF EXISTS `technicians`;

DROP TABLE IF EXISTS `routers`;

DROP TABLE IF EXISTS `radius_nas`;

DROP TABLE IF EXISTS `radius_accounting`;

DROP TABLE IF EXISTS `public_voucher_orders`;

DROP TABLE IF EXISTS `public_ppob_orders`;

DROP TABLE IF EXISTS `public_donation_orders`;

DROP TABLE IF EXISTS `promo_slides`;

DROP TABLE IF EXISTS `payroll_slips`;

DROP TABLE IF EXISTS `payroll_settings`;

DROP TABLE IF EXISTS `packages`;

DROP TABLE IF EXISTS `olts`;

DROP TABLE IF EXISTS `odps`;

DROP TABLE IF EXISTS `invoices`;

DROP TABLE IF EXISTS `inventory_stock`;

DROP TABLE IF EXISTS `inventory_logs`;

DROP TABLE IF EXISTS `inventory_items`;

DROP TABLE IF EXISTS `inventory_categories`;

DROP TABLE IF EXISTS `genieacs_servers`;

DROP TABLE IF EXISTS `expenses`;

DROP TABLE IF EXISTS `expense_categories`;

DROP TABLE IF EXISTS `digiflazz_webhook_logs`;

DROP TABLE IF EXISTS `digiflazz_sync_logs`;

DROP TABLE IF EXISTS `digiflazz_staff_transactions`;

DROP TABLE IF EXISTS `digiflazz_products`;

DROP TABLE IF EXISTS `customers`;

DROP TABLE IF EXISTS `customer_usage`;

DROP TABLE IF EXISTS `customer_topup_requests`;

DROP TABLE IF EXISTS `collectors`;

DROP TABLE IF EXISTS `collector_payment_requests`;

DROP TABLE IF EXISTS `cashiers`;

DROP TABLE IF EXISTS `cash_in`;

DROP TABLE IF EXISTS `audit_trail`;

DROP TABLE IF EXISTS `attendance`;

DROP TABLE IF EXISTS `areas`;

DROP TABLE IF EXISTS `app_settings`;

DROP TABLE IF EXISTS `agents`;

DROP TABLE IF EXISTS `agent_transactions`;

DROP TABLE IF EXISTS `agent_topup_requests`;

DROP TABLE IF EXISTS `agent_hotspot_prices`;

DROP TABLE IF EXISTS `acs_tasks`;

DROP TABLE IF EXISTS `acs_devices`;

CREATE TABLE `acs_devices` (
  `id` VARCHAR(191) NOT NULL,
  `serial_number` VARCHAR(191),
  `manufacturer` TEXT,
  `product_class` TEXT,
  `oui` TEXT,
  `software_version` TEXT,
  `hardware_version` TEXT,
  `ip_address` TEXT,
  `connection_request_url` TEXT,
  `connection_request_user` TEXT,
  `connection_request_pass` TEXT,
  `tags` TEXT,
  `params` TEXT,
  `last_inform` DATETIME,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `acs_tasks` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `device_id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `payload` TEXT,
  `status` VARCHAR(191) DEFAULT 'pending',
  `result` TEXT,
  `retry_count` BIGINT DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `agent_hotspot_prices` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `agent_id` BIGINT NOT NULL,
  `router_id` BIGINT,
  `profile_name` VARCHAR(191) NOT NULL,
  `validity` TEXT,
  `buy_price` BIGINT NOT NULL DEFAULT 0,
  `sell_price` BIGINT NOT NULL DEFAULT 0,
  `is_active` BIGINT DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `agent_topup_requests` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `agent_id` BIGINT NOT NULL,
  `amount` BIGINT NOT NULL DEFAULT 0,
  `payment_gateway` TEXT,
  `payment_order_id` TEXT,
  `payment_link` TEXT,
  `payment_reference` TEXT,
  `payment_payload` TEXT,
  `payment_expires_at` DATETIME,
  `status` VARCHAR(255) DEFAULT 'pending',
  `paid_at` DATETIME,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `agent_transactions` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `agent_id` BIGINT NOT NULL,
  `type` VARCHAR(191) NOT NULL,
  `invoice_id` BIGINT,
  `customer_id` BIGINT,
  `router_id` BIGINT,
  `profile_name` TEXT,
  `voucher_code` TEXT,
  `voucher_password` TEXT,
  `amount_invoice` BIGINT NOT NULL DEFAULT 0,
  `amount_buy` BIGINT NOT NULL DEFAULT 0,
  `amount_sell` BIGINT NOT NULL DEFAULT 0,
  `fee` BIGINT NOT NULL DEFAULT 0,
  `balance_before` BIGINT NOT NULL DEFAULT 0,
  `balance_after` BIGINT NOT NULL DEFAULT 0,
  `digi_refunded` BIGINT NOT NULL DEFAULT 0,
  `note` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `provider` TEXT,
  `digi_sku` TEXT,
  `digi_target` TEXT,
  `digi_ref_id` VARCHAR(191) DEFAULT '',
  `digi_trx_id` TEXT,
  `digi_sn` TEXT,
  `digi_status` TEXT,
  `digi_message` TEXT,
  `digi_price` BIGINT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `agents` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(191) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(255) DEFAULT '',
  `balance` BIGINT NOT NULL DEFAULT 0,
  `billing_fee` BIGINT NOT NULL DEFAULT 0,
  `is_active` BIGINT DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `router_id` BIGINT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `app_settings` (
  `key` VARCHAR(191) NOT NULL,
  `value` TEXT NOT NULL,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `areas` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(191) NOT NULL,
  `description` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `attendance` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `employee_type` VARCHAR(191) NOT NULL,
  `employee_id` BIGINT NOT NULL,
  `employee_name` TEXT NOT NULL,
  `check_in_time` DATETIME NOT NULL,
  `check_in_lat` TEXT,
  `check_in_lng` TEXT,
  `check_in_note` TEXT,
  `check_in_photo` TEXT,
  `check_out_time` DATETIME,
  `check_out_lat` TEXT,
  `check_out_lng` TEXT,
  `check_out_note` TEXT,
  `check_out_photo` TEXT,
  `work_duration_minutes` BIGINT DEFAULT 0,
  `status` VARCHAR(191) DEFAULT 'checked_in',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `audit_trail` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `action` VARCHAR(191) NOT NULL,
  `entity_type` VARCHAR(191) NOT NULL,
  `entity_id` VARCHAR(191),
  `actor_type` VARCHAR(191) NOT NULL,
  `actor_id` VARCHAR(191),
  `actor_name` TEXT,
  `details` TEXT,
  `ip_address` TEXT,
  `user_agent` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cash_in` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `date` DATETIME NOT NULL,
  `category` VARCHAR(255) NOT NULL,
  `amount` BIGINT NOT NULL,
  `description` TEXT,
  `reference_type` TEXT,
  `reference_id` BIGINT,
  `receipt_number` TEXT,
  `payment_method` TEXT,
  `recorded_by_role` TEXT,
  `recorded_by_name` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cashiers` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(191) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(255) DEFAULT '',
  `is_active` BIGINT DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `collector_payment_requests` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `collector_id` BIGINT NOT NULL,
  `invoice_id` BIGINT NOT NULL,
  `customer_id` BIGINT NOT NULL,
  `amount` BIGINT NOT NULL DEFAULT 0,
  `note` TEXT,
  `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
  `decided_by_role` TEXT,
  `decided_by_name` TEXT,
  `decided_note` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `decided_at` DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `collectors` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(191) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(255) DEFAULT '',
  `area` TEXT,
  `is_active` BIGINT DEFAULT 1,
  `auto_approve` BIGINT DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `customer_topup_requests` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `customer_id` BIGINT NOT NULL,
  `amount` BIGINT NOT NULL DEFAULT 0,
  `payment_gateway` TEXT,
  `payment_order_id` TEXT,
  `payment_link` TEXT,
  `payment_reference` TEXT,
  `payment_payload` TEXT,
  `payment_expires_at` DATETIME,
  `qris_unique_code` BIGINT,
  `qris_amount_unique` BIGINT,
  `qris_assigned_at` DATETIME,
  `qris_paid_notif_id` BIGINT,
  `status` VARCHAR(255) DEFAULT 'pending',
  `paid_at` DATETIME,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `customer_usage` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `customer_id` BIGINT NOT NULL,
  `period_month` BIGINT NOT NULL,
  `period_year` BIGINT NOT NULL,
  `bytes_in` BIGINT DEFAULT 0,
  `bytes_out` BIGINT DEFAULT 0,
  `last_total_bytes_in` BIGINT DEFAULT 0,
  `last_total_bytes_out` BIGINT DEFAULT 0,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `customers` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `nik` TEXT,
  `name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(255) DEFAULT '',
  `address` TEXT,
  `area` TEXT,
  `package_id` BIGINT,
  `genieacs_tag` TEXT,
  `pppoe_username` TEXT,
  `isolir_profile` TEXT,
  `status` VARCHAR(255) DEFAULT 'active',
  `install_date` DATETIME,
  `expired_at` DATETIME,
  `notes` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `auto_isolate` BIGINT DEFAULT 1,
  `isolate_day` BIGINT DEFAULT 10,
  `email` VARCHAR(255) DEFAULT '',
  `router_id` BIGINT,
  `olt_id` BIGINT,
  `pon_port` TEXT,
  `odp_id` BIGINT,
  `lat` TEXT,
  `lng` TEXT,
  `cable_path` TEXT,
  `connection_type` TEXT,
  `static_ip` TEXT,
  `mac_address` TEXT,
  `hotspot_username` TEXT,
  `hotspot_password` TEXT,
  `hotspot_profile` TEXT,
  `pppoe_password` TEXT,
  `pppoe_remote_address` TEXT,
  `wifi_ssid` TEXT,
  `collector_id` BIGINT,
  `promo_cycles_used` BIGINT DEFAULT 0,
  `balance` BIGINT NOT NULL DEFAULT 0,
  `is_radius` BIGINT DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `digiflazz_products` (
  `sku` VARCHAR(191) NOT NULL,
  `product_name` TEXT NOT NULL,
  `category` VARCHAR(191) DEFAULT '',
  `brand` VARCHAR(191) DEFAULT '',
  `price_modal` BIGINT NOT NULL DEFAULT 0,
  `price_sell` BIGINT NOT NULL DEFAULT 0,
  `status` BIGINT NOT NULL DEFAULT 1,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`sku`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `digiflazz_staff_transactions` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `role` VARCHAR(191) NOT NULL DEFAULT 'admin',
  `actor_phone` TEXT,
  `actor_name` TEXT,
  `sku` TEXT NOT NULL,
  `target` TEXT NOT NULL,
  `ref_id` VARCHAR(191) NOT NULL,
  `trx_id` TEXT,
  `sn` VARCHAR(255) DEFAULT '',
  `status` VARCHAR(255) DEFAULT '',
  `message` TEXT,
  `price` BIGINT NOT NULL DEFAULT 0,
  `sell_price` BIGINT NOT NULL DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `digiflazz_sync_logs` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `total` BIGINT NOT NULL DEFAULT 0,
  `inserted` BIGINT NOT NULL DEFAULT 0,
  `updated` BIGINT NOT NULL DEFAULT 0,
  `active` BIGINT NOT NULL DEFAULT 0,
  `inactive` BIGINT NOT NULL DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `digiflazz_webhook_logs` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `ref_id` VARCHAR(191) DEFAULT '',
  `status` VARCHAR(255) DEFAULT '',
  `signature` TEXT,
  `signature_ok` BIGINT NOT NULL DEFAULT 0,
  `matched_agent_tx_id` BIGINT,
  `ip` VARCHAR(255) DEFAULT '',
  `payload` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `expense_categories` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(191) NOT NULL,
  `parent_id` BIGINT,
  `description` TEXT,
  `icon` TEXT,
  `color` TEXT,
  `is_active` BIGINT DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `expenses` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `date` DATETIME NOT NULL,
  `category` VARCHAR(255) NOT NULL,
  `subcategory` TEXT,
  `amount` BIGINT NOT NULL,
  `description` TEXT NOT NULL,
  `vendor` TEXT,
  `receipt_number` TEXT,
  `payment_method` TEXT,
  `recorded_by_role` TEXT,
  `recorded_by_name` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `genieacs_servers` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `url` TEXT NOT NULL,
  `cwmp_url` TEXT,
  `username` VARCHAR(255),
  `password` VARCHAR(255),
  `location` TEXT,
  `status` VARCHAR(255) DEFAULT 'active',
  `device_count` BIGINT DEFAULT 0,
  `last_sync` DATETIME,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `inventory_categories` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(191) NOT NULL,
  `description` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `inventory_items` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `category_id` BIGINT,
  `name` VARCHAR(255) NOT NULL,
  `brand` VARCHAR(255) DEFAULT '',
  `model` VARCHAR(255) DEFAULT '',
  `unit` TEXT,
  `min_stock` BIGINT DEFAULT 5,
  `description` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `inventory_logs` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `item_id` BIGINT,
  `stock_id` BIGINT,
  `type` VARCHAR(255) NOT NULL,
  `quantity` BIGINT NOT NULL DEFAULT 0,
  `actor` TEXT,
  `note` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `inventory_stock` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `item_id` BIGINT NOT NULL,
  `serial_number` VARCHAR(191),
  `quantity` BIGINT NOT NULL DEFAULT 0,
  `condition` TEXT,
  `location` TEXT,
  `status` VARCHAR(255) DEFAULT 'available',
  `assigned_to_customer_id` BIGINT,
  `note` TEXT,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `invoices` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `customer_id` BIGINT NOT NULL,
  `period_month` BIGINT NOT NULL,
  `period_year` BIGINT NOT NULL,
  `amount` BIGINT NOT NULL DEFAULT 0,
  `status` VARCHAR(255) DEFAULT 'unpaid',
  `paid_at` DATETIME,
  `paid_by_name` TEXT,
  `notes` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `payment_gateway` TEXT,
  `payment_order_id` TEXT,
  `payment_link` TEXT,
  `payment_reference` TEXT,
  `payment_payload` TEXT,
  `payment_expires_at` DATETIME,
  `qris_unique_code` BIGINT,
  `qris_amount_unique` BIGINT,
  `qris_assigned_at` DATETIME,
  `qris_paid_notif_id` BIGINT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `odps` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `olt_id` BIGINT,
  `pon_port` TEXT,
  `port_capacity` BIGINT NOT NULL DEFAULT 16,
  `lat` TEXT,
  `lng` TEXT,
  `description` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `olts` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `host` VARCHAR(255) NOT NULL,
  `snmp_community` TEXT,
  `snmp_port` BIGINT DEFAULT 161,
  `brand` VARCHAR(255) DEFAULT 'zte',
  `description` TEXT,
  `is_active` BIGINT DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `web_user` TEXT,
  `web_password` TEXT,
  `api_base_url` TEXT,
  `telnet_port` BIGINT DEFAULT 23,
  `enable_password` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `packages` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `price` BIGINT NOT NULL DEFAULT 0,
  `speed_down` BIGINT DEFAULT 0,
  `speed_up` BIGINT DEFAULT 0,
  `description` TEXT,
  `billing_type` TEXT,
  `duration_days` BIGINT DEFAULT 30,
  `is_active` BIGINT DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `use_ppn` BIGINT DEFAULT 0,
  `ppn_percentage` DOUBLE DEFAULT 11.0,
  `use_uso` BIGINT DEFAULT 0,
  `uso_percentage` DOUBLE DEFAULT 1.75,
  `night_speed_down` BIGINT DEFAULT 0,
  `night_speed_up` BIGINT DEFAULT 0,
  `fup_limit_gb` BIGINT DEFAULT 0,
  `fup_speed_down` BIGINT DEFAULT 0,
  `use_night_speed` BIGINT DEFAULT 0,
  `night_profile_name` TEXT,
  `use_fup` BIGINT DEFAULT 0,
  `fup_profile_name` TEXT,
  `promo_price` BIGINT,
  `promo_cycles` BIGINT DEFAULT 0,
  `prorate_first_invoice` BIGINT DEFAULT 0,
  `router_id` BIGINT,
  `speed_down_upto` BIGINT DEFAULT 0,
  `speed_up_upto` BIGINT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `payroll_settings` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `employee_type` VARCHAR(191) NOT NULL,
  `employee_id` BIGINT NOT NULL,
  `base_salary` BIGINT DEFAULT 0,
  `transport_allowance` BIGINT DEFAULT 0,
  `meal_allowance` BIGINT DEFAULT 0,
  `phone_allowance` BIGINT DEFAULT 0,
  `other_allowance` BIGINT DEFAULT 0,
  `other_allowance_note` TEXT,
  `absence_deduction_per_day` BIGINT DEFAULT 0,
  `bonus_per_ticket` BIGINT DEFAULT 0,
  `commission_percentage` DOUBLE DEFAULT 0,
  `working_days_per_month` BIGINT DEFAULT 26,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `payroll_slips` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `employee_type` VARCHAR(191) NOT NULL,
  `employee_id` BIGINT NOT NULL,
  `employee_name` TEXT NOT NULL,
  `period_month` BIGINT NOT NULL,
  `period_year` BIGINT NOT NULL,
  `base_salary` BIGINT DEFAULT 0,
  `transport_allowance` BIGINT DEFAULT 0,
  `meal_allowance` BIGINT DEFAULT 0,
  `phone_allowance` BIGINT DEFAULT 0,
  `other_allowance` BIGINT DEFAULT 0,
  `other_allowance_note` TEXT,
  `working_days` BIGINT DEFAULT 0,
  `absent_days` BIGINT DEFAULT 0,
  `late_days` BIGINT DEFAULT 0,
  `overtime_hours` DOUBLE DEFAULT 0,
  `total_tickets_resolved` BIGINT DEFAULT 0,
  `total_collection_amount` BIGINT DEFAULT 0,
  `ticket_bonus` BIGINT DEFAULT 0,
  `collection_commission` BIGINT DEFAULT 0,
  `overtime_bonus` BIGINT DEFAULT 0,
  `absence_deduction` BIGINT DEFAULT 0,
  `late_deduction` BIGINT DEFAULT 0,
  `other_deduction` BIGINT DEFAULT 0,
  `other_deduction_note` TEXT,
  `gross_salary` BIGINT DEFAULT 0,
  `total_deductions` BIGINT DEFAULT 0,
  `net_salary` BIGINT DEFAULT 0,
  `status` VARCHAR(191) DEFAULT 'draft',
  `approved_at` DATETIME,
  `paid_at` DATETIME,
  `notes` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `promo_slides` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) DEFAULT '',
  `description` TEXT,
  `image_path` TEXT NOT NULL,
  `url` TEXT,
  `open_in_new_tab` BIGINT DEFAULT 0,
  `sort_order` BIGINT DEFAULT 0,
  `is_active` BIGINT DEFAULT 1,
  `start_date` DATETIME,
  `end_date` DATETIME,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `public_donation_orders` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `donor_name` TEXT,
  `donor_phone` TEXT NOT NULL,
  `amount` BIGINT NOT NULL DEFAULT 0,
  `qris_amount_unique` BIGINT,
  `qris_unique_code` BIGINT,
  `notes` TEXT,
  `status` VARCHAR(191) DEFAULT 'pending',
  `paid_at` DATETIME,
  `qris_paid_notif_id` BIGINT,
  `activation_code` TEXT,
  `wa_sent` BIGINT DEFAULT 0,
  `wa_sent_at` DATETIME,
  `wa_error` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `public_ppob_orders` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `customer_id` BIGINT,
  `buyer_phone` TEXT NOT NULL,
  `sku` TEXT NOT NULL,
  `product_name` TEXT,
  `target` TEXT NOT NULL,
  `price` BIGINT NOT NULL DEFAULT 0,
  `payment_gateway` TEXT,
  `payment_order_id` TEXT,
  `payment_link` TEXT,
  `payment_reference` TEXT,
  `payment_payload` TEXT,
  `payment_expires_at` DATETIME,
  `status` VARCHAR(255) DEFAULT 'pending',
  `paid_at` DATETIME,
  `fulfilled_at` DATETIME,
  `digi_ref_id` VARCHAR(191) DEFAULT '',
  `digi_trx_id` TEXT,
  `digi_sn` TEXT,
  `digi_message` TEXT,
  `wa_sent` BIGINT DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `public_voucher_orders` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `router_id` BIGINT,
  `profile_name` TEXT NOT NULL,
  `validity` TEXT,
  `price` BIGINT NOT NULL DEFAULT 0,
  `buyer_phone` TEXT NOT NULL,
  `status` VARCHAR(191) DEFAULT 'pending',
  `paid_at` DATETIME,
  `fulfilled_at` DATETIME,
  `voucher_code` TEXT,
  `voucher_password` TEXT,
  `voucher_comment` TEXT,
  `wa_sent` BIGINT NOT NULL DEFAULT 0,
  `wa_sent_at` DATETIME,
  `wa_error` TEXT,
  `payment_gateway` TEXT,
  `payment_order_id` TEXT,
  `payment_link` TEXT,
  `payment_reference` TEXT,
  `payment_payload` TEXT,
  `payment_expires_at` DATETIME,
  `payment_method` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `qris_unique_code` BIGINT,
  `qris_amount_unique` BIGINT,
  `qris_assigned_at` DATETIME,
  `qris_paid_notif_id` BIGINT,
  `proof_url` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `radius_accounting` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(191) NOT NULL,
  `nas_ip` TEXT,
  `framed_ip` TEXT,
  `session_id` VARCHAR(191) NOT NULL,
  `status_type` BIGINT DEFAULT 1,
  `input_octets` BIGINT DEFAULT 0,
  `output_octets` BIGINT DEFAULT 0,
  `input_gigawords` BIGINT DEFAULT 0,
  `output_gigawords` BIGINT DEFAULT 0,
  `session_time` BIGINT DEFAULT 0,
  `terminate_cause` BIGINT DEFAULT 0,
  `calling_station_id` TEXT,
  `called_station_id` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `radius_nas` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `nasname` VARCHAR(191) NOT NULL,
  `shortname` TEXT,
  `secret` TEXT NOT NULL,
  `description` TEXT,
  `is_active` BIGINT DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `routers` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `host` VARCHAR(255) NOT NULL,
  `port` BIGINT DEFAULT 8728,
  `user` TEXT NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `is_active` BIGINT DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `technicians` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(191) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(255) DEFAULT '',
  `area` TEXT,
  `is_active` BIGINT DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `tickets` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `customer_id` BIGINT NOT NULL,
  `subject` TEXT NOT NULL,
  `message` TEXT NOT NULL,
  `status` VARCHAR(255) DEFAULT 'open',
  `technician_id` BIGINT,
  `technician_notes` TEXT,
  `photos` TEXT,
  `photo_metadata` TEXT,
  `customer_photos` TEXT,
  `customer_photo_metadata` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `voucher_batches` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `router_id` BIGINT,
  `profile_name` TEXT NOT NULL,
  `qty_total` BIGINT NOT NULL DEFAULT 0,
  `qty_created` BIGINT NOT NULL DEFAULT 0,
  `qty_failed` BIGINT NOT NULL DEFAULT 0,
  `price` BIGINT NOT NULL DEFAULT 0,
  `validity` TEXT,
  `prefix` TEXT,
  `code_length` BIGINT NOT NULL DEFAULT 4,
  `status` VARCHAR(255) DEFAULT 'creating',
  `created_by` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `mode` TEXT,
  `charset` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `voucher_packages` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `router_id` BIGINT,
  `profile_name` VARCHAR(191) NOT NULL,
  `price` BIGINT NOT NULL DEFAULT 0,
  `validity` TEXT,
  `prefix` TEXT,
  `code_length` BIGINT NOT NULL DEFAULT 6,
  `charset` TEXT,
  `is_active` BIGINT DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `vouchers` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `batch_id` BIGINT NOT NULL,
  `router_id` BIGINT,
  `code` VARCHAR(191) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `profile_name` TEXT NOT NULL,
  `comment` TEXT,
  `status` VARCHAR(255) DEFAULT 'pending',
  `used_at` DATETIME,
  `last_seen_comment` TEXT,
  `last_seen_uptime` TEXT,
  `last_seen_at` DATETIME,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `wa_chat_messages` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `direction` TEXT NOT NULL,
  `gateway` TEXT NOT NULL,
  `sender_phone` VARCHAR(191),
  `recipient_phone` VARCHAR(191),
  `customer_id` BIGINT,
  `customer_name` TEXT,
  `message_text` TEXT NOT NULL,
  `status` VARCHAR(255) DEFAULT 'sent',
  `meta_message_id` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `webhook_payment_notifs` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `service` VARCHAR(191) DEFAULT '',
  `content` TEXT NOT NULL,
  `parsed_amount` BIGINT,
  `parsed_ok` BIGINT NOT NULL DEFAULT 0,
  `matched_invoice_id` BIGINT,
  `matched_voucher_order_id` BIGINT,
  `ip` VARCHAR(255) DEFAULT '',
  `user_agent` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `matched_topup_request_id` BIGINT,
  `matched_donation_order_id` BIGINT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_acs_devices_1` ON `acs_devices` (`last_inform`);

CREATE INDEX `idx_acs_devices_2` ON `acs_devices` (`serial_number`);

CREATE INDEX `idx_acs_tasks_1` ON `acs_tasks` (`status`);

CREATE INDEX `idx_acs_tasks_2` ON `acs_tasks` (`device_id`);

CREATE INDEX `idx_agent_hotspot_prices_1` ON `agent_hotspot_prices` (`router_id`, `profile_name`);

CREATE INDEX `idx_agent_hotspot_prices_2` ON `agent_hotspot_prices` (`agent_id`);

CREATE UNIQUE INDEX `uq_agent_hotspot_prices_3` ON `agent_hotspot_prices` (`agent_id`, `router_id`, `profile_name`);

CREATE INDEX `idx_agent_transactions_1` ON `agent_transactions` (`type`);

CREATE INDEX `idx_agent_transactions_2` ON `agent_transactions` (`digi_ref_id`);

CREATE INDEX `idx_agent_transactions_3` ON `agent_transactions` (`created_at`);

CREATE INDEX `idx_agent_transactions_4` ON `agent_transactions` (`agent_id`);

CREATE INDEX `idx_agents_1` ON `agents` (`username`);

CREATE UNIQUE INDEX `uq_agents_2` ON `agents` (`username`);

CREATE UNIQUE INDEX `uq_areas_1` ON `areas` (`name`);

CREATE INDEX `idx_attendance_1` ON `attendance` (`status`);

CREATE INDEX `idx_attendance_2` ON `attendance` (`employee_type`, `employee_id`);

CREATE INDEX `idx_audit_trail_1` ON `audit_trail` (`created_at`);

CREATE INDEX `idx_audit_trail_2` ON `audit_trail` (`action`);

CREATE INDEX `idx_audit_trail_3` ON `audit_trail` (`entity_type`, `entity_id`);

CREATE INDEX `idx_audit_trail_4` ON `audit_trail` (`actor_type`, `actor_id`);

CREATE UNIQUE INDEX `uq_cashiers_1` ON `cashiers` (`username`);

CREATE INDEX `idx_collector_payment_requests_1` ON `collector_payment_requests` (`created_at`);

CREATE INDEX `idx_collector_payment_requests_2` ON `collector_payment_requests` (`collector_id`);

CREATE INDEX `idx_collector_payment_requests_3` ON `collector_payment_requests` (`invoice_id`);

CREATE INDEX `idx_collector_payment_requests_4` ON `collector_payment_requests` (`status`);

CREATE INDEX `idx_collectors_1` ON `collectors` (`username`);

CREATE UNIQUE INDEX `uq_collectors_2` ON `collectors` (`username`);

CREATE INDEX `idx_customer_usage_1` ON `customer_usage` (`period_month`, `period_year`);

CREATE INDEX `idx_customer_usage_2` ON `customer_usage` (`customer_id`);

CREATE UNIQUE INDEX `uq_customer_usage_3` ON `customer_usage` (`customer_id`, `period_month`, `period_year`);

CREATE INDEX `idx_digiflazz_products_1` ON `digiflazz_products` (`status`);

CREATE INDEX `idx_digiflazz_products_2` ON `digiflazz_products` (`brand`);

CREATE INDEX `idx_digiflazz_products_3` ON `digiflazz_products` (`category`);

CREATE INDEX `idx_digiflazz_staff_transactions_1` ON `digiflazz_staff_transactions` (`ref_id`);

CREATE INDEX `idx_digiflazz_staff_transactions_2` ON `digiflazz_staff_transactions` (`role`);

CREATE INDEX `idx_digiflazz_staff_transactions_3` ON `digiflazz_staff_transactions` (`created_at`);

CREATE UNIQUE INDEX `uq_digiflazz_staff_transactions_4` ON `digiflazz_staff_transactions` (`ref_id`);

CREATE INDEX `idx_digiflazz_sync_logs_1` ON `digiflazz_sync_logs` (`created_at`);

CREATE INDEX `idx_digiflazz_webhook_logs_1` ON `digiflazz_webhook_logs` (`ref_id`);

CREATE INDEX `idx_digiflazz_webhook_logs_2` ON `digiflazz_webhook_logs` (`created_at`);

CREATE UNIQUE INDEX `uq_expense_categories_1` ON `expense_categories` (`name`);

CREATE UNIQUE INDEX `uq_inventory_categories_1` ON `inventory_categories` (`name`);

CREATE INDEX `idx_inventory_items_1` ON `inventory_items` (`category_id`);

CREATE INDEX `idx_inventory_logs_1` ON `inventory_logs` (`created_at`);

CREATE INDEX `idx_inventory_logs_2` ON `inventory_logs` (`item_id`);

CREATE INDEX `idx_inventory_stock_1` ON `inventory_stock` (`serial_number`);

CREATE INDEX `idx_inventory_stock_2` ON `inventory_stock` (`item_id`);

CREATE UNIQUE INDEX `uq_inventory_stock_3` ON `inventory_stock` (`serial_number`);

CREATE INDEX `idx_payroll_settings_1` ON `payroll_settings` (`employee_type`, `employee_id`);

CREATE UNIQUE INDEX `uq_payroll_settings_2` ON `payroll_settings` (`employee_type`, `employee_id`);

CREATE INDEX `idx_payroll_slips_1` ON `payroll_slips` (`status`);

CREATE INDEX `idx_payroll_slips_2` ON `payroll_slips` (`period_month`, `period_year`);

CREATE INDEX `idx_payroll_slips_3` ON `payroll_slips` (`employee_type`, `employee_id`);

CREATE UNIQUE INDEX `uq_payroll_slips_4` ON `payroll_slips` (`employee_type`, `employee_id`, `period_month`, `period_year`);

CREATE INDEX `idx_public_donation_orders_1` ON `public_donation_orders` (`qris_amount_unique`, `status`);

CREATE INDEX `idx_public_donation_orders_2` ON `public_donation_orders` (`status`);

CREATE INDEX `idx_public_ppob_orders_1` ON `public_ppob_orders` (`digi_ref_id`);

CREATE INDEX `idx_public_voucher_orders_1` ON `public_voucher_orders` (`created_at`);

CREATE INDEX `idx_public_voucher_orders_2` ON `public_voucher_orders` (`status`);

CREATE INDEX `idx_radius_accounting_1` ON `radius_accounting` (`status_type`);

CREATE INDEX `idx_radius_accounting_2` ON `radius_accounting` (`session_id`);

CREATE INDEX `idx_radius_accounting_3` ON `radius_accounting` (`username`);

CREATE UNIQUE INDEX `uq_radius_nas_1` ON `radius_nas` (`nasname`);

CREATE UNIQUE INDEX `uq_technicians_1` ON `technicians` (`username`);

CREATE INDEX `idx_voucher_batches_1` ON `voucher_batches` (`router_id`);

CREATE UNIQUE INDEX `uq_voucher_packages_1` ON `voucher_packages` (`router_id`, `profile_name`);

CREATE INDEX `idx_vouchers_1` ON `vouchers` (`code`);

CREATE INDEX `idx_vouchers_2` ON `vouchers` (`batch_id`);

CREATE UNIQUE INDEX `uq_vouchers_3` ON `vouchers` (`router_id`, `code`);

CREATE INDEX `idx_wa_chat_messages_1` ON `wa_chat_messages` (`created_at`);

CREATE INDEX `idx_wa_chat_messages_2` ON `wa_chat_messages` (`sender_phone`, `recipient_phone`);

CREATE INDEX `idx_webhook_payment_notifs_1` ON `webhook_payment_notifs` (`service`);

CREATE INDEX `idx_webhook_payment_notifs_2` ON `webhook_payment_notifs` (`created_at`);

SET FOREIGN_KEY_CHECKS=1;
