# Copyright (c) 2024, Dinesh Panchal and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.utils import logger

logger.set_log_level("DEBUG")
logger = frappe.logger("Sranco_logs", allow_site=True, file_count=1)


def execute(filters=None):
	columns = get_columns()
	data = get_data(filters)
	return columns, data


def get_columns():
	column = [
		{
			"label": _("Customer Name"),
			"fieldname": "customer_name",
			"fieldtype": "Data",
			"width": 150
		},
		{
			"label": _("Stock Order No"),
			"fieldname": "stock_order_no",
			"fieldtype": "Link",
			"options": "Stock Order",
			"width": 150
		},
		{
			"label": _("OC No"),
			"fieldname": "oc_no",
			"fieldtype": "Data",
			"width": 250
		},
		{
			"label": "Order Qty",
			"fieldname": "order_qty",
			"fieldtype": "Float",
			"width": 150
		},
		{
			"label": "Customer",
			"fieldname": "customer",
			"fieldtype": "Link",
			"options": "Customer",
			"width": 150
		},
		{
			"label": "Sales Order No.",
			"fieldname": "sales_order_no",
			"fieldtype": "Link",
			"options": "Sales Order",
			"width": 250
		},
		{
			"label": "Adj. Qty",
			"fieldname": "adj_qty",
			"fieldtype": "Float",
			"width": 150
		},
		{
			"label": "Balance Qty",
			"fieldname": "balance_qty",
			"fieldtype": "Float",
			"width": 150
		}
	]
	
	return column


def get_data(filters):
	
	conditions = ""
	
	if filters.get("customer"):
		conditions += " AND so.customer = %(customer)s"
	if filters.get("stock_order_no"):
		conditions += " AND so.name = %(stock_order_no)s"
	if filters.get("order_confirmation"):
		conditions += " AND so.order_confirmation = %(order_confirmation)s"
	if filters.get("from_date"):
		conditions += " AND so.creation >= %(from_date)s"
	if filters.get("to_date"):
		conditions += " AND so.creation <= %(to_date)s"
	if filters.get("tn_number"):
		conditions += " AND soi.tn_number = %(tn_number)s"
  
  
	data = frappe.db.sql("""
		SELECT
			so.customer,
			so.customer_name,
			so.name as stock_order_no,
			so.order_confirmation as oc_no,
			soi.qty as order_qty,
			soi.sales_qty as adj_qty,
			(soi.qty - soi.sales_qty) as balance_qty,
			sao.name as sales_order_no
		FROM
			`tabStock Order` so
		LEFT JOIN
			`tabStock Order Items` soi ON so.name = soi.parent
		LEFT JOIN
			`tabSales Order Item` saoi ON so.order_confirmation = saoi.custom_order_confirmation
		LEFT JOIN	
   			`tabSales Order` sao ON saoi.parent = sao.name
		WHERE
			so.docstatus = 1
			{conditions}
		ORDER BY
			so.name;
	""".format(conditions=conditions),
		filters,
		as_dict=1,
	)
 
	return data