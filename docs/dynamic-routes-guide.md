# 动态路由树结构管理系统使用指南

## 概述

动态路由系统允许在运行时动态添加、更新和删除路由，无需重启应用。系统支持完整的树结构管理，能够智能处理父子关系、路由插入和树结构重建。

### 支持的路由模式：

1. **模块模式 (module mode)**: 基于文件系统的静态路由 + 动态路由
2. **权限模式 (permission mode)**: 基于数据库权限的完全动态路由

### 核心特性：

- ✅ **智能树结构管理** - 自动处理父子关系和树结构重建
- ✅ **可视化操作界面** - 提供直观的树形结构管理界面
- ✅ **实时路由更新** - 路由变更立即生效，无需刷新页面
- ✅ **智能父节点插入** - 支持选择父节点并正确插入到树结构中
- ✅ **批量操作支持** - 支持批量添加、移动和删除路由
- ✅ **数据持久化** - 路由数据自动保存到本地存储

## 核心组件

### 1. 路由状态管理 (`src/store/routeStore.ts`)

```typescript
// 获取动态路由数据
const dynamicRoutes = useDynamicRoutes();

// 获取路由版本号（用于强制刷新）
const routeVersion = useRouteVersion();

// 路由操作方法
const { addRoute, updateRoute, removeRoute, setDynamicRoutes } = useRouteActions();
```

### 2. 动态路由管理 Hook (`src/hooks/use-dynamic-routes.ts`)

```typescript
const { 
  // 基础方法
  addDynamicRoute,           // 添加新路由
  updateDynamicRoute,        // 更新现有路由
  removeDynamicRoute,        // 删除路由
  refreshRoutes,             // 刷新路由数据
  
  // 智能树结构管理方法
  addDynamicRouteToTree,     // 智能添加路由到指定父节点
  updateDynamicRouteInTree,  // 智能更新路由（保持树结构）
  removeDynamicRouteFromTree,// 智能删除路由（包括子节点）
  getDynamicRouteTree,       // 获取树结构数据
  getAllRoutes,              // 获取所有路由（扁平化）
  moveRouteToParent,         // 移动路由到新父节点
  addMultipleRoutes,         // 批量添加路由
  findRouteByPath,           // 根据路径查找路由
  getRouteChildren,          // 获取路由的子节点
} = useDynamicRoutes();
```

### 3. 树结构工具函数 (`src/utils/tree.ts`)

```typescript
// 从扁平化数组重建树结构
buildTreeFromFlat(flatArray, 'id', 'parentId', 'children')

// 在树结构中插入新节点
insertNodeToTree(tree, newNode, parentId)

// 从树结构中删除节点
removeNodeFromTree(tree, nodeId)

// 更新树结构中的节点
updateNodeInTree(tree, updatedNode)

// 查找树结构中的节点
findNodeInTree(tree, nodeId)

// 获取节点的完整路径
getNodePath(tree, nodeId)
```

### 3. 菜单服务 (`src/api/services/menuService.ts`)

提供与后端API交互的方法：
- `createMenu()` - 创建菜单
- `updateMenu()` - 更新菜单
- `deleteMenu()` - 删除菜单
- `getUserMenus()` - 获取用户菜单

## 使用方法

### 1. 智能添加路由到指定父节点

```typescript
// 添加到根级别
const rootRoute: Permission = {
  id: faker.string.uuid(),
  name: 'sys.menu.dashboard',
  route: 'dashboard',
  component: '/pages/dashboard/index.tsx',
  icon: 'ic-dashboard',
  order: 1,
  hide: false,
  type: PermissionType.MENU,
};

const success = await addDynamicRouteToTree(rootRoute); // 不指定parentId，添加到根级别

// 添加到指定父节点
const childRoute: Permission = {
  id: faker.string.uuid(),
  name: 'sys.menu.dashboard.analytics',
  route: 'analytics',
  component: '/pages/dashboard/analytics/index.tsx',
  icon: 'ic-analytics',
  order: 1,
  hide: false,
  type: PermissionType.MENU,
};

const success2 = await addDynamicRouteToTree(childRoute, 'parent-route-id');
```

### 2. 获取和展示树结构

```typescript
// 获取完整的树结构
const treeStructure = getDynamicRouteTree();
console.log('当前路由树结构:', treeStructure);

// 获取所有路由的扁平化数据
const allRoutes = getAllRoutes();
console.log('所有路由（扁平化）:', allRoutes);

// 查找特定路由
const foundRoute = findRouteByPath('dashboard/analytics');
console.log('找到的路由:', foundRoute);

// 获取某个路由的所有子节点
const children = getRouteChildren('parent-route-id');
console.log('子路由:', children);
```

### 3. 移动路由到新的父节点

```typescript
// 将路由移动到新的父节点
const success = await moveRouteToParent('route-id', 'new-parent-id');

// 将路由移动到根级别
const success2 = await moveRouteToParent('route-id'); // 不指定新父节点ID
```

### 4. 批量操作

```typescript
// 批量添加路由
const routes: Permission[] = [
  {
    id: faker.string.uuid(),
    name: 'sys.menu.users',
    route: 'users',
    component: '/pages/users/index.tsx',
    icon: 'ic-users',
    order: 1,
  },
  {
    id: faker.string.uuid(),
    name: 'sys.menu.settings',
    route: 'settings',
    component: '/pages/settings/index.tsx',
    icon: 'ic-settings',
    order: 2,
  }
];

const result = await addMultipleRoutes(routes);
console.log(`批量添加结果: ${result.success}/${result.total} 成功`);
```

### 2. 更新现有路由

```typescript
const updatedRoute: Permission = {
  ...existingRoute,
  name: 'sys.menu.updatedPage',
  order: 10,
};

const success = await updateDynamicRoute(updatedRoute);
if (success) {
  console.log('路由更新成功');
}
```

### 3. 删除路由

```typescript
const success = await removeDynamicRoute(routeId);
if (success) {
  console.log('路由删除成功');
}
```

### 4. 刷新路由系统

```typescript
const success = await refreshRoutes();
if (success) {
  console.log('路由系统已刷新');
}
```

## 工作原理

### 1. 路由合并机制

系统会自动合并静态路由和动态路由：

```typescript
// 在 usePermissionRoutes hook 中
const combinedRoutes = useMemo(() => {
  const staticRoutes = getMenuRoutes(permissionRoutes);
  
  if (dynamicRoutes && dynamicRoutes.length > 0) {
    const flattenedDynamicRoutes = flattenTrees(dynamicRoutes);
    const dynamicAppRoutes = transformPermissionsToRoutes(dynamicRoutes, flattenedDynamicRoutes);
    return [...staticRoutes, ...dynamicAppRoutes];
  }
  
  return staticRoutes;
}, [permissionRoutes, dynamicRoutes, routeVersion]);
```

### 2. 实时更新机制

- 路由变更会触发 `routeVersion` 更新
- React 组件通过 `useMemo` 依赖 `routeVersion` 自动重新渲染
- 侧边栏菜单会立即反映路由变更

### 3. 数据持久化

动态路由数据会自动持久化到 localStorage：

```typescript
// 在 routeStore 中
partialize: (state) => ({
  [StorageEnum.DynamicRoutes]: state.dynamicRoutes,
  routeVersion: state.routeVersion,
})
```

## 配置说明

### 1. 环境变量

在 `.env` 文件中设置路由模式：

```bash
# 模块模式（推荐）
VITE_APP_ROUTER_MODE=module

# 权限模式
VITE_APP_ROUTER_MODE=permission
```

### 2. 后端API接口

需要实现以下API接口：

```typescript
// 菜单管理接口
POST   /api/menus           // 创建菜单
PUT    /api/menus/:id       // 更新菜单
DELETE /api/menus/:id       // 删除菜单
GET    /api/menus           // 获取所有菜单
GET    /api/user/menus      // 获取用户权限菜单
PUT    /api/menus/order     // 批量更新菜单顺序
```

### 3. 权限数据结构

```typescript
interface Permission {
  id: string;
  name: string;           // 菜单名称（国际化key）
  route: string;          // 路由路径
  component?: string;     // 组件路径
  parentId?: string;      // 父级菜单ID
  icon?: string;          // 图标
  order?: number;         // 排序
  hide?: boolean;         // 是否隐藏
  type?: PermissionType;  // 权限类型
  children?: Permission[]; // 子菜单
}
```

## 最佳实践

### 1. 路由命名规范

```typescript
// 推荐的路由命名
{
  name: 'sys.menu.moduleName.pageName',  // 国际化key
  route: 'module-name/page-name',        // kebab-case
  component: '/pages/module-name/page-name/index.tsx'
}
```

### 2. 错误处理

```typescript
try {
  const success = await addDynamicRoute(newRoute);
  if (success) {
    // 成功处理
    message.success('路由添加成功');
  }
} catch (error) {
  // 错误处理
  message.error('路由添加失败');
  console.error(error);
}
```

### 3. 批量操作

```typescript
// 批量添加路由
const addMultipleRoutes = async (routes: Permission[]) => {
  const results = await Promise.allSettled(
    routes.map(route => addDynamicRoute(route))
  );
  
  const successCount = results.filter(r => r.status === 'fulfilled').length;
  console.log(`成功添加 ${successCount}/${routes.length} 个路由`);
};
```

## 演示页面

访问 `/management/menu/dynamicDemo` 查看完整的动态路由演示，包括：

- 添加示例路由
- 更新现有路由
- 删除路由
- 刷新路由系统
- 查看当前路由状态

## 注意事项

1. **组件路径**: 确保 `component` 路径指向实际存在的组件文件
2. **权限验证**: 在实际项目中需要添加权限验证逻辑
3. **路由冲突**: 避免动态路由与静态路由路径冲突
4. **性能考虑**: 大量动态路由可能影响性能，建议分页加载
5. **数据同步**: 确保前后端路由数据保持同步

## 故障排除

### 1. 路由不生效

- 检查 `routeVersion` 是否更新
- 确认组件路径是否正确
- 查看控制台是否有错误信息

### 2. 菜单不显示

- 检查 `hide` 属性是否为 `false`
- 确认 `meta.hideMenu` 设置
- 验证权限数据结构

### 3. API调用失败

- 检查网络连接
- 验证API接口是否正确实现
- 查看后端日志

通过这个动态路由系统，你可以轻松实现运行时的路由管理，为用户提供更灵活的菜单配置体验。