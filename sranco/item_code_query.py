# import frappe
from frappe.desk.reportview import get_match_cond
import frappe


# @frappe.whitelist()
# @frappe.validate_and_sanitize_search_inputs
# def custom_item_query(doctype, txt, searchfield, start, page_len, filters):
#     # Ensure filters contains necessary data
#     if not filters.get("purchase_order"):
#         return []

#     # Subquery to fetch item codes from the Purchase Order's item table
#     item_codes_in_po = frappe.db.sql_list("""
#         SELECT item_code
#         FROM `tabPurchase Order Item`
#         WHERE parent = %(purchase_order)s
#     """, {"purchase_order": filters.get("purchase_order")})

#     # Main query to fetch items based on custom_tn_number and item codes in the Purchase Order
#     return frappe.db.sql("""
#         SELECT name, item_name
#         FROM `tabItem`
#         WHERE
#             docstatus < 2
#             AND custom_tn_number LIKE %(txt)s
#             AND name IN ({})
#             {mcond}
#         ORDER BY
#             IF(LOCATE(%(_txt)s, name), LOCATE(%(_txt)s, name), 99999),
#             IF(LOCATE(%(_txt)s, item_name), LOCATE(%(_txt)s, item_name), 99999),
#             name, item_name
#         LIMIT %(start)s, %(page_len)s
#     """.format(", ".join(["%s"] * len(item_codes_in_po)), mcond=get_match_cond(doctype)), {
#         'txt': "%{}%".format(txt),
#         '_txt': txt.replace("%", ""),
#         'start': start,
#         'page_len': page_len,
#         'item_codes_in_po': item_codes_in_po
#     })




@frappe.whitelist()
@frappe.validate_and_sanitize_search_inputs
def custom_pr_item_query(doctype, txt, searchfield, start, page_len, filters):
    # Determine the filter condition based on the provided data
    filter_condition = ""
    filter_data = {}
    
    if filters.get("purchase_order"):
        filter_condition = "parent = %(filter_value)s"
        filter_data["filter_value"] = filters.get("purchase_order")
    elif filters.get("custom_order_confirmation"):
        filter_condition = "custom_order_confirmation = %(filter_value)s"
        filter_data["filter_value"] = filters.get("custom_order_confirmation")

    # If a filter condition is set, fetch item codes
    item_codes_in_po = []
    if filter_condition:
        item_codes_in_po = frappe.db.sql_list(f"""
            SELECT item_code
            FROM `tabPurchase Order Item`
            WHERE {filter_condition}
        """, filter_data)

    # Modify the main query based on whether item codes were fetched
    if item_codes_in_po:
        item_condition = "AND name IN ({})".format(", ".join(["%s"] * len(item_codes_in_po)))
    else:
        item_condition = ""

    # Main query to fetch items based on custom_tn_number and item codes (if any)
    return frappe.db.sql("""
        SELECT name, custom_tn_number, item_name, 
        FROM `tabItem`
        WHERE
            docstatus < 2
            AND custom_tn_number LIKE %(txt)s OR name LIKE %(txt)s)
            {item_condition}
            {mcond}
        ORDER BY
            IF(LOCATE(%(_txt)s, name), LOCATE(%(_txt)s, name), 99999),
            IF(LOCATE(%(_txt)s, item_name), LOCATE(%(_txt)s, item_name), 99999),
            name, item_name
        LIMIT %(start)s, %(page_len)s
    """.format(**{
            'key': searchfield,
            'mcond':get_match_cond(doctype)
        }), {
        'txt': "%{}%".format(txt),
        '_txt': txt.replace("%", ""),
        'start': start,
        'page_len': page_len
    })


@frappe.whitelist()
@frappe.validate_and_sanitize_search_inputs
def custom_item_query(doctype, txt, searchfield, start, page_len, filters):
    # Main query to fetch items based on custom_tn_number or item_code
    return frappe.db.sql("""
        SELECT name, custom_tn_number, item_name
        FROM `tabItem`
        WHERE
            docstatus < 2
            AND (custom_tn_number LIKE %(txt)s OR name LIKE %(txt)s)
            {mcond}
        ORDER BY
            IF(LOCATE(%(_txt)s, name), LOCATE(%(_txt)s, name), 99999),
            IF(LOCATE(%(_txt)s, custom_tn_number), LOCATE(%(_txt)s, custom_tn_number), 99999),
            IF(LOCATE(%(_txt)s, item_name), LOCATE(%(_txt)s, item_name), 99999),
            name, item_name, custom_tn_number
        LIMIT %(start)s, %(page_len)s
    """.format(**{
            'key': searchfield,
            'mcond':get_match_cond(doctype)
        }), {
        'txt': "%{}%".format(txt),
        '_txt': txt.replace("%", ""),
        'start': start,
        'page_len': page_len
    })
    