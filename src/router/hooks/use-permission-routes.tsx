import { Icon } from "@/components/icon";
import { CircleLoading } from "@/components/loading";
import { useUserPermission } from "@/store/userStore";
import { useDynamicRoutes as useDynamicRoutesStore, useRouteVersion } from "@/store/routeStore";
import { flattenTrees } from "@/utils/tree";
import { Tag } from "antd";
import { isEmpty } from "ramda";
import { Suspense, lazy, useMemo } from "react";
import { Navigate, Outlet } from "react-router";
import type { Permission } from "#/entity";
import { BasicStatus, PermissionType } from "#/enum";
import type { AppRouteObject } from "#/router";
import { getRoutesFromModules, getMenuRoutes } from "../utils";

const ENTRY_PATH = "/src/pages";
const PAGES = import.meta.glob("/src/pages/**/*.tsx");
const loadComponentFromPath = (path: string) => PAGES[`${ENTRY_PATH}${path}`];

/**
 * Build complete route path by traversing from current permission to root
 * @param {Permission} permission - current permission
 * @param {Permission[]} flattenedPermissions - flattened permission array
 * @param {string[]} segments - route segments accumulator
 * @returns {string} normalized complete route path
 */
function buildCompleteRoute(
	permission: Permission,
	flattenedPermissions: Permission[],
	segments: string[] = [],
): string {
	// Add current route segment
	segments.unshift(permission.route);

	// Base case: reached root permission
	if (!permission.parentId) {
		return `/${segments.join("")}`;
	}

	// Find parent and continue recursion
	const parent = flattenedPermissions.find((p) => p.id === permission.parentId);
	console.log(parent, "parent");
	if (!parent) {
		console.warn(`Parent permission not found for ID: ${permission.parentId}`);
		return `/${segments.join("/")}`;
	}

	return buildCompleteRoute(parent, flattenedPermissions, segments);
}

// Components
function NewFeatureTag() {
	return (
		<Tag color="cyan" className="ml-2!">
			<div className="flex items-center gap-1">
				<Icon icon="solar:bell-bing-bold-duotone" size={12} />
				<span className="ms-1">NEW</span>
			</div>
		</Tag>
	);
}

// Route Transformers
const createBaseRoute = (permission: Permission, completeRoute: string): AppRouteObject => {
	const { route, name, icon, order, hide, hideTab, status, frameSrc, newFeature } = permission;

	const baseRoute: AppRouteObject = {
		path: route,
		meta: {
			label: name,
			key: completeRoute,
			hideMenu: !!hide,
			hideTab,
			disabled: status === BasicStatus.DISABLE,
		},
	};

	if (order) baseRoute.order = order;
	if (baseRoute.meta) {
		if (icon) baseRoute.meta.icon = icon;
		if (frameSrc) baseRoute.meta.frameSrc = frameSrc;
		if (newFeature) baseRoute.meta.suffix = <NewFeatureTag />;
	}

	return baseRoute;
};

const createCatalogueRoute = (permission: Permission, flattenedPermissions: Permission[]): AppRouteObject => {
	const baseRoute = createBaseRoute(permission, buildCompleteRoute(permission, flattenedPermissions));

	if (baseRoute.meta) {
		baseRoute.meta.hideTab = true;
	}

	const { parentId, children = [] } = permission;
	if (!parentId) {
		baseRoute.element = (
			<Suspense fallback={<CircleLoading />}>
				<Outlet />
			</Suspense>
		);
	}

	baseRoute.children = transformPermissionsToRoutes(children, flattenedPermissions);

	if (!isEmpty(children)) {
		baseRoute.children.unshift({
			index: true,
			element: <Navigate to={children[0].route} replace />,
		});
	}

	return baseRoute;
};

const createMenuRoute = (permission: Permission, flattenedPermissions: Permission[]): AppRouteObject => {
	console.log(buildCompleteRoute(permission, flattenedPermissions), "buildCompleteRoute");
	const baseRoute = createBaseRoute(permission, buildCompleteRoute(permission, flattenedPermissions));

	if (permission.component) {
		const Element = lazy(loadComponentFromPath(permission.component) as any);

		if (permission.frameSrc) {
			baseRoute.element = <Element src={permission.frameSrc} />;
		} else {
			baseRoute.element = (
				<Suspense fallback={<CircleLoading />}>
					<Element />
				</Suspense>
			);
		}
	}

	return baseRoute;
};

function transformPermissionsToRoutes(permissions: Permission[], flattenedPermissions: Permission[]): AppRouteObject[] {
	return permissions.map((permission) => {
		if (permission.type === PermissionType.CATALOGUE) {
			return createCatalogueRoute(permission, flattenedPermissions);
		}
		return createMenuRoute(permission, flattenedPermissions);
	});
}

const ROUTE_MODE = import.meta.env.VITE_APP_ROUTER_MODE;
export function usePermissionRoutes() {
	const dynamicRoutes = useDynamicRoutesStore();
	const routeVersion = useRouteVersion();

	if (ROUTE_MODE === "module") {
		const permissionRoutes = getRoutesFromModules();

		// 合并静态路由和动态路由
		const combinedRoutes = useMemo(() => {
			const staticRoutes = getMenuRoutes(permissionRoutes);

			// 如果有动态路由，将其转换为AppRouteObject格式并合并
			if (dynamicRoutes && dynamicRoutes.length > 0) {
				const flattenedDynamicRoutes = flattenTrees(staticRoutes as Permission[]);
				const dynamicAppRoutes = transformPermissionsToRoutes(dynamicRoutes, flattenedDynamicRoutes);
				console.log(
					flattenedDynamicRoutes,
					dynamicAppRoutes,
					// buildTreeFromFlat([...flattenedDynamicRoutes, ...dynamicAppRoutes]),
					"dynamicRoutes",
				);
				return [...staticRoutes, ...dynamicAppRoutes];
			}

			return staticRoutes;
		}, [permissionRoutes, dynamicRoutes, routeVersion]);

		return combinedRoutes;
	}

	// 权限模式：优先使用动态路由，如果没有则使用用户权限
	const permissions = useUserPermission();
	const effectivePermissions = dynamicRoutes && dynamicRoutes.length > 0 ? dynamicRoutes : permissions;

	return useMemo(() => {
		if (!effectivePermissions) return [];

		const flattenedPermissions = flattenTrees(effectivePermissions);
		return transformPermissionsToRoutes(effectivePermissions, flattenedPermissions);
	}, [effectivePermissions, routeVersion]);
}
