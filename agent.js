      const rawMsg = response.choices[0].message;

      // Handle SwiftRouter / reasoning models that return extra fields
      let finalContent = rawMsg.content || "";
      if (finalContent.includes("<think>")) {
        finalContent = finalContent.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
      }

      const msg = {
        content: finalContent,
        tool_calls: rawMsg.tool_calls || null,
        reasoning_content: rawMsg.reasoning_content || null,
      };

      const invalidToolArgErrors = new Map();

      if (msg.tool_calls) {
        for (const tc of msg.tool_calls) {
          if (tc.function?.arguments) {
            try {
              JSON.parse(tc.function.arguments);
            } catch {
              try {
                tc.function.arguments = JSON.stringify(JSON.parse(jsonrepair(tc.function.arguments)));
                log("warn", `Repaired malformed JSON args for ${tc.function.name}`);
              } catch {
                tc.function.arguments = "{}";
                invalidToolArgErrors.set(tc.id, `Invalid tool arguments for ${tc.function.name}`);
                log("error", `Could not repair JSON for ${tc.function.name}`);
              }
            }
          }
        }
      }

      messages.push(rawMsg); // push original for API compatibility

      if (!msg.tool_calls || msg.tool_calls.length === 0) {
        if (!msg.content) {
          messages.pop();
          log("agent", "Empty response, retrying...");
          continue;
        }
        if (mustUseRealTool && !sawToolCall) {
          noToolRetryCount += 1;
          messages.pop();
          log("agent", `Rejected no-tool final answer (${noToolRetryCount}/2)`);
          if (noToolRetryCount >= 2) {
            return { content: "I couldn't complete that reliably (no tool call). Check logs.", userMessage: goal };
          }
          messages.push({
            role: providerMode === "system" ? "system" : "user",
            content: "You have not used any tool yet. This request requires real tool execution. Call the appropriate tool first.",
          });
          continue;
        }
        log("agent", "Final answer reached");
        return { content: msg.content, userMessage: goal };
      }