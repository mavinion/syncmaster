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

    // Dynamic base URL from AppConfig
    private val baseUrl: String
        get() = org.syncmaster.app.config.AppConfig.baseUrl.value 

    // Placeholder for API methods
    // suspend fun getStatus(userId: String): SyncStatus { ... }
}
