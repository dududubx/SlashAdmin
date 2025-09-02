import { useState } from "react";
import { Card, Button, Space, Alert, Divider, Typography, Steps } from "antd";
import { useDynamicRoutes } from "@/hooks/use-dynamic-routes";
import { useDynamicRoutes as useDynamicRoutesStore, useRouteVersion } from "@/store/routeStore";
import { faker } from "@faker-js/faker";
import type { Permission } from "#/entity";
import { PermissionType } from "#/enum";

const { Title, Paragraph, Text } = Typography;

export default function DynamicRouteDemo() {
	const { addDynamicRoute, updateDynamicRoute, removeDynamicRoute, refreshRoutes } = useDynamicRoutes();
	const dynamicRoutes = useDynamicRoutesStore();
	const routeVersion = useRouteVersion();
	const [loading, setLoading] = useState(false);

	// 示例路由数据
	const sampleRoutes: Omit<Permission, "id">[] = [
		{
			name: "sys.menu.demo.dashboard",
			route: "demo-dashboard",
			component: "/management/menu/index.tsx",
			parentId: "",
			icon: "ic-dashboard",
			order: 1,
			hide: false,
			type: PermissionType.MENU,
		},
		{
			name: "sys.menu.demo.analytics",
			route: "demo-analytics",
			component: "/management/menu/index.tsx",
			parentId: "",
			icon: "ic-analytics",
			order: 2,
			hide: false,
			type: PermissionType.MENU,
		},
		{
			name: "sys.menu.demo.reports",
			route: "demo-reports",
			component: "/management/menu/index.tsx",
			parentId: "",
			icon: "ic-report",
			order: 3,
			hide: false,
			type: PermissionType.MENU,
		},
	];

	const handleAddRoute = async (routeData: Omit<Permission, "id">) => {
		setLoading(true);
		try {
			const newRoute: Permission = {
				...routeData,
				id: faker.string.uuid(),
			};

			const success = await addDynamicRoute(newRoute);
			if (success) {
				console.log("✅ 路由添加成功");
			}
		} catch (error) {
			console.error("❌ 路由添加失败:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleUpdateRoute = async (routeId: string) => {
		setLoading(true);
		try {
			const existingRoute = dynamicRoutes.find((r) => r.id === routeId);
			if (existingRoute) {
				const updatedRoute: Permission = {
					...existingRoute,
					name: `${existingRoute.name} (Updated)`,
					order: (existingRoute.order || 0) + 10,
				};

				const success = await updateDynamicRoute(updatedRoute);
				if (success) {
					console.log("✅ 路由更新成功");
				}
			}
		} catch (error) {
			console.error("❌ 路由更新失败:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleRemoveRoute = async (routeId: string) => {
		setLoading(true);
		try {
			const success = await removeDynamicRoute(routeId);
			if (success) {
				console.log("✅ 路由删除成功");
			}
		} catch (error) {
			console.error("❌ 路由删除失败:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleRefreshRoutes = async () => {
		setLoading(true);
		try {
			const success = await refreshRoutes();
			if (success) {
				console.log("✅ 路由刷新成功");
			}
		} catch (error) {
			console.error("❌ 路由刷新失败:", error);
		} finally {
			setLoading(false);
		}
	};

	const steps = [
		{
			title: "添加路由",
			description: "动态添加新的路由到系统中",
		},
		{
			title: "更新菜单",
			description: "系统自动更新侧边栏菜单",
		},
		{
			title: "路由生效",
			description: "新路由立即可用，无需重启应用",
		},
	];

	return (
		<div className="p-6">
			<Title level={2}>动态路由管理演示</Title>

			<Alert
				message="动态路由系统说明"
				description="此系统允许在运行时动态添加、更新和删除路由，无需重启应用。路由变更会立即反映在侧边栏菜单中。"
				type="info"
				showIcon
				className="mb-6"
			/>

			<Steps items={steps} className="mb-6" />

			<Card title="当前动态路由状态" className="mb-6">
				<Space direction="vertical" className="w-full">
					<Text>
						路由版本: <Text code>{routeVersion}</Text>
					</Text>
					<Text>
						动态路由数量: <Text code>{dynamicRoutes.length}</Text>
					</Text>

					{dynamicRoutes.length > 0 && (
						<div>
							<Text strong>当前动态路由:</Text>
							<ul className="mt-2">
								{dynamicRoutes.map((route) => (
									<li key={route.id} className="mb-2">
										<Space>
											<Text code>{route.route}</Text>
											<Text>{route.name}</Text>
											<Button size="small" onClick={() => handleUpdateRoute(route.id)} loading={loading}>
												更新
											</Button>
											<Button size="small" danger onClick={() => handleRemoveRoute(route.id)} loading={loading}>
												删除
											</Button>
										</Space>
									</li>
								))}
							</ul>
						</div>
					)}
				</Space>
			</Card>

			<Card title="动态路由操作" className="mb-6">
				<Space direction="vertical" className="w-full">
					<div>
						<Title level={4}>添加示例路由</Title>
						<Space wrap>
							{sampleRoutes.map((route) => (
								<Button key={route.label} type="primary" onClick={() => handleAddRoute(route)} loading={loading}>
									添加 {route.name}
								</Button>
							))}
						</Space>
					</div>

					<Divider />

					<div>
						<Title level={4}>系统操作</Title>
						<Space>
							<Button onClick={handleRefreshRoutes} loading={loading}>
								刷新路由
							</Button>
							<Button
								danger
								onClick={() => {
									for (let route of dynamicRoutes) {
										handleRemoveRoute(route.id);
									}
								}}
								loading={loading}
								disabled={dynamicRoutes.length === 0}
							>
								清空所有动态路由
							</Button>
						</Space>
					</div>
				</Space>
			</Card>

			<Card title="使用说明">
				<Typography>
					<Title level={4}>动态路由工作原理</Title>
					<Paragraph>
						1. <Text strong>路由存储</Text>: 动态路由数据存储在 Zustand store 中，并持久化到 localStorage
					</Paragraph>
					<Paragraph>
						2. <Text strong>路由合并</Text>: 系统会将静态路由（基于文件系统）和动态路由合并
					</Paragraph>
					<Paragraph>
						3. <Text strong>实时更新</Text>: 路由变更会触发版本号更新，React 组件会自动重新渲染
					</Paragraph>
					<Paragraph>
						4. <Text strong>菜单同步</Text>: 侧边栏菜单会自动反映路由变更
					</Paragraph>

					<Title level={4}>API 集成</Title>
					<Paragraph>在实际项目中，动态路由操作会调用后端 API：</Paragraph>
					<ul>
						<li>
							<Text code>POST /api/menus</Text> - 创建新菜单
						</li>
						<li>
							<Text code>PUT /api/menus/:id</Text> - 更新菜单
						</li>
						<li>
							<Text code>DELETE /api/menus/:id</Text> - 删除菜单
						</li>
						<li>
							<Text code>GET /api/user/menus</Text> - 获取用户菜单
						</li>
					</ul>
				</Typography>
			</Card>
		</div>
	);
}
