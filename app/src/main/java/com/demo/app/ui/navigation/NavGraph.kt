package com.demo.app.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.demo.app.data.repository.BankrollRepository
import com.demo.app.ui.screens.*

object Routes {
    const val HOME = "home"
    const val ROLL_DETAIL = "roll/{rollId}"
    const val ADD_ROLL = "add_roll?parentId={parentId}"
    const val EDIT_ROLL = "edit_roll/{rollId}"
    const val ADD_ENTRY = "add_entry/{rollId}"
    const val EDIT_ENTRY = "edit_entry/{entryId}"
    const val SETTINGS = "settings"

    fun rollDetail(rollId: Long) = "roll/$rollId"
    fun addRoll(parentId: Long? = null) = "add_roll?parentId=${parentId ?: -1}"
    fun editRoll(rollId: Long) = "edit_roll/$rollId"
    fun addEntry(rollId: Long) = "add_entry/$rollId"
    fun editEntry(entryId: Long) = "edit_entry/$entryId"
}

@Composable
fun AppNavGraph(
    navController: NavHostController,
    repository: BankrollRepository
) {
    NavHost(navController = navController, startDestination = Routes.HOME) {

        composable(Routes.HOME) {
            HomeScreen(
                repository = repository,
                onRollClick = { navController.navigate(Routes.rollDetail(it)) },
                onAddRoll = { navController.navigate(Routes.addRoll()) },
                onSettings = { navController.navigate(Routes.SETTINGS) }
            )
        }

        composable(
            route = Routes.ROLL_DETAIL,
            arguments = listOf(navArgument("rollId") { type = NavType.LongType })
        ) { backStackEntry ->
            val rollId = backStackEntry.arguments?.getLong("rollId") ?: return@composable
            RollDetailScreen(
                rollId = rollId,
                repository = repository,
                onBack = { navController.popBackStack() },
                onAddEntry = { navController.navigate(Routes.addEntry(rollId)) },
                onEditEntry = { navController.navigate(Routes.editEntry(it)) },
                onSubRollClick = { navController.navigate(Routes.rollDetail(it)) },
                onAddSubRoll = { navController.navigate(Routes.addRoll(rollId)) },
                onEditRoll = { navController.navigate(Routes.editRoll(rollId)) }
            )
        }

        composable(
            route = Routes.ADD_ROLL,
            arguments = listOf(navArgument("parentId") {
                type = NavType.LongType
                defaultValue = -1L
            })
        ) { backStackEntry ->
            val parentId = backStackEntry.arguments?.getLong("parentId")?.takeIf { it != -1L }
            AddEditRollScreen(
                rollId = null,
                parentRollId = parentId,
                repository = repository,
                onDone = { navController.popBackStack() }
            )
        }

        composable(
            route = Routes.EDIT_ROLL,
            arguments = listOf(navArgument("rollId") { type = NavType.LongType })
        ) { backStackEntry ->
            val rollId = backStackEntry.arguments?.getLong("rollId") ?: return@composable
            AddEditRollScreen(
                rollId = rollId,
                parentRollId = null,
                repository = repository,
                onDone = { navController.popBackStack() }
            )
        }

        composable(
            route = Routes.ADD_ENTRY,
            arguments = listOf(navArgument("rollId") { type = NavType.LongType })
        ) { backStackEntry ->
            val rollId = backStackEntry.arguments?.getLong("rollId") ?: return@composable
            AddEditEntryScreen(
                entryId = null,
                rollId = rollId,
                repository = repository,
                onDone = { navController.popBackStack() }
            )
        }

        composable(
            route = Routes.EDIT_ENTRY,
            arguments = listOf(navArgument("entryId") { type = NavType.LongType })
        ) { backStackEntry ->
            val entryId = backStackEntry.arguments?.getLong("entryId") ?: return@composable
            AddEditEntryScreen(
                entryId = entryId,
                rollId = -1,
                repository = repository,
                onDone = { navController.popBackStack() }
            )
        }

        composable(Routes.SETTINGS) {
            SettingsScreen(onBack = { navController.popBackStack() })
        }
    }
}
