package com.demo.backend.services

import kotlin.math.*

object MathService {

    fun calculate(operation: String, values: List<Double>): Double {
        require(values.isNotEmpty()) { "Values list must not be empty" }

        return when (operation.lowercase()) {
            "sum", "add" -> values.sum()
            "subtract" -> values.reduce { acc, d -> acc - d }
            "multiply" -> values.reduce { acc, d -> acc * d }
            "divide" -> values.reduce { acc, d -> acc / d }
            "average", "mean" -> values.average()
            "median" -> median(values)
            "min" -> values.min()
            "max" -> values.max()
            "stddev" -> standardDeviation(values)
            "variance" -> variance(values)
            "abs" -> abs(values.first())
            "sqrt" -> sqrt(values.first())
            "pow" -> {
                require(values.size >= 2) { "pow requires at least two values (base, exponent)" }
                values[0].pow(values[1])
            }
            "log" -> ln(values.first())
            "log10" -> log10(values.first())
            "factorial" -> factorial(values.first().toInt()).toDouble()
            else -> throw IllegalArgumentException("Unknown operation: $operation")
        }
    }

    private fun median(values: List<Double>): Double {
        val sorted = values.sorted()
        val mid = sorted.size / 2
        return if (sorted.size % 2 == 0) {
            (sorted[mid - 1] + sorted[mid]) / 2.0
        } else {
            sorted[mid]
        }
    }

    private fun variance(values: List<Double>): Double {
        val mean = values.average()
        return values.map { (it - mean).pow(2) }.average()
    }

    private fun standardDeviation(values: List<Double>): Double {
        return sqrt(variance(values))
    }

    private fun factorial(n: Int): Long {
        require(n >= 0) { "Factorial is not defined for negative numbers" }
        return if (n <= 1) 1L else n.toLong() * factorial(n - 1)
    }
}
