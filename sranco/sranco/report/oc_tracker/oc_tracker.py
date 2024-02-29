# Copyright (c) 2023, Dinesh Panchal and contributors
# For license information, please see license.txt

import frappe
from frappe import _


def execute(filters=None):
    columns = get_columns()
    data = get_data(filters)
    return columns, data

def get_columns():
    return [
        {
            "label": _("Order Confirmation"),
            "fieldname": "order_confirmation",
            "fieldtype": "Data",
            "width": 160
        },
        {
            "label": _("Customer"),
            "fieldname": "customer",
            "fieldtype": "Link",
            "options": "Customer",
            "width": 140
        },
        {
            "label": _("Customer Name"),
            "fieldname": "customer_name",
            "fieldtype": "Data",
            "width": 160
        },
        {
            "label": _("Seq No."),
            "fieldname": "seq_no",
            "fieldtype": "Data",
            "width": 100
        },
        {
            "label": _("TN Number"),
            "fieldname": "custom_tn_number",
            "fieldtype": "Data",
            "width": 140	
        },
        {
            "label": _("Shape"),
            "fieldname": "shape",
            "fieldtype": "Data",
            "width": 100
        },
        {
            "label": _("Diameter"),
            "fieldname": "diameter",
            "fieldtype": "Data",
            "width": 100
        },
        {
            "label": _("Thickness"),
            "fieldname": "thickness",
            "fieldtype": "Data",
            "width": 100
        },
        {
            "label": _("Bore"),
            "fieldname": "bore",
            "fieldtype": "Data",
            "width": 100
        },
        {
            "label": _("Speed"),
            "fieldname": "speed",
            "fieldtype": "Data",
            "width": 100
        },
        {
            "label": _("Order Qty"),
            "fieldname": "order_qty",
            "fieldtype": "Float",
            "width": 100
        },
        {
            "label": _("Ready Qty"),
            "fieldname": "ready_qty",
            "fieldtype": "Float",
            "width": 100
        },
        {
            "label": _("Shipment Qty in Transit"),
            "fieldname": "shipment_qty_in_transit",
            "fieldtype": "Float",
            "width": 140
        },
        {
            "label": _("Received Qty"),
            "fieldname": "received_qty",
            "fieldtype": "Float",
            "width": 100
        }
    ]
    
    
def get_data(filters):
    
    conditions = ""

    if filters.get("order_confirmation"):
        conditions += " AND po.custom_order_confirmation LIKE %(order_confirmation)s"
    if filters.get("tn_number"):
        conditions += " AND poi.custom_tn_number LIKE %(tn_number)s"
    if filters.get("customer"):
        conditions += " AND po.customer LIKE %(customer)s"
    if filters.get("from_date"):
        conditions += " AND po.transaction_date >= %(from_date)s"
    if filters.get("to_date"):
        conditions += " AND po.transaction_date <= %(to_date)s"
        
    data = frappe.db.sql("""
        SELECT
            po.custom_order_confirmation as order_confirmation,
            po.customer,
            cu.customer_name,
            poi.item_code,
            CAST(poi.idx AS CHAR) as seq_no,
            poi.custom_tn_number,
            it.custom_shape as shape,
            it.custom_diameter as diameter,
            it.custom_thickness as thickness,
            it.custom_bore as bore,
            it.custom_speed as speed,
            poi.qty as order_qty,
            poi.custom_ready_qty as ready_qty,
            poi.custom_shipped_qty - poi.received_qty as shipment_qty_in_transit,
            poi.received_qty
        FROM
            `tabPurchase Order` AS po
        JOIN
            `tabPurchase Order Item` AS poi ON po.name = poi.parent
        JOIN
            `tabItem` AS it ON poi.item_code = it.name
        JOIN
            `tabCustomer` AS cu ON po.customer = cu.name
        WHERE
            po.docstatus < 2
            {}
        ORDER BY
            po.transaction_date, poi.idx;
        """.format(conditions),
        filters,
        as_dict=True,)
    
    return data
            
            
            
