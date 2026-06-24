// ─── Messages Collection Schema Reference ────────────────
// This project uses the native MongoDB Atlas driver (not Mongoose).
// Collection: "messages"
//
// Document structure:
// {
//   _id:              ObjectId (auto-generated),
//   conversation_id:  ObjectId (ref: conversations),
//   sender_id:        Number (0=AI, 1=customer, 999=admin),
//   message:          String (default: ""),
//   file_url:         String | null,
//   is_edited:        Number (0 or 1),
//   is_deleted:       Number (0 or 1),
//   edited_at:        Date | null,
//   created_at:       Date,
// }