package org.syncmaster.app.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import kotlinx.coroutines.launch
import org.syncmaster.app.data.AuthRepository

import androidx.compose.ui.platform.LocalUriHandler

// TODO: Inject AuthRepository properly
class LoginScreen(private val authRepository: AuthRepository) : Screen {
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val scope = rememberCoroutineScope()
        var errorMessage by remember { mutableStateOf<String?>(null) }
        val uriHandler = LocalUriHandler.current

        Column(
            modifier = Modifier.fillMaxSize().padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text("Welcome to SyncMaster", style = MaterialTheme.typography.headlineMedium)
            Spacer(modifier = Modifier.height(32.dp))

            Button(
                onClick = {
                    // Open Browser for Google Sign-In
                    // Note: In emulator use 10.0.2.2, on device use real IP
                    // TODO: Make this URL configurable
                    val authUrl = "http://10.0.2.2:3000/auth/google?platform=mobile"
                    try {
                        uriHandler.openUri(authUrl)
                    } catch (e: Exception) {
                        errorMessage = "Could not open browser: ${e.message}"
                    }
                },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Sign in with Google")
            }

            Spacer(modifier = Modifier.height(16.dp))

            Button(
                onClick = {
                     scope.launch {
                        try {
                            authRepository.login("apple", "mock-apple-token")
                            navigator.replaceAll(DashboardScreen())
                        } catch (e: Exception) {
                            errorMessage = "Login failed: ${e.message}"
                        }
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary)
            ) {
                Text("Sign in with Apple")
            }

            if (errorMessage != null) {
                Spacer(modifier = Modifier.height(16.dp))
                Text(errorMessage!!, color = MaterialTheme.colorScheme.error)
            }
        }
    }
}
