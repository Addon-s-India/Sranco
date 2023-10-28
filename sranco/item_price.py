import frappe
from frappe.utils import now_datetime, logger

logger.set_log_level("DEBUG")
logger = frappe.logger("Sranco_logs", allow_site=True, file_count=1)

def validate(doc, method):
    if doc.is_new():
        # If the document is new, directly add the current price to the Price History
        logger.info(f"Validate method called for new doc. Adding initial price for {doc.item_code} as {doc.price_list_rate}")
        doc.append('custom_price_history', {
            'price': doc.price_list_rate,
            'changed_by': frappe.session.user,
            'date_time': now_datetime()
        })
    else:
        # Fetch the existing document
        original_doc = frappe.get_doc('Item Price', doc.name)
        
        # Compare the price_list_rate of the current doc with the original one
        if original_doc.price_list_rate != doc.price_list_rate:
            # Price has changed, so append a new row to the Price History child table
            logger.info(f"Validate method called. Price has changed for {doc.item_code} from {original_doc.price_list_rate} to {doc.price_list_rate}")
            doc.append('custom_price_history', {
                'price': doc.price_list_rate,
                'changed_by': frappe.session.user,
                'date_time': now_datetime()
            })
            # SNC commission history logic
    if (doc.custom_snc_commission_ is not None ) or (doc.custom_snc_commission_lumpsum is not None):
        logger.info(f"Validate method called. SNC commission is None for {doc.item_code} and the percentage is {doc.custom_snc_commission_} and the lumpsum is {doc.custom_snc_commission_lumpsum}")
        update_snc_commission_history(doc)


def update_snc_commission_history(doc):
    try:
        if doc.custom_snc_commission_ is None:
            # Handle the None value, e.g., set it to 0 or return from the function
            doc.custom_snc_commission_ = 0.0
        # Check if the document is a new one or if it's an existing one
        original_doc = None if doc.is_new() else frappe.get_doc('Item Price', doc.name)
        
        # If commission percentage is modified
        if not original_doc or (original_doc and original_doc.custom_snc_commission_ != doc.custom_snc_commission_):
            percent = doc.custom_snc_commission_
            logger.info(f"percent value is {percent}")
            if percent is None or percent == 0:
                amount = 0
            else:
                amount = (doc.custom_snc_commission_ * doc.price_list_rate) / 100
            append_snc_commission_history(doc, percent, amount)
        
        # If commission lumpsum is modified
        if  not original_doc or (original_doc and original_doc.custom_snc_commission_lumpsum != doc.custom_snc_commission_lumpsum):
            
            amount = doc.custom_snc_commission_lumpsum
            append_snc_commission_history(doc, None, amount)
    except Exception as e:
        logger.error(f"Error in update_snc_commission_history: {e}")
        frappe.log_error(f"Error in update_snc_commission_history: {e}", "Sranco_logs")

def append_snc_commission_history(doc, percent, amount):
    doc.append('custom_snc_commission_history', {
        'changed_by': frappe.session.user,
        'date_time': now_datetime(),
        'percent': percent,
        'amount': amount
    })