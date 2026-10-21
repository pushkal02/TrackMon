package app.trackmon

import android.app.Application
import androidx.room.Room
import app.trackmon.data.local.AppDatabase
import app.trackmon.data.remote.TrackMonApiClient
import app.trackmon.domain.usecase.ComputeAccountBalanceUseCase
import app.trackmon.domain.usecase.IsPremiumUseCase
import app.trackmon.domain.usecase.SaveTransactionUseCase

class TrackMonApp : Application() {

    lateinit var database: AppDatabase
        private set

    lateinit var apiClient: TrackMonApiClient
        private set

    lateinit var isPremiumUseCase: IsPremiumUseCase
        private set

    lateinit var computeBalanceUseCase: ComputeAccountBalanceUseCase
        private set

    lateinit var saveTransactionUseCase: SaveTransactionUseCase
        private set

    override fun onCreate() {
        super.onCreate()

        database = Room.databaseBuilder(
            applicationContext,
            AppDatabase::class.java,
            "trackmon_local.db"
        ).fallbackToDestructiveMigration().build()

        apiClient = TrackMonApiClient(
            baseUrl = BuildConfig.DEFAULT_BACKEND_URL
        )

        isPremiumUseCase = IsPremiumUseCase()
        computeBalanceUseCase = ComputeAccountBalanceUseCase(database.transactionDao())
        saveTransactionUseCase = SaveTransactionUseCase(database.transactionDao())
    }
}
