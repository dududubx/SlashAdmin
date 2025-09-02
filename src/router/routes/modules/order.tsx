import { Icon } from "@/components/icon";
import { CircleLoading } from "@/components/loading";
import { Suspense, lazy } from "react";
import { Outlet } from "react-router";
import type { AppRouteObject } from "#/router";

const OrderManagePage = lazy(() => import("@/pages/orderPage"));

const order: AppRouteObject = {
	order: 3,
	path: "order",
	element: (
		<Suspense fallback={<CircleLoading />}>
			<Outlet />
		</Suspense>
	),
	meta: {
		label: "sys.menu.order.index",
		icon: <Icon icon="local:ic-order" className="ant-menu-item-icon" size="24" />,
		key: "/order",
	},
	children: [
		{
			path: "management",
			element: <OrderManagePage />,
			meta: {
				label: "sys.menu.order.management",
				key: "/order/management",
			},
		},
	],
};

export default order;
