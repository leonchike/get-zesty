# Logging Best Practices

## Using the Logger Utility

The app includes a centralized logger utility that ensures logs are only shown in development and not in production.

### Import the Logger

```typescript
import { logger } from '@/lib/utils/logger';
```

### Available Methods

The logger utility provides these methods:

- `logger.log(...args)` - For general logs
- `logger.error(...args)` - For error logs
- `logger.warn(...args)` - For warning logs
- `logger.info(...args)` - For informational logs
- `logger.debug(...args)` - For debug logs

### Usage Examples

```typescript
// Instead of this:
console.log('User data:', userData);

// Use this:
logger.log('User data:', userData);

// For errors:
try {
  // Some code that might throw
} catch (error) {
  // Instead of console.error
  logger.error('Operation failed:', error);
}
```

### Production Error Logging

For critical errors that should be logged even in production, you can use the `prodLogger`:

```typescript
import { prodLogger } from '@/lib/utils/logger';

try {
  // Critical operation
} catch (error) {
  prodLogger.criticalError(error, { context: 'paymentProcessing' });
}
```

## Best Practices

1. **Always use the logger utility** instead of direct console methods
2. **Be descriptive** in your log messages
3. **Include relevant context** in your logs
4. **Use appropriate log levels** (error, warn, info, debug)
5. **Remove unnecessary logs** before pushing to production

## Migrating Existing Code

Use find and replace to convert existing console logs:

```bash
# Find console.log statements
find . -type f -name "*.ts" -o -name "*.tsx" | grep -v "node_modules" | xargs grep -l "console\.log"

# Find console.error statements
find . -type f -name "*.ts" -o -name "*.tsx" | grep -v "node_modules" | xargs grep -l "console\.error"
```

Then replace with the appropriate logger method.