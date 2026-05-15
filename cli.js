### meridian models --provider swiftrouter [--tool-calling]
Lists available models from SwiftRouter.

Flags:
  --tool-calling    Only show models that are generally good at tool/function calling (recommended for Meridian).

\`\`\`
Output: { provider, base_url, total, filtered_for_tool_calling, models: [{id, owned_by}, ...] }
\`\`\`

### meridian start [--dry-run]
Starts the autonomous agent with cron jobs (management + screening).