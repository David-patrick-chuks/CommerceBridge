# Gemini AI Support Integration

CommerceBridge now features intelligent AI-powered customer support using Google's Gemini AI. This system provides automated responses to user questions while intelligently escalating urgent issues to human support.

## 🚀 Features

### 🤖 AI-Powered Support
- **Intelligent Responses**: Gemini AI generates contextual, helpful responses to user questions
- **User Type Awareness**: Different responses for customers vs sellers
- **WhatsApp Formatting**: Responses use proper WhatsApp formatting (*bold*, _italic_)
- **Context Preservation**: Maintains conversation context and user information

### 🚨 Smart Escalation
- **Automatic Detection**: Identifies urgent issues that require human intervention
- **Keyword Analysis**: Detects escalation keywords (urgent, error, broken, etc.)
- **Emotional Indicators**: Recognizes emotional distress or frustration
- **AI Decision Making**: Uses Gemini to make final escalation decisions

### 📱 Multi-Channel Support
- **Onboarding Support**: Available during account creation process
- **Customer Support**: Integrated into customer menu (option 5)
- **Seller Support**: Integrated into seller menu (option 5)
- **Seamless Navigation**: Easy return to main menus

## 🔧 Implementation

### Core Functions

#### `handleSupportQuestion(userQuestion, userType, userPhone)`
Generates AI responses to support questions.

```typescript
const response = await handleSupportQuestion(
  "How do I create an account?",
  "customer",
  "+1234567890"
);
```

#### `shouldEscalateToHuman(userQuestion, userType)`
Determines if a question should be escalated to human support.

```typescript
const shouldEscalate = await shouldEscalateToHuman(
  "My payment failed!",
  "customer"
);
```

#### `getEscalationMessage()`
Generates standardized escalation messages with contact information.

### Session States

The system uses these session states to manage support interactions:

- `support_mode`: Onboarding support mode
- `customer_support`: Customer support mode
- `seller_support`: Seller support mode
- `escalated_support`: Escalated to human support

### Environment Variables

Add these to your `.env` file:

```env
# Support Contact Information
SUPPORT_EMAIL=support@commercebridge.com
SUPPORT_PHONE=+234-XXX-XXX-XXXX

# Gemini API Keys (already configured)
GEMINI_API_KEYS=your-api-key-1,your-api-key-2
```

## 🧪 Testing

Run the test script to verify the integration:

```bash
cd backend
node test-gemini-support.js
```

This will test:
- Basic support question handling
- Seller vs customer responses
- Escalation detection
- Escalation message generation

## 📋 Usage Examples

### Customer Support Flow
1. User selects "Help" from customer menu
2. User asks: "How do I browse products?"
3. AI responds with helpful instructions
4. User can ask follow-up questions or type "back"

### Escalation Flow
1. User asks: "My payment failed and I need immediate help!"
2. System detects urgency keywords
3. AI decides to escalate
4. User receives escalation message with contact info

### Seller Support Flow
1. User selects "Help" from seller menu
2. User asks: "How do I upload product images?"
3. AI provides step-by-step instructions
4. User can continue asking questions

## 🎯 Supported Topics

### Customer Topics
- Account creation and setup
- Product browsing and search
- Shopping cart management
- Payment and checkout process
- Order tracking
- Returns and refunds
- General platform questions

### Seller Topics
- Account setup and verification
- Product upload and management
- Inventory management
- Order processing
- Payment and commission
- Sales analytics
- Platform features

## 🔄 Integration Points

### Conversation Flow
- `ConversationFlow.processMessage()` routes support messages
- Support states are handled before user type routing
- Seamless integration with existing flow logic

### Session Management
- Support states are preserved in user sessions
- Context is maintained across support interactions
- Easy navigation back to main menus

### Error Handling
- Graceful fallback if Gemini API fails
- User-friendly error messages
- Automatic escalation on API errors

## 🚀 Future Enhancements

### Planned Features
- **Support Ticket Creation**: Automatic ticket creation for escalated issues
- **Knowledge Base Integration**: Enhanced responses with platform documentation
- **Multi-language Support**: Support for multiple languages
- **Voice Message Support**: Handle voice messages in support
- **Support Analytics**: Track support interactions and effectiveness

### Analytics & Monitoring
- Support question frequency
- Escalation rate tracking
- Response quality metrics
- User satisfaction scores

## 🔒 Security & Privacy

- User phone numbers are included in context for personalized support
- No sensitive data is stored in support interactions
- API keys are rotated automatically for rate limiting
- All interactions are logged for quality improvement

## 📞 Support Contact

For technical issues with the support system:
- Email: dev-support@commercebridge.com
- Documentation: See main README.md
- Issues: Create GitHub issue with "support" label 