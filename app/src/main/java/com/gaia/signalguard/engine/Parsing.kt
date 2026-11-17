package com.gaia.signalguard.engine

/** How risky a message looks, from the on-device score. */
enum class RiskLevel { LOW, MEDIUM, HIGH }

/** Result of the on-device scoring pass. */
data class LocalScore(
    val risk: Int,
    val type: String,
) {
    val level: RiskLevel
        get() = when {
            risk >= 70 -> RiskLevel.HIGH
            risk >= 35 -> RiskLevel.MEDIUM
            else -> RiskLevel.LOW
        }
}

/** Where an inference actually ran. */
enum class InferenceSource { ON_DEVICE, IN_CLOUD }

/** One scored message, with the explanation when the cloud was involved. */
data class ScoredMessage(
    val id: String,
    val sender: String,
    val body: String,
    val score: LocalScore?,
    val source: InferenceSource,
    val latencyMs: Int,
    val why: String?,
    val reply: String?,
)

object Parsing {

    /** Parse the two lines returned by the on-device model. */
    fun parseLocalOutput(raw: String): LocalScore {
        var risk = 0
        var type = "unknown"
        for (line in raw.lines()) {
            val clean = line.trim()
            when {
                clean.startsWith("RISK:", ignoreCase = true) ->
                    risk = parseRisk(valueAfter(clean))
                clean.startsWith("TYPE:", ignoreCase = true) ->
                    type = valueAfter(clean).lowercase().ifEmpty { "unknown" }
            }
        }
        return LocalScore(risk, type)
    }

    /** Parse the two lines returned by the cloud model. */
    fun parseCloudOutput(raw: String): Pair<String?, String?> {
        var why: String? = null
        var reply: String? = null
        for (line in raw.lines()) {
            val clean = line.trim()
            when {
                clean.startsWith("WHY:", ignoreCase = true) ->
                    why = valueAfter(clean).ifEmpty { null }
                clean.startsWith("REPLY:", ignoreCase = true) ->
                    reply = valueAfter(clean).ifEmpty { null }
            }
        }
        return why to reply
    }

    /** Clamp a risk value into [0, 100]; unparseable values mean "no score". */
    fun parseRisk(raw: String): Int {
        val value = raw.trim().removeSuffix("%").toDoubleOrNull() ?: return 0
        return value.toInt().coerceIn(0, 100)
    }

    /** Only clearly risky messages are worth a cloud explanation. */
    fun needsEscalation(score: LocalScore, threshold: Int): Boolean {
        return score.risk >= threshold
    }

    private fun valueAfter(line: String): String {
        val index = line.indexOf(':')
        if (index < 0) return ""
        return line.substring(index + 1).trim()
    }
}
