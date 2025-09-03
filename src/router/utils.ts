import { ascend } from "ramda";
import { faker } from "@faker-js/faker";

import type { AppRouteObject, RouteMeta } from "#/router";

/**
 * return menu routes
 */
export const menuFilter = (items: AppRouteObject[], parentId = "") => {
	return items
		.filter((item) => {
			const show = item.meta?.key;
			const hideMenu = item.meta?.hideMenu;
			item.id = faker.string.uuid();
			item.parentId = parentId;
			if (show && item.children && !hideMenu) {
				item.children = menuFilter(item.children);
			}
			return show && !hideMenu;
		})
		.sort(ascend((item) => item.order || Number.POSITIVE_INFINITY));
};

/**
 * 基于 src/router/routes/modules 文件结构动态生成路由
 */
export function getRoutesFromModules() {
	const menuModules: AppRouteObject[] = [];
	const showMenu: string[] = ["management", "order"];

	const modules = import.meta.glob("./routes/modules/**/*.tsx", {
		eager: true,
	});

	for (const key in modules) {
		const isAllowed = showMenu.some((menu) => {
			// 匹配 ./routes/modules/dashboard.tsx 或 ./routes/modules/dashboard/xxx.tsx
			return key.includes(`/modules/${menu}.tsx`) || key.includes(`/modules/${menu}/`);
		});
		if (!isAllowed) continue;
		const mod = (modules as any)[key].default || {};
		const modList = Array.isArray(mod) ? [...mod] : [mod];
		menuModules.push(...modList);
	}
	return menuModules;
}

/**
 * return the routes will be used in sidebar menu
 */
export function getMenuRoutes(appRouteObjects: AppRouteObject[]) {
	// return menuFilter(getMenuModules());
	return menuFilter(appRouteObjects);
}

/**
 * return flatten routes
 */
export function flattenMenuRoutes(routes: AppRouteObject[]) {
	return routes.reduce<RouteMeta[]>((prev, item) => {
		const { meta, children } = item;
		if (meta) prev.push(meta);
		if (children) prev.push(...flattenMenuRoutes(children));
		return prev;
	}, []);
}
