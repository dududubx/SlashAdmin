import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Permission } from "#/entity";
import type { AppRouteObject } from "#/router";
import { StorageEnum } from "#/enum";
import { buildTreeFromFlat, flattenTrees } from "@/utils/tree";
import { getRoutesFromModules, getMenuRoutes } from "@/router/utils";
import { PermissionType, BasicStatus } from "#/enum";
import { faker } from "@faker-js/faker";
import { useTranslation } from "react-i18next";

/**
 * 将 AppRouteObject 转换为 Permission 格式
 */
function convertAppRoutesToPermissions(routes: AppRouteObject[], parentId: string = ""): Permission[] {
	const { t } = useTranslation();
	return routes.map((route) => {
		const permission: Permission = {
			id: route.id || faker.string.uuid(),
			name: route.meta?.label || route.path || "",
			label: t(route.meta?.label || ""),
			route: route.path || "",
			type: route.children && route.children.length > 0 ? PermissionType.CATALOGUE : PermissionType.MENU,
			parentId: route.parentId || parentId,
			order: route.order || 0,
			hide: route.meta?.hideMenu || false,
			status: route.meta?.disabled ? BasicStatus.DISABLE : BasicStatus.ENABLE,
			// 处理图标 - 如果是 React 元素，提取图标名称
			icon: (() => {
				if (typeof route.meta?.icon === "string") {
					return route.meta.icon;
				}
				// 如果是 React 元素，尝试提取图标名称
				if (route.meta?.icon && typeof route.meta.icon === "object") {
					// 这里可以根据实际的图标组件结构来提取图标名称
					return "ic-default"; // 默认图标
				}
				return undefined;
			})(),
			component: route.element ? route.path : undefined,
		};

		// 递归处理子路由
		if (route.children && route.children.length > 0) {
			permission.children = convertAppRoutesToPermissions(
				route.children.filter((child) => !child.index), // 过滤掉 index 路由
				permission.id,
			);
		}

		return permission;
	});
}

type RouteStore = {
	// 动态路由数据（扁平化存储）
	dynamicRoutes: Permission[];
	// 静态路由
	staticRoutes: AppRouteObject[];
	// 是否需要刷新路由
	needRefresh: boolean;
	// 路由版本号，用于强制刷新
	routeVersion: number;

	actions: {
		// 设置动态路由
		setDynamicRoutes: (routes: Permission[]) => void;
		// 设置静态路由
		setStaticRoutes: (routes: AppRouteObject[]) => void;
		// 智能添加路由（自动处理树结构）
		addRouteToTree: (route: Permission, parentId?: string) => void;
		// 智能更新路由（保持树结构）
		updateRouteInTree: (route: Permission) => void;
		// 智能删除路由（处理子节点）
		removeRouteFromTree: (routeId: string) => void;
		// 获取树结构的动态路由
		getTreeStructure: () => Permission[];
		// 获取扁平化的所有路由（静态+动态）
		getAllFlatRoutes: () => Permission[];
		// 传统方法（向后兼容）
		addRoute: (route: Permission) => void;
		updateRoute: (route: Permission) => void;
		removeRoute: (routeId: string) => void;
		// 标记需要刷新
		markNeedRefresh: () => void;
		// 清除刷新标记
		clearRefreshFlag: () => void;
		// 增加版本号
		incrementVersion: () => void;
	};
};

const useRouteStore = create<RouteStore>()(
	persist(
		(set, get) => ({
			dynamicRoutes: [] as Permission[],
			staticRoutes: [] as AppRouteObject[],
			needRefresh: false,
			routeVersion: 0,

			actions: {
				setDynamicRoutes: (routes) => {
					set({
						dynamicRoutes: routes,
						needRefresh: true,
						routeVersion: get().routeVersion + 1,
					});
				},
				setStaticRoutes: (routes) => {
					set({ staticRoutes: routes });
				},

				// 智能添加路由到树结构
				addRouteToTree: (route, parentId) => {
					const currentRoutes = get().dynamicRoutes;
					const routeWithParent = { ...route, parentId: parentId || "" };
					const newRoutes = [...currentRoutes, routeWithParent];

					set({
						dynamicRoutes: newRoutes,
						needRefresh: true,
						routeVersion: get().routeVersion + 1,
					});
				},

				// 智能更新路由（保持树结构）
				updateRouteInTree: (updatedRoute) => {
					const currentRoutes = get().dynamicRoutes;
					const newRoutes = currentRoutes.map((route) => (route.id === updatedRoute.id ? updatedRoute : route));

					set({
						dynamicRoutes: newRoutes,
						needRefresh: true,
						routeVersion: get().routeVersion + 1,
					});
				},

				// 智能删除路由（包括所有子节点）
				removeRouteFromTree: (routeId) => {
					const currentRoutes = get().dynamicRoutes;

					// 递归查找所有需要删除的节点（包括子节点）
					const findAllChildIds = (parentId: string, routes: Permission[]): string[] => {
						const childIds: string[] = [];
						routes.forEach((route) => {
							if (route.parentId === parentId) {
								childIds.push(route.id);
								// 递归查找子节点的子节点
								childIds.push(...findAllChildIds(route.id, routes));
							}
						});
						return childIds;
					};

					const idsToDelete = [routeId, ...findAllChildIds(routeId, currentRoutes)];
					const newRoutes = currentRoutes.filter((route) => !idsToDelete.includes(route.id));

					set({
						dynamicRoutes: newRoutes,
						needRefresh: true,
						routeVersion: get().routeVersion + 1,
					});
				},

				// 获取树结构的动态路由
				getTreeStructure: () => {
					const routes = get().dynamicRoutes;
					return buildTreeFromFlat(routes, "id", "parentId", "children");
				},

				// 获取扁平化的所有路由（静态+动态）
				getAllFlatRoutes: () => {
					const { staticRoutes, dynamicRoutes } = get();

					// 如果静态路由为空，从模块中获取
					let currentStaticRoutes = staticRoutes;
					let moduleRoutes = [] as AppRouteObject[];
					if (currentStaticRoutes.length === 0) {
						const allRoutes = getRoutesFromModules();
						// 将 AppRouteObject 转换为 Permission 格式
						const staticRoutes = getMenuRoutes(allRoutes);
						moduleRoutes = staticRoutes;
						// 更新静态路由存储
						set({ staticRoutes: staticRoutes });
					} else {
						moduleRoutes = currentStaticRoutes;
					}
					const convertedRoutes = convertAppRoutesToPermissions(moduleRoutes);
					const flatStaticRoutes = flattenTrees(convertedRoutes);
					return buildTreeFromFlat([...flatStaticRoutes, ...dynamicRoutes]);
				},
				addRoute: (route) => {
					const currentRoutes = get().dynamicRoutes;
					const newRoutes = [...currentRoutes, route];
					set({
						dynamicRoutes: newRoutes,
						needRefresh: true,
						routeVersion: get().routeVersion + 1,
					});
				},

				updateRoute: (updatedRoute) => {
					const currentRoutes = get().dynamicRoutes;
					const newRoutes = currentRoutes.map((route) => (route.id === updatedRoute.id ? updatedRoute : route));
					set({
						dynamicRoutes: newRoutes,
						needRefresh: true,
						routeVersion: get().routeVersion + 1,
					});
				},

				removeRoute: (routeId) => {
					const currentRoutes = get().dynamicRoutes;
					const newRoutes = currentRoutes.filter((route) => route.id !== routeId);
					set({
						dynamicRoutes: newRoutes,
						needRefresh: true,
						routeVersion: get().routeVersion + 1,
					});
				},

				markNeedRefresh: () => {
					set({ needRefresh: true });
				},

				clearRefreshFlag: () => {
					set({ needRefresh: false });
				},

				incrementVersion: () => {
					set({ routeVersion: get().routeVersion + 1 });
				},
			},
		}),
		{
			name: "routeStore",
			storage: createJSONStorage(() => localStorage),
			partialize: (state) => ({
				[StorageEnum.DynamicRoutes]: state.dynamicRoutes,
				// [StorageEnum.staticRoutes]: state.staticRoutes,
				routeVersion: state.routeVersion,
			}),
		},
	),
);

export const useDynamicRoutes = () => useRouteStore((state) => state.dynamicRoutes);
export const useRouteVersion = () => useRouteStore((state) => state.routeVersion);
export const useNeedRefresh = () => useRouteStore((state) => state.needRefresh);
export const useRouteActions = () => useRouteStore((state) => state.actions);
export const useStaticRoutes = () => useRouteStore((state) => state.staticRoutes);

export default useRouteStore;
