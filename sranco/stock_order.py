# sales_order.py
import frappe
from frappe.utils import logger
from frappe import _

logger.set_log_level("DEBUG")
logger = frappe.logger("Sranco_logs", allow_site=True, file_count=1)

def on_submit(doc, method):
    stock_order_on_submit(doc, method)
    

def stock_order_on_submit(doc, method):
    # Check if Sales Order items are available
    if not doc.items:
        return
    
    # Create a new Purchase Order
    po = frappe.new_doc("Purchase Order")
    
    # Copy the relevant fields from Sales Order to Purchase Order
    po.customer = doc.customer
    po.delivery_date = doc.gi_date
    po.custom_order_confirmation = doc.order_confirmation
    po.schedule_date = doc.gi_date
    po.supplier = "Default"
    
    # Loop through Sales Order items and append to Purchase Order
    for item in doc.items:
        po_item = po.append('items', {})
        po_item.item_code = item.item_code
        po_item.expected_delivery_date = item.gi_date
        po_item.schedule_date = item.gi_date
        po_item.item_name = item.item_name
        po_item.qty = item.qty
        po_item.uom = item.uom
        po_item.rate = item.rate
        po_item.custom_tn_number = item.tn_number
        po_item.custom_customer_item_code = item.customer_item_code
        po_item.custom_stock_order = doc.name  # Linking Sales Order to Purchase Order items
    
    # Save and submit the Purchase Order
    po.flags.ignore_permissions = True  # Ignore permissions during insert
    po.save()  # Save the PO; insert and save are equivalent here
    po.submit()  # Submit the PO

    logger.info(f"Purchase Order {po.name} created successfully!")

    # Add a comment in the Sales Order indicating the Purchase Order creation
    frappe.msgprint(_("Purchase Order {0} created successfully!").format(po.name))

    # Set the purchase_order field in Stock Order items to the Purchase Order name
    for stock_order_item in doc.items:
        stock_order_item.purchase_order = po.name
        
    doc.purchase_order = po.name

    # Save the Stock Order to update the purchase_order field
    doc.save()


@frappe.whitelist()
def get_qty_from_stock_order(tn_number, required_qty):
    logger.info(f"tn_number: {tn_number}, required_qty: {required_qty}")

    try:
        stock_orders = frappe.get_all(
            "Stock Order Items",
            filters={"tn_number": tn_number, "docstatus": 1},
            fields=["qty", "purchase_order", "order_confirmation", "parent", "sales_qty"],
            order_by="creation asc",
        )
        logger.info(f"stock_orders: {stock_orders}")

        matching_stock_orders = []
        total_qty = 0

        for stock_order in stock_orders:
            qty = stock_order["qty"]
            sales_qty = stock_order["sales_qty"]
            available_qty = qty - sales_qty
            logger.info(f"qty: {qty}, sales_qty: {sales_qty}, available_qty: {available_qty}")

            if available_qty > 0:
                if total_qty + available_qty >= float(required_qty):
                    qty_to_add = float(required_qty) - total_qty
                    total_qty += qty_to_add
                else:
                    qty_to_add = available_qty
                    total_qty += qty_to_add

                matching_stock_orders.append({
                    "qty": qty_to_add,
                    "purchase_order": stock_order["purchase_order"],
                    "order_confirmation": stock_order["order_confirmation"],
                    "stock_order": stock_order["parent"],
                })

                if total_qty >= float(required_qty):
                    break

        if matching_stock_orders:
            return matching_stock_orders
        else:
            frappe.msgprint(f"No matching Stock Order with sufficient qty found for tn_number {tn_number}")
            return None

    except Exception as e:
        logger.error(f"Error: {e}")
        return None




@frappe.whitelist()
@frappe.validate_and_sanitize_search_inputs
def custom_stock_order_query(doctype, txt, searchfield, start, page_len, filters):
    logger.info(f"txt: {txt}, searchfield: {searchfield}, start: {start}, page_len: {page_len}, filters: {filters}")
    customer_filter = ""
    if filters.get('customer'):
        customer_filter = "AND so.customer = %(customer)s"

    return frappe.db.sql(f"""
        SELECT so.name, so.order_confirmation, so.gi_date
        FROM `tabStock Order` so
        JOIN `tabStock Order Items` soi ON so.name = soi.parent
        WHERE so.docstatus = 1
            AND soi.item_code = %(item_code)s
            {customer_filter}
            AND (so.{searchfield} LIKE %(txt)s)
        ORDER BY so.gi_date ASC, so.name ASC
        LIMIT %(start)s, %(page_len)s
    """, {
        'item_code': filters.get('item_code'),
        'customer': filters.get('customer'),
        'txt': "%{}%".format(txt),
        '_txt': txt.replace("%", ""),
        'start': start,
        'page_len': page_len
    })
