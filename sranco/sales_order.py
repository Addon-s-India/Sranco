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
        logger.info(f"Item {item.item_code} with rate {item.rate} and customer {doc.customer}")
        item_price = frappe.db.exists('Item Price', {'item_code': item.item_code, 'price_list': 'Standard Selling', 'customer': doc.customer})
        logger.info(f"Item Price {item_price} exists")
        # If an Item Price exists
        if item_price:
            logger.info(f"Item Price in if condition {item_price} exists")
            existing_item_price = frappe.get_doc('Item Price', item_price)
            # Check if rate is different
            if round(existing_item_price.price_list_rate, 2) != round(item.rate, 2):
                existing_item_price.price_list_rate = item.rate
                existing_item_price.custom_snc_commission_type = item.custom_snc_commission_type
                if item.custom_snc_commission_:
                    existing_item_price.custom_snc_commission_ = item.custom_snc_commission_
                    existing_item_price.custom_snc_commission_amount = item.custom_snc_commission_amount / item.qty
                    existing_item_price.custom_snc_commission_lumpsum = item.custom_snc_commission_amount / item.qty
                    
                else:
                    existing_item_price.custom_snc_commission_amount = item.custom_snc_commission_amount
                    existing_item_price.custom_snc_commission_lumpsum = item.custom_snc_commission_amount
                
                if item.custom_has_representative_commission:
                    existing_item_price.custom_has_representative_commission = item.custom_has_representative_commission
                    existing_item_price.custom_representative = item.custom_representative
                    existing_item_price.custom_rep_commission_type = item.custom_rep_commission_type
                    if item.custom_rep_commission_:
                        existing_item_price.custom_rep_commission_ = item.custom_rep_commission_
                        existing_item_price.custom_rep_commission_amount = item.custom_rep_commission_amount / item.qty
                    else:
                        existing_item_price.custom_rep_commission_amount = item.custom_rep_commission_amount

                logger.info(f"Updating Item Price {existing_item_price.item_code} with rate {item.rate}")
                frappe.msgprint(f"Updated Item Price {existing_item_price.item_code} with rate {item.rate}")
                existing_item_price.save()
        # If no Item Price exists
        else:
            logger.info(f"Item Price in else condition {item_price} exists")
            new_item_price = frappe.new_doc('Item Price')
            new_item_price.price_list = 'Standard Selling'
            new_item_price.item_code = item.item_code
            new_item_price.customer = doc.customer
            new_item_price.custom_customer_name = doc.customer_name
            new_item_price.uom = item.uom
            new_item_price.price_list_rate = item.rate
            new_item_price.custom_snc_commission_type = item.custom_snc_commission_type
            if item.custom_snc_commission_:
                new_item_price.custom_snc_commission_ = item.custom_snc_commission_
                new_item_price.custom_snc_commission_amount = item.custom_snc_commission_amount / item.qty
                new_item_price.custom_snc_commission_lumpsum = item.custom_snc_commission_amount / item.qty
            else:
                new_item_price.custom_snc_commission_amount = item.custom_snc_commission_amount
                new_item_price.custom_snc_commission_lumpsum = item.custom_snc_commission_amount
            
            if item.custom_has_representative_commission:
                new_item_price.custom_has_representative_commission = item.custom_has_representative_commission
                new_item_price.custom_representative = item.custom_representative
                new_item_price.custom_rep_commission_type = item.custom_rep_commission_type
                if item.custom_rep_commission_:
                    new_item_price.custom_rep_commission_ = item.custom_rep_commission_
                    new_item_price.custom_rep_commission_amount = item.custom_rep_commission_amount / item.qty
                    
                else:
                    new_item_price.custom_rep_commission_amount = item.custom_rep_commission_amount
            logger.info(f"Creating new Item Price {new_item_price.item_code} with rate {item.rate}")
            new_item_price.insert()
            frappe.msgprint(f"Created new Item Price {new_item_price.item_code} with rate {item.rate}")
            
            
def sales_order_on_submit(doc, method):
    # Check if Sales Order items are available
    if not doc.items:
        return
    
    # Check if any item in Sales Order does not have an associated Purchase Order
    has_item_without_po = any(not item.purchase_order for item in doc.items)
    if not has_item_without_po:
        # All items have a Purchase Order, so skip the PO creation
        frappe.msgprint(_("All items have a Purchase Order, so skipping PO creation"))
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
        if not item.purchase_order:
            po_item = po.append('items', {})
            po_item.item_code = item.item_code
            po_item.expected_delivery_date = doc.delivery_date
            po_item.item_name = item.item_name
            po_item.description = item.description
            po_item.qty = item.qty
            po_item.uom = item.uom
            po_item.rate = item.rate
            po_item.custom_tn_number = item.custom_tn_number
            po_item.custom_customer_item_code = item.custom_customer_item_code
            po_item.sales_order = doc.name  # Linking Sales Order to Purchase Order items
    
    # Save and submit the Purchase Order
    po.insert()
    po.save()
    for item in doc.items:
        if not item.purchase_order:
            item.purchase_order = po.name
    po.submit()
    logger.info(f"Stock Order Items {doc.items}")
    # Update Stock Order items with sales quantities
    for item in doc.items:
        logger.info(f"Sales Order Stock Order Items {item.custom_stock_order}")
        if item.custom_stock_order:
            logger.info(f"Sales Order Stock Order Items {item.custom_stock_order}")
            stock_order_items = frappe.get_all(
                "Stock Order Items",
                filters={"parent": item.custom_stock_order, "item_code": item.item_code},
                fields=["name", "sales_qty"],
            )
            logger.info(f"Sales Order Stock Order Items {stock_order_items}")
            for stock_order_item in stock_order_items:
                stock_order = frappe.get_doc("Stock Order Items", stock_order_item.name)
                stock_order.sales_qty += item.qty
                logger.info(f"Updated Stock Order {stock_order.name} with sales quantity {item.qty}")
                stock_order.save()
                frappe.msgprint(f"Updated Stock Order {stock_order.name} with sales quantity {item.qty}")
            
            
    logger.info(f"Purchase Order {po.name} created successfully!")

    # Add a comment in the Sales Order indicating the Purchase Order creation
    frappe.msgprint(_("Purchase Order {0} created successfully!").format(po.name))

