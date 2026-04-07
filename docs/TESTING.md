# SheetMail Sender - Testing Checklist

Comprehensive testing guide for the SheetMail Sender system.

## Table of Contents

1. [Pre-Testing Setup](#pre-testing-setup)
2. [Authentication Tests](#authentication-tests)
3. [Google Sheets Integration Tests](#google-sheets-integration-tests)
4. [Email Template Tests](#email-template-tests)
5. [Campaign Tests](#campaign-tests)
6. [UI/UX Tests](#uiux-tests)
7. [Edge Case Tests](#edge-case-tests)

---

## Pre-Testing Setup

### Create Test Data

1. **Create a test Google Sheet** with the following columns:
   - Name
   - Email
   - Company
   - Title

2. **Add test rows** (at least 10):
   ```
   | Name          | Email                    | Company    | Title           |
   |---------------|--------------------------|------------|-----------------|
   | John Doe      | john.doe@example.com     | Acme Inc   | Manager         |
   | Jane Smith    | jane.smith@example.com   | Tech Corp  | Developer       |
   | Bob Johnson   | bob.johnson@example.com  | StartupXYZ | CEO             |
   ```

3. **Include some invalid emails** for testing:
   - `invalid-email` (no @)
   - `@nodomain.com` (no local part)
   - `spaces in@email.com` (contains spaces)
   - Empty cells

---

## Authentication Tests

### Test 1: Google Sign-In

**Steps:**
1. Open the app
2. Tap "Continue with Google"
3. Select a Google account
4. Grant requested permissions

**Expected Results:**
- [ ] Sign-in prompt appears
- [ ] Account selection works
- [ ] Permissions screen shows Gmail and Sheets scopes
- [ ] User is redirected to Dashboard after successful sign-in
- [ ] User profile shows correct name and email

**Pass/Fail:** _______

### Test 2: Sign-Out

**Steps:**
1. Go to Settings
2. Tap "Sign Out"

**Expected Results:**
- [ ] Confirmation dialog appears
- [ ] User is signed out
- [ ] App returns to Login screen
- [ ] User data is cleared from local storage

**Pass/Fail:** _______

### Test 3: Token Refresh

**Steps:**
1. Sign in
2. Wait for token to expire (or simulate)
3. Try to access sheets

**Expected Results:**
- [ ] Token is automatically refreshed
- [ ] User stays signed in
- [ ] No interruption to app usage

**Pass/Fail:** _______

---

## Google Sheets Integration Tests

### Test 4: List Sheets

**Steps:**
1. Go to Dashboard
2. Tap "New Campaign"
3. View sheet list

**Expected Results:**
- [ ] List of user's Google Sheets displays
- [ ] Sheet names are correct
- [ ] Last modified dates show correctly
- [ ] Pull-to-refresh works

**Pass/Fail:** _______

### Test 5: Select Sheet by URL

**Steps:**
1. On Sheet Select screen
2. Paste a Google Sheets URL
3. Tap arrow button

**Expected Results:**
- [ ] Sheet ID is extracted from URL
- [ ] Sheet data loads
- [ ] Column detection works

**Pass/Fail:** _______

### Test 6: Sheet with No Email Column

**Steps:**
1. Create a sheet without an "Email" column
2. Try to select it

**Expected Results:**
- [ ] Column mapping modal appears
- [ ] User can manually select email column
- [ ] App proceeds after selection

**Pass/Fail:** _______

### Test 7: Empty Sheet

**Steps:**
1. Create an empty sheet
2. Try to select it

**Expected Results:**
- [ ] Error message shows "Sheet is empty"
- [ ] User can go back and select another sheet

**Pass/Fail:** _______

---

## Email Template Tests

### Test 8: Create Template

**Steps:**
1. Select a sheet
2. Enter subject: `Welcome {Name}!`
3. Enter body with HTML formatting
4. Use placeholder buttons

**Expected Results:**
- [ ] Subject accepts text and placeholders
- [ ] Rich text editor works
- [ ] Placeholder buttons insert correctly
- [ ] Available placeholders show from sheet columns

**Pass/Fail:** _______

### Test 9: Preview Email

**Steps:**
1. Create a template with placeholders
2. Tap "Preview"

**Expected Results:**
- [ ] Preview modal opens
- [ ] Placeholders are replaced with sample data
- [ ] Subject and body display correctly

**Pass/Fail:** _______

### Test 10: Send Test Email

**Steps:**
1. Create a template
2. Tap "Send Test"
3. Enter your email
4. Send

**Expected Results:**
- [ ] Test email is received
- [ ] Placeholders are replaced correctly
- [ ] HTML formatting is preserved
- [ ] Success toast shows

**Pass/Fail:** _______

---

## Campaign Tests

### Test 11: Create Campaign

**Steps:**
1. Select a sheet
2. Create a template
3. Review preview
4. Tap "Start Campaign"

**Expected Results:**
- [ ] Campaign is created
- [ ] Recipients are loaded from sheet
- [ ] Campaign appears in History

**Pass/Fail:** _______

### Test 12: Send Campaign

**Steps:**
1. Create a campaign
2. Start sending
3. Monitor progress

**Expected Results:**
- [ ] Progress ring shows percentage
- [ ] Current email being sent is displayed
- [ ] Stats update (sent/failed)
- [ ] Rate limiting works (1 email per 2 seconds)
- [ ] Campaign completes successfully

**Pass/Fail:** _______

### Test 13: Pause Campaign

**Steps:**
1. Start a campaign
2. Tap "Pause" during sending

**Expected Results:**
- [ ] Campaign pauses immediately
- [ ] Status shows "Paused"
- [ ] Resume button appears

**Pass/Fail:** _______

### Test 14: Resume Campaign

**Steps:**
1. Pause a campaign
2. Tap "Resume"

**Expected Results:**
- [ ] Campaign resumes from where it left off
- [ ] Progress continues
- [ ] No duplicate emails sent

**Pass/Fail:** _______

### Test 15: Stop Campaign

**Steps:**
1. Start a campaign
2. Tap "Stop"
3. Confirm

**Expected Results:**
- [ ] Campaign stops immediately
- [ ] Status shows "Stopped"
- [ ] Partial results are saved

**Pass/Fail:** _______

### Test 16: Campaign with Invalid Emails

**Steps:**
1. Create a sheet with some invalid emails
2. Create and send a campaign

**Expected Results:**
- [ ] Invalid emails are skipped
- [ ] Failed count increments
- [ ] Valid emails are still sent
- [ ] Error details available in History

**Pass/Fail:** _______

### Test 17: Sheet Status Update

**Steps:**
1. Send a campaign
2. Check the Google Sheet

**Expected Results:**
- [ ] "Email Status" column is created (if not exists)
- [ ] Status is updated for each row (Sent/Failed)
- [ ] Timestamps are added

**Pass/Fail:** _______

---

## UI/UX Tests

### Test 18: Dark Mode

**Steps:**
1. Go to Settings
2. Toggle Dark Mode
3. Navigate through all screens

**Expected Results:**
- [ ] All screens support dark mode
- [ ] Colors are appropriate
- [ ] Text is readable
- [ ] Toggle persists across app restarts

**Pass/Fail:** _______

### Test 19: Loading States

**Steps:**
1. Navigate to each screen
2. Observe loading indicators

**Expected Results:**
- [ ] Loading indicators show during data fetch
- [ ] Skeleton screens where appropriate
- [ ] No blank screens

**Pass/Fail:** _______

### Test 20: Error Handling

**Steps:**
1. Turn off internet
2. Try various actions
3. Turn on internet

**Expected Results:**
- [ ] Network error messages show
- [ ] Retry options available
- [ ] App recovers when connection restored

**Pass/Fail:** _______

### Test 21: Empty States

**Steps:**
1. Fresh install (no campaigns)
2. Navigate to History

**Expected Results:**
- [ ] Empty state illustration shows
- [ ] Helpful message displayed
- [ ] CTA to create first campaign

**Pass/Fail:** _______

---

## Edge Case Tests

### Test 22: Large Sheet (1000+ rows)

**Steps:**
1. Create a sheet with 1000+ rows
2. Try to select it

**Expected Results:**
- [ ] Sheet loads (may take time)
- [ ] Preview shows first 10 rows
- [ ] Campaign can be created

**Pass/Fail:** _______

### Test 23: Special Characters in Template

**Steps:**
1. Create template with special characters:
   - Emojis
   - Unicode characters
   - HTML tags

**Expected Results:**
- [ ] Characters display correctly
- [ ] Emails send successfully
- [ ] Formatting preserved

**Pass/Fail:** _______

### Test 24: Very Long Subject/Body

**Steps:**
1. Create template with very long subject (900+ chars)
2. Create template with very long body

**Expected Results:**
- [ ] Character count shows
- [ ] Warnings for exceeding limits
- [ ] Emails send (or fail gracefully)

**Pass/Fail:** _______

### Test 25: Background Sending

**Steps:**
1. Start a campaign
2. Minimize app (go to home screen)
3. Wait a few minutes
4. Reopen app

**Expected Results:**
- [ ] Campaign continues in background
- [ ] Progress is updated when app reopens
- [ ] No duplicate sends

**Pass/Fail:** _______

### Test 26: App Kill During Sending

**Steps:**
1. Start a campaign
2. Kill the app (swipe away)
3. Reopen app

**Expected Results:**
- [ ] Campaign status is preserved
- [ ] Can resume or view results
- [ ] No data corruption

**Pass/Fail:** _______

---

## Performance Tests

### Test 27: Cold Start Time

**Steps:**
1. Kill app completely
2. Launch app
3. Measure time to Dashboard

**Expected Results:**
- [ ] App launches in < 3 seconds
- [ ] Dashboard loads quickly

**Pass/Fail:** _______

### Test 28: Sheet List Loading

**Steps:**
1. Navigate to Sheet Select
2. Measure load time

**Expected Results:**
- [ ] List loads in < 2 seconds
- [ ] Loading indicator shows

**Pass/Fail:** _______

---

## Security Tests

### Test 29: Data Privacy

**Steps:**
1. Sign in as User A
2. Try to access User B's campaigns (via API)

**Expected Results:**
- [ ] Access denied
- [ ] No data leakage
- [ ] Proper 403 errors

**Pass/Fail:** _______

### Test 30: Token Security

**Steps:**
1. Sign in
2. Check local storage

**Expected Results:**
- [ ] No plaintext tokens stored
- [ ] Refresh token is encrypted
- [ ] Secure storage used

**Pass/Fail:** _______

---

## Test Summary

| Category | Tests | Passed | Failed | Pass Rate |
|----------|-------|--------|--------|-----------|
| Authentication | 3 | | | |
| Google Sheets | 4 | | | |
| Email Templates | 3 | | | |
| Campaigns | 7 | | | |
| UI/UX | 4 | | | |
| Edge Cases | 6 | | | |
| Performance | 2 | | | |
| Security | 2 | | | |
| **Total** | **31** | | | |

---

## Sign-Off

**Tester Name:** ___________________

**Date:** ___________________

**Overall Result:** ☐ PASS ☐ FAIL

**Notes:**

