import frappe
from frappe import _
import json
from frappe.utils import logger, today, add_days

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
            'item_group','gst_hsn_code', 'uom', 'base_rate', 'custom_drawing_ref_no'
        ]
        
        for field in fields_to_map:
            if field == 'item_group':
                item.set(field, "All Item Groups")
            elif field == 'gst_hsn_code':
                item.set(field, "010190")
            elif field == 'uom':
                uom = item_data.get(field)
                if uom:
                    item.set('stock_uom', uom)
                else:
                    item.set('stock_uom', "Nos")
            elif field == 'base_rate':
                item.set('valuation_rate', item_data.get(field))
            elif field == 'custom_attach_drawing':
                drawing_value = item_data.get(field)
                if drawing_value:
                    item.set(field, drawing_value)
                    item.set('custom_has_drawing', 1)
                else:
                    logger.warning(f"Field {field} is missing or empty in item_data")
            else:
                item.set(field, item_data.get(field))
        
        item.insert()

        return {
            'item_code': item.item_code,
            'item_name': item.item_name
        }
    except Exception as e:
        logger.error(str(e))
        frappe.throw(str(e))



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


@frappe.whitelist()
def create_gi_date_tracker_and_update_po(dispatch_data):
    try:
        dispatch_data = json.loads(dispatch_data)

        for row in dispatch_data:
            logger.info(f"Row :: {row}")
            # Create and submit GI Date Tracker
            gi_date_tracker = frappe.new_doc('GI Date Tracker')
            gi_date_tracker.sequence_no = (row['sequence_no'])
            gi_date_tracker.item_code = row['item_code']
            gi_date_tracker.item_name = row['item_name']
            gi_date_tracker.tn_number = row['tn_number']
            gi_date_tracker.customer_item_code = row['customer_item_code']
            gi_date_tracker.ready_qty = float(row['update_ready_qty'])
            gi_date_tracker.purchase_order = row['purchase_order']
            gi_date_tracker.sales_order = row['sales_order']
            gi_date_tracker.order_confirmation = row['order_confirmation']
            gi_date_tracker.customer = row['customer']
            gi_date_tracker.warehouse = "Goods In Transit - S"
            # ... other fields as needed
            gi_date_tracker.insert()
            gi_date_tracker.submit()

            # Update custom_ready_qty in Purchase Order Item
            po_item = frappe.get_doc('Purchase Order Item', {'parent': row['purchase_order'], 'idx': row['sequence_no']})
            po_item.custom_ready_qty += row['update_ready_qty']
            po_item.save()

        return 'success'
    except Exception as e:
        logger.info(f"Error updating Ready Quantity & Creating GI Date Tracker :: {e}")
        frappe.log_error(str(e), "Error updating Ready Quantity & Creating GI Date Tracker")

        return 'error'
    
    
@frappe.whitelist()
def create_shipment_tracker_and_update_po(shipment_data, purchase_order, sales_order, order_confirmation):
    try:
        shipment_data = json.loads(shipment_data)

        for row in shipment_data:
            logger.info(f"Row :: \n{row}\n")
            # Create Shipment Tracker
            shipment_tracker = frappe.new_doc('Shipment Tracker')
            
            # Populate the main fields from row data
            shipment_tracker.sales_order = sales_order
            shipment_tracker.purchase_order = purchase_order
            shipment_tracker.sequence_no = row['sequence_no']
            shipment_tracker.item_code = row['item_code']
            shipment_tracker.item_name = row['item_name']
            shipment_tracker.order_confirmation = order_confirmation
            shipment_tracker.tn_number = row['tn_number']
            shipment_tracker.customer_item_code = row['customer_item_code']
            shipment_tracker.customer = row['customer']
            shipment_tracker.total_quantity_to_ship = row['update_shipment_qty']
            shipment_tracker.gi_date = today()  # Assuming gi_date is today's date

            # Populate the Transport Mode Table
            for mode_field, mode_name in [('air_qty', 'Air'), ('express_qty', 'Express'), ('sea_qty', 'Sea')]:
                if row.get(mode_field):  # If the mode has a quantity
                    transport_mode = frappe.get_doc('Transport Mode', mode_name)
                    shipment_tracker.append('transport_mode_table', {
                        'mode': mode_name,
                        'quantity': row[mode_field],
                        'eod': add_days(today(), transport_mode.days)  # Calculate the eod based on days in Transport Mode doctype
                    })

            shipment_tracker.insert()
            shipment_tracker.submit()

            # Update custom_shipped_qty in Purchase Order Item
            po_item = frappe.get_doc('Purchase Order Item', {'parent': purchase_order, 'idx': row['sequence_no']})
            po_item.custom_shipped_qty += float(row['update_shipment_qty'])
            po_item.save()

        return 'success'
    except Exception as e:
        logger.info(f"Error creating Shipment Tracker & updating shipped qty :: {e}")
        frappe.log_error(str(e), "Error creating Shipment Tracker & updating shipped qty.")
        return 'error'


@frappe.whitelist()
def update_customer_item_ref_code(item_code, customer, ref_code):
    item = frappe.get_doc("Item", item_code)
    
    customer_item_entry = next((entry for entry in item.customer_items if entry.customer_name == customer), None)

    if customer_item_entry:
        customer_item_entry.ref_code = ref_code
    else:
        # Add new entry
        item.append("customer_items", {
            "customer_name": customer,
            "ref_code": ref_code
            # Add other required/default fields if any
        })

    item.save()

    return "Customer item reference code updated successfully."


@frappe.whitelist()
def get_customer_ref_code(item_code, customer):
    item = frappe.get_doc("Item", item_code)
    for customer_item in item.customer_items:
        if customer_item.customer_name == customer:
            return customer_item.ref_code
    return None


@frappe.whitelist()
def update_received_qty_in_shipment_tracker(shipment_tracker, transport_mode, received_qty):
    try:
        # Fetch the Shipment Tracker document
        shipment = frappe.get_doc("Shipment Tracker", shipment_tracker)
        
        # Loop through the transport_mode_table to find the correct mode and update its received_qty
        for mode_row in shipment.transport_mode_table:
            if mode_row.mode == transport_mode:
                mode_row.received_qty = float(received_qty)
                break
        
        # Save the updated Shipment Tracker document
        shipment.save()

        return "Received quantity updated successfully in Shipment Tracker."

    except Exception as e:
        return frappe.throw(_("An error occurred while updating the Shipment Tracker: {0}").format(e))
    