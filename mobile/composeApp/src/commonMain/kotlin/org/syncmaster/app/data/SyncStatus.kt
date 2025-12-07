package org.syncmaster.app.data

import kotlinx.serialization.Serializable

@Serializable
data class SyncStatus(
    val active: Boolean,
    val lastSyncTime: String?, // Using String for simplicity, can handle Instant later
    val google: Boolean,
    val apple: Boolean
)
