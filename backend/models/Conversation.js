// ─── Conversations Collection Schema Reference ──────────
// This project uses the native MongoDB Atlas driver (not Mongoose).
// Collection: "conversations"
//
// Document structure:
// {
//   _id:               ObjectId (auto-generated),
//   user_id:           ObjectId | null (ref: users),
//   customer_name:     String,
//   customer_email:    String (indexed),
//   ai_enabled:        Number (0 or 1, default: 1),
//   is_pinned:         Number (0 or 1, default: 0),
//   last_message:      String | null,
//   last_message_time: Date | null,
//   created_at:        Date,
// }