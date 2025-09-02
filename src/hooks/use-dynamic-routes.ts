import { useCallback } from "react";
import { useRouteActions } from "@/store/routeStore";
import menuService from "@/api/services/menuService";
import type { Permission } from "#/entity";
import type { AppRouteObject } from "#/router";

/**
 * 动态路由管理 Hook
 * 用于在运行时动态添加、更新、删除路由和菜单
 * 支持智能树结构管理
 */
export function useDynamicRoutes() {
	const {
		setDynamicRoutes,
		incrementVersion,
		addRouteToTree,
		updateRouteInTree,
		removeRouteFromTree,
		getTreeStructure,
		getAllFlatRoutes,
	} = useRouteActions();

	/**
	 * 将新的菜单权限转换为路由对象
	 */
	const transformPermissionToRoute = useCallback((permission: Permission): AppRouteObject => {
		const route: AppRouteObject = {
			path: permission.route,
			meta: {
				label: permission.name,
				key: permission.route,
				hideMenu: !!permission.hide,
				disabled: false,
			},
			order: permission.order,
		};

		// 如果有图标
		if (permission.icon) {
			route.meta!.icon = permission.icon;
		}

		return route;
	}, []);

	/**
	 * 智能添加新路由到树结构中的指定父节点
	 * @param newPermission 新路由数据
	 * @param parentId 父节点ID，为空则添加到根级别
	 */
	const addDynamicRouteToTree = useCallback(
		async (newPermission: Permission, parentId?: string) => {
			try {
				// 1. 调用后端API保存新路由
				// const response = await menuService.createMenu({
				//   name: newPermission.name,
				//   route: newPermission.route,
				//   component: newPermission.component,
				//   parentId: parentId || '',
				//   icon: newPermission.icon,
				//   order: newPermission.order,
				//   hide: newPermission.hide,
				// });

				// 2. 使用智能树结构管理添加路由
				addRouteToTree(newPermission, parentId);

				console.log("新路由已添加到树结构:", newPermission);
				return true;
			} catch (error) {
				console.error("添加路由失败:", error);
				// 如果API调用失败，仍然更新本地store（用于演示）
				addRouteToTree(newPermission, parentId);
				return true;
			}
		},
		[addRouteToTree],
	);

	/**
	 * 动态添加新路由到权限系统（向后兼容）
	 */
	const addDynamicRoute = useCallback(
		async (newPermission: Permission) => {
			return addDynamicRouteToTree(newPermission, newPermission.parentId);
		},
		[addDynamicRouteToTree],
	);

	/**
	 * 智能更新现有路由（保持树结构）
	 */
	const updateDynamicRouteInTree = useCallback(
		async (updatedPermission: Permission) => {
			try {
				// 1. 调用后端API更新路由
				// const response = await menuService.updateMenu({
				//   id: updatedPermission.id,
				//   name: updatedPermission.name,
				//   route: updatedPermission.route,
				//   component: updatedPermission.component,
				//   parentId: updatedPermission.parentId,
				//   icon: updatedPermission.icon,
				//   order: updatedPermission.order,
				//   hide: updatedPermission.hide,
				// });

				// 2. 使用智能树结构管理更新路由
				updateRouteInTree(updatedPermission);

				console.log("路由已更新（树结构）:", updatedPermission);
				return true;
			} catch (error) {
				console.error("更新路由失败:", error);
				// 如果API调用失败，仍然更新本地store（用于演示）
				updateRouteInTree(updatedPermission);
				return true;
			}
		},
		[updateRouteInTree],
	);

	/**
	 * 动态更新现有路由（向后兼容）
	 */
	const updateDynamicRoute = useCallback(
		async (updatedPermission: Permission) => {
			return updateDynamicRouteInTree(updatedPermission);
		},
		[updateDynamicRouteInTree],
	);

	/**
	 * 智能删除路由（包括所有子节点）
	 */
	const removeDynamicRouteFromTree = useCallback(
		async (permissionId: string) => {
			try {
				// 1. 调用后端API删除路由
				// await menuService.deleteMenu(permissionId);

				// 2. 使用智能树结构管理删除路由（包括子节点）
				removeRouteFromTree(permissionId);

				console.log("路由及其子节点已删除:", permissionId);
				return true;
			} catch (error) {
				console.error("删除路由失败:", error);
				// 如果API调用失败，仍然更新本地store（用于演示）
				removeRouteFromTree(permissionId);
				return true;
			}
		},
		[removeRouteFromTree],
	);

	/**
	 * 动态删除路由（向后兼容）
	 */
	const removeDynamicRoute = useCallback(
		async (permissionId: string) => {
			return removeDynamicRouteFromTree(permissionId);
		},
		[removeDynamicRouteFromTree],
	);

	/**
	 * 刷新权限数据，重新计算路由
	 */
	const refreshRoutes = useCallback(async () => {
		try {
			// 1. 从后端重新获取最新的菜单数据
			const latestMenus = await menuService.getUserMenus();

			// 2. 更新路由store
			setDynamicRoutes(latestMenus);

			// 3. 强制增加版本号，触发路由重新计算
			incrementVersion();

			console.log("路由已刷新");
			return true;
		} catch (error) {
			console.error("刷新路由失败:", error);
			// 如果API调用失败，仍然增加版本号（用于演示）
			incrementVersion();
			return true;
		}
	}, [setDynamicRoutes, incrementVersion]);

	/**
	 * 获取当前动态路由的树结构
	 */
	const getDynamicRouteTree = useCallback(() => {
		return getTreeStructure();
	}, [getTreeStructure]);

	/**
	 * 获取所有路由的扁平化数据（静态+动态）
	 */
	const getAllRoutes = useCallback(() => {
		return getAllFlatRoutes();
	}, [getAllFlatRoutes]);

	/**
	 * 移动路由到新的父节点
	 */
	const moveRouteToParent = useCallback(
		async (routeId: string, newParentId?: string) => {
			try {
				// 1. 获取当前路由数据
				const allRoutes = getAllFlatRoutes();
				const routeToMove = allRoutes.find((r) => r.id === routeId);

				if (!routeToMove) {
					throw new Error(`路由 ${routeId} 不存在`);
				}

				// 2. 更新路由的父节点
				const updatedRoute = {
					...routeToMove,
					parentId: newParentId || "",
				};

				// 3. 调用更新方法
				return await updateDynamicRouteInTree(updatedRoute);
			} catch (error) {
				console.error("移动路由失败:", error);
				return false;
			}
		},
		[getAllFlatRoutes, updateDynamicRouteInTree],
	);

	/**
	 * 批量添加路由
	 */
	const addMultipleRoutes = useCallback(
		async (routes: Permission[]) => {
			const results = await Promise.allSettled(routes.map((route) => addDynamicRouteToTree(route, route.parentId)));

			const successCount = results.filter((r) => r.status === "fulfilled").length;
			console.log(`批量添加路由完成: ${successCount}/${routes.length} 成功`);

			return {
				total: routes.length,
				success: successCount,
				failed: routes.length - successCount,
			};
		},
		[addDynamicRouteToTree],
	);

	/**
	 * 根据路径查找路由
	 */
	const findRouteByPath = useCallback(
		(routePath: string) => {
			const allRoutes = getAllFlatRoutes();
			return allRoutes.find((route) => route.route === routePath);
		},
		[getAllFlatRoutes],
	);

	/**
	 * 获取路由的所有子节点
	 */
	const getRouteChildren = useCallback(
		(parentId: string) => {
			const allRoutes = getAllFlatRoutes();
			return allRoutes.filter((route) => route.parentId === parentId);
		},
		[getAllFlatRoutes],
	);

	return {
		// 基础方法
		addDynamicRoute,
		updateDynamicRoute,
		removeDynamicRoute,
		refreshRoutes,
		transformPermissionToRoute,

		// 智能树结构管理方法
		addDynamicRouteToTree,
		updateDynamicRouteInTree,
		removeDynamicRouteFromTree,
		getDynamicRouteTree,
		getAllRoutes,
		moveRouteToParent,
		addMultipleRoutes,
		findRouteByPath,
		getRouteChildren,
	};
}
