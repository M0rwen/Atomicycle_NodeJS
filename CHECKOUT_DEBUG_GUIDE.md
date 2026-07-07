# Checkout Debugging Guide

## Issues Found and Potential Fixes

### 1. Hardcoded localhost URLs (FIXED)
**Status:** ✅ Already fixed in previous changes
- All JavaScript files now use dynamic `window.location.origin` instead of hardcoded `localhost:4000`

### 2. Authentication Flow
**Potential Issue:** The checkout requires a valid JWT token. If authentication fails, checkout will fail.

**Debug Steps:**
1. Open browser DevTools (F12) → Console
2. Try to checkout and watch for errors
3. Check if `sessionStorage.getItem('token')` returns a valid token
4. Check Network tab for the `/api/v1/create-order` request:
   - Status code (should be 201 for success)
   - Request payload (should include cart, user, delivery details)
   - Response (should show error details)

**Common Issues:**
- Token expired (tokens expire after 1 day)
- Invalid token format
- Missing Authorization header

### 3. Database Issues
**Potential Issue:** The order creation requires several database operations:
- Finding/creating Customer record
- Creating OrderInfo record  
- Creating OrderLine records
- Updating Stock records

**Debug Steps:**
1. Check backend console for SQL errors
2. Verify database tables exist:
   - `users` (with columns: id, name, email, password, role, token, deleted_at)
   - `customer` (with columns: id, fname, lname, addressline, zipcode, phone, user_id)
   - `item` (with columns: item_id, description, cost_price, sell_price, img_path, deleted_at)
   - `stock` (with columns: item_id, quantity)
   - `orderinfo` (with columns: orderinfo_id, customer_id, date_placed, date_shipped, shipping, payment_method, delivery_status, delivery_name, delivery_address, delivery_phone, notes)
   - `orderline` (with columns: orderline_id, orderinfo_id, item_id, quantity)

3. Verify user has a corresponding customer record

### 4. Environment Configuration
**Required .env variables:**
```
PORT=4000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=your_database_name
JWT_SECRET=your_secret_key
```

**Check:** Ensure `.env` file exists in `node-s-2026-master/` directory with correct values

### 5. Cart Data Structure
**Expected cart item structure:**
```javascript
{
  item_id: number,
  quantity: number,
  price: number,
  description: string,
  image: string
}
```

**Debug:** In browser console, run:
```javascript
JSON.parse(localStorage.getItem('cart_YOUR_USER_ID'))
```

### 6. Manual Testing Steps
1. **Test Authentication:**
   - Register a new user
   - Login and verify token is stored in sessionStorage
   - Check Network tab for login request response

2. **Test Cart:**
   - Add items to cart
   - Verify cart data in localStorage
   - Go to cart page and verify items display

3. **Test Checkout:**
   - Fill in delivery details
   - Select payment method
   - Click checkout
   - Monitor browser console and Network tab
   - Monitor backend console for errors

### 7. Common Error Messages and Solutions

**"Cart is empty"**
- Cart array is empty or not sent properly
- Check localStorage for cart data

**"Delivery and payment details are required"**
- Form fields not filled correctly
- Check deliveryName, deliveryPhone, deliveryAddress, paymentMethod values

**"Login first to access this resource"**
- Token missing or invalid
- Re-login to get fresh token

**"Transaction error"**
- Database operation failed
- Check backend console for SQL errors
- Verify database connection

**"Invalid or expired token"**
- Token expired (1 day validity)
- Re-login to get new token

### 8. Quick Fix Checklist
- [ ] Backend server running on port 4000
- [ ] Database connection working
- [ ] User logged in with valid token
- [ ] Cart has items with valid item_id
- [ ] Delivery form filled completely
- [ ] Payment method selected
- [ ] No CORS errors in browser console
- [ ] No SQL errors in backend console

### 9. Enable Debug Logging
To add more detailed logging, you can modify these files:

**Backend (node-s-2026-master/controllers/order.js):**
Add console.log statements at the start of createOrder function to log request data

**Frontend (itcp237-js-s-2026-master/js/cart.js):**
Add console.log statements before the AJAX call to log payload and token
