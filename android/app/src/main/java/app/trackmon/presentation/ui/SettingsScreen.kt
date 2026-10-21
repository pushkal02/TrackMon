package app.trackmon.presentation.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CloudSync
import androidx.compose.material.icons.filled.VerifiedUser
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import app.trackmon.TrackMonApp
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

@Composable
fun SettingsScreen(app: TrackMonApp) {
    val scope = rememberCoroutineScope()
    var backendUrl by remember { mutableStateOf("http://10.0.2.2:4000/api/v1") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var statusMessage by remember { mutableStateOf<String?>(null) }
    var isSyncing by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(text = "Settings", style = MaterialTheme.typography.headlineMedium)

        // License & Entitlements Card (Demonstrating Phase 3 unlocked state)
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer)
        ) {
            Row(
                modifier = Modifier.padding(16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Icon(Icons.Default.VerifiedUser, contentDescription = "Active License", tint = MaterialTheme.colorScheme.primary)
                Column {
                    Text(text = "TrackMon Self-Hosted Edition", style = MaterialTheme.typography.titleMedium)
                    Text(
                        text = "All premium features unlocked: Unlimited Accounts, Live Exchange Rates, Cloud Backup, and PDF Export.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSecondaryContainer
                    )
                }
            }
        }

        // Self-Hosted Backend Configuration Card
        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(text = "Self-Hosted API Server", style = MaterialTheme.typography.titleMedium)

                OutlinedTextField(
                    value = backendUrl,
                    onValueChange = {
                        backendUrl = it
                        app.apiClient.setBaseUrl(it)
                    },
                    label = { Text("Backend Base URL") },
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Account Email") },
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = { Text("Password") },
                    modifier = Modifier.fillMaxWidth()
                )

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(onClick = {
                        scope.launch {
                            val res = app.apiClient.login(email, password)
                            res.onSuccess {
                                app.apiClient.setAuthToken(it.token)
                                statusMessage = "Logged in successfully as ${it.user.email}"
                            }.onFailure {
                                statusMessage = "Login failed: ${it.message}"
                            }
                        }
                    }) {
                        Text("Log In")
                    }

                    OutlinedButton(onClick = {
                        scope.launch {
                            val res = app.apiClient.register(email, password)
                            res.onSuccess {
                                app.apiClient.setAuthToken(it.token)
                                statusMessage = "Account registered and logged in!"
                            }.onFailure {
                                statusMessage = "Registration failed: ${it.message}"
                            }
                        }
                    }) {
                        Text("Register")
                    }
                }
            }
        }

        // Cloud Synchronization Card
        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(text = "Cloud Synchronization", style = MaterialTheme.typography.titleMedium)
                Text(
                    text = "Sync local Room database directly with your personal MongoDB backend.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.outline
                )

                Button(
                    onClick = {
                        scope.launch {
                            isSyncing = true
                            try {
                                val localAccounts = app.database.accountDao().getAllAccounts().first()
                                val localTxs = app.database.transactionDao().getAllTransactions().first()

                                val pushRes = app.apiClient.push(
                                    app.trackmon.data.remote.SyncPushRequest(
                                        accounts = localAccounts,
                                        transactions = localTxs
                                    )
                                )

                                pushRes.onSuccess {
                                    val pullRes = app.apiClient.pull()
                                    pullRes.onSuccess { pullData ->
                                        if (pullData.accounts.isNotEmpty()) {
                                            app.database.accountDao().insertAll(pullData.accounts)
                                        }
                                        if (pullData.transactions.isNotEmpty()) {
                                            app.database.transactionDao().insertAll(pullData.transactions)
                                        }
                                        statusMessage = "Sync completed successfully at ${System.currentTimeMillis()}"
                                    }
                                }.onFailure {
                                    statusMessage = "Sync failed: ${it.message}"
                                }
                            } finally {
                                isSyncing = false
                            }
                        }
                    },
                    enabled = !isSyncing,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Default.CloudSync, contentDescription = "Sync Now")
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(if (isSyncing) "Syncing..." else "Sync Now")
                }
            }
        }

        statusMessage?.let {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
            ) {
                Text(text = it, modifier = Modifier.padding(16.dp), style = MaterialTheme.typography.bodyMedium)
            }
        }
    }
}
