package com.demo.backend.services

import java.util.PriorityQueue

object GraphService {

    /**
     * Dijkstra's shortest path. Returns (path as list of nodes, total distance).
     */
    fun shortestPath(
        nodes: List<String>,
        edges: List<Triple<String, String, Double>>,
        source: String,
        target: String
    ): Pair<List<String>, Double> {
        val adjacency = buildAdjacencyList(edges)
        val dist = mutableMapOf<String, Double>().withDefault { Double.MAX_VALUE }
        val prev = mutableMapOf<String, String?>()
        val visited = mutableSetOf<String>()

        dist[source] = 0.0
        val queue = PriorityQueue<Pair<String, Double>>(compareBy { it.second })
        queue.add(source to 0.0)

        while (queue.isNotEmpty()) {
            val (current, currentDist) = queue.poll()
            if (current in visited) continue
            visited.add(current)

            if (current == target) break

            adjacency[current]?.forEach { (neighbor, weight) ->
                val newDist = currentDist + weight
                if (newDist < dist.getValue(neighbor)) {
                    dist[neighbor] = newDist
                    prev[neighbor] = current
                    queue.add(neighbor to newDist)
                }
            }
        }

        // Reconstruct path
        val path = mutableListOf<String>()
        var current: String? = target
        while (current != null) {
            path.add(0, current)
            current = prev[current]
        }

        val distance = dist.getValue(target)
        return if (distance == Double.MAX_VALUE) {
            emptyList<String>() to Double.MAX_VALUE
        } else {
            path to distance
        }
    }

    /**
     * Returns the list of neighbors for a given node.
     */
    fun neighbors(
        edges: List<Triple<String, String, Double>>,
        node: String
    ): List<Map<String, Any>> {
        val adjacency = buildAdjacencyList(edges)
        return adjacency[node]?.map { (neighbor, weight) ->
            mapOf("node" to neighbor as Any, "weight" to weight as Any)
        } ?: emptyList()
    }

    private fun buildAdjacencyList(
        edges: List<Triple<String, String, Double>>
    ): Map<String, List<Pair<String, Double>>> {
        val adjacency = mutableMapOf<String, MutableList<Pair<String, Double>>>()
        for ((from, to, weight) in edges) {
            adjacency.getOrPut(from) { mutableListOf() }.add(to to weight)
            adjacency.getOrPut(to) { mutableListOf() }.add(from to weight)  // undirected
        }
        return adjacency
    }
}
