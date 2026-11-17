plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    // Applied per-module only when app/google-services.json exists.
    id("com.google.gms.google-services") version "4.4.2" apply false
}
