// Test script for Gemini support integration
import 'dotenv/config';
import { SupportMessages, supportService } from '../src/utils/gemini/index';

async function testGeminiSupport() {
  console.log('🧪 Testing Gemini Support Integration...\n');

  try {
    // Test 1: Basic support question
    console.log('📝 Test 1: Basic support question');
    const response1 = await supportService.handleSupportQuestion(
      'How do I create an account?',
      'customer',
      '+1234567890'
    );
    console.log('Response:', response1);
    console.log('---\n');

    // Test 2: Seller support question
    console.log('📝 Test 2: Seller support question');
    const response2 = await supportService.handleSupportQuestion(
      'How do I upload products?',
      'seller',
      '+1234567890'
    );
    console.log('Response:', response2);
    console.log('---\n');

    // Test 3: Escalation detection - should NOT escalate
    console.log('📝 Test 3: Escalation detection (should NOT escalate)');
    const shouldEscalate1 = await supportService.shouldEscalateToHuman(
      'How do I browse products?',
      'customer'
    );
    console.log('Should escalate:', shouldEscalate1);
    console.log('---\n');

    // Test 4: Escalation detection - should escalate
    console.log('📝 Test 4: Escalation detection (should escalate)');
    const shouldEscalate2 = await supportService.shouldEscalateToHuman(
      'My payment failed and I need immediate help!',
      'customer'
    );
    console.log('Should escalate:', shouldEscalate2);
    console.log('---\n');

    // Test 5: Escalation message
    console.log('📝 Test 5: Escalation message');
    const escalationMsg = SupportMessages.getEscalationMessage();
    console.log('Escalation message:', escalationMsg);
    console.log('---\n');

    console.log('✅ All tests completed successfully!');

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testGeminiSupport(); 