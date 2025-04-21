CREATE TABLE `users`(
    `user_id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(255) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `firstname` VARCHAR(50) NOT NULL,
    `surname` VARCHAR(50) NOT NULL,
    `city` VARCHAR(255) NOT NULL,
    `postcode` INT NOT NULL,
    `address` VARCHAR(255) NOT NULL,
    `tel` VARCHAR(30) NOT NULL,
    `admin` BOOLEAN NOT NULL DEFAULT '0'
);
CREATE TABLE `products`(
    `product_id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `product_name` VARCHAR(100) NOT NULL,
    `category_id` INT UNSIGNED NOT NULL,
    `brand_id` INT UNSIGNED NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `is_in_stock` INT NOT NULL,
    `description` TEXT NOT NULL,
    `image` VARCHAR(100) NOT NULL
);
ALTER TABLE
    `products` ADD INDEX `products_category_id_index`(`category_id`);
ALTER TABLE
    `products` ADD INDEX `products_brand_id_index`(`brand_id`);
CREATE TABLE `cart`(
    `cart_id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NOT NULL
);
ALTER TABLE
    `cart` ADD INDEX `cart_user_id_index`(`user_id`);
CREATE TABLE `cart_items`(
    `cart_items_id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `cart_id` INT UNSIGNED NOT NULL,
    `product_id` INT UNSIGNED NOT NULL,
    `quantity` INT NOT NULL
);
ALTER TABLE
    `cart_items` ADD INDEX `cart_items_cart_id_index`(`cart_id`);
ALTER TABLE
    `cart_items` ADD INDEX `cart_items_product_id_index`(`product_id`);
CREATE TABLE `orders`(
    `order_id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NOT NULL,
    `order_date` TIMESTAMP NOT NULL,
    `total_amount` DECIMAL(10, 2) NOT NULL,
    `city` VARCHAR(255) NOT NULL,
    `address` VARCHAR(255) NOT NULL,
    `postcode` INT NOT NULL,
    `tel` VARCHAR(30) NOT NULL
);
ALTER TABLE
    `orders` ADD INDEX `orders_user_id_index`(`user_id`);
CREATE TABLE `order_items`(
    `order_item_id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `order_id` INT UNSIGNED NOT NULL,
    `product_id` INT UNSIGNED NOT NULL,
    `quantity` INT NOT NULL,
    `unit_price` DECIMAL(10, 2) NOT NULL
);
ALTER TABLE
    `order_items` ADD INDEX `order_items_order_id_index`(`order_id`);
ALTER TABLE
    `order_items` ADD INDEX `order_items_product_id_index`(`product_id`);
CREATE TABLE `category`(
    `category_id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `category` VARCHAR(255) NOT NULL,
    `image` VARCHAR(100) NOT NULL
);
CREATE TABLE `brands`(
    `brand_id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `brand` VARCHAR(50) NOT NULL
);
ALTER TABLE
    `orders` ADD CONSTRAINT `orders_user_id_foreign` FOREIGN KEY(`user_id`) REFERENCES `users`(`user_id`);
ALTER TABLE
    `cart` ADD CONSTRAINT `cart_user_id_foreign` FOREIGN KEY(`user_id`) REFERENCES `users`(`user_id`);
ALTER TABLE
    `order_items` ADD CONSTRAINT `order_items_product_id_foreign` FOREIGN KEY(`product_id`) REFERENCES `products`(`product_id`);
ALTER TABLE
    `cart_items` ADD CONSTRAINT `cart_items_product_id_foreign` FOREIGN KEY(`product_id`) REFERENCES `products`(`product_id`);
ALTER TABLE
    `cart_items` ADD CONSTRAINT `cart_items_cart_id_foreign` FOREIGN KEY(`cart_id`) REFERENCES `cart`(`cart_id`);
ALTER TABLE
    `order_items` ADD CONSTRAINT `order_items_order_id_foreign` FOREIGN KEY(`order_id`) REFERENCES `orders`(`order_id`);
ALTER TABLE
    `products` ADD CONSTRAINT `products_brand_id_foreign` FOREIGN KEY(`brand_id`) REFERENCES `brands`(`brand_id`);
ALTER TABLE
    `products` ADD CONSTRAINT `products_category_id_foreign` FOREIGN KEY(`category_id`) REFERENCES `category`(`category_id`);