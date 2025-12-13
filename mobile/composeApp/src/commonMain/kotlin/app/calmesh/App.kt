package app.calmesh

import androidx.compose.runtime.*
import cafe.adriel.voyager.navigator.Navigator
import cafe.adriel.voyager.transitions.SlideTransition
import app.calmesh.data.AuthRepository
import app.calmesh.network.CalmeshApi
import app.calmesh.screens.DashboardScreen
import app.calmesh.screens.LoginScreen
import app.calmesh.theme.AppTheme

// Simple helper to provide dependencies
object AppContainer {
    val api = CalmeshApi()
    val authRepository = AuthRepository(api)
}

@Composable
fun App() {
    AppTheme {
        // Collect session state
        val userSession by AppContainer.authRepository.userSession.collectAsState()
        
        // Determine start screen
        // Note: For a smoother experience, you might want a Splash screen while loading session
        val startScreen = if (userSession != null) {
            DashboardScreen()
        } else {
            LoginScreen(AppContainer.authRepository)
        }

        Navigator(startScreen) { navigator ->
            // Update navigator if session changes? 
            // Better: LoginScreen navigates on success. Logout navigates to Login.
            // But we need to react to session changes if they happen externally (e.g. token expiry)
            
            // For now, let's stick to simple navigation
            SlideTransition(navigator)
        }
    }
}
