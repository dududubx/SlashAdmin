import Table, { type ColumnsType } from "antd/es/table";
import { Button, Card, Popconfirm, Tag } from "antd";
import { Icon, IconButton } from "@/components/icon";
import { MenuStatus } from "#/enum";
import type { Permission } from "#/entity";
import { useTranslation } from "react-i18next";
import React, { useState, useMemo, useCallback } from "react";
import MenuModal, { type MenuModalProps } from "./menu-modal";
import type { AppRouteObject } from "#/router";
import { faker } from "@faker-js/faker";
import { useDynamicRoutes } from "@/hooks/use-dynamic-routes";
import { usePermissionRoutes } from "@/router/hooks/use-permission-routes";

const defaultRouteValue: Permission = {
	id: "",
	parentId: "",
	component: "",
	name: "",
	// icon: "",
	hide: false,
	order: 1,
	route: "",
};
export default function MenuManagePage() {
	const { t } = useTranslation();
	const modulesMenu = usePermissionRoutes();
	const { addDynamicRouteToTree, updateDynamicRouteInTree, removeDynamicRouteFromTree, refreshRoutes } =
		useDynamicRoutes();
	const menuToTableData = (menuList: AppRouteObject[], tableList: (Permission | AppRouteObject)[]) => {
		menuList.forEach((item) => {
			const icon = item.meta?.icon;
			const obj = {
				name: item.meta?.label || "",
				label: t(item.meta?.label || ""),
				icon: typeof icon === "string" ? icon : React.isValidElement(icon) ? icon.props?.icon : "",
				route: item.meta?.key || "",
				children: [],
				order: item.order,
				hide: false,
				isChild: !(item.children && item.children.length),
				id: item.id,
				parentId: item.parentId,
			};
			tableList.push(obj);
			if (item.children && item.children.length) {
				menuToTableData(item.children, obj.children);
			}
		});
	};
	const tableData = useMemo(() => {
		const tableList: Permission[] = [];
		menuToTableData(modulesMenu, tableList);
		return tableList;
	}, [modulesMenu]);
	console.log(tableData, "tableData");
	const onSubmit = useCallback(
		async (values: Permission) => {
			try {
				if (values.id && values.id !== values.route) {
					// 更新现有菜单（如果ID存在且不等于route，说明是真正的更新）
					const success = await updateDynamicRouteInTree(values);
					if (success) {
						// 刷新路由和菜单
						await refreshRoutes();
						console.log("菜单更新成功");
					}
				} else {
					// 添加新菜单
					const newPermission = {
						...values,
						id: faker.string.uuid(), // 使用UUID作为真正的ID
					};
					const success = await addDynamicRouteToTree(newPermission, values.parentId);
					if (success) {
						// 刷新路由和菜单
						await refreshRoutes();
						console.log("菜单添加成功");
					}
				}
			} catch (error) {
				console.error("操作失败:", error);
			}
		},
		[addDynamicRouteToTree, updateDynamicRouteInTree, refreshRoutes],
	);
	const [permissionModalProps, setPermissionModalProps] = useState<MenuModalProps>({
		formValue: { ...defaultRouteValue },
		title: t("common.new"),
		show: false,
		parentData: tableData,
		onOk: () => {
			setPermissionModalProps((prev) => {
				return { ...prev, show: false };
			});
		},
		onCancel: () => {
			setPermissionModalProps((prev) => ({ ...prev, show: false }));
		},
		onSubmit,
	});
	const columns: ColumnsType<Permission> = [
		{
			title: t("common.name"),
			dataIndex: "name",
			width: 300,
			render: (_, record) => <div>{t(record.name)}</div>,
		},
		// {
		// 	title: "Type",
		// 	dataIndex: "type",
		// 	width: 60,
		// 	render: (_, record) => <Tag color="processing">{PermissionType[record.type]}</Tag>,
		// },
		// {
		//   title: t("common.icon"),
		//   dataIndex: "icon",
		//   width: 60,
		//   render: (icon: string) => {
		//     if (isNil(icon)) return "";
		//     if (icon.startsWith("ic")) {
		//       return (
		//         <Icon
		//           icon={`local:${icon}`}
		//           size={18}
		//           className="ant-menu-item-icon"
		//         />
		//       );
		//     }
		//     return <Icon icon={icon} size={18} className="ant-menu-item-icon" />;
		//   },
		// },
		{
			title: t("common.route"),
			dataIndex: "route",
		},
		{
			title: t("common.status"),
			dataIndex: "hide",
			align: "center",
			width: 120,
			render: (hide) => (
				<Tag color={hide == MenuStatus.HIDDEN ? "error" : "success"}>
					{hide == MenuStatus.HIDDEN ? "Hidden" : "Show"}
				</Tag>
			),
		},
		{ title: t("common.order"), dataIndex: "order", width: 60 },
		{
			title: t("common.action"),
			key: "operation",
			align: "center",
			width: 100,
			render: (_, record) => (
				<div className="flex w-full justify-end text-gray">
					<IconButton onClick={() => onCreate(record.id)}>
						<Icon icon="gridicons:add-outline" size={18} />
					</IconButton>
					<IconButton onClick={() => onEdit(record)}>
						<Icon icon="solar:pen-bold-duotone" size={18} />
					</IconButton>
					<Popconfirm
						title="Delete the Permission"
						okText="Yes"
						cancelText="No"
						placement="left"
						onConfirm={() => onDelete(record.id)}
					>
						<IconButton>
							<Icon icon="mingcute:delete-2-fill" size={18} className="text-error" />
						</IconButton>
					</Popconfirm>
				</div>
			),
		},
	];
	const onCreate = (parentId?: string) => {
		setPermissionModalProps((prev) => ({
			...prev,
			show: true,
			...defaultRouteValue,
			title: t("common.new"),
			formValue: { ...defaultRouteValue, parentId: parentId ?? "" },
			onSubmit,
		}));
	};

	const onEdit = (formValue: Permission) => {
		setPermissionModalProps((prev) => ({
			...prev,
			show: true,
			title: t("common.edit"),
			formValue,
			onSubmit,
		}));
	};

	const onDelete = useCallback(
		async (id: string) => {
			try {
				const success = await removeDynamicRouteFromTree(id);
				if (success) {
					// 刷新路由和菜单
					await refreshRoutes();
					console.log("菜单删除成功");
				}
			} catch (error) {
				console.error("删除失败:", error);
			}
		},
		[removeDynamicRouteFromTree, refreshRoutes],
	);

	return (
		<Card
			title="Menu List"
			extra={
				<Button type="primary" onClick={() => onCreate()}>
					{t("common.new")}
				</Button>
			}
		>
			<Table
				rowKey="id"
				size="small"
				scroll={{ x: "max-content" }}
				pagination={false}
				columns={columns}
				dataSource={tableData}
			/>

			<MenuModal {...permissionModalProps} />
		</Card>
	);
}
