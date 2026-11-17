package com.gaia.signalguard.engine

import com.google.firebase.ai.FirebaseAI
import com.google.firebase.ai.GenerativeModel
import com.google.firebase.ai.InferenceMode
import com.google.firebase.ai.OnDeviceConfig
import com.google.firebase.ai.type.GenerativeBackend
import com.google.firebase.ai.type.PublicPreviewAPI

/**
 * Signal Guard - score messages on the device, explain the flagged ones in
 * the cloud.
 *
 *  1. on-device pass (`ONLY_ON_DEVICE`): risk score + type, no network;
 *  2. cloud pass (`ONLY_IN_CLOUD`): why it is suspicious + a suggested reply,
 *     only for messages above the threshold.
 */
@OptIn(PublicPreviewAPI::class)
class SignalEngine(
    private val cloudModelName: String = DEFAULT_CLOUD_MODEL,
    private val escalationThreshold: Int = DEFAULT_THRESHOLD,
) {

    var isReady: Boolean = false
        private set

    private var localModel: GenerativeModel? = null
    private var cloudModel: GenerativeModel? = null

    fun configure(ai: FirebaseAI): SignalEngine {
        localModel = ai.generativeModel(
            modelName = cloudModelName,
            onDeviceConfig = OnDeviceConfig(mode = InferenceMode.ONLY_ON_DEVICE),
        )
        cloudModel = ai.generativeModel(
            modelName = cloudModelName,
            onDeviceConfig = OnDeviceConfig(mode = InferenceMode.ONLY_IN_CLOUD),
        )
        isReady = true
        return this
    }

    suspend fun analyse(id: String, sender: String, body: String): ScoredMessage {
        check(isReady) { "engine not configured: call configure(ai) first" }
        val started = System.currentTimeMillis()

        val score = localModel?.let { model ->
            try {
                Parsing.parseLocalOutput(
                    model.generateContent(Prompts.buildLocalPrompt(body))?.text.orEmpty(),
                )
            } catch (t: Throwable) {
                null
            }
        }

        val localLatency = (System.currentTimeMillis() - started).toInt()
        if (score == null || !Parsing.needsEscalation(score, escalationThreshold)) {
            return ScoredMessage(
                id = id,
                sender = sender,
                body = body,
                score = score,
                source = InferenceSource.ON_DEVICE,
                latencyMs = localLatency,
                why = null,
                reply = null,
            )
        }

        val cloud = cloudModel?.generateContent(Prompts.buildCloudPrompt(body))?.text.orEmpty()
        val (why, reply) = Parsing.parseCloudOutput(cloud)
        val totalLatency = (System.currentTimeMillis() - started).toInt()
        return ScoredMessage(
            id = id,
            sender = sender,
            body = body,
            score = score,
            source = InferenceSource.IN_CLOUD,
            latencyMs = totalLatency,
            why = why,
            reply = reply,
        )
    }

    companion object {
        // gemini-2.5-flash was retired on Vertex on 2026-10-20; this stable
        // model needs no billing account on the Gemini Developer API.
        const val DEFAULT_CLOUD_MODEL = "gemini-3.5-flash-lite"
        const val DEFAULT_THRESHOLD = 70
    }
}
