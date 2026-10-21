package app.trackmon.presentation.main

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import app.trackmon.TrackMonApp
import app.trackmon.presentation.ui.AccountsScreen
import app.trackmon.presentation.ui.DashboardScreen
import app.trackmon.presentation.ui.SettingsScreen
import app.trackmon.presentation.ui.TransactionsScreen

enum class Screen(val title: String, val icon: ImageVector) {
    Dashboard("Home", Icons.Default.Dashboard),
    Transactions("Transactions", Icons.Default.ReceiptLong),
    Accounts("Accounts", Icons.Default.AccountBalanceWallet),
    Settings("Settings", Icons.Default.Settings)
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val app = application as TrackMonApp

        setContent {
            MaterialTheme(colorScheme = darkColorScheme()) {
                var currentScreen by remember { mutableStateOf(Screen.Dashboard) }

                Scaffold(
                    bottomBar = {
                        NavigationBar {
                            Screen.values().forEach { screen ->
                                NavigationBarItem(
                                    selected = currentScreen == screen,
                                    onClick = { currentScreen = screen },
                                    icon = { Icon(screen.icon, contentDescription = screen.title) },
                                    label = { Text(screen.title) }
                                )
                            }
                        }
                    }
                ) { innerPadding ->
                    Box(modifier = Modifier.padding(innerPadding)) {
                        when (currentScreen) {
                            Screen.Dashboard -> DashboardScreen(app)
                            Screen.Transactions -> TransactionsScreen(app)
                            Screen.Accounts -> AccountsScreen(app)
                            Screen.Settings -> SettingsScreen(app)
                        }
                    }
                }
            }
        }
    }
}
