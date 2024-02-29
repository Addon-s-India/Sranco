# Copyright (c) 2023, Dinesh Panchal and contributors
# For license information, please see license.txt

# import frappe


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
    return [
        {"label": _("Shipment Tracker"), "fieldname": "name", "fieldtype": "Link", "options": "Shipment Tracker", "width": 160},
        {"label": _("GI Date"), "fieldname": "gi_date", "fieldtype": "Date", "width": 100},
        {"label": _("Order Confirmation"), "fieldname": "order_confirmation", "width": 160},
        {"label": _("TN Number"), "fieldname": "tn_number", "width": 140},
        {"label": _("Customer"), "fieldname": "customer", "fieldtype": "Link", "options": "Customer", "width": 120},
        {"label": _("Position"), "fieldname": "position", "fieldtype": "Int",  "width": 50},
        # {"label": _("Total Quantity to Ship"), "fieldname": "total_quantity_to_ship", "fieldtype": "Float", "width": 170},
        {"label": _("Mode"), "fieldname": "mode", "width": 100},
        {"label": _("Quantity"), "fieldname": "quantity", "fieldtype": "Float", "width": 100},
        {"label": _("Received Qty"), "fieldname": "received_qty", "fieldtype": "Float", "width": 120},
        {"label": _("Balance Qty"), "fieldname": "balance_qty", "fieldtype": "Float", "width": 120},
        {"label": _("EOD"), "fieldname": "eod", "fieldtype": "Date", "width": 100}
    ]

def get_data(filters):
    conditions = ""

    if filters.get("order_confirmation"):
        conditions += " AND st.order_confirmation LIKE %(order_confirmation)s"
    if filters.get("tn_number"):
        conditions += " AND st.tn_number LIKE %(tn_number)s"
    if filters.get("customer"):
        conditions += " AND st.customer LIKE %(customer)s"
    if filters.get("from_date"):
        conditions += " AND tmt.eod >= %(from_date)s"
    if filters.get("to_date"):
        conditions += " AND tmt.eod <= %(to_date)s"
    # Check if the "show_eod_expired" checkbox is checked
    if not filters.get("show_eod_expired"):
        conditions += ""
    else:
        conditions += " AND (tmt.eod < CURDATE() OR tmt.received_qty = 0)"
    logger.info("conditions: {}".format(conditions))
    
    data = frappe.db.sql("""
        SELECT
            st.name,
            st.sales_order,
            st.purchase_order,
            st.gi_date,
            st.item_code,
            st.item_name,
            st.order_confirmation,
            st.tn_number,
            st.customer,
            tmt.mode,
            tmt.quantity,
            tmt.received_qty,
            (tmt.quantity - tmt.received_qty) AS balance_qty,
            tmt.eod,
            tmt.sequence_no as position
        FROM
            `tabShipment Tracker` AS st
        JOIN
            `tabTransport Mode Table` AS tmt ON st.name = tmt.parent
        WHERE
            st.docstatus = 1
            {}
        ORDER BY
            st.name, tmt.mode;
    """.format(conditions),
        filters,
        as_dict=1,
    )
    return data
