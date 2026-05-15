  // ── models ─────────────────────────────────────────────────────
  case "models": {
    const provider = flags.provider || "swiftrouter";

    if (provider === "swiftrouter") {
      const baseUrl = process.env.LLM_BASE_URL || "https://api.swiftrouter.com/v1";
      const apiKey = process.env.LLM_API_KEY;

      if (!apiKey) {
        die("LLM_API_KEY is required to list models from SwiftRouter. Set it in .env");
      }

      try {
        const res = await fetch(`${baseUrl}/models`, {
          headers: {
            "Authorization": `Bearer ${apiKey}`,
          },
        });

        if (!res.ok) {
          const text = await res.text();
          die(`Failed to fetch models from SwiftRouter: ${res.status} ${text}`);
        }

        const data = await res.json();
        const models = (data.data || []).map(m => ({
          id: m.id,
          owned_by: m.owned_by,
        }));

        out({
          provider: "swiftrouter",
          base_url: baseUrl,
          total: models.length,
          models,
        });
      } catch (err) {
        die("Error fetching models: " + err.message);
      }
    } else {
      die(`Provider "${provider}" is not yet supported for 'meridian models'. Currently only 'swiftrouter' is supported.`);
    }
    break;
  }

  default:
    die(`Unknown command: ${subcommand}. Run 'meridian help' for usage.`);
}