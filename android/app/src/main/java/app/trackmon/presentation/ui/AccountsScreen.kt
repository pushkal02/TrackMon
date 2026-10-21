package app.trackmon.presentation.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import app.trackmon.TrackMonApp
import app.trackmon.data.local.entity.AccountEntity
import kotlinx.coroutines.launch
import java.math.BigDecimal

@Composable
fun AccountsScreen(app: TrackMonApp) {
    val accounts by app.database.accountDao().getAllAccounts().collectAsState(initial = emptyList())
    val transactions by app.database.transactionDao().getAllTransactions().collectAsState(initial = emptyList())
    val scope = rememberCoroutineScope()
    var showAddDialog by remember { mutableStateOf(false) }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(onClick = { showAddDialog = true }) {
                Icon(Icons.Default.Add, contentDescription = "Add Account")
            }
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            item {
                Text(text = "Accounts", style = MaterialTheme.typography.headlineMedium)
                Text(
                    text = "Unlimited Accounts Unlocked",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.primary
                )
                Spacer(modifier = Modifier.height(8.dp))
            }

            items(accounts) { acc ->
                var currentBalance by remember { mutableStateOf<BigDecimal?>(null) }

                LaunchedEffect(acc, transactions) {
                    currentBalance = app.computeBalanceUseCase(acc.id, acc.initialBalance)
                }

                Card(modifier = Modifier.fillMaxWidth()) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(text = acc.name, style = MaterialTheme.typography.titleMedium)
                            Text(
                                text = "${acc.type} • ${acc.currencyCode}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.outline
                            )
                        }
                        Text(
                            text = "$${currentBalance?.toPlainString() ?: acc.initialBalance}",
                            style = MaterialTheme.typography.titleLarge
                        )
                    }
                }
            }
        }
    }

    if (showAddDialog) {
        var name by remember { mutableStateOf("") }
        var initialBalance by remember { mutableStateOf("0.00") }
        var currencyCode by remember { mutableStateOf("USD") }
        var type by remember { mutableStateOf("REGULAR") }

        AlertDialog(
            onDismissRequest = { showAddDialog = false },
            title = { Text("Add Account") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = name,
                        onValueChange = { name = it },
                        label = { Text("Account Name") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = initialBalance,
                        onValueChange = { initialBalance = it },
                        label = { Text("Initial Balance") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = currencyCode,
                        onValueChange = { currencyCode = it.uppercase() },
                        label = { Text("Currency Code") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(onClick = {
                    if (name.isNotBlank()) {
                        scope.launch {
                            app.database.accountDao().insertOrUpdate(
                                AccountEntity(
                                    name = name.trim(),
                                    type = type,
                                    currencyCode = currencyCode.ifBlank { "USD" },
                                    initialBalance = initialBalance.ifBlank { "0.00" }
                                )
                            )
                            showAddDialog = false
                        }
                    }
                }) {
                    Text("Create")
                }
            },
            dismissButton = {
                TextButton(onClick = { showAddDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}
