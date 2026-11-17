package com.gaia.signalguard.engine

/**
 * Prompts for the two passes.
 *
 * The on-device pass scores the message locally and answers with two lines:
 *   RISK: 72
 *   TYPE: phishing
 * The cloud pass only runs for flagged messages and explains the verdict.
 */
object Prompts {

    fun buildLocalPrompt(message: String): String {
        return listOf(
            "You are an on-device message filter.",
            "Score how likely the MESSAGE is a scam, phishing or dangerous request.",
            "Answer with exactly two lines, no markdown:",
            "RISK: a number between 0 and 100 (0 = harmless, 100 = certainly a scam).",
            "TYPE: one of phishing, scam, spam, suspicious or legit.",
            "",
            "MESSAGE: $message",
        ).joinToString("\n")
    }

    fun buildCloudPrompt(message: String): String {
        return listOf(
            "You explain why a message was flagged as suspicious.",
            "Answer with exactly two lines, no markdown:",
            "WHY: one short sentence naming the concrete red flags (urgency, fake domain, unusual payment request...).",
            "REPLY: one short suggested reply for the recipient, or a warning to ignore the message.",
            "",
            "MESSAGE: $message",
        ).joinToString("\n")
    }
}
