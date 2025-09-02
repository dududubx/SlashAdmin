import type { Permission } from "#/entity";
import apiClient from "../apiClient";

export interface CreateMenuReq {
	name: string;
	route: string;
	component?: string;
	parentId?: string;
	icon?: string;
	order?: number;
	hide?: boolean;
}

export interface UpdateMenuReq extends CreateMenuReq {
	id: string;
}

class MenuService {
	/**
	 * 创建新菜单
	 */
	async createMenu(menuData: CreateMenuReq): Promise<Permission> {
		return await apiClient.post({ url: "/api/menus", data: menuData });
	}

	/**
	 * 更新菜单
	 */
	async updateMenu(menuData: UpdateMenuReq): Promise<Permission> {
		return await apiClient.put({ url: `/api/menus/${menuData.id}`, data: menuData });
	}

	/**
	 * 删除菜单
	 */
	async deleteMenu(menuId: string): Promise<void> {
		await apiClient.delete({ url: `/api/menus/${menuId}` });
	}

	/**
	 * 获取菜单列表
	 */
	async getMenus(): Promise<Permission[]> {
		return await apiClient.get({ url: "/api/menus" });
	}

	/**
	 * 获取用户权限菜单
	 */
	async getUserMenus(): Promise<Permission[]> {
		return await apiClient.get({ url: "/api/user/menus" });
	}

	/**
	 * 批量更新菜单顺序
	 */
	async updateMenuOrder(menuOrders: { id: string; order: number }[]): Promise<void> {
		await apiClient.put({ url: "/api/menus/order", data: { menuOrders } });
	}
}

const menuService = new MenuService();
export default menuService;
