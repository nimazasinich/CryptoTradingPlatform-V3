# 🧪 Settings Page - Testing Guide

## Quick Test Checklist

Use this guide to verify all Settings functionality works correctly.

---

## 1️⃣ Profile Tab Testing

### Test Avatar Upload
1. Navigate to Settings → Profile
2. Hover over avatar circle
3. Click to upload
4. Select an image file (JPG, PNG)
5. ✅ **Expected**: Image appears immediately, saved to localStorage

### Test Profile Form
1. Edit Name field → Click "Save Changes"
2. ✅ **Expected**: Success toast, data persists after refresh
3. Try empty name → Save
4. ✅ **Expected**: Error toast "Name must be at least 2 characters"
5. Edit Email to invalid format → Save
6. ✅ **Expected**: Error toast about valid email

### Test Password Change
1. Enter current password
2. Enter new password (min 8 chars)
3. Confirm new password
4. Click "Update Password"
5. ✅ **Expected**: Success toast, password hash updated
6. Try mismatched passwords
7. ✅ **Expected**: Error toast "passwords do not match"

### Test 2FA Toggle
1. Click 2FA toggle switch
2. Save profile
3. Refresh page
4. ✅ **Expected**: Toggle state persists

---

## 2️⃣ API Keys Tab Testing

### Test HuggingFace Token
1. Navigate to Settings → API Keys
2. Enter token in primary field (e.g., "hf_test...")
3. Click "Save Token"
4. ✅ **Expected**: Success toast, preferences saved

### Test Custom API Key - Add
1. Click "+ Create New Key"
2. Enter name: "Test Key"
3. Enter key: "sk_1234567890abcdef"
4. Select provider: "Custom"
5. Click "Save API Key"
6. ✅ **Expected**: Key appears in list, masked as "sk_1...cdef"

### Test Custom API Key - Visibility
1. Click eye icon on any key
2. ✅ **Expected**: Full key revealed
3. Click again
4. ✅ **Expected**: Key masked again

### Test Custom API Key - Copy
1. Click copy icon on any key
2. ✅ **Expected**: Toast "copied to clipboard"
3. Paste somewhere (Ctrl+V)
4. ✅ **Expected**: Full key pasted

### Test Custom API Key - Test Connection
1. Click "Test" button on a key
2. ✅ **Expected**: 
   - Button shows "Testing..."
   - If HuggingFace token: Real API call made
   - Success or error toast appears

### Test Custom API Key - Delete
1. Click trash icon on any key
2. Confirm deletion
3. ✅ **Expected**: Key removed from list, localStorage updated

---

## 3️⃣ Exchange Connections Tab Testing

### Test Add Exchange Connection
1. Navigate to Settings → Exchanges
2. Select exchange: "Binance"
3. Enter API Key (try "1234567890abcdef..." - 64 chars for Binance)
4. Enter API Secret (any 10+ chars)
5. Click "Connect Exchange"
6. ✅ **Expected**: 
   - "Connecting..." loading state
   - Success toast
   - Exchange card appears with "Connected" badge

### Test Exchange Validation
1. Try to connect with short API key (< 10 chars)
2. ✅ **Expected**: Error toast about minimum length
3. Try Binance with non-64 char key
4. ✅ **Expected**: Error toast "Binance API keys are typically 64 characters"

### Test Disconnect Exchange
1. Click "Disconnect" on any connected exchange
2. ✅ **Expected**: Card removed, credentials deleted

---

## 4️⃣ Telegram Bot Tab Testing

### Test Telegram Configuration
1. Navigate to Settings → Telegram Bot
2. Enter Bot Token: "123456789:ABCdefGHIjklMNOpqrSTUvwxYZ"
3. Enter Chat ID: "@yourusername" or "123456789"
4. Select frequency: "Immediate"
5. Set confidence: 80%
6. Toggle all notification types ON
7. Click "Save Configuration"
8. ✅ **Expected**: Success toast, config saved

### Test Telegram - Real API Call
1. Get a real bot token from @BotFather on Telegram
2. Get your chat ID from @userinfobot
3. Enter both in Settings
4. Click "Send Test Message"
5. ✅ **Expected**: 
   - Button shows "Sending..."
   - Real message appears in your Telegram chat
   - Success toast

### Test Telegram Validation
1. Try invalid chat ID format (e.g., "abc")
2. ✅ **Expected**: Error toast about format
3. Try empty token
4. ✅ **Expected**: Error toast "Invalid Bot Token format"

---

## 5️⃣ Personalization Tab Testing

### Test Theme Selector
1. Navigate to Settings → Personalization
2. Click "Light Mode"
3. Click "Apply Changes"
4. ✅ **Expected**: Theme changes (if implemented in AppContext)

### Test Currency Selector
1. Select "EUR (€)"
2. Click "Apply Changes"
3. ✅ **Expected**: Success toast, preference saved
4. Refresh page
5. ✅ **Expected**: EUR still selected

### Test Date Format
1. Select "DD/MM/YYYY"
2. Click "Apply Changes"
3. ✅ **Expected**: Format saved, applied globally

---

## 6️⃣ Notifications Tab Testing

### Test Quiet Hours
1. Navigate to Settings → Notifications
2. Toggle "Quiet Hours" ON
3. Set Start: 22:00
4. Set End: 07:00
5. Click "Save Settings"
6. ✅ **Expected**: Success toast, times saved

### Test Quiet Hours Validation
1. Enable Quiet Hours
2. Leave times empty
3. Try to save
4. ✅ **Expected**: Error toast about required times

### Test Sound Toggle
1. Toggle "Sound Effects" ON/OFF
2. Click "Save Settings"
3. Refresh page
4. ✅ **Expected**: State persists

### Test Event Notifications
1. Toggle each notification type (Email, Push, Price Alerts, Trade Executions)
2. Click "Save Settings"
3. Refresh page
4. ✅ **Expected**: All toggles maintain state

---

## 7️⃣ Data Sources Tab Testing

### Test Refresh Rate Configuration
1. Navigate to Settings → Data Sources
2. Change "Market Data Refresh" to "1 Minute"
3. Change "News Feed Refresh" to "5 Minutes"
4. Change "Sentiment Refresh" to "1 Hour"
5. Click "Update Intervals"
6. ✅ **Expected**: Success toast, settings saved

### Test Refresh Rate Validation
1. Manually set a rate to < 10 seconds (if possible)
2. Try to save
3. ✅ **Expected**: Error toast about minimum 10 seconds

### Test Database Statistics
1. Scroll down to "Local Database" section
2. ✅ **Expected**: See storage size in KB
3. ✅ **Expected**: See table count
4. ✅ **Expected**: See scrollable table with record counts

### Test Database Backup
1. Click "Backup" button
2. ✅ **Expected**: 
   - File downloads automatically
   - Filename: "crypto_backup_YYYY-MM-DD.db"
   - Success toast appears

### Test Database Clear
1. Click "Clear Data" button
2. ✅ **Expected**: Strong warning dialog appears
3. Cancel it
4. Click again, confirm
5. ✅ **Expected**: 
   - All data cleared
   - Statistics reset to 0
   - Success toast

---

## 🔄 Cross-Tab Testing

### Test Data Persistence
1. Make changes in Profile tab → Save
2. Navigate to API Keys tab
3. Navigate back to Profile
4. ✅ **Expected**: Changes still there

### Test Refresh Persistence
1. Make changes across all tabs
2. Save everything
3. Hard refresh page (Ctrl+Shift+R)
4. Check all tabs
5. ✅ **Expected**: All data persists from localStorage

---

## 📱 Responsive Testing

### Mobile View (< 768px)
1. Resize browser to mobile width
2. ✅ **Expected**: 
   - Sidebar navigation stacks vertically
   - Forms stack in single column
   - All inputs remain accessible
   - No horizontal scroll

### Tablet View (768px - 1024px)
1. Resize to tablet width
2. ✅ **Expected**:
   - 2-column layout where appropriate
   - Comfortable spacing
   - Touch-friendly targets

---

## ⚠️ Error Testing

### Test Network Errors
1. Disconnect internet
2. Try HuggingFace token test
3. ✅ **Expected**: Error toast about network

### Test Invalid Data
1. Try XSS injection in text fields
2. ✅ **Expected**: Sanitized, no script execution

### Test Edge Cases
1. Try extremely long names (1000+ chars)
2. ✅ **Expected**: Handled gracefully
3. Upload 10MB image as avatar
4. ✅ **Expected**: Error toast "File too large"

---

## ✅ Success Criteria

All tests should show:
- ✅ Immediate visual feedback
- ✅ Toast notifications (success/error)
- ✅ Data persistence after refresh
- ✅ No console errors
- ✅ No broken functionality
- ✅ Smooth animations
- ✅ Responsive layout
- ✅ Loading states during async ops

---

## 🐛 Known Limitations

1. **Encryption**: Uses base64 (demo). Production should use AES-256.
2. **API Validation**: HuggingFace is real, exchanges are simulated.
3. **Database**: Uses localStorage + sql.js, not a real backend.
4. **Auth**: No user authentication system (demo mode).

---

## 📝 Quick Verification Commands

### Check localStorage
```javascript
// In browser console
localStorage.getItem('crypto_settings_v1')
```

### Check Database
```javascript
// In browser console
localStorage.getItem('crypto_platform.db')
```

### Clear All Data
```javascript
// In browser console
localStorage.clear()
location.reload()
```

---

## 🎯 Expected Behavior Summary

| Feature | Expected Result |
|---------|----------------|
| Save buttons | Async with loading state |
| Delete buttons | Confirmation dialog first |
| Input validation | Real-time or on submit |
| Error messages | Toast notifications |
| Success messages | Toast notifications |
| Loading states | Spinner or "Loading..." text |
| Data persistence | Survives page refresh |
| Encryption | Keys/secrets encrypted |
| API calls | Real (HuggingFace, Telegram) |
| Forms | All fields functional |

---

## ✅ Testing Complete When:

- [ ] All 7 tabs tested
- [ ] All forms submit successfully
- [ ] All validations trigger correctly
- [ ] All async operations complete
- [ ] All data persists after refresh
- [ ] All error states display properly
- [ ] All success toasts appear
- [ ] No console errors
- [ ] Responsive on mobile/tablet/desktop
- [ ] All buttons do something

---

**Testing Status**: Ready for QA ✅
