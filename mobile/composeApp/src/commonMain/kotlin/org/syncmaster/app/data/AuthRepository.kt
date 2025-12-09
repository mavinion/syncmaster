package org.syncmaster.app.data

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import org.syncmaster.app.network.SyncmasterApi

class AuthRepository(private val api: SyncmasterApi) {
    private val _userSession = MutableStateFlow<UserSession?>(null)
    val userSession: StateFlow<UserSession?> = _userSession.asStateFlow()

    init {
        // TODO: Load saved session
    }

    suspend fun login(provider: String, token: String) {
        try {
             val response = api.login(provider, token)
             _userSession.value = UserSession(token = response.token, userId = response.userId)
             // TODO: Save session
        } catch (e: Exception) {
            println("Login failed: ${e.message}")
            throw e
        }
    }

    suspend fun handleDeepLinkLogin(token: String, userId: String) {
         // Deep link provides the ready-to-use token, so we just set the session
         _userSession.value = UserSession(token = token, userId = userId)
         // TODO: Save session
         api.setAuthToken(token)
    }

    fun logout() {
        _userSession.value = null
        // TODO: Clear saved session
    }

    fun isLoggedIn(): Boolean {
        return _userSession.value != null
    }
}

data class UserSession(
    val token: String,
    val userId: String
)
