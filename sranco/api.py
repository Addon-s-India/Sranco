import frappe
import json
from frappe.utils import logger, now_datetime

logger.set_log_level("DEBUG")
logger = frappe.logger("Sranco_logs", allow_site=True, file_count=1)

@frappe.whitelist()
def create_new_item(item_data):
    # Parse the string into a dictionary
    item_data = json.loads(item_data)
    
    # Create a new item
    try:
        item = frappe.new_doc('Item')
        
        # Generate an item_code based on naming series
        item.item_code = frappe.model.naming.make_autoname("ITEM-.YYYY.-.MM.-.#####")
        
        # Map the fields from the Opportunity Item to the new Item
        fields_to_map = [
            'custom_shape', 'custom_diameter', 'custom_thickness', 
            'custom_bore', 'custom_speed', 'custom_more_dimensions', 
            'custom_specification', 'custom_application', 'custom_attach_drawing', 
            'item_group','gst_hsn_code', 'uom', 'base_rate'
        ]
        
        for field in fields_to_map:
            try:
                if field == 'item_group':
                    item.set(field, "All Item Groups")
                elif field == 'gst_hsn_code':
                    item.set(field, "010190")
                elif field == 'custom_attach_drawing' and item_data['custom_attach_drawing']:
                    item.set(field, item_data[field])
                    item.set('has_drawing', 1)
                elif field == 'uom':
                    item.set('stock_uom', item_data[field])
                elif field == 'base_rate':
                    item.set('valuation_rate', item_data[field])
                else:
                    item.set(field, item_data[field])
            except KeyError:
                logger.error(f"Field {field} not found in item_data {item_data[field]}")

        item.insert()

        return {
            'item_code': item.item_code,
            'item_name': item.item_name
        }
    except Exception as e:
        logger.error(e)
        frappe.throw(e)


@frappe.whitelist()
def update_item_prices(docnames, by_percent=None, by_amount=None):
    docnames = json.loads(docnames)  # Parsing the stringified list
    try:
        logger.info(f"The doc names are :: {docnames}")
        for docname in docnames:
            item_price_doc = frappe.get_doc("Item Price", docname)
            current_price = frappe.get_value("Item Price", docname, "price_list_rate")
            logger.info(f"Current price for {docname} is {current_price}")
            if not current_price:
                continue

            if by_percent:
                new_price = current_price + (current_price * float(by_percent) / 100)
            else:  # by_amount
                new_price = current_price + float(by_amount)
            logger.info(f"Updating price for {docname} from {current_price} to {new_price}")
            item_price_doc.price_list_rate = new_price
            item_price_doc.save()  # Save the updated Item Price document
            
        return "success"
    except Exception as e:
        frappe.log_error(message=frappe.get_traceback(), title="Error updating item prices")
        return "error"


@frappe.whitelist()
def update_item_commissions(docnames, by_percent=None, by_amount=None):
    docnames = json.loads(docnames)  # Parsing the stringified list
    try:
        logger.info(f"The doc names are :: {docnames}")
        for docname in docnames:
            item_price_doc = frappe.get_doc("Item Price", docname)
            
            current_price_list_rate= frappe.get_value("Item Price", docname, "price_list_rate")
            current_commission_amount = frappe.get_value("Item Price", docname, "custom_snc_commission_amount")

            if not current_price_list_rate:
                continue

            if by_percent and float(by_percent) != 0:
                item_price_doc.custom_snc_commission_type = "Percent"
                new_commission = (current_price_list_rate * float(by_percent)) / 100
                item_price_doc.custom_snc_commission_ = float(by_percent)
            else:  # by_amount
                item_price_doc.custom_snc_commission_type = "Amount"
                new_commission = float(by_amount)
                item_price_doc.custom_snc_commission_lumpsum = float(by_amount)
            
            logger.info(f"Updating commission for {docname} from {current_commission_amount} to {new_commission}")
            
            item_price_doc.custom_snc_commission_amount = new_commission
            item_price_doc.save()  # Save the updated Item Price document
            
        return "success"
    except Exception as e:
        logger.info(e)
        frappe.log_error(message=frappe.get_traceback(), title="Error updating item commissions")
        return "error"


