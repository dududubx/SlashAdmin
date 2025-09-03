import type { MenuProps } from "antd";
import { Menu } from "antd";

type MenuItem = Required<MenuProps>["items"][number];

const orderMenuTop: MenuItem[] = [
	{
		label: "全部订单",
		key: "allOrders",
	},
	{
		label: "待付款",
		key: "pendingPayment",
	},
	{
		label: "待发货",
		key: "pendingDelivery",
	},
	{
		label: "已发货",
		key: "delivered",
	},
	{
		label: "退款中",
		key: "refunding",
	},
	{
		label: "已完成",
		key: "completed",
	},
];

export default function OrderMenuTop({
	current,
	setCurrent,
}: {
	current: string;
	setCurrent: (key: string) => void;
}) {
	const onClick: MenuProps["onClick"] = (e) => {
		console.log("click ", e);
		setCurrent(e.key);
	};
	return <Menu onClick={onClick} selectedKeys={[current]} mode="horizontal" items={orderMenuTop} />;
}
