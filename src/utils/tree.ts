import { chain } from "ramda";

/**
 * Flatten an array containing a tree structure
 * @param {T[]} trees - An array containing a tree structure
 * @returns {T[]} - Flattened array
 */
export function flattenTrees<T extends { children?: T[] }>(trees: T[] = []): T[] {
	return chain((node) => {
		const children = node.children || [];
		return [node, ...flattenTrees(children)];
	}, trees);
}

/**
 * 从扁平化数组重建树结构
 * @param {T[]} flatArray - 扁平化的数组
 * @param {string} idKey - ID字段名
 * @param {string} parentIdKey - 父ID字段名
 * @param {string} childrenKey - 子节点字段名
 * @returns {T[]} - 重建的树结构
 */
export function buildTreeFromFlat<T extends Record<string, any>>(
	flatArray: T[],
	idKey: string = "id",
	parentIdKey: string = "parentId",
	childrenKey: string = "children",
): T[] {
	if (!flatArray || flatArray.length === 0) return [];

	// 创建ID到节点的映射
	const nodeMap = new Map<string, T>();
	const result: T[] = [];

	// 初始化所有节点，确保每个节点都有children数组
	flatArray.forEach((item) => {
		const node = { ...item, [childrenKey]: [] };
		nodeMap.set(item[idKey], node);
	});
	const allNodes = Array.from(nodeMap.values());
	// 构建树结构
	flatArray.forEach((item) => {
		const node = nodeMap.get(item[idKey])!;
		const parentId = item[parentIdKey];

		if (!parentId || parentId === "" || parentId === null) {
			// 根节点
			result.push(node);
		} else {
			// 子节点
			const parent = nodeMap.get(parentId);
			if (parent) {
				parent[childrenKey].push(node);
			} else {
				// 如果找不到父节点，作为根节点处理
				result.push(node);
			}
		}
	});
	allNodes.forEach((node) => {
		if (node[childrenKey].length === 0) {
			delete node[childrenKey];
		}
	});
	return result;
}

/**
 * 在树结构中插入新节点
 * @param {T[]} tree - 原始树结构
 * @param {T} newNode - 新节点
 * @param {string} parentId - 父节点ID
 * @param {string} idKey - ID字段名
 * @param {string} parentIdKey - 父ID字段名
 * @param {string} childrenKey - 子节点字段名
 * @returns {T[]} - 插入新节点后的树结构
 */
export function insertNodeToTree<T extends Record<string, any>>(
	tree: T[],
	newNode: T,
	parentId: string | null = null,
	idKey: string = "id",
	parentIdKey: string = "parentId",
	childrenKey: string = "children",
): T[] {
	// 设置新节点的parentId
	const nodeToInsert = {
		...newNode,
		[parentIdKey]: parentId || "",
		[childrenKey]: newNode[childrenKey] || [],
	};

	// 如果没有父节点，直接添加到根级别
	if (!parentId || parentId === "") {
		return [...tree, nodeToInsert];
	}

	// 递归查找父节点并插入
	const insertToNode = (nodes: T[]): T[] => {
		return nodes.map((node) => {
			if (node[idKey] === parentId) {
				// 找到父节点，插入新节点
				const children = node[childrenKey] || [];
				return {
					...node,
					[childrenKey]: [...children, nodeToInsert],
				};
			} else if (node[childrenKey] && node[childrenKey].length > 0) {
				// 递归查找子节点
				return {
					...node,
					[childrenKey]: insertToNode(node[childrenKey]),
				};
			}
			return node;
		});
	};

	return insertToNode(tree);
}

/**
 * 从树结构中删除节点
 * @param {T[]} tree - 原始树结构
 * @param {string} nodeId - 要删除的节点ID
 * @param {string} idKey - ID字段名
 * @param {string} childrenKey - 子节点字段名
 * @returns {T[]} - 删除节点后的树结构
 */
export function removeNodeFromTree<T extends Record<string, any>>(
	tree: T[],
	nodeId: string,
	idKey: string = "id",
	childrenKey: string = "children",
): T[] {
	const removeFromNodes = (nodes: T[]): T[] => {
		return nodes
			.filter((node) => node[idKey] !== nodeId)
			.map((node) => {
				if (node[childrenKey] && node[childrenKey].length > 0) {
					return {
						...node,
						[childrenKey]: removeFromNodes(node[childrenKey]),
					};
				}
				return node;
			});
	};

	return removeFromNodes(tree);
}
/**
 * 更新树结构中的节点
 * @param {T[]} tree - 原始树结构
 * @param {T} updatedNode - 更新的节点
 * @param {string} idKey - ID字段名
 * @param {string} childrenKey - 子节点字段名
 * @returns {T[]} - 更新节点后的树结构
 */
export function updateNodeInTree<T extends Record<string, any>>(
	tree: T[],
	updatedNode: T,
	idKey: string = "id",
	childrenKey: string = "children",
): T[] {
	const updateInNodes = (nodes: T[]): T[] => {
		return nodes.map((node) => {
			if (node[idKey] === updatedNode[idKey]) {
				// 找到要更新的节点，保持原有的children
				return {
					...updatedNode,
					[childrenKey]: node[childrenKey] || [],
				};
			} else if (node[childrenKey] && node[childrenKey].length > 0) {
				// 递归更新子节点
				return {
					...node,
					[childrenKey]: updateInNodes(node[childrenKey]),
				};
			}
			return node;
		});
	};

	return updateInNodes(tree);
}

/**
 * 查找树结构中的节点
 * @param {T[]} tree - 树结构
 * @param {string} nodeId - 节点ID
 * @param {string} idKey - ID字段名
 * @param {string} childrenKey - 子节点字段名
 * @returns {T | null} - 找到的节点或null
 */
export function findNodeInTree<T extends Record<string, any>>(
	tree: T[],
	nodeId: string,
	idKey: string = "id",
	childrenKey: string = "children",
): T | null {
	for (const node of tree) {
		if (node[idKey] === nodeId) {
			return node;
		}
		if (node[childrenKey] && node[childrenKey].length > 0) {
			const found = findNodeInTree(node[childrenKey], nodeId, idKey, childrenKey);
			if (found) return found as T;
		}
	}
	return null;
}

/**
 * 获取节点的完整路径
 * @param {T[]} tree - 树结构
 * @param {string} nodeId - 节点ID
 * @param {string} idKey - ID字段名
 * @param {string} childrenKey - 子节点字段名
 * @returns {T[]} - 从根到目标节点的路径
 */
export function getNodePath<T extends Record<string, any>>(
	tree: T[],
	nodeId: string,
	idKey: string = "id",
	childrenKey: string = "children",
): T[] {
	const findPath = (nodes: T[], path: T[] = []): T[] | null => {
		for (const node of nodes) {
			const currentPath = [...path, node];

			if (node[idKey] === nodeId) {
				return currentPath;
			}

			if (node[childrenKey] && node[childrenKey].length > 0) {
				const found = findPath(node[childrenKey], currentPath);
				if (found) return found;
			}
		}
		return null;
	};

	return findPath(tree) || [];
}
