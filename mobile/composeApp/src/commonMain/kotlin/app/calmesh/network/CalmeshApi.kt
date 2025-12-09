package app.calmesh.network

import io.ktor.client.HttpClient
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.json.Json

class CalmeshApi {
    private val client = HttpClient {
        install(ContentNegotiation) {
            json(Json {
                ignoreUnknownKeys = true
                prettyPrint = true
                isLenient = true
            })
        }
    }


    private var authToken: String? = null

    fun setAuthToken(token: String?) {
        authToken = token
    }

    suspend fun login(provider: String, token: String): AuthResponse {
        // Mock implementation for now
        // val response = client.post("$baseUrl/auth/login") { ... }
        return AuthResponse("mock-token-123", "user-123")
    }

    data class AuthResponse(val token: String, val userId: String)
}
