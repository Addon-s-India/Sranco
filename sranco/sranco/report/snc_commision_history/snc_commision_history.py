# Copyright (c) 2023, Dinesh Panchal and contributors
# For license information, please see license.txt

import frappe
from frappe.utils import logger

logger.set_log_level("DEBUG")
logger = frappe.logger("Sranco_logs", allow_site=True, file_count=1)

def execute(filters=None):
    columns, data = get_columns_and_data_commission(filters)
    return columns, data

def get_columns_and_data_commission(filters):
    columns = [
        {
            "fieldname": "item_code",
            "label": "Item Code",
            "fieldtype": "Link",
            "options": "Item",
            "width": 200
        },
        {
            "fieldname": "item_name",
            "label": "Item Name",
            "fieldtype": "Data",
            "width": 200
        },
        {
            "fieldname": "commission_percent",
            "label": "Commission %",
            "fieldtype": "Percent",
            "width": 120
        },
        {
            "fieldname": "commission_amount",
            "label": "Commission Amount",
            "fieldtype": "Currency",
            "width": 130
        },
        {
            "fieldname": "changed_by",
            "label": "Changed By",
            "fieldtype": "Data",
            "width": 150
        },
        {
            "fieldname": "date_time",
            "label": "Date and Time",
            "fieldtype": "Datetime",
            "width": 200
        },
        {
            "fieldname": "customer",
            "label": "Customer",
            "fieldtype": "Link",
            "options": "Customer",
            "width": 200
        }
    ]

# ... (Continuing from the previous part)

    item_data = get_item_details_commission(filters)
    data = []

    for item in item_data:
        current_commission_percent = item.get("current_commission_percent")
        current_commission_amount = item.get("current_commission_amount")
        doc = item.get("docname")
        itemCode = item.get("item_code")
        itemName = item.get("item_name")
        customer = item.get("customer")
        
        row = {
            "docname": doc,
            "item_code": itemCode,
            "item_name": itemName,
            "commission_percent": current_commission_percent,
            "commission_amount": current_commission_amount,
            "changed_by": f"<b>Current Commission</b>",
            "date_time": None,
            "customer": customer,
        }
        data.append(row)

        # Fetch the commission history for the current item
        commission_history_data = get_commission_history_for_item(item.get("docname"), filters)

        for history in commission_history_data:
            row = {
                "docname": "",
                "item_code": "",
                "item_name": "",
                "commission_percent": history.get("percent"),
                "commission_amount": history.get("amount"),
                "changed_by": history.get("changed_by"),
                "date_time": history.get("date_time"),
                "customer": ""
            }
            data.append(row)

    return columns, data

def get_item_details_commission(filters):
    conditions = []

    if filters.get("tn_number"):
        conditions.append("i.custom_tn_number = %(tn_number)s")
    if filters.get("customer"):
        conditions.append("ip.customer = %(customer)s")
    if filters.get("item_code"):
        conditions.append("ip.item_code = %(item_code)s")

    conditions = " AND ".join(conditions)

    return frappe.db.sql("""
        SELECT DISTINCT
            ip.name as docname,
            ip.item_code,
            ip.item_name,
            ip.customer,
            ip.custom_snc_commission_ as current_commission_percent,
            ip.custom_snc_commission_amount as current_commission_amount
        FROM
            `tabItem Price` ip
        JOIN `tabItem` i ON ip.item_code = i.name
        WHERE {conditions}
    """.format(conditions=conditions or "1=1"), filters, as_dict=1)

def get_commission_history_for_item(docName, filters):
    conditions = ["ip.name = %(docName)s"]

    # Format the dates with time
    if filters.get("from_date"):
        filters["from_datetime"] = filters["from_date"] + " 00:00:00"
        conditions.append("ch.date_time >= %(from_datetime)s")
    if filters.get("to_date"):
        filters["to_datetime"] = filters["to_date"] + " 23:59:59"
        conditions.append("ch.date_time <= %(to_datetime)s")
    if filters.get("item_code"):
        conditions.append("ip.item_code = %(item_code)s")

    conditions = " AND ".join(conditions)
    
    return frappe.db.sql("""
        SELECT
            ch.percent,
            ch.amount,
            ch.changed_by,
            ch.date_time
        FROM
            `tabItem Price` ip
        LEFT JOIN `tabSNC Commission History` ch ON ip.name = ch.parent
        WHERE {conditions}
        ORDER BY ch.date_time DESC
    """.format(conditions=conditions), {**filters, "docName": docName}, as_dict=1)
