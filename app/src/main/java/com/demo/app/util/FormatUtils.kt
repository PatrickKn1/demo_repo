package com.demo.app.util

import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object FormatUtils {

    private val currencyFormat = NumberFormat.getCurrencyInstance(Locale.US)
    private val dateFormat = SimpleDateFormat("MMM d, yyyy", Locale.US)
    private val dateTimeFormat = SimpleDateFormat("MMM d, yyyy · h:mm a", Locale.US)
    private val shortDateFormat = SimpleDateFormat("M/d", Locale.US)

    fun formatCurrency(amount: Double): String = currencyFormat.format(amount)

    fun formatProfit(amount: Double): String {
        val prefix = if (amount >= 0) "+" else ""
        return "$prefix${currencyFormat.format(amount)}"
    }

    fun formatDate(timestamp: Long): String = dateFormat.format(Date(timestamp))

    fun formatDateTime(timestamp: Long): String = dateTimeFormat.format(Date(timestamp))

    fun formatShortDate(timestamp: Long): String = shortDateFormat.format(Date(timestamp))

    fun formatPercent(value: Double): String = String.format(Locale.US, "%.1f%%", value * 100)
}
