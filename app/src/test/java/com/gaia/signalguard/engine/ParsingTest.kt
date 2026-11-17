package com.gaia.signalguard.engine

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class ParsingTest {

    @Test
    fun readsTheLocalScore() {
        val raw = "RISK: 82\nTYPE: phishing"
        val score = Parsing.parseLocalOutput(raw)
        assertEquals(82, score.risk)
        assertEquals("phishing", score.type)
        assertEquals(RiskLevel.HIGH, score.level)
    }

    @Test
    fun riskLevelsFollowTheScore() {
        assertEquals(RiskLevel.LOW, LocalScore(10, "legit").level)
        assertEquals(RiskLevel.MEDIUM, LocalScore(50, "suspicious").level)
        assertEquals(RiskLevel.HIGH, LocalScore(90, "scam").level)
    }

    @Test
    fun clampsAndRejectsBadNumbers() {
        assertEquals(100, Parsing.parseRisk("150"))
        assertEquals(0, Parsing.parseRisk("-12"))
        assertEquals(0, Parsing.parseRisk("not-a-number"))
        assertEquals(72, Parsing.parseRisk("72%"))
    }

    @Test
    fun missingSectionsDoNotCrash() {
        val score = Parsing.parseLocalOutput("no idea")
        assertEquals(0, score.risk)
        assertEquals("unknown", score.type)
    }

    @Test
    fun escalatesOnlyAboveTheThreshold() {
        assertFalse(Parsing.needsEscalation(LocalScore(69, "suspicious"), 70))
        assertTrue(Parsing.needsEscalation(LocalScore(70, "suspicious"), 70))
    }

    @Test
    fun readsTheCloudExplanation() {
        val (why, reply) = Parsing.parseCloudOutput(
            "WHY: urgency plus a lookalike domain.\nREPLY: Ignore and report the message.",
        )
        assertEquals("urgency plus a lookalike domain.", why)
        assertEquals("Ignore and report the message.", reply)
    }

    @Test
    fun emptyCloudLinesStayNull() {
        val (why, reply) = Parsing.parseCloudOutput("WHY: \nREPLY:")
        assertNull(why)
        assertNull(reply)
    }
}
