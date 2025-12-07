package org.syncmaster.app.network

import io.ktor.client.HttpClient
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.json.Json

class SyncmasterApi {
    private val client = HttpClient {
        install(ContentNegotiation) {
            json(Json {
                ignoreUnknownKeys = true
                prettyPrint = true
                isLenient = true
            })
        }
    }

    // TODO: Need a way to configure base URL based on platform/env
    // Android Emulator: 10.0.2.2
    // iOS Simulator: localhost
    private val baseUrl = "http://10.0.2.2:3000" 

    // Placeholder for API methods
    // suspend fun getStatus(userId: String): SyncStatus { ... }
}
