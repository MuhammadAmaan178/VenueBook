# Quick Fix Guide - 3 Files Remaining

## File 1: PaymentsPage.jsx

**Line 2** - Add after the existing imports:
```javascript
import { ownerService, adminService } from '../../../services/api';
```

**Lines 12-20** - Replace these lines:
```javascript
// DELETE THESE LINES (12-20):
                const ownerId = user?.role === 'admin' ? null : (user?.user_id || user?.id || 1);
                const query = ownerId ? `?owner_id=${ownerId}` : '';
                const response = await fetch(`http://localhost:5000/api/payments${query}`);
                const data = await response.json();

                if (response.ok) {
                    setPayments(data.payments || []);
                }

// REPLACE WITH:
                const token = localStorage.getItem('token');
                
                if (!token || !user) {
                    console.error('No authentication token or user found');
                    setLoading(false);
                    return;
                }

                let data;
                if (user.role === 'admin') {
                    data = await adminService.getPayments({}, token);
                } else if (user.role === 'owner') {
                    const ownerId = user.owner_id || user.user_id;
                    data = await ownerService.getPayments(ownerId, {}, token);
                } else {
                    console.error('Invalid user role');
                    setLoading(false);
                    return;
                }

                setPayments(data.payments || []);
```

---

## File 2: ReviewsPage.jsx

**Line 2** - Add after the existing imports:
```javascript
import { ownerService } from '../../../services/api';
```

**Lines 12-20** - Replace these lines:
```javascript
// DELETE THESE LINES (12-20):
                const ownerId = user?.role === 'admin' ? null : (user?.user_id || user?.id || 1);
                const query = ownerId ? `?owner_id=${ownerId}` : '';
                const response = await fetch(`http://localhost:5000/api/reviews${query}`);
                const data = await response.json();

                if (response.ok) {
                    setReviews(data.reviews || []);
                }

// REPLACE WITH:
                const token = localStorage.getItem('token');
                
                if (!token || !user) {
                    console.error('No authentication token or user found');
                    setLoading(false);
                    return;
                }

                if (user.role === 'owner') {
                    const ownerId = user.owner_id || user.user_id;
                    const data = await ownerService.getReviews(ownerId, {}, token);
                    setReviews(data.reviews || []);
                } else {
                    console.error('Invalid user role for reviews');
                    setLoading(false);
                    return;
                }
```

---

## File 3: AnalyticsPage.jsx

**Line 2** - Add after the existing imports:
```javascript
import { ownerService } from '../../../services/api';
```

**Lines 12-20** - Replace these lines:
```javascript
// DELETE THESE LINES (12-20):
                const ownerId = user?.role === 'admin' ? null : (user?.user_id || user?.id || 1);
                const query = ownerId ? `?owner_id=${ownerId}` : '';
                const response = await fetch(`http://localhost:5000/api/analytics${query}`);
                const data = await response.json();

                if (response.ok) {
                    setAnalytics(data);
                }

// REPLACE WITH:
                const token = localStorage.getItem('token');
                
                if (!token || !user) {
                    console.error('No authentication token or user found');
                    setLoading(false);
                    return;
                }

                if (user.role === 'owner') {
                    const ownerId = user.owner_id || user.user_id;
                    const data = await ownerService.getAnalytics(ownerId, token);
                    setAnalytics(data);
                } else {
                    console.error('Invalid user role for analytics');
                    setLoading(false);
                    return;
                }
```

---

## ✅ After Making Changes

1. Save all files
2. Check for any syntax errors
3. Test the application:
   ```bash
   cd backend
   python app.py
   
   # In another terminal:
   cd frontend
   npm run dev
   ```

---

**That's it!** Just 3 files, 2 changes each (add import + replace fetch logic).
