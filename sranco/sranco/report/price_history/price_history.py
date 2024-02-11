# Copyright (c) 2023, Dinesh Panchal and contributors
# For license information, please see license.txt

# import frappe


import frappe
from frappe.utils import logger

logger.set_log_level("DEBUG")
logger = frappe.logger("Sranco_logs", allow_site=True, file_count=1)

def execute(filters=None):
    columns, data = get_columns_and_data(filters)
    return columns, data

def get_columns_and_data(filters):
    columns = [
        {
            "fieldname": "tn_number",
            "label": "TN Number",
            "fieldtype": "Data",
            "width": 200
        },
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
            "fieldname": "price",
            "label": "Price",
            "fieldtype": "Data",
            "width": 100
        },
        {
            "fieldname": "percent_change",
            "label": "% Change",
            "fieldtype": "Percent",
            "width": 100
        },
        {
            "fieldname": "changed_by",
            "label": "Changed By",
            "fieldtype": "Data",
            "width": 100
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
        },
        {
            "fieldname": "customer_name",
            "label": "Customer Name",
            "fieldtype": "Data",
            "width": 200
        },
        {
            "fieldname": "customer_item_code",
            "label": "Customer Item Code",
            "fieldtype": "Data",
            "width": 200
        }
    ]

    item_data = get_item_details(filters)
    data = []

    for item in item_data:
        current_price = item.get("current_rate")
        doc = item.get("docname")
        itemCode = item.get("item_code")
        itemName = item.get("item_name")
        tnNumber = item.get("tn_number")
        customer = item.get("customer")
        customer_name = item.get("customer_name")
        customer_item_code = item.get("customer_item_code")
        row = {
            "docname": doc,
            "tn_number": tnNumber,
            "item_code": itemCode,
            "item_name": itemName,
            "price": f"<b>{current_price}</b>",
            "changed_by": f"<b>Current Price</b>",
            "date_time": None,
            "percent_change": None,
            "customer": customer,
            "customer_name": customer_name,
            "customer_item_code": customer_item_code
        }
        data.append(row)

        # Fetch the price history for the current item
        price_history_data = get_price_history_for_item(item.get("docname"), filters)

        for index, history in enumerate(price_history_data):
            row = {
                "docname": "",
                "tn_number": "",
                "item_code": "",
                "item_name": "",
                "price": history.get("price"),
                "changed_by": history.get("changed_by"),
                "date_time": history.get("date_time"),
                "percent_change": None,  # Set to None initially
                "customer": "",
                "customer_name": "",
                "customer_item_code": ""
            }
            
            # Compute the percent change if not the last item in the list
            if index < len(price_history_data) - 1:
                next_price = price_history_data[index + 1].get("price")
                if next_price and next_price != 0:  # Avoid division by zero
                    percent_change = ((history.get("price") - next_price) / next_price) * 100
                    row["percent_change"] = percent_change

            data.append(row)

    return columns, data

def get_item_details(filters):
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
            i.custom_tn_number as tn_number,
            ip.item_code,
            ip.item_name,
            ip.customer,
            c.customer_name,
            ip.price_list_rate as current_rate,
            icd.ref_code as customer_item_code  # This might be NULL for some rows
        FROM
            `tabItem Price` ip
        JOIN `tabItem` i ON ip.item_code = i.name
        LEFT JOIN `tabItem Customer Detail` icd ON ip.item_code = icd.parent  # Changed to LEFT JOIN
        JOIN `tabCustomer` c ON ip.customer = c.name
        WHERE {conditions}
        AND (icd.customer_name = c.customer_name OR icd.customer_name IS NULL)  # Adjusted condition to include items without customer item code
    """.format(conditions=conditions or "1=1"), filters, as_dict=1)

def get_price_history_for_item(docName, filters):
    conditions = ["ip.name = %(docName)s"]


    # Format the dates with time
    if filters.get("from_date"):
        filters["from_datetime"] = filters["from_date"] + " 00:00:00"
        conditions.append("ph.date_time >= %(from_datetime)s")
    if filters.get("to_date"):
        filters["to_datetime"] = filters["to_date"] + " 23:59:59"
        conditions.append("ph.date_time <= %(to_datetime)s")
    if filters.get("item_code"):
        conditions.append("ip.item_code = %(item_code)s")

    conditions = " AND ".join(conditions)
    

    return frappe.db.sql("""
        SELECT
            ph.price,
            ph.changed_by,
            ph.date_time
        FROM
            `tabItem Price` ip
        LEFT JOIN `tabPrice History` ph ON ip.name = ph.parent
        WHERE {conditions}
        ORDER BY ph.date_time DESC
    """.format(conditions=conditions), {**filters, "docName": docName}, as_dict=1)
