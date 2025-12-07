package org.syncmaster.app.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Settings
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow

class DashboardScreen : Screen {
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Syncmaster") },
                    actions = {
                        IconButton(onClick = { navigator.push(SettingsScreen()) }) {
                            Icon(Icons.Default.Settings, contentDescription = "Settings")
                        }
                    }
                )
            }
        ) { padding ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(16.dp)
            ) {
                // Sync Status Card
                Card(
                    elevation = 4.dp,
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(Modifier.padding(16.dp)) {
                        Text("Sync Status", style = MaterialTheme.typography.h6)
                        Spacer(Modifier.height(8.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(12.dp)
                                    .background(Color.Green, RoundedCornerShape(50))
                            )
                            Spacer(Modifier.width(8.dp))
                            Text("Active", fontSize = 18.sp, fontWeight = FontWeight.Bold)
                        }
                        Spacer(Modifier.height(4.dp))
                        Text("Last Synced: 2 mins ago", style = MaterialTheme.typography.caption)
                    }
                }

                Spacer(Modifier.height(24.dp))

                // Quick Actions
                Button(
                    onClick = { /* TODO: Trigger sync */ },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Default.Refresh, contentDescription = null)
                    Spacer(Modifier.width(8.dp))
                    Text("Sync Now")
                }

                Spacer(Modifier.height(24.dp))

                // Recent Activity
                Text("Recent Activity", style = MaterialTheme.typography.h6)
                Spacer(Modifier.height(8.dp))
                
                val recentLogs = listOf(
                    "Synced 'Meeting with Team'",
                    "Updated 'Dentist Appointment'",
                    "No changes found"
                )
                
                LazyColumn {
                    items(recentLogs) { log ->
                        Card(
                            modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                            elevation = 2.dp
                        ) {
                            Text(
                                text = log,
                                modifier = Modifier.padding(12.dp),
                                style = MaterialTheme.typography.body2
                            )
                        }
                    }
                    item {
                        TextButton(
                            onClick = { navigator.push(LogsScreen()) },
                            modifier = Modifier.align(Alignment.CenterHorizontally)
                        ) {
                            Text("View All Logs")
                        }
                    }
                }
            }
        }
    }
}
