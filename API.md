# API Reference

## Base URL
```
http://localhost:3000/api (development)
https://your-domain.com/api (production)
```

## Authentication

All admin endpoints require a valid NextAuth session. Include `Authorization` header or ensure session cookies are sent.

### Session Status
- Authenticated: Session exists with user ID
- Unauthenticated: No session or expired session
- Admin: User ID in `ADMIN_DISCORD_IDS` environment variable

## Endpoints

### Forms

#### List Forms
**GET** `/forms`

Returns all published forms. Admins see all forms.

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Feedback Form",
    "description": "Share your feedback",
    "createdBy": "123456789",
    "isPublished": true,
    "createdAt": "2024-01-14T10:00:00Z",
    "updatedAt": "2024-01-14T10:00:00Z"
  }
]
```

**Status Codes:**
- `200` — Success

---

#### Create Form
**POST** `/forms`

Create a new form. Requires admin authentication.

**Request Body:**
```json
{
  "title": "Feedback Form",
  "description": "Share your feedback",
  "fields": [
    {
      "id": "name",
      "type": "text",
      "label": "Full Name",
      "placeholder": "John Doe",
      "required": true,
      "order": 0
    },
    {
      "id": "email",
      "type": "email",
      "label": "Email Address",
      "required": true,
      "order": 1
    },
    {
      "id": "feedback",
      "type": "textarea",
      "label": "Your Feedback",
      "required": false,
      "order": 2
    }
  ]
}
```

**Field Types:**
- `text` — Single-line text input
- `email` — Email input with validation
- `textarea` — Multi-line text area
- `checkbox` — Single checkbox (boolean)
- `select` — Dropdown selection (requires `options`)
- `radio` — Radio button group (requires `options`)
- `date` — Date picker input

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "Feedback Form",
  "description": "Share your feedback",
  "fields": [...],
  "createdBy": "123456789",
  "isPublished": false,
  "createdAt": "2024-01-14T10:00:00Z",
  "updatedAt": "2024-01-14T10:00:00Z"
}
```

**Status Codes:**
- `201` — Created
- `400` — Invalid form data
- `401` — Unauthorized (not authenticated)
- `403` — Forbidden (not admin)
- `500` — Server error

---

#### Get Form Details
**GET** `/forms/:id`

Get full form definition with all fields. Public access if published.

**Parameters:**
- `:id` (required) — Form ID (MongoDB ObjectId)

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "Feedback Form",
  "description": "Share your feedback",
  "fields": [
    {
      "id": "name",
      "type": "text",
      "label": "Full Name",
      "placeholder": "John Doe",
      "required": true,
      "order": 0
    }
  ],
  "createdBy": "123456789",
  "isPublished": true,
  "createdAt": "2024-01-14T10:00:00Z",
  "updatedAt": "2024-01-14T10:00:00Z"
}
```

**Status Codes:**
- `200` — Success
- `400` — Invalid form ID
- `403` — Forbidden (unpublished form, not creator)
- `404` — Form not found
- `500` — Server error

---

#### Update Form
**PUT** `/forms/:id`

Update form details and fields. Creator or admin only.

**Parameters:**
- `:id` (required) — Form ID

**Request Body:**
```json
{
  "title": "Updated Feedback Form",
  "description": "Updated description",
  "fields": [...]
}
```

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "Updated Feedback Form",
  ...
}
```

**Status Codes:**
- `200` — Success
- `400` — Invalid form ID or data
- `401` — Unauthorized
- `403` — Forbidden (not creator or admin)
- `404` — Form not found
- `500` — Server error

---

#### Delete Form
**DELETE** `/forms/:id`

Delete a form and all its submissions. Creator or admin only.

**Parameters:**
- `:id` (required) — Form ID

**Response:**
```json
{
  "message": "Form deleted"
}
```

**Status Codes:**
- `200` — Success
- `400` — Invalid form ID
- `401` — Unauthorized
- `403` — Forbidden (not creator or admin)
- `404` — Form not found
- `500` — Server error

---

### Submissions

#### Submit Form
**POST** `/forms/:id/submit`

Submit form response data. Public endpoint.

**Parameters:**
- `:id` (required) — Form ID

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "feedback": "Great form!"
}
```

**Validation:**
- Required fields must be present
- Email fields must be valid email format
- Date fields must be valid ISO date
- Select/radio values must match defined options

**Response (Success):**
```json
{
  "message": "Submission received",
  "id": "507f1f77bcf86cd799439012"
}
```

**Response (Validation Error):**
```json
{
  "error": "Validation failed",
  "details": {
    "email": "email must be a valid email",
    "feedback": "feedback is required"
  }
}
```

**Status Codes:**
- `201` — Submission received
- `400` — Invalid form ID or validation failed
- `403` — Form not published
- `404` — Form not found
- `500` — Server error

---

## Error Responses

### Standard Error Format
```json
{
  "error": "Error message",
  "details": {
    "field1": "Error message for field1",
    "field2": "Error message for field2"
  }
}
```

### Common Errors

**401 Unauthorized**
```json
{
  "error": "Unauthorized"
}
```
Solution: Sign in with Discord

**403 Forbidden**
```json
{
  "error": "Forbidden"
}
```
Solution: User is not an admin or not the form creator

**404 Not Found**
```json
{
  "error": "Form not found"
}
```
Solution: Check form ID is correct and form exists

**400 Bad Request**
```json
{
  "error": "Invalid form data",
  "details": {
    "title": "title is required",
    "fields": "fields must have at least 1 item"
  }
}
```
Solution: Check request body matches schema

---

## Examples

### cURL

**Create Form:**
```bash
curl -X POST http://localhost:3000/api/forms \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Contact Form",
    "fields": [
      {
        "id": "email",
        "type": "email",
        "label": "Email",
        "required": true,
        "order": 0
      }
    ]
  }'
```

**Submit Form:**
```bash
curl -X POST http://localhost:3000/api/forms/507f1f77bcf86cd799439011/submit \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

### JavaScript/Fetch

**Create Form:**
```javascript
const response = await fetch('/api/forms', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Contact Form',
    fields: [{
      id: 'email',
      type: 'email',
      label: 'Email',
      required: true,
      order: 0
    }]
  })
});

const form = await response.json();
console.log(form._id); // Form ID
```

**Submit Form:**
```javascript
const response = await fetch(`/api/forms/${formId}/submit`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com' })
});

const result = await response.json();
if (response.ok) {
  console.log('Submission saved:', result.id);
} else {
  console.error('Validation errors:', result.details);
}
```

---

## Rate Limiting

Currently no rate limiting implemented. Recommended for production:
- Submissions: 5 per IP per hour
- Form creation: 10 per user per day
- API calls: 100 per minute per user

---

## Session Management

Sessions stored in memory during development. For production:
1. Use MongoDB session store
2. Set `session.maxAge` in NextAuth config
3. Implement session refresh logic
4. Use secure cookie settings

```typescript
// .env.local
NEXTAUTH_SESSION_EXPIRY=86400 // 24 hours
```
