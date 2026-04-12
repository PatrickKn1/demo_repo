package com.demo.app.data.remote.api

import com.demo.app.data.remote.model.*
import retrofit2.http.*

interface BackendApi {

    // ── Rolls ──────────────────────────────────────────────

    @GET("api/rolls")
    suspend fun getRolls(
        @Query("userId") userId: String = "local",
        @Query("parentId") parentId: Long? = null
    ): List<RollDto>

    @GET("api/rolls/{id}")
    suspend fun getRoll(@Path("id") id: Long): RollDto

    @POST("api/rolls")
    suspend fun createRoll(@Body roll: RollDto): Map<String, Long>

    @PUT("api/rolls/{id}")
    suspend fun updateRoll(@Path("id") id: Long, @Body roll: RollDto): Map<String, Long>

    @DELETE("api/rolls/{id}")
    suspend fun deleteRoll(@Path("id") id: Long): Map<String, Long>

    @GET("api/rolls/{id}/stats")
    suspend fun getRollStats(@Path("id") id: Long): RollStatsDto

    // ── Entries ────────────────────────────────────────────

    @GET("api/entries")
    suspend fun getEntries(@Query("rollId") rollId: Long): List<EntryDto>

    @POST("api/entries")
    suspend fun createEntry(@Body entry: EntryDto): Map<String, Long>

    @PUT("api/entries/{id}")
    suspend fun updateEntry(@Path("id") id: Long, @Body entry: EntryDto): Map<String, Long>

    @DELETE("api/entries/{id}")
    suspend fun deleteEntry(@Path("id") id: Long): Map<String, Long>

    // ── Math ───────────────────────────────────────────────

    @POST("api/math/calculate")
    suspend fun calculate(@Body request: MathRequest): MathResponse

    // ── Health ─────────────────────────────────────────────

    @GET("api/health")
    suspend fun healthCheck(): Map<String, String>
}
