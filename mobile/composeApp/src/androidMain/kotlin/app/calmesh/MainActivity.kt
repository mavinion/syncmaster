package app.calmesh

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent

import android.content.Intent
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        handleIntent(intent)
        setContent {
            App()
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleIntent(intent)
    }

    private fun handleIntent(intent: Intent?) {
        val uri = intent?.data
        if (uri != null && uri.scheme == "app.calmesh" && uri.path == "/login-callback") {
            val token = uri.getQueryParameter("token")
            val userId = uri.getQueryParameter("userId")
            
            if (token != null && userId != null) {
                // Pass to Repository
                CoroutineScope(Dispatchers.Main).launch {
                    AppContainer.authRepository.handleDeepLinkLogin(token, userId)
                }
            }
        }
    }
}
