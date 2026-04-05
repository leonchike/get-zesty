# Sentry Error Tracking Setup

This document explains how to set up and use Sentry error tracking for the Recipe Manager MCP server.

## Overview

Sentry provides real-time error tracking and performance monitoring for the MCP server. When enabled, all exceptions are automatically captured with detailed context including:

- Tool name that encountered the error
- Function parameters that caused the error
- HTTP status codes and response details
- Stack traces and error messages
- Environment and release information

## Setup

### 1. Create a Sentry Account

1. Go to [https://sentry.io/](https://sentry.io/)
2. Sign up for a free account (includes 5,000 errors/month)
3. Create a new project
   - Choose **Python** as the platform
   - Name it "Recipe Manager MCP" or similar

### 2. Get Your DSN

After creating the project:

1. Go to **Settings** → **Projects** → **[Your Project]**
2. Click on **Client Keys (DSN)**
3. Copy the DSN (looks like: `https://xxx@oXXX.ingest.sentry.io/XXX`)

### 3. Configure Environment Variables

Update your `/mcp/.env` file:

```env
# Sentry Error Tracking
SENTRY_DSN="https://your-sentry-dsn-here"
SENTRY_ENVIRONMENT=production  # or development, staging, etc.
SENTRY_RELEASE=recipe-manager-mcp@1.0.3
```

**Important:**
- Set `SENTRY_DSN` to enable Sentry (leave empty to disable)
- Use appropriate `SENTRY_ENVIRONMENT` for your deployment
- Update `SENTRY_RELEASE` when deploying new versions

### 4. Install Sentry SDK

If not already installed:

```bash
cd mcp
pip install -r requirements.txt  # Includes sentry-sdk
```

### 5. Test the Integration

Run the MCP server and trigger an error:

```bash
cd mcp
python main.py
```

You should see in the logs:
```
[MCP Server] Sentry initialized successfully
```

## What Gets Tracked

### Automatic Error Capture

All exceptions in MCP tools are automatically captured with context:

**HTTP Errors (4xx, 5xx):**
- Status code
- Response text (first 500 chars)
- Request URL
- Tool name and parameters

**General Exceptions:**
- Stack trace
- Error type and message
- Tool name and parameters
- User ID (if provided)

### Error Context

Each error includes:

```python
{
    "tool": "create_recipe",  # Which tool failed
    "params": {               # Parameters passed to the tool
        "title": "Test Recipe",
        "cuisine_type": "Italian",
        "user_id": "clz..."
    },
    "http_error": {           # For HTTP errors
        "status_code": 500,
        "response_text": "...",
        "url": "http://..."
    }
}
```

## Viewing Errors in Sentry

### Dashboard

Access your Sentry dashboard at: `https://sentry.io/organizations/[your-org]/issues/`

### Error Details

Click on any error to see:

1. **Overview**
   - Error message and type
   - Number of occurrences
   - Affected users
   - First seen / Last seen timestamps

2. **Breadcrumbs**
   - Sequence of events leading to the error
   - HTTP requests made
   - Function calls

3. **Tags**
   - Environment (production, development)
   - Release version
   - Tool name

4. **Context**
   - Function parameters
   - HTTP error details
   - User information

5. **Stack Trace**
   - Full Python stack trace
   - Source code context

### Filters and Search

```
# Find all errors from a specific tool
tool:create_recipe

# Find HTTP 500 errors
http.status_code:500

# Find errors in production
environment:production

# Find errors for a specific release
release:recipe-manager-mcp@1.0.3
```

## Performance Monitoring

Sentry also captures performance data:

- **Traces Sample Rate**: 100% (all requests)
- **Profiles Sample Rate**: 100% (all function calls)

View performance metrics:
1. Go to **Performance** tab in Sentry
2. See average response times per tool
3. Identify slow operations
4. Track performance regressions

## Alerts

Configure alerts to get notified of critical errors:

1. Go to **Alerts** → **Create Alert**
2. Choose alert type:
   - **Issues**: Alert on new/regressed errors
   - **Metric**: Alert on error rate thresholds
3. Set notification channels:
   - Email
   - Slack
   - PagerDuty
   - Discord
   - Webhooks

### Recommended Alerts

**Critical Errors:**
```
Alert when: Number of events > 10 in 5 minutes
For issue: priority:high
Action: Send email + Slack notification
```

**New Errors:**
```
Alert when: A new issue is created
For issue: is:unresolved
Action: Send Slack notification
```

**High Error Rate:**
```
Alert when: Error rate > 5% in 10 minutes
Action: Send email + PagerDuty
```

## Disabling Sentry

To disable Sentry error tracking:

### Option 1: Remove DSN
```env
# In /mcp/.env
SENTRY_DSN=  # Empty value
```

### Option 2: Comment Out
```env
# SENTRY_DSN="https://..."
```

When disabled, errors will be logged to console instead:
```
[Error] HTTPStatusError: 404 - Recipe not found
```

## Best Practices

### 1. Use Environments

Separate errors by environment:

```env
# Development
SENTRY_ENVIRONMENT=development

# Staging
SENTRY_ENVIRONMENT=staging

# Production
SENTRY_ENVIRONMENT=production
```

### 2. Tag Releases

Always update the release version when deploying:

```env
SENTRY_RELEASE=recipe-manager-mcp@1.0.3
SENTRY_RELEASE=recipe-manager-mcp@1.0.4  # After update
```

This allows you to:
- Track errors per version
- Identify regressions
- Roll back if needed

### 3. Set Up Alerts

Configure alerts for:
- Critical errors (500s)
- New error types
- High error rates
- Performance degradation

### 4. Review Regularly

- Check Sentry dashboard daily
- Review new error types
- Track error trends
- Fix high-frequency errors first

### 5. Sensitive Data

Sentry automatically scrubs sensitive data, but be cautious with:
- API keys (already excluded from error context)
- User passwords (never logged)
- Personal information

## Troubleshooting

### Sentry Not Initializing

**Issue:** No "[MCP Server] Sentry initialized successfully" message

**Solutions:**
1. Check `SENTRY_DSN` is set in `.env`
2. Verify DSN format is correct
3. Ensure `python-dotenv` is installed
4. Check for `.env` file in correct location (`/mcp/.env`)

### Errors Not Appearing in Sentry

**Issue:** Errors occur but don't show in Sentry dashboard

**Solutions:**
1. Verify Sentry is initialized (check logs)
2. Check internet connection (Sentry requires network access)
3. Verify DSN is correct (test at sentry.io)
4. Check Sentry service status: [status.sentry.io](https://status.sentry.io)
5. Review Sentry project settings (ensure not paused)

### Too Many Errors

**Issue:** Quota exceeded or too much noise

**Solutions:**
1. Use sampling: `traces_sample_rate=0.1` (10%)
2. Set up filters to ignore known errors
3. Upgrade Sentry plan if needed
4. Fix high-frequency errors first

## Cost Considerations

### Free Tier
- 5,000 errors/month
- 10,000 performance units/month
- 1 project
- 30-day data retention

### When to Upgrade
- Exceeding monthly quotas
- Need longer data retention
- Want more team members
- Require advanced features (source maps, releases)

### Tips to Stay Under Quota
1. Use error sampling in development
2. Set up filters for known/expected errors
3. Fix high-frequency errors quickly
4. Use different projects for dev/prod

## Additional Resources

- **Sentry Documentation**: [docs.sentry.io](https://docs.sentry.io/)
- **Python SDK Guide**: [docs.sentry.io/platforms/python/](https://docs.sentry.io/platforms/python/)
- **Best Practices**: [docs.sentry.io/product/best-practices/](https://docs.sentry.io/product/best-practices/)
- **Support**: support@sentry.io

---

**Version:** 1.0.3
**Last Updated:** 2025-10-20
**Status:** ✅ Fully Configured
