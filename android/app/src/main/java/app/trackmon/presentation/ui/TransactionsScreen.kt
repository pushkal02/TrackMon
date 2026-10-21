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
import kotlinx.coroutines.launch

@Composable
fun TransactionsScreen(app: TrackMonApp) {
    val transactions by app.database.transactionDao().getAllTransactions().collectAsState(initial = emptyList())
    val accounts by app.database.accountDao().getActiveAccounts().collectAsState(initial = emptyList())
    val scope = rememberCoroutineScope()
    var showDialog by remember { mutableStateOf(false) }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(onClick = { showDialog = true }) {
                Icon(Icons.Default.Add, contentDescription = "Add Transaction")
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
                Text(text = "All Transactions", style = MaterialTheme.typography.headlineMedium)
                Spacer(modifier = Modifier.height(8.dp))
            }

            items(transactions) { tx ->
                Card(modifier = Modifier.fillMaxWidth()) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(text = tx.type, style = MaterialTheme.typography.titleMedium)
                            tx.note?.let {
                                Text(text = it, style = MaterialTheme.typography.bodySmall)
                            }
                        }
                        Text(
                            text = "$${tx.accountAmount ?: tx.mainCurrencyAmount}",
                            style = MaterialTheme.typography.titleLarge,
                            color = if (tx.type == "EXPENSE") MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.primary
                        )
                    }
                }
            }
        }
    }

    if (showDialog) {
        var type by remember { mutableStateOf("EXPENSE") }
        var amount by remember { mutableStateOf("") }
        var note by remember { mutableStateOf("") }
        var selectedAccountId by remember { mutableStateOf(accounts.firstOrNull()?.id ?: 0L) }
        var selectedToAccountId by remember { mutableStateOf(accounts.getOrNull(1)?.id ?: 0L) }
        var errorMessage by remember { mutableStateOf<String?>(null) }

        AlertDialog(
            onDismissRequest = { showDialog = false },
            title = { Text(text = "Add Transaction") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        FilterChip(
                            selected = type == "EXPENSE",
                            onClick = { type = "EXPENSE" },
                            label = { Text("Expense") }
                        )
                        FilterChip(
                            selected = type == "INCOME",
                            onClick = { type = "INCOME" },
                            label = { Text("Income") }
                        )
                        FilterChip(
                            selected = type == "TRANSFER",
                            onClick = { type = "TRANSFER" },
                            label = { Text("Transfer") }
                        )
                    }

                    OutlinedTextField(
                        value = amount,
                        onValueChange = { amount = it },
                        label = { Text("Amount") },
                        modifier = Modifier.fillMaxWidth()
                    )

                    OutlinedTextField(
                        value = note,
                        onValueChange = { note = it },
                        label = { Text("Note / Description") },
                        modifier = Modifier.fillMaxWidth()
                    )

                    errorMessage?.let {
                        Text(text = it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
                    }
                }
            },
            confirmButton = {
                Button(onClick = {
                    scope.launch {
                        val result = app.saveTransactionUseCase(
                            type = type,
                            mainCurrencyAmount = amount,
                            accountId = if (selectedAccountId > 0) selectedAccountId else accounts.firstOrNull()?.id,
                            accountAmount = amount,
                            toAccountId = if (type == "TRANSFER") (if (selectedToAccountId > 0) selectedToAccountId else accounts.getOrNull(1)?.id) else null,
                            toAccountAmount = if (type == "TRANSFER") amount else null,
                            note = note.ifBlank { null }
                        )
                        when (result) {
                            is app.trackmon.domain.usecase.SaveTransactionResult.Success -> {
                                showDialog = false
                            }
                            is app.trackmon.domain.usecase.SaveTransactionResult.Error -> {
                                errorMessage = result.message
                            }
                        }
                    }
                }) {
                    Text("Save")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}
