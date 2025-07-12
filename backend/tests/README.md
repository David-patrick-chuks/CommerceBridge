# CommerceBridge Test Suite

This directory contains comprehensive test scripts for the CommerceBridge WhatsApp e-commerce platform. These tests help verify the functionality of various system components during development.

## Test Files Overview

### 1. `test-image-handling.ts`
**Purpose**: Tests the image handling improvements for the seller product upload flow in the WhatsApp bot.

**Key Features**:
- Validates image upload handling for both "image" and "album" message types
- Tests message object serialization for debugging
- Verifies log file creation and directory structure
- Checks nodemon configuration to prevent server restarts
- Validates TypeScript compilation and module imports

**Usage**:
```bash
# Development mode (skips file creation to avoid nodemon restarts)
npm run test:image-handling

# Standalone mode (full tests including file creation)
npm run test:image-handling:standalone
```

**What it tests**:
- ✅ Logs directory creation and permissions
- ✅ Message object serialization for debugging
- ✅ Nodemon configuration validation
- ✅ .gitignore configuration
- ✅ Existing log file detection
- ✅ TypeScript module imports

### 2. `test-gemini-support.ts`
**Purpose**: Tests the Gemini AI integration for customer support and escalation handling.

**Key Features**:
- Tests basic support question handling for customers and sellers
- Validates escalation detection logic
- Tests escalation message generation
- Verifies AI-powered support responses

**Usage**:
```bash
npm run test:gemini-support
```

**What it tests**:
- ✅ Basic customer support questions
- ✅ Seller-specific support questions
- ✅ Escalation detection (should NOT escalate for simple questions)
- ✅ Escalation detection (should escalate for urgent issues)
- ✅ Escalation message generation

### 3. `test-notification-system.ts`
**Purpose**: Tests the comprehensive notification system for user communications.

**Key Features**:
- Tests notification creation for specific users
- Validates bulk notifications for user types (customers/sellers)
- Tests general notifications for all users
- Verifies notification retrieval and management
- Tests analytics and statistics

**Usage**:
```bash
npm run test:notification-system
```

**What it tests**:
- ✅ Create notification for specific user
- ✅ Create bulk notifications for all customers
- ✅ Create bulk notifications for all sellers
- ✅ Create general notifications for all users
- ✅ Retrieve user notifications
- ✅ Get notification statistics
- ✅ Get unknown user statistics
- ✅ Get conversion analytics
- ✅ Mark notifications as read
- ✅ Mark all notifications as read

## Prerequisites

Before running these tests, ensure you have:

1. **Environment Setup**:
   ```bash
   # Install dependencies
   npm install
   
   # Set up environment variables
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Database Setup**:
   - PostgreSQL database running
   - MongoDB database running (if applicable)
   - Proper database connections configured

3. **External Services**:
   - WhatsApp Web JS connection (for image handling tests)
   - Gemini AI API key (for support tests)
   - Paystack API key (if testing payment-related features)

## Running Tests

### Individual Tests
```bash
# Image handling tests
npm run test:image-handling
npm run test:image-handling:standalone

# Gemini support tests
npm run test:gemini-support

# Notification system tests
npm run test:notification-system
```

### All Tests
```bash
# Run all tests in sequence
npm run test:all
```

## Test Output

### Success Indicators
- ✅ Green checkmarks indicate successful test completion
- 📝 Blue text shows test descriptions and progress
- 🎉 Final success message confirms all tests passed

### Error Handling
- ❌ Red X marks indicate test failures
- Detailed error messages help identify issues
- Stack traces are provided for debugging

## Debugging

### Log Files
Image handling tests create detailed log files in the `logs/` directory:
- Message objects are serialized for inspection
- State transitions are logged
- Error conditions are captured

### Common Issues

1. **Server Restarts During Development**:
   - Use development mode tests to avoid file creation
   - Check nodemon configuration in `nodemon.json`
   - Ensure `logs/` directory is in `.gitignore`

2. **API Connection Errors**:
   - Verify server is running on correct port
   - Check environment variables
   - Ensure external services are accessible

3. **Database Connection Issues**:
   - Verify database credentials
   - Check database server status
   - Ensure proper network connectivity

## Integration with Development Workflow

### Pre-commit Testing
These tests can be integrated into your development workflow:

```bash
# Add to package.json scripts
"precommit": "npm run test:all"
```

### Continuous Integration
Consider adding these tests to your CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Run CommerceBridge Tests
  run: |
    npm install
    npm run test:all
```

## Test Data Management

### Sample Data
Tests use mock data that doesn't affect production:
- Test phone numbers: `+1234567890`
- Test user types: `customer`, `seller`
- Sample product data and images

### Cleanup
Test data is automatically cleaned up:
- Log files can be safely deleted
- Database test records are isolated
- No permanent changes to production data

## Contributing

When adding new tests:

1. **Follow Naming Convention**: `test-[feature-name].ts`
2. **Add to README**: Document purpose and usage
3. **Update package.json**: Add npm scripts for easy execution
4. **Include Error Handling**: Proper try-catch blocks
5. **Add TypeScript Types**: Define interfaces for test data

## Troubleshooting

### TypeScript Compilation Issues
```bash
# Check TypeScript configuration
npx tsc --noEmit

# Verify module resolution
npx tsc --traceResolution
```

### Environment Variable Issues
```bash
# Check environment loading
node -e "console.log(process.env.NODE_ENV)"
```

### Permission Issues
```bash
# Check file permissions
ls -la logs/
chmod 755 logs/
```

## Support

For issues with these tests:
1. Check the test output for specific error messages
2. Verify all prerequisites are met
3. Review the debugging section above
4. Check the main project documentation

---

**Last Updated**: $(date)
**CommerceBridge Version**: 1.0.0 