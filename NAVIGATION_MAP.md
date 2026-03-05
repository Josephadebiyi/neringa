# 🗺️ Baggo Web App - Navigation Map

## Complete Site Structure

```
                                    ┌─────────────┐
                                    │  HOME PAGE  │
                                    └──────┬──────┘
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    │                      │                      │
                    ▼                      ▼                      ▼
            ┌──────────────┐       ┌──────────────┐      ┌──────────────┐
            │ SEARCH PAGE  │       │  POST TRIP   │      │ SEND PACKAGE │
            │              │       │              │      │              │
            │ • Filter     │       │ • Route      │      │ • Package    │
            │ • Trip cards │       │ • Dates      │      │ • Route      │
            │ • Book       │       │ • Transport  │      │ • Deadline   │
            └──────┬───────┘       │ • Capacity   │      └──────┬───────┘
                   │               └──────┬───────┘             │
                   │                      │                     │
                   │                      ▼                     │
                   │               ┌──────────────┐             │
                   └──────────────►│  DASHBOARD   │◄────────────┘
                                   │              │
                                   │ • KYC Status │
                                   │ • Quick Acts │
                                   │ • Activity   │
                                   └──────┬───────┘
                                          │
                                          ▼
                                   ┌──────────────┐
                                   │ LOGIN/SIGNUP │
                                   └──────────────┘
```

---

## All Clickable Paths

### From HOME PAGE (/)

#### Navbar
```
[Carpool] ──────────► /search?mode=carpool
[Bus] ───────────────► /search?mode=bus
[Search Icon] ───────► /search
[Offer a ride] ──────► /post-trip
[Profile Icon] ──────► /dashboard
```

#### Hero Section
```
[Search Button] ─────► /search?origin=X&destination=Y
                       (or /search if empty)
```

#### Content Sections
```
[By bus card] ───────► /search?mode=bus
[By carpool card] ───► /search?mode=car
[Share your ride] ───► /post-trip
[Get going] ─────────► /search
```

---

### From DASHBOARD (/dashboard)

```
[Post a Trip card] ──► /post-trip
[Send Package card] ─► /send-package
[Back to Home] ──────► /
```

---

### From SEARCH PAGE (/search)

```
[Back Button] ───────► Previous page (browser history)
[Trip Card] ─────────► /trip/:id (future feature)
[Post Your Trip] ────► /post-trip (when no results)
```

---

### From POST TRIP (/post-trip)

```
[Back Button] ───────► Previous page
[Submit Form] ───────► /dashboard (on success)
[Not Verified] ──────► /dashboard (redirect to verify)
```

---

### From SEND PACKAGE (/send-package)

```
[Back Button] ───────► Previous page
[Find Travelers] ────► /search?origin=X&destination=Y
[Not Verified] ──────► /dashboard (redirect to verify)
```

---

## URL Parameters

### Search Page (`/search`)

| Parameter | Description | Example |
|-----------|-------------|---------|
| `origin` | Departure city | `?origin=New York` |
| `destination` | Arrival city | `?destination=London` |
| `mode` | Transport mode | `?mode=bus` or `?mode=carpool` |

**Example URLs:**
- `/search` - Show all trips
- `/search?origin=Paris&destination=Berlin` - Filtered search
- `/search?mode=bus` - Only bus trips
- `/search?mode=car` - Only carpools

---

## Page Access Requirements

### Public (No Auth Required)
- ✅ Home `/`
- ✅ Login `/login`
- ✅ Signup `/signup`
- ✅ Search `/search` (view only)

### Auth Required
- 🔒 Dashboard `/dashboard`

### Auth + KYC Required
- 🔒🛡️ Post Trip `/post-trip`
- 🔒🛡️ Send Package `/send-package`

---

## User Flow Examples

### Flow 1: Browse Trips (No Login)
```
1. Land on Home Page
2. Enter "New York" → "London" in search
3. Click "Search" button
4. View trip results on Search page
5. Click trip card → Redirected to Login (future)
```

### Flow 2: Post a Trip
```
1. Home Page
2. Click "Offer a ride" in navbar
3. → PostTrip page
4. ✋ Check: Is logged in? If no → Login
5. ✋ Check: Is KYC verified? If no → Dashboard warning
6. Fill form (route, dates, transport, capacity)
7. Click "Post Trip"
8. ✅ Success message
9. → Redirect to Dashboard
```

### Flow 3: Request Package Delivery
```
1. Home Page
2. Dashboard → Click "Send Package" card
3. → SendPackage page
4. ✋ Check: Is logged in? If no → Login
5. ✋ Check: Is KYC verified? If no → Dashboard warning
6. Fill form (package details, route, deadline)
7. Click "Find Travelers"
8. → Search page with pre-filled origin/destination
9. View matching travelers
10. Click trip → Book (future)
```

### Flow 4: Search from Home
```
1. Home Page hero section
2. Type "Paris" in "Leaving from"
3. Type "Berlin" in "Going to"
4. Click "Search" button
5. → /search?origin=Paris&destination=Berlin
6. See filtered results
7. Adjust filters (date, price, transport)
8. Click "Apply Filters"
9. Updated results
```

---

## Mobile-Specific Navigation

### Bottom Nav (Mobile Only, < 768px)
```
[Home Icon] ─────────► /
[Search Icon] ───────► /search
[Plus Icon] ─────────► /post-trip or /send-package
[Messages Icon] ─────► /messages (future)
[Profile Icon] ──────► /dashboard
```

---

## Error Handling Routes

### Authentication Errors
```
Not logged in → Redirect to /login
After login → Return to intended page
```

### KYC Verification Errors
```
KYC not approved → Show warning on PostTrip/SendPackage
"Go to Dashboard" button → /dashboard
Complete verification → Can access posting features
```

### 404 Not Found
```
Invalid route → Show 404 page (future)
"Go Home" button → /
```

---

## Quick Reference

### To Search for Trips
- Home search bar
- Navbar search icon
- "By bus" or "By carpool" cards
- Dashboard → Send Package → Find Travelers

### To Post a Trip
- Navbar "Offer a ride"
- Home "Share your ride" button
- Dashboard "Post a Trip" card
- Search empty state button

### To Send a Package
- Dashboard "Send Package" card
- Then redirects to Search

### To Manage Account
- Navbar profile icon → Dashboard
- Dashboard shows KYC status
- Quick action cards for main tasks

---

## Navigation Best Practices

### Back Button Behavior
- All subpages have back button (top left)
- Uses `navigate(-1)` for browser history
- Preserves user's navigation path

### Breadcrumb Pattern (Future)
```
Home > Search > Trip Details > Booking
```

### Deep Linking Support
```
✅ /search?origin=Paris&destination=Berlin
✅ /trip/123
✅ /dashboard#kyc
```

---

**Built with ❤️ by Claude**
