package com.gaia.signalguard

import android.os.Bundle
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.google.firebase.FirebaseApp
import com.google.firebase.ai.FirebaseAI
import com.google.firebase.ai.type.GenerativeBackend
import com.google.firebase.appcheck.FirebaseAppCheck
import com.google.firebase.appcheck.debug.DebugAppCheckProviderFactory
import com.gaia.signalguard.engine.InferenceSource
import com.gaia.signalguard.engine.RiskLevel
import com.gaia.signalguard.engine.ScoredMessage
import com.gaia.signalguard.engine.SignalEngine
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * Signal Guard - a demo inbox scored on the device.
 *
 * Every message gets a risk gauge from the on-device model; only the flagged
 * ones are explained by the cloud model. All messages are fictional.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var engine: SignalEngine
    private lateinit var statusView: TextView
    private lateinit var list: LinearLayout
    private lateinit var scanButton: Button

    private val scope = CoroutineScope(Dispatchers.Main)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        statusView = findViewById(R.id.status)
        list = findViewById(R.id.messages)
        scanButton = findViewById(R.id.scan)
        statusView.text = getString(R.string.status_loading)
        setupFirebase()
        renderMessages(emptyMap())
        scanButton.setOnClickListener { scan() }
    }

    private fun setupFirebase() {
        engine = SignalEngine()
        try {
            FirebaseApp.initializeApp(this)
            FirebaseAppCheck.getInstance()
                .installAppCheckProviderFactory(DebugAppCheckProviderFactory.getInstance())
            val ai = FirebaseAI.getInstance(backend = GenerativeBackend.googleAI())
            engine.configure(ai)
            statusView.text = getString(R.string.status_ready)
        } catch (t: Throwable) {
            statusView.text = getString(R.string.status_no_firebase)
            scanButton.isEnabled = false
        }
    }

    private fun scan() {
        scanButton.isEnabled = false
        scope.launch {
            val results = withContext(Dispatchers.IO) {
                DEMO_MESSAGES.map { message ->
                    try {
                        engine.analyse(message.first, message.second, message.third)
                    } catch (t: Throwable) {
                        ScoredMessage(
                            id = message.first,
                            sender = message.second,
                            body = message.third,
                            score = null,
                            source = InferenceSource.IN_CLOUD,
                            latencyMs = 0,
                            why = "error: ${t.message}",
                            reply = null,
                        )
                    }
                }
            }
            val flagged = results.count { it.score?.risk ?: 0 >= 70 }
            statusView.text = getString(R.string.status_scanned, results.size, flagged)
            renderMessages(results.associateBy { it.id })
            scanButton.isEnabled = true
        }
    }

    private fun renderMessages(results: Map<String, ScoredMessage>) {
        list.removeAllViews()
        for (message in DEMO_MESSAGES) {
            list.addView(buildRow(results[message.first], message.second, message.third))
        }
    }

    private fun buildRow(result: ScoredMessage?, sender: String, body: String): LinearLayout {
        val row = LinearLayout(this)
        row.orientation = LinearLayout.VERTICAL
        row.setPadding(0, 20, 0, 20)

        val header = TextView(this)
        header.text = sender
        header.textSize = 15f
        row.addView(header)

        val bodyView = TextView(this)
        bodyView.text = body
        bodyView.alpha = 0.85f
        row.addView(bodyView)

        val gauge = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal)
        gauge.max = 100
        val risk = result?.score?.risk ?: 0
        gauge.progress = risk
        row.addView(gauge)

        val meta = TextView(this)
        meta.text = metaText(result, risk)
        meta.textSize = 12f
        meta.alpha = 0.85f
        row.addView(meta)

        val why = TextView(this)
        why.text = result?.why ?: ""
        why.textSize = 13f
        why.setTextColor(getColor(R.color.warn))
        row.addView(why)

        val reply = TextView(this)
        reply.text = result?.reply?.let { getString(R.string.suggested_reply, it) } ?: ""
        reply.textSize = 13f
        reply.alpha = 0.9f
        row.addView(reply)

        return row
    }

    private fun metaText(result: ScoredMessage?, risk: Int): String {
        if (result == null) return getString(R.string.meta_pending)
        val level = result.score?.level ?: RiskLevel.LOW
        val source = if (result.source == InferenceSource.ON_DEVICE) {
            getString(R.string.badge_local)
        } else {
            getString(R.string.badge_cloud)
        }
        return "$source · ${result.latencyMs} ms · risk $risk (${level.name.lowercase()})"
    }

    companion object {
        /** Fictional demo messages: no real person, no real PII. */
        private val DEMO_MESSAGES = listOf(
            Triple(
                "m1", "Unknown number +33 6 12 34 56 78",
                "URGENT: your account is suspended. Pay 49 EUR now at http://secure-verif1.xyz to keep access.",
            ),
            Triple(
                "m2", "Amina Diallo - supplier",
                "Invoice 2026-118 is ready, the amount is unchanged. Can you confirm receipt before Friday?",
            ),
            Triple(
                "m3", "Bank (spoofed)",
                "Dear client, a new beneficiary has been added to your account. Call +33 1 44 55 66 77 to cancel.",
            ),
            Triple(
                "m4", "Team - canteen",
                "The canteen menu for Thursday is posted in the usual place. See you there!",
            ),
        )
    }
}
