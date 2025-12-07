package org.syncmaster.app

import androidx.compose.runtime.*
import cafe.adriel.voyager.navigator.Navigator
import cafe.adriel.voyager.transitions.SlideTransition
import org.syncmaster.app.screens.DashboardScreen
import org.syncmaster.app.theme.AppTheme

@Composable
fun App() {
    AppTheme {
        Navigator(DashboardScreen()) { navigator ->
            SlideTransition(navigator)
        }
    }
}
