package app.trackmon.domain.usecase

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flowOf

/**
 * Replaces the original decompiled IsPremiumUseCase (r7 / RevenueCatBillingRepository).
 * In TrackMon (self-hosted rebuild), premium features are permanently unlocked for all users.
 * All feature gates (unlimited accounts, cloud sync, live rates, PDF exports) evaluate to true.
 */
class IsPremiumUseCase {
    operator fun invoke(): Flow<Boolean> {
        return flowOf(true)
    }

    fun isPremiumSync(): Boolean {
        return true
    }
}
