function getAIReply(message) {
  const text = message.toLowerCase();

  if (text.includes("hello") || text.includes("hi")) {
    return "Hello! Welcome to Triangle Creative Lab. How can I help you today?";
  }

  if (
    text.includes("service") ||
    text.includes("services")
  ) {
    return "We offer Web Development, Mobile App Development, UI/UX Design and AI Solutions.";
  }

  if (
    text.includes("price") ||
    text.includes("cost")
  ) {
    return "Pricing depends on your project requirements. An admin will assist you shortly.";
  }

  if (
    text.includes("website")
  ) {
    return "We can definitely help build your website. Could you share more details about your requirements?";
  }

  return "Thank you for your message. Our team will get back to you shortly.";
}

module.exports = { getAIReply };