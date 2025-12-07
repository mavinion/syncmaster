plugins {
    alias(libs.plugins.kotlinMultiplatform)
    alias(libs.plugins.androidApplication)
    alias(libs.plugins.jetbrainsCompose)
    alias(libs.plugins.kotlinSerialization)
}

import java.util.Properties
import java.io.File

kotlin {
    applyDefaultHierarchyTemplate()

    androidTarget {
        compilations.all {
            kotlinOptions {
                jvmTarget = "1.8"
            }
        }
    }
    
    listOf(
        iosX64(),
        iosArm64(),
        iosSimulatorArm64()
    ).forEach { iosTarget ->
        iosTarget.binaries.framework {
            baseName = "ComposeApp"
            isStatic = true
        }
    }
    
    sourceSets {
        val commonMain by getting {
            dependencies {
                implementation(compose.runtime)
                implementation(compose.foundation)
                implementation(compose.material3)
                implementation(compose.ui)
                implementation(compose.components.resources)
                implementation(compose.components.uiToolingPreview)
                
                implementation(libs.voyager.navigator)
                implementation(libs.voyager.screenModel)
                implementation(libs.voyager.bottomSheetNavigator)
                implementation(libs.voyager.tabNavigator)
                implementation(libs.voyager.transitions)

                implementation(libs.ktor.client.core)
                implementation(libs.ktor.client.content.negotiation)
                implementation(libs.ktor.serialization.kotlinx.json)
            }
        }
        val androidMain by getting {
            dependencies {
                implementation(libs.androidx.activity.compose)
                implementation(libs.androidx.appcompat)
                implementation(libs.androidx.core.ktx)
                implementation(libs.ktor.client.okhttp)
            }
        }
        val iosMain by getting {
            dependencies {
                implementation(libs.ktor.client.darwin)
            }
        }
    }
}

// Generate BuildConstants.kt
val generateBuildConstants by tasks.registering {
    val outputDir = layout.buildDirectory.dir("generated/kotlin").get().asFile
    val configFile = rootProject.file("mobile/local.properties")
    val properties = Properties()
    if (configFile.exists()) {
        properties.load(configFile.inputStream())
    }
    
    // Default to localhost emulator if not set
    val apiUrl = properties.getProperty("API_URL") ?: "http://10.0.2.2:3000"

    doLast {
        val packageDir = File(outputDir, "org/syncmaster/app/config")
        packageDir.mkdirs()
        
        val File = File(packageDir, "BuildConstants.kt")
        File.writeText("""
            package org.syncmaster.app.config
            
            internal object BuildConstants {
                const val BUILD_API_URL = "$apiUrl"
            }
        """.trimIndent())
    }
}

// Add generated source to commonMain
kotlin.sourceSets.commonMain.get().kotlin.srcDir(layout.buildDirectory.dir("generated/kotlin"))

// Make sure generation happens before compilation
tasks.withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile> {
    dependsOn(generateBuildConstants)
}

android {
    namespace = "org.syncmaster.app"
    compileSdk = libs.versions.android.compileSdk.get().toInt()

    sourceSets["main"].manifest.srcFile("src/androidMain/AndroidManifest.xml")
    sourceSets["main"].res.srcDirs("src/androidMain/res")
    sourceSets["main"].resources.srcDirs("src/commonMain/resources")

    defaultConfig {
        applicationId = "org.syncmaster.app"
        minSdk = libs.versions.android.minSdk.get().toInt()
        targetSdk = libs.versions.android.targetSdk.get().toInt()
        versionCode = 1
        versionName = "1.0"
    }
    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
    buildTypes {
        getByName("release") {
            isMinifyEnabled = false
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }
    dependencies {
        debugImplementation(compose.uiTooling)
    }
}
