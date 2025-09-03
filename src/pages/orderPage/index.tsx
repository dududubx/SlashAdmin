import React, { useState, useEffect } from "react";
import {
	Card,
	Table,
	Button,
	Space,
	Input,
	Select,
	// DatePicker,
	Tag,
	// Avatar,
	Typography,
	// Checkbox,
	Row,
	Col,
	// Statistic,
	// Divider,
	Image,
} from "antd";
import {
	SearchOutlined,
	ReloadOutlined,
	ExportOutlined,
	// EyeOutlined,
	// MessageOutlined,
	// PhoneOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { faker } from "@faker-js/faker";
import dayjs from "dayjs";
import OrderMenuTop from "./orderMenuTop";

const { Search } = Input;
const { Option } = Select;
// const { RangePicker } = DatePicker;
const { Text } = Typography;

// 订单状态枚举
enum OrderStatus {
	PENDING = "pendingPayment",
	REFUNDING = "refunding",
	SHIPPED = "pendingDelivery",
	DELIVERED = "delivered",
	COMPLETED = "completed",
}

enum OrderType {
	PAYMENT = "payment",
	LEASE = "lease",
	RECYCLE = "recycle",
}

// 订单状态配置
// const ORDER_STATUS_CONFIG = {
//   [OrderStatus.PENDING]: { label: "待付款", color: "orange" },
//   [OrderStatus.REFUNDING]: { label: "退款中", color: "blue" },
//   [OrderStatus.SHIPPED]: { label: "待发货", color: "cyan" },
//   [OrderStatus.DELIVERED]: { label: "已发货", color: "green" },
//   [OrderStatus.COMPLETED]: { label: "已完成", color: "red" },
// };

const ORDER_TYPE_CONFIG = {
	[OrderType.PAYMENT]: { label: "购买订单", color: "blue" },
	[OrderType.LEASE]: { label: "租赁订单", color: "green" },
	[OrderType.RECYCLE]: { label: "回收订单", color: "red" },
};

// 订单数据类型
interface OrderItem {
	id: string;
	orderNo: string;
	createTime: string;
	status: OrderStatus;
	customerName: string;
	customerPhone: string;
	productImage: string;
	productTitle: string;
	productSpecs: string;
	quantity: number;
	unitPrice: number;
	totalAmount: number;
	paymentMethod: string;
	deliveryTime?: string;
	remark?: string;
	orderType: OrderType;
}

// 生成模拟订单数据
const generateMockOrders = (count: number): OrderItem[] => {
	return Array.from({ length: count }, () => ({
		id: faker.string.uuid(),
		orderNo: faker.string.numeric(18),
		createTime: faker.date.recent({ days: 30 }).toISOString(),
		status: faker.helpers.enumValue(OrderStatus),
		orderType: faker.helpers.enumValue(OrderType),
		customerName: faker.person.fullName(),
		customerPhone: faker.phone.number(),
		productImage: faker.image.url({ width: 80, height: 80 }),
		productTitle: faker.commerce.productName(),
		productSpecs: `颜色: ${faker.color.human()}, 尺寸: ${faker.helpers.arrayElement(["S", "M", "L", "XL"])}`,
		quantity: faker.number.int({ min: 1, max: 5 }),
		unitPrice: faker.number.float({ min: 10, max: 500, fractionDigits: 2 }),
		totalAmount: 0, // 将在后面计算
		paymentMethod: faker.helpers.arrayElement(["支付宝", "微信支付", "银行卡"]),
		deliveryTime: faker.helpers.maybe(() => faker.date.future().toISOString(), {
			probability: 0.6,
		}),
		remark: faker.helpers.maybe(() => faker.lorem.sentence(), {
			probability: 0.3,
		}),
	})).map((order) => ({
		...order,
		totalAmount: order.quantity * order.unitPrice,
	}));
};

export default function OrderManagePage() {
	const [orders, setOrders] = useState<OrderItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
	const [searchText, setSearchText] = useState("");
	const [statusFilter, setStatusFilter] = useState("allOrders");
	const [dateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
	const [orderTypeFilter, setOrderTypeFilter] = useState<OrderType | "all">("all");
	// 初始化数据
	useEffect(() => {
		loadOrders();
	}, []);

	const loadOrders = async () => {
		setLoading(true);
		try {
			// 模拟API调用
			// await new Promise((resolve) => setTimeout(resolve, 1000));
			const mockData = generateMockOrders(50);
			setOrders(mockData);
		} catch (error) {
			console.error("加载订单失败:", error);
		} finally {
			setLoading(false);
		}
	};

	// 过滤订单数据
	const filteredOrders = orders.filter((order) => {
		// 搜索过滤
		if (searchText) {
			const searchLower = searchText.toLowerCase();
			if (
				!order.orderNo.toLowerCase().includes(searchLower) &&
				!order.customerName.toLowerCase().includes(searchLower) &&
				!order.productTitle.toLowerCase().includes(searchLower)
			) {
				return false;
			}
		}

		// 状态过滤
		if (statusFilter !== "allOrders" && order.status !== statusFilter) {
			return false;
		}
		if (orderTypeFilter !== "all" && order.orderType !== orderTypeFilter) {
			return false;
		}

		// 日期范围过滤
		if (dateRange) {
			const orderDate = dayjs(order.createTime);
			if (!(orderDate as any).isBetween(dateRange[0], dateRange[1], "day", "[]")) {
				return false;
			}
		}

		return true;
	});

	// 统计数据
	// const statistics = {
	//   total: orders.length,
	//   pending: orders.filter((o) => o.status === OrderStatus.PENDING).length,
	//   confirmed: orders.filter((o) => o.status === OrderStatus.CONFIRMED).length,
	//   shipped: orders.filter((o) => o.status === OrderStatus.SHIPPED).length,
	//   delivered: orders.filter((o) => o.status === OrderStatus.DELIVERED).length,
	//   totalAmount: orders.reduce((sum, order) => sum + order.totalAmount, 0),
	// };

	// 表格列定义
	const columns: ColumnsType<OrderItem> = [
		{
			title: "商品名称",
			key: "productTitle",
			// width: 150,
			render: (_, record) => (
				<div>
					<div className="flex items-center absolute top-0 left-0 w-full bg-blue-100 px-5">
						{/* <Checkbox
              checked={selectedRowKeys.includes(record.id)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedRowKeys([...selectedRowKeys, record.id]);
                } else {
                  setSelectedRowKeys(
                    selectedRowKeys.filter((key) => key !== record.id)
                  );
                }
              }}
            /> */}
						<Text strong className="mr-2">
							订单号: {record.orderNo}
						</Text>
						<div className="text-gray-500 text-sm">
							创建时间: {dayjs(record.createTime).format("YYYY-MM-DD HH:mm:ss")}
						</div>
					</div>

					<div className="mt-5 flex items-center">
						<Image
							src={record.productImage}
							alt={record.productTitle}
							width={60}
							height={60}
							className="rounded"
							fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
						/>
						<div className="flex-1 ml-2">
							<div className="font-medium text-gray-900 mb-1">{record.productTitle}</div>
							<div className="text-sm text-gray-500 mb-1">{record.productSpecs}</div>
							<div className="text-sm text-gray-500 mt-1">支付方式: {record.paymentMethod}</div>
						</div>
					</div>
				</div>
			),
		},
		{
			title: "单价",
			key: "unitPrice",
			dataIndex: "unitPrice",
			width: 80,
			// render: (_, record) => <div className="flex items-start space-x-3"></div>,
		},
		{
			title: "数量",
			key: "quantity",
			dataIndex: "quantity",
			width: 80,
		},
		{
			title: "订单类型",
			key: "orderType",
			width: 100,
			render: (_, record) => (
				<div>
					<div className="mt-1">
						<Tag color={ORDER_TYPE_CONFIG[record.orderType].color}>{ORDER_TYPE_CONFIG[record.orderType].label}</Tag>
					</div>
				</div>
			),
		},
		{
			title: "实付款",
			key: "amount",
			width: 80,
			align: "right",
			render: (_, record) => (
				<div>
					<Text strong className="text-lg">
						¥{record.totalAmount.toFixed(2)}
					</Text>
					{/* {record.deliveryTime && (
            <div className="text-xs text-gray-500 mt-1">
              预计送达: {dayjs(record.deliveryTime).format("MM-DD HH:mm")}
            </div>
          )} */}
				</div>
			),
		},
		// {
		//   title: "操作",
		//   key: "actions",
		//   width: 100,
		//   align: "center",
		//   render: (_) => (
		//     <Space direction="vertical" size="small">
		//       <Button type="primary" size="small">
		//         处理
		//       </Button>
		//       <Button size="small">详情</Button>
		//     </Space>
		//   ),
		// },
	];

	const rowSelection = {
		selectedRowKeys,
		onChange: (newSelectedRowKeys: React.Key[]) => {
			setSelectedRowKeys(newSelectedRowKeys);
		},
		onSelectAll: (
			selected: boolean,
			// selectedRows: OrderItem[],
			// changeRows: OrderItem[]
		) => {
			if (selected) {
				setSelectedRowKeys(filteredOrders.map((order) => order.id));
			} else {
				setSelectedRowKeys([]);
			}
		},
	};

	return (
		<div className="p-6">
			{/* 统计卡片 */}
			{/* <Row gutter={16} className="mb-6">
        <Col span={4}>
          <Card>
            <Statistic
              title="总订单数"
              value={statistics.total}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="待确认"
              value={statistics.pending}
              valueStyle={{ color: "#fa8c16" }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="已确认"
              value={statistics.confirmed}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="已发货"
              value={statistics.shipped}
              valueStyle={{ color: "#13c2c2" }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="已送达"
              value={statistics.delivered}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="总金额"
              value={statistics.totalAmount}
              precision={2}
              prefix="¥"
              valueStyle={{ color: "#f5222d" }}
            />
          </Card>
        </Col>
      </Row> */}
			<OrderMenuTop setCurrent={setStatusFilter} current={statusFilter} />
			{/* 搜索和筛选 */}
			<Card className="mb-4">
				<Row gutter={18} align="middle">
					<Col span={6}>
						<Search
							placeholder="搜索订单号、客户姓名、商品名称"
							value={searchText}
							onChange={(e) => setSearchText(e.target.value)}
							onSearch={loadOrders}
							enterButton={<SearchOutlined />}
						/>
					</Col>
					<Col span={1.5}>
						<label className="mr-2">订单类型:</label>
					</Col>
					<Col span={4}>
						<Select placeholder="订单类型" value={orderTypeFilter} onChange={setOrderTypeFilter} className="w-full">
							<Option value="all">全部状态</Option>
							{Object.entries(ORDER_TYPE_CONFIG).map(([key, config]) => (
								<Option key={key} value={key}>
									{config.label}
								</Option>
							))}
						</Select>
					</Col>
					{/* <Col span={6}>
            <RangePicker
              placeholder={["开始日期", "结束日期"]}
              value={dateRange}
              onChange={(dates) => {
                if (dates && dates.length === 2) {
                  // 确保两个值都不是 null
                  const [start, end] = dates;
                  if (start && end) {
                    setDateRange([start, end]);
                  } else {
                    // 如果其中一个值是 null，则将整个日期范围设置为 null
                    setDateRange(null);
                  }
                } else {
                  setDateRange(null);
                }
              }}
              className="w-full"
            />
          </Col> */}
					<Col span={8}>
						<Space>
							<Button icon={<ReloadOutlined />} onClick={loadOrders}>
								刷新
							</Button>
							<Button icon={<ExportOutlined />}>导出</Button>
							<Button type="primary" disabled={selectedRowKeys.length === 0}>
								批量处理 ({selectedRowKeys.length})
							</Button>
						</Space>
					</Col>
				</Row>
			</Card>

			{/* 订单列表 */}
			<Card>
				<div className="mb-4 flex justify-between items-center">
					<div>
						<Text strong>共找到 {filteredOrders.length} 个订单</Text>
						{selectedRowKeys.length > 0 && (
							<Text className="ml-4 text-blue-600">已选择 {selectedRowKeys.length} 个订单</Text>
						)}
					</div>
					<Space>
						<Button size="small">批量确认</Button>
						<Button size="small">批量发货</Button>
						<Button size="small">批量取消</Button>
					</Space>
				</div>

				<Table
					columns={columns}
					dataSource={filteredOrders}
					rowKey="id"
					loading={loading}
					rowSelection={rowSelection}
					pagination={{
						total: filteredOrders.length,
						pageSize: 10,
						showSizeChanger: true,
						showQuickJumper: true,
						showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
					}}
					scroll={{ x: 800 }}
					size="middle"
				/>
			</Card>
			<style>
				{`
					.css-dev-only-do-not-override-shxm43.ant-table-wrapper .ant-table-cell{
						position:static !important;
					}
					.ant-table-row{
						position: relative !important;
					}
					`}
			</style>
		</div>
	);
}
