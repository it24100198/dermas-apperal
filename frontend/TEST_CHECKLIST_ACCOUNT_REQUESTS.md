# Account Requests UI Regression Checklist

Use this checklist after changes to registration or approval flows.

## Request Access Page

- [ ] Request Access form shows only: Full Name, Email, Phone Number, Password, Confirm Password, Reason for Access.
- [ ] Requested Department field is not rendered.
- [ ] Form submit succeeds with valid payload and shows success state.
- [ ] Form submit blocks with invalid email, phone, or password mismatch.

## Pending User Requests Page

- [ ] Pending requests table renders without Requested Department column.
- [ ] Opening a pending request details panel triggers next employee ID fetch.
- [ ] Approve Request -> Employee ID input auto-fills with suggested value (for example EMP-001).
- [ ] Suggested value is visible under the input.
- [ ] Employee ID field remains editable.

## Approval Safety

- [ ] Approving with duplicate Employee ID shows a clear backend error and does not approve.
- [ ] Approving with unique Employee ID succeeds.

## API and Auth Behavior

- [ ] GET /api/account-requests/next-employee-id returns 401 without token.
- [ ] GET /api/account-requests/next-employee-id returns 403 for non-admin user.
- [ ] GET /api/account-requests/next-employee-id returns 200 and JSON employeeId for admin.
