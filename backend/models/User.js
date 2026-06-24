// ─── Users Collection Schema Reference ───────────────────
// This project uses the native MongoDB Atlas driver (not Mongoose).
// Collection: "users"
//
// Document structure:
// {
//   _id:        ObjectId (auto-generated),
//   name:       String,
//   email:      String (indexed),
//   password:   String (bcrypt hashed),
//   role:       String (default: "client"),
//   createdAt:  Date,
//   updatedAt:  Date,
// }