package app.trackmon.presentation.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import app.trackmon.TrackMonApp
import java.math.BigDecimal

@Composable
fun DashboardScreen(app: TrackMonApp) {
    val accounts by app.database.accountDao().getActiveAccounts().collectAsState(initial = emptyList())
    val transactions by app.database.transactionDao().getAllTransactions().collectAsState(initial = emptyList())

    // Dynamically compute Net Worth
    var netWorth by remember { mutableStateOf(BigDecimal.ZERO) }

    LaunchedEffect(accounts, transactions) {
        var total = BigDecimal.ZERO
        for (acc in accounts) {
            if (acc.includeBalance) {
                val bal = app.computeBalanceUseCase(acc.id, acc.initialBalance)
                total = total.add(bal)
            }
        }
        netWorth = total
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
            ) {
                Column(modifier = Modifier.padding(24.dp)) {
                    Text(text = "Total Net Worth", style = MaterialTheme.typography.titleMedium)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "$${netWorth.toPlainString()}",
                        style = MaterialTheme.typography.headlineLarge,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                }
            }
        }

        item {
            Text(text = "Recent Transactions", style = MaterialTheme.typography.titleLarge)
        }

        if (transactions.isEmpty()) {
            item {
                Text(
                    text = "No transactions recorded yet.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.outline
                )
            }
        } else {
            items(transactions.take(10)) { tx ->
                Card(modifier = Modifier.fillMaxWidth()) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(text = tx.type, style = MaterialTheme.typography.titleSmall)
                            tx.note?.let {
                                Text(text = it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.outline)
                            }
                        }
                        Text(
                            text = if (tx.type == "EXPENSE") "-$${tx.accountAmount ?: tx.mainCurrencyAmount}" else "+$${tx.accountAmount ?: tx.mainCurrencyAmount}",
                            style = MaterialTheme.typography.bodyLarge,
                            color = if (tx.type == "EXPENSE") MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.primary
                        )
                    }
                }
            }
        }
    }
}
