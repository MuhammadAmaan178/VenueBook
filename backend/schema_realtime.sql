-- VenueBook Real-time System Tables
-- Tables for logging, notifications, and reviews

SET FOREIGN_KEY_CHECKS = 0;

-- ================================
-- DROP TABLES (in reverse FK order)
-- ================================
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS conversations;
DROP TABLE IF EXISTS booking_customer_details;
DROP TABLE IF EXISTS booking_facilities;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS logs;
DROP TABLE IF EXISTS venue_payment_info;
DROP TABLE IF EXISTS venue_reviews;
DROP TABLE IF EXISTS booking_reviews;
DROP TABLE IF EXISTS booking_payments;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS venue_availability;
DROP TABLE IF EXISTS venue_facility_map;
DROP TABLE IF EXISTS venue_facilities;
DROP TABLE IF EXISTS venue_images;
DROP TABLE IF EXISTS venues;
DROP TABLE IF EXISTS owners;
DROP TABLE IF EXISTS users;

-- ================================
-- 1. USERS
-- ================================
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role ENUM('user','owner','admin','bot') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================
-- 2. OWNERS
-- ================================
CREATE TABLE owners (
    owner_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    business_name VARCHAR(200),
    cnic VARCHAR(50),
    verification_status ENUM('pending','verified','rejected') DEFAULT 'pending',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- ================================
-- 3. VENUES
-- ================================
CREATE TABLE venues (
    venue_id INT AUTO_INCREMENT PRIMARY KEY,
    owner_id INT NOT NULL,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50),
    address VARCHAR(500),
    city VARCHAR(100),
    capacity INT,
    base_price DECIMAL(12,2),
    rating DECIMAL(3,2),
    description TEXT,
    status ENUM('active', 'inactive', 'pending', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES owners(owner_id)
);

-- ================================
-- 4. CONVERSATIONS (FIXED)
-- ================================
CREATE TABLE conversations (
    conversation_id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NULL,
    owner_id INT NULL,
    admin_id INT NULL,
    venue_id INT NULL,

    conversation_type ENUM(
        'customer_owner',
        'customer_admin',
        'owner_admin',
        'with_bot'
    ) DEFAULT 'customer_owner',

    title VARCHAR(255) NULL,
    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,

    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (owner_id) REFERENCES owners(owner_id),
    FOREIGN KEY (admin_id) REFERENCES users(user_id),
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id),

    CONSTRAINT chk_conversation_type CHECK (
        (conversation_type = 'customer_owner'
            AND user_id IS NOT NULL
            AND owner_id IS NOT NULL
            AND admin_id IS NULL)

        OR
        (conversation_type = 'customer_admin'
            AND user_id IS NOT NULL
            AND owner_id IS NULL
            AND admin_id IS NOT NULL)

        OR
        (conversation_type = 'owner_admin'
            AND user_id IS NULL
            AND owner_id IS NOT NULL
            AND admin_id IS NOT NULL)

        OR
        (conversation_type = 'with_bot'
            AND user_id IS NOT NULL
            AND owner_id IS NULL
            AND admin_id IS NULL)
    ),

    UNIQUE KEY unique_customer_owner_venue (user_id, owner_id, venue_id),
    UNIQUE KEY unique_customer_admin (user_id, admin_id),
    UNIQUE KEY unique_owner_admin (owner_id, admin_id)
);

-- ================================
-- 5. MESSAGES (message_type REMOVED)
-- ================================
CREATE TABLE messages (
    message_id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    sender_id INT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (conversation_id)
        REFERENCES conversations(conversation_id)
        ON DELETE CASCADE,

    FOREIGN KEY (sender_id)
        REFERENCES users(user_id),

    INDEX idx_conversation_created (conversation_id, created_at),
    INDEX idx_sender (sender_id),
    INDEX idx_is_read (is_read),
    INDEX idx_conversation_unread (conversation_id, is_read)
);

-- ================================
-- 6. VENUE_PAYMENT_INFO
-- ================================
CREATE TABLE venue_payment_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    venue_id INT NOT NULL,
    account_holder_name VARCHAR(150),
    account_number VARCHAR(100),
    contact_number VARCHAR(50),
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id)
);

-- ================================
-- 7. VENUE IMAGES
-- ================================
CREATE TABLE venue_images (
    image_id INT AUTO_INCREMENT PRIMARY KEY,
    venue_id INT NOT NULL,
    image_url VARCHAR(1000),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id)
);

-- ================================
-- 8. FACILITIES
-- ================================
CREATE TABLE venue_facilities (
    facility_id INT AUTO_INCREMENT PRIMARY KEY,
    facility_name VARCHAR(100),
    extra_price DECIMAL(10,2) DEFAULT 0
);

CREATE TABLE venue_facility_map (
    map_id INT AUTO_INCREMENT PRIMARY KEY,
    venue_id INT NOT NULL,
    facility_id INT NOT NULL,
    availability ENUM('yes','no') DEFAULT 'yes',
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id),
    FOREIGN KEY (facility_id) REFERENCES venue_facilities(facility_id)
);

-- ================================
-- 9. AVAILABILITY
-- ================================
CREATE TABLE venue_availability (
    availability_id INT AUTO_INCREMENT PRIMARY KEY,
    venue_id INT NOT NULL,
    date DATE NOT NULL,
    slot ENUM('full-day','morning','evening'),
    is_available TINYINT DEFAULT 1,
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id)
);

-- ================================
-- 10. BOOKINGS
-- ================================
CREATE TABLE bookings (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    venue_id INT NOT NULL,
    event_date DATE NOT NULL,
    slot ENUM('full-day','morning','evening'),
    event_type VARCHAR(100),
    special_requirements TEXT,
    total_price DECIMAL(12,2),
    status ENUM('pending','confirmed','rejected','completed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id)
);

-- ================================
-- 11. BOOKING CUSTOMER DETAILS
-- ================================
CREATE TABLE booking_customer_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    fullname VARCHAR(150),
    email VARCHAR(255),
    phone_primary VARCHAR(50),
    phone_secondary VARCHAR(50) NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id)
);

-- ================================
-- 12. BOOKING FACILITIES
-- ================================
CREATE TABLE booking_facilities (
    booking_facility_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    facility_id INT NOT NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id),
    FOREIGN KEY (facility_id) REFERENCES venue_facilities(facility_id)
);

-- ================================
-- 13. BOOKING PAYMENTS
-- ================================
CREATE TABLE booking_payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    amount DECIMAL(12,2),
    method ENUM('bank-transfer','cash'),
    trx_id VARCHAR(255) NULL,
    payment_status ENUM('pending','completed','failed'),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id)
);

-- ================================
-- 14. VENUE REVIEWS (RENAMED)
-- ================================
CREATE TABLE venue_reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    venue_id INT NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id)
);

-- ================================
-- 15. NOTIFICATIONS
-- ================================
CREATE TABLE notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('booking','system','verification') DEFAULT 'system',
    booking_id INT NULL,
    venue_id INT NULL,
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id),
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id)
);

-- ================================
-- 16. GENERAL LOG TABLE
-- ================================
CREATE TABLE logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    action_by INT NULL,                  -- FK to users
    action_type VARCHAR(100),
    target_table VARCHAR(50),
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (action_by) REFERENCES users(user_id)
);

SET FOREIGN_KEY_CHECKS = 1;
