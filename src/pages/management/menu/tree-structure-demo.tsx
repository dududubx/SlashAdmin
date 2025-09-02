import React, { useState, useCallback, useMemo } from "react";
import {
	Card,
	Tree,
	Button,
	Space,
	Modal,
	Form,
	Input,
	Select,
	InputNumber,
	Switch,
	Typography,
	Alert,
	Divider,
	AutoComplete,
} from "antd";
import { Icon } from "@/components/icon";
import { useDynamicRoutes } from "@/hooks/use-dynamic-routes";
import { useDynamicRoutes as useDynamicRoutesStore } from "@/store/routeStore";
import { faker } from "@faker-js/faker";
import type { Permission } from "#/entity";
import { PermissionType } from "#/enum";
import type { DataNode } from "antd/es/tree";

const { Title, Text } = Typography;
const { Option } = Select;

interface TreeNodeData extends DataNode {
	id: string;
	parentId?: string;
	route: string;
	component?: string;
	icon?: string;
	order?: number;
	hide?: boolean;
	permission: Permission;
}

export default function TreeStructureDemo() {
	const {
		addDynamicRouteToTree,
		// updateDynamicRouteInTree,
		removeDynamicRouteFromTree,
		getDynamicRouteTree,
		moveRouteToParent,
		getAllRoutes,
	} = useDynamicRoutes();

	const dynamicRoutes = useDynamicRoutesStore();
	const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
	const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
	const [showAddModal, setShowAddModal] = useState(false);
	const [showMoveModal, setShowMoveModal] = useState(false);
	const [selectedNode, setSelectedNode] = useState<Permission | null>(null);
	const [form] = Form.useForm();
	const [moveForm] = Form.useForm();
	const ENTRY_PATH = "/src/pages";
	const PAGES = import.meta.glob("/src/pages/**/*.tsx");
	const PAGE_SELECT_OPTIONS = Object.entries(PAGES).map(([path]) => {
		const pagePath = path.replace(ENTRY_PATH, "");
		return {
			label: pagePath,
			value: pagePath,
		};
	});

	// 将Permission数据转换为Tree组件需要的数据格式
	const convertToTreeData = useCallback((routes: Permission[]): TreeNodeData[] => {
		return routes.map((route) => ({
			key: route.id,
			id: route.id,
			parentId: route.parentId,
			title: (
				<div className="flex items-center justify-between w-full">
					<Space>
						{route.icon && <Icon icon={route.icon.startsWith("ic") ? `local:${route.icon}` : route.icon} size={16} />}
						<Text strong>{route.name}</Text>
						<Text type="secondary">({route.route})</Text>
						{route.hide && <Text type="warning">[Hidden]</Text>}
					</Space>
					<Space>
						<Button
							size="small"
							type="link"
							onClick={(e) => {
								e.stopPropagation();
								handleAddChild(route.id);
							}}
						>
							Add Child
						</Button>
						<Button
							size="small"
							type="link"
							onClick={(e) => {
								e.stopPropagation();
								handleEdit(route);
							}}
						>
							Edit
						</Button>
						<Button
							size="small"
							type="link"
							onClick={(e) => {
								e.stopPropagation();
								handleMove(route);
							}}
						>
							Move
						</Button>
						<Button
							size="small"
							type="link"
							danger
							onClick={(e) => {
								e.stopPropagation();
								handleDelete(route.id);
							}}
						>
							Delete
						</Button>
					</Space>
				</div>
			),
			route: route.route,
			component: route.component,
			icon: route.icon,
			order: route.order,
			hide: route.hide,
			permission: route,
			children: route.children ? convertToTreeData(route.children) : undefined,
		}));
	}, []);

	// 获取树结构数据
	const treeData = useMemo(() => {
		const treeStructure = getDynamicRouteTree();
		return convertToTreeData(treeStructure);
	}, [dynamicRoutes, convertToTreeData, getDynamicRouteTree]);

	// 获取所有路由的扁平列表（用于父节点选择）
	const allRoutes = useMemo(() => {
		const routes = getAllRoutes();
		console.log("所有可用路由（静态+动态）:", routes);
		return routes;
	}, [getAllRoutes]);

	const handleAddChild = (parentId: string) => {
		form.resetFields();
		form.setFieldsValue({ parentId });
		setShowAddModal(true);
	};

	const handleEdit = (route: Permission) => {
		form.resetFields();
		form.setFieldsValue(route);
		setShowAddModal(true);
	};

	const handleMove = (route: Permission) => {
		setSelectedNode(route);
		moveForm.resetFields();
		moveForm.setFieldsValue({
			routeId: route.id,
			currentParentId: route.parentId || "(Root)",
			newParentId: route.parentId,
		});
		setShowMoveModal(true);
	};

	const handleDelete = async (routeId: string) => {
		Modal.confirm({
			title: "Delete Route",
			content: "Are you sure you want to delete this route and all its children?",
			onOk: async () => {
				const success = await removeDynamicRouteFromTree(routeId);
				if (success) {
					console.log("Route deleted successfully");
				}
			},
		});
	};

	const handleAddRoute = async (values: any) => {
		try {
			const newRoute: Permission = {
				...values,
				id: values.id || faker.string.uuid(),
				type: PermissionType.MENU,
			};

			const success = await addDynamicRouteToTree(newRoute, values.parentId);
			if (success) {
				setShowAddModal(false);
				form.resetFields();
				console.log("Route added successfully");
			}
		} catch (error) {
			console.error("Failed to add route:", error);
		}
	};

	const handleMoveRoute = async (values: any) => {
		try {
			const success = await moveRouteToParent(values.routeId, values.newParentId);
			if (success) {
				setShowMoveModal(false);
				moveForm.resetFields();
				setSelectedNode(null);
				console.log("Route moved successfully");
			}
		} catch (error) {
			console.error("Failed to move route:", error);
		}
	};

	const handleAddRoot = () => {
		form.resetFields();
		form.setFieldsValue({ parentId: "" });
		setShowAddModal(true);
	};

	const onSelect = (selectedKeysValue: React.Key[]) => {
		setSelectedKeys(selectedKeysValue);
	};

	const onExpand = (expandedKeysValue: React.Key[]) => {
		setExpandedKeys(expandedKeysValue);
	};

	return (
		<div className="p-6">
			<Title level={2}>动态路由树结构管理</Title>

			<Alert
				message="树结构管理说明"
				description="此页面展示动态路由的完整树结构，支持可视化的添加、编辑、移动和删除操作。所有操作都会实时更新路由树结构。"
				type="info"
				showIcon
				className="mb-6"
			/>

			<Card
				title="路由树结构"
				extra={
					<Space>
						<Button type="primary" onClick={handleAddRoot}>
							添加根路由
						</Button>
						<Button onClick={() => setExpandedKeys(treeData.map((item) => item.key))}>展开全部</Button>
						<Button onClick={() => setExpandedKeys([])}>收起全部</Button>
					</Space>
				}
			>
				{treeData.length > 0 ? (
					<Tree
						showLine
						showIcon={false}
						selectedKeys={selectedKeys}
						expandedKeys={expandedKeys}
						onSelect={onSelect}
						onExpand={onExpand}
						treeData={treeData}
						className="dynamic-route-tree"
					/>
				) : (
					<div className="text-center py-8">
						<Text type="secondary">暂无动态路由数据</Text>
						<br />
						<Button type="link" onClick={handleAddRoot}>
							点击添加第一个路由
						</Button>
					</div>
				)}
			</Card>

			<Divider />

			<Card title="路由统计信息">
				<Space direction="vertical" className="w-full">
					<Text>
						总路由数量: <Text code>{allRoutes.length}</Text>
					</Text>
					<Text>
						动态路由数量: <Text code>{dynamicRoutes.length}</Text>
					</Text>
					<Text>
						根级路由数量: <Text code>{treeData.length}</Text>
					</Text>
				</Space>
			</Card>

			{/* 添加/编辑路由模态框 */}
			<Modal
				title={form.getFieldValue("id") ? "编辑路由" : "添加路由"}
				open={showAddModal}
				onCancel={() => {
					setShowAddModal(false);
					form.resetFields();
				}}
				onOk={() => form.submit()}
				width={600}
			>
				<Form form={form} layout="vertical" onFinish={handleAddRoute}>
					<Form.Item name="id" hidden>
						<Input />
					</Form.Item>

					<Form.Item name="name" label="路由名称" rules={[{ required: true, message: "请输入路由名称" }]}>
						<Input placeholder="sys.menu.example" />
					</Form.Item>

					<Form.Item name="route" label="路由路径" rules={[{ required: true, message: "请输入路由路径" }]}>
						<Input placeholder="example-page" />
					</Form.Item>

					<Form.Item
						name="component"
						label="组件路径"
						noStyle
						shouldUpdate={(prevValues, currentValues) => prevValues !== currentValues}
					>
						{
							<Form.Item<Permission> label="Component" name="component">
								<AutoComplete
									options={PAGE_SELECT_OPTIONS}
									filterOption={(input, option) =>
										((option?.label || "") as string).toLowerCase().includes(input.toLowerCase())
									}
								/>
							</Form.Item>
						}
					</Form.Item>

					<Form.Item name="parentId" label="父级路由">
						<Select placeholder="选择父级路由（留空为根级路由）" allowClear>
							{allRoutes.map((route) => (
								<Option key={route.id} value={route.id}>
									{route.name} ({route.route})
								</Option>
							))}
						</Select>
					</Form.Item>

					<Form.Item name="icon" label="图标">
						<Input placeholder="ic-example 或 solar:home-bold" />
					</Form.Item>

					<Form.Item name="order" label="排序">
						<InputNumber min={0} placeholder="0" className="w-full" />
					</Form.Item>

					<Form.Item name="hide" label="隐藏菜单" valuePropName="checked">
						<Switch />
					</Form.Item>
				</Form>
			</Modal>

			{/* 移动路由模态框 */}
			<Modal
				title="移动路由"
				open={showMoveModal}
				onCancel={() => {
					setShowMoveModal(false);
					moveForm.resetFields();
					setSelectedNode(null);
				}}
				onOk={() => moveForm.submit()}
			>
				<Form form={moveForm} layout="vertical" onFinish={handleMoveRoute}>
					<Form.Item name="routeId" hidden>
						<Input />
					</Form.Item>

					<Form.Item label="当前路由">
						<Text strong>{selectedNode?.name}</Text> ({selectedNode?.route})
					</Form.Item>

					<Form.Item name="currentParentId" label="当前父级">
						<Input disabled />
					</Form.Item>

					<Form.Item name="newParentId" label="新父级路由">
						<Select placeholder="选择新的父级路由（留空为根级路由）" allowClear>
							{allRoutes
								.filter((route) => route.id !== selectedNode?.id) // 排除自己
								.map((route) => (
									<Option key={route.id} value={route.id}>
										{route.name} ({route.route})
									</Option>
								))}
						</Select>
					</Form.Item>
				</Form>
			</Modal>

			<style>{`
        .dynamic-route-tree .ant-tree-treenode {
          padding: 4px 0;
        }
        .dynamic-route-tree .ant-tree-node-content-wrapper {
          width: 100%;
        }
      `}</style>
		</div>
	);
}
