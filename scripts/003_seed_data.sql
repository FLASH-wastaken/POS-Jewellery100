-- Insert sample products (luxury jewelry)
insert into public.products (sku, name, description, category, metal_type, purity, weight_grams, making_charges, stone_charges, price, stock_quantity, hallmark_number) values
  ('RNG-001', 'Eternal Diamond Ring', 'Elegant 18K gold ring with 0.5ct diamond', 'rings', 'gold', '18K', 4.50, 2500.00, 25000.00, 85000.00, 5, 'HM2024-RNG-001'),
  ('NCK-001', 'Royal Pearl Necklace', 'Stunning pearl necklace with gold chain', 'necklaces', 'gold', '22K', 25.00, 8500.00, 15000.00, 195000.00, 3, 'HM2024-NCK-001'),
  ('ERG-001', 'Classic Diamond Studs', 'Timeless diamond stud earrings', 'earrings', 'gold', '18K', 3.20, 1800.00, 18000.00, 65000.00, 8, 'HM2024-ERG-001'),
  ('BRC-001', 'Elegant Gold Bracelet', 'Delicate 22K gold bracelet with floral pattern', 'bracelets', 'gold', '22K', 15.50, 5500.00, 0.00, 98000.00, 4, 'HM2024-BRC-001'),
  ('PNG-001', 'Sapphire Pendant', 'Beautiful sapphire pendant with platinum chain', 'pendants', 'platinum', 'PT950', 6.00, 3500.00, 32000.00, 125000.00, 2, 'HM2024-PNG-001'),
  ('BNG-001', 'Traditional Gold Bangle', 'Classic design 22K gold bangle pair', 'bangles', 'gold', '22K', 45.00, 12000.00, 0.00, 285000.00, 6, 'HM2024-BNG-001'),
  ('CHN-001', 'Silver Chain Necklace', 'Modern silver chain with minimalist design', 'chains', 'silver', '925', 18.00, 1200.00, 0.00, 12500.00, 15, 'HM2024-CHN-001'),
  ('RNG-002', 'Emerald Gold Ring', 'Luxury emerald ring with intricate design', 'rings', 'gold', '18K', 5.80, 3200.00, 45000.00, 155000.00, 3, 'HM2024-RNG-002');

-- Insert sample customers
insert into public.customers (customer_code, full_name, email, phone, address, city, state, pincode, loyalty_points, total_purchases) values
  ('CUST-001', 'Rajesh Kumar', 'rajesh.kumar@email.com', '+91-9876543210', '123 MG Road', 'Mumbai', 'Maharashtra', '400001', 2500, 250000.00),
  ('CUST-002', 'Priya Sharma', 'priya.sharma@email.com', '+91-9876543211', '456 Park Street', 'Delhi', 'Delhi', '110001', 1800, 180000.00),
  ('CUST-003', 'Amit Patel', 'amit.patel@email.com', '+91-9876543212', '789 Brigade Road', 'Bangalore', 'Karnataka', '560001', 3200, 320000.00);
