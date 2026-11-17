import java.util.Properties

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
}

val keystoreProps = Properties().apply {
    val f = rootProject.file("local.properties")
    if (f.exists()) f.inputStream().use { load(it) }
}

android {
    namespace = "com.gaia.signalguard"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.gaia.signalguard"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

kotlin {
    compilerOptions {
        jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17)
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.appcompat)
    implementation(libs.material)
    implementation(libs.androidx.constraintlayout)
    implementation(libs.kotlinx.coroutines.android)

    // Firebase AI Logic + on-device hybrid inference (experimental, opt-in API)
    implementation(libs.firebase.ai)
    implementation(libs.firebase.ai.ondevice)
    implementation(libs.firebase.appcheck.debug)
    implementation(libs.firebase.firestore)
    implementation(libs.firebase.auth)

    testImplementation(libs.junit)
}

// google-services.json is NOT committed: the plugin is applied only when the
// developer drops the Firebase config at app/google-services.json, so CI and
// forks can build and run the unit tests without a Firebase project.
if (file("google-services.json").exists()) {
    apply(plugin = "com.google.gms.google-services")
}
