package app.calmesh.config

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow

object AppConfig {
    // Default to value from local.properties (via BuildConstants)
    private val _baseUrl = MutableStateFlow(BuildConstants.BUILD_API_URL)
    val baseUrl = _baseUrl.asStateFlow()

    fun updateBaseUrl(newUrl: String) {
        _baseUrl.value = newUrl
    }
}
