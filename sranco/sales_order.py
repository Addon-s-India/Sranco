# sales_order.py
import frappe
from frappe.utils import logger
from frappe import _

logger.set_log_level("DEBUG")
logger = frappe.logger("Sranco_logs", allow_site=True, file_count=1)

def on_submit(doc, method):
    item_price_update(doc, method)
    sales_order_on_submit(doc, method)


def item_price_update(doc, method):    
    # Check if Sales Order items are available
    for item in doc.items:
        item_price = frappe.db.exists('Item Price', {'item_code': item.item_code, 'price_list': 'Standard Selling', 'customer': doc.customer})
        
        # If an Item Price exists
        if item_price:
            existing_item_price = frappe.get_doc('Item Price', item_price)
            # Check if rate is different
            if existing_item_price.price_list_rate != item.rate:
                existing_item_price.price_list_rate = item.rate
                logger.info(f"Updating Item Price {existing_item_price.item_code} with rate {item.rate}")
                frappe.msgprint(f"Updated Item Price {existing_item_price.item_code} with rate {item.rate}")
                existing_item_price.save()
        # If no Item Price exists
        else:
            new_item_price = frappe.new_doc('Item Price')
            new_item_price.price_list = 'Standard Selling'
            new_item_price.item_code = item.item_code
            new_item_price.customer = doc.customer
            new_item_price.uom = item.uom
            new_item_price.price_list_rate = item.rate
            logger.info(f"Creating new Item Price {new_item_price.item_code} with rate {item.rate}")
            new_item_price.insert()
            frappe.msgprint(f"Created new Item Price {new_item_price.item_code} with rate {item.rate}")
            
            
def sales_order_on_submit(doc, method):
    # Check if Sales Order items are available
    if not doc.items:
        return
    
    # Create a new Purchase Order
    po = frappe.new_doc("Purchase Order")
    
    # Copy the relevant fields from Sales Order to Purchase Order
    po.customer = doc.customer
    po.delivery_date = doc.delivery_date
    po.custom_order_confirmation = doc.custom_order_confirmation
    po.schedule_date = doc.delivery_date
    po.supplier = "Default"
    
    # Loop through Sales Order items and append to Purchase Order
    for item in doc.items:
        po_item = po.append('items', {})
        po_item.item_code = item.item_code
        po_item.expected_delivery_date = doc.delivery_date
        po_item.item_name = item.item_name
        po_item.description = item.description
        po_item.qty = item.qty
        po_item.uom = item.uom
        po_item.rate = item.rate
        po_item.custom_tn_number = item.custom_tn_number
        po_item.sales_order = doc.name  # Linking Sales Order to Purchase Order items
    
    # Save and submit the Purchase Order
    po.insert()
    po.save()
    po.submit()
    logger.info(f"Purchase Order {po.name} created successfully!")

    # Add a comment in the Sales Order indicating the Purchase Order creation
    frappe.msgprint(_("Purchase Order {0} created successfully!").format(po.name))

