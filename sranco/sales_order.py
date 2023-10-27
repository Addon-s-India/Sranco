# sales_order.py
import frappe
from frappe.utils import logger

logger.set_log_level("DEBUG")
logger = frappe.logger("Sranco_logs", allow_site=True, file_count=1)

def on_submit(doc, method):
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
