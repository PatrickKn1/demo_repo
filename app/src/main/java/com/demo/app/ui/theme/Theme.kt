package com.demo.app.ui.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

// Brand palette
val Purple = Color(0xFF6C63FF)
val PurpleDark = Color(0xFF5A52E0)
val Green = Color(0xFF4CAF50)
val GreenLight = Color(0xFF66BB6A)
val Red = Color(0xFFEF5350)
val RedLight = Color(0xFFE57373)
val SurfaceDark = Color(0xFF121212)
val SurfaceVariantDark = Color(0xFF1E1E2E)
val CardDark = Color(0xFF252538)
val OnSurfaceDark = Color(0xFFE0E0E0)
val OnSurfaceVariantDark = Color(0xFF9E9E9E)

private val DarkColorScheme = darkColorScheme(
    primary = Purple,
    onPrimary = Color.White,
    secondary = GreenLight,
    tertiary = PurpleDark,
    background = SurfaceDark,
    surface = SurfaceVariantDark,
    surfaceVariant = CardDark,
    onBackground = OnSurfaceDark,
    onSurface = OnSurfaceDark,
    onSurfaceVariant = OnSurfaceVariantDark,
    error = Red
)

private val LightColorScheme = lightColorScheme(
    primary = Purple,
    onPrimary = Color.White,
    secondary = Green,
    tertiary = PurpleDark,
    background = Color(0xFFF8F8FC),
    surface = Color.White,
    surfaceVariant = Color(0xFFF0F0F8),
    onBackground = Color(0xFF1A1A2E),
    onSurface = Color(0xFF1A1A2E),
    onSurfaceVariant = Color(0xFF6E6E80),
    error = Red
)

val AppTypography = Typography(
    headlineLarge = TextStyle(
        fontWeight = FontWeight.Bold,
        fontSize = 28.sp,
        letterSpacing = (-0.5).sp
    ),
    headlineMedium = TextStyle(
        fontWeight = FontWeight.SemiBold,
        fontSize = 22.sp
    ),
    headlineSmall = TextStyle(
        fontWeight = FontWeight.SemiBold,
        fontSize = 18.sp
    ),
    titleLarge = TextStyle(
        fontWeight = FontWeight.SemiBold,
        fontSize = 16.sp
    ),
    titleMedium = TextStyle(
        fontWeight = FontWeight.Medium,
        fontSize = 14.sp
    ),
    bodyLarge = TextStyle(
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp
    ),
    bodyMedium = TextStyle(
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp
    ),
    bodySmall = TextStyle(
        fontWeight = FontWeight.Normal,
        fontSize = 12.sp,
        color = Color(0xFF9E9E9E)
    ),
    labelLarge = TextStyle(
        fontWeight = FontWeight.SemiBold,
        fontSize = 14.sp
    ),
    labelMedium = TextStyle(
        fontWeight = FontWeight.Medium,
        fontSize = 12.sp
    )
)

@Composable
fun DemoAppTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = AppTypography,
        content = content
    )
}
