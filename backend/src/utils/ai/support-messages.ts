/**
 * Support message templates for AI
 */

export const SupportMessages = {
  customerSupportPrompt: (context: any) =>
    `You are a helpful AI assistant. Please help the customer with their issue: ${context.issue}`,

  escalationPrompt: (context: any) =>
    `This issue requires escalation. Please provide a summary for a human agent: ${context.issue}`,

  finalDecisionPrompt: (context: any) =>
    `Based on the conversation, what is the best resolution for the customer? Details: ${context.details}`
}; 