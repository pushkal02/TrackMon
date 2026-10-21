package app.trackmon.data.remote

import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.engine.okhttp.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.request.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

@Serializable
data class AuthRequestDto(
    val email: String,
    val password: String,
    val currencyCode: String? = null
)

@Serializable
data class AuthResponseDto(
    val token: String,
    val user: UserDto
)

@Serializable
data class UserDto(
    val id: String,
    val email: String,
    val currencyCode: String
)

@Serializable
data class SyncPullResponse(
    val serverTimestamp: Long,
    val accounts: List<app.trackmon.data.local.entity.AccountEntity>,
    val transactions: List<app.trackmon.data.local.entity.TransactionEntity>,
    val categories: List<app.trackmon.data.local.entity.CategoryEntity>,
    val subcategories: List<app.trackmon.data.local.entity.SubcategoryEntity>,
    val budgets: List<app.trackmon.data.local.entity.BudgetEntity>
)

@Serializable
data class SyncPushRequest(
    val accounts: List<app.trackmon.data.local.entity.AccountEntity> = emptyList(),
    val transactions: List<app.trackmon.data.local.entity.TransactionEntity> = emptyList(),
    val categories: List<app.trackmon.data.local.entity.CategoryEntity> = emptyList(),
    val subcategories: List<app.trackmon.data.local.entity.SubcategoryEntity> = emptyList(),
    val budgets: List<app.trackmon.data.local.entity.BudgetEntity> = emptyList()
)

@Serializable
data class SyncPushResponse(
    val success: Boolean,
    val processedAt: Long
)

class TrackMonApiClient(
    private var baseUrl: String = "http://10.0.2.2:4000/api/v1",
    private var authToken: String? = null
) {
    private val client = HttpClient(OkHttp) {
        install(ContentNegotiation) {
            json(Json {
                ignoreUnknownKeys = true
                isLenient = true
                encodeDefaults = true
            })
        }
    }

    fun setBaseUrl(url: String) {
        this.baseUrl = url.trimEnd('/')
    }

    fun setAuthToken(token: String?) {
        this.authToken = token
    }

    suspend fun register(email: String, password: String, currencyCode: String = "USD"): Result<AuthResponseDto> = runCatching {
        client.post("$baseUrl/auth/register") {
            contentType(ContentType.Application.Json)
            setBody(AuthRequestDto(email, password, currencyCode))
        }.body()
    }

    suspend fun login(email: String, password: String): Result<AuthResponseDto> = runCatching {
        client.post("$baseUrl/auth/login") {
            contentType(ContentType.Application.Json)
            setBody(AuthRequestDto(email, password))
        }.body()
    }

    suspend fun pull(since: Long = 0): Result<SyncPullResponse> = runCatching {
        client.get("$baseUrl/sync/pull") {
            parameter("since", since)
            authToken?.let { header(HttpHeaders.Authorization, "Bearer $it") }
        }.body()
    }

    suspend fun push(data: SyncPushRequest): Result<SyncPushResponse> = runCatching {
        client.post("$baseUrl/sync/push") {
            contentType(ContentType.Application.Json)
            authToken?.let { header(HttpHeaders.Authorization, "Bearer $it") }
            setBody(data)
        }.body()
    }
}
