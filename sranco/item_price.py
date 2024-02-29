import frappe
from frappe.utils import now_datetime, logger

logger.set_log_level("DEBUG")
logger = frappe.logger("Sranco_logs", allow_site=True, file_count=1)

def validate(doc, method):
    if doc.is_new():
        # If the document is new, directly add the current price to the Price History
        logger.info(f"Validate method called for new doc. Adding initial price for {doc.item_code} as {doc.price_list_rate}")
        
        # get the ref_code from customer_items child table with matching customer_name in item_price
        ref_code = frappe.db.get_value('Item Customer Detail', {'parent': doc.item_code, 'customer_name': doc.custom_customer_name}, 'ref_code')
        doc.custom_customer_item_code = ref_code
        
        doc.append('custom_price_history', {
            'price': doc.price_list_rate,
            'changed_by': frappe.session.user,
            'date_time': now_datetime(),
            'customer_item_code': ref_code,
        })
    else:
        # Fetch the existing document
        original_doc = frappe.get_doc('Item Price', doc.name)
        
        # get item doc to check if the item is active or not
        item_doc = frappe.get_doc('Item', doc.item_code)
        
        # get the ref_code from customer_items child table with matching customer_name in item_price
        ref_code = frappe.db.get_value('Item Customer Detail', {'parent': doc.item_code, 'customer_name': doc.custom_customer_name}, 'ref_code')
        doc.custom_customer_item_code = ref_code
        # Check if the last entry in the price history is different from the current price_list_rate
        last_entry = doc.custom_price_history[-1] if doc.custom_price_history else None
        if not last_entry or round(last_entry.price, 2) != round(doc.price_list_rate, 2):
            # Price has changed, so append a new row to the Price History child table
            logger.info(f"Validate method called. Price has changed for {doc.item_code} from {original_doc.price_list_rate} to {doc.price_list_rate}")
            doc.append('custom_price_history', {
                'price': doc.price_list_rate,
                'changed_by': frappe.session.user,
                'date_time': now_datetime(),
                'customer_item_code': ref_code,
            })

        # SNC commission history logic
    if (doc.custom_snc_commission_ is not None ) or (doc.custom_snc_commission_lumpsum is not None):
        logger.info(f"Validate method called. SNC commission is None for {doc.item_code} and the percentage is {doc.custom_snc_commission_} and the lumpsum is {doc.custom_snc_commission_lumpsum}")
        update_snc_commission_history(doc)
        
    if doc.custom_has_representative_commission == 1:
        logger.info(f"Validate method called. Representative commission is enabled for {doc.item_code}")
        update_rep_commission_history(doc)



def update_snc_commission_history(doc):
    try:
        if doc.custom_snc_commission_ is None:
            # Handle the None value, e.g., set it to 0 or return from the function
            doc.custom_snc_commission_ = 0.0

        # Check if the document is a new one or if it's an existing one
        original_doc = None if doc.is_new() else frappe.get_doc('Item Price', doc.name)

        # Calculate new commission amount
        new_percent = doc.custom_snc_commission_
        new_amount = (new_percent * doc.price_list_rate) / 100 if new_percent else 0
        new_lumpsum = doc.custom_snc_commission_lumpsum or 0

        # Check the last entry in the commission history
        last_entry = doc.custom_snc_commission_history[-1] if doc.custom_snc_commission_history else None

        # If commission percentage is modified
        if not original_doc or (original_doc and original_doc.custom_snc_commission_ != doc.custom_snc_commission_):
            if not last_entry or last_entry.amount != new_amount:
                append_snc_commission_history(doc, new_percent, new_amount)

        # If commission lumpsum is modified
        if not original_doc or (original_doc and original_doc.custom_snc_commission_lumpsum != doc.custom_snc_commission_lumpsum):
            if not last_entry or last_entry.amount != new_lumpsum:
                append_snc_commission_history(doc, None, new_lumpsum)

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
    

def update_rep_commission_history(doc):
    try:
        if doc.custom_has_representative_commission == 1:
            # Check if the document is new or if representative commission fields have changed
            original_doc = None if doc.is_new() else frappe.get_doc('Item Price', doc.name)

            # Calculate new commission amount
            new_amount = None
            if doc.custom_rep_commission_type == 'Percent':
                percent = doc.custom_rep_commission_ or 0
                new_amount = (percent * doc.price_list_rate) / 100
            else:  # Assume Lumpsum or other types
                percent = None
                new_amount = doc.custom_rep_commission_amount or 0

            # Check if there's a change in commission values
            rep_commission_changed = (
                not original_doc or
                original_doc.custom_representative != doc.custom_representative or
                original_doc.custom_rep_commission_type != doc.custom_rep_commission_type or
                original_doc.custom_rep_commission_ != doc.custom_rep_commission_ or
                original_doc.custom_rep_commission_amount != doc.custom_rep_commission_amount
            )

            # Check the last entry in the commission history
            last_entry = doc.custom_representative_commission_history[-1] if doc.custom_representative_commission_history else None
            
            # Append new row if commission values have changed and the amount is different from the last entry
            if rep_commission_changed and (not last_entry or last_entry.amount != new_amount):
                doc.append('custom_representative_commission_history', {
                    'representative': doc.custom_representative,
                    'changed_by': frappe.session.user,
                    'date_time': now_datetime(),
                    'percent': percent,
                    'amount': new_amount
                })

    except Exception as e:
        logger.error(f"Error in update_rep_commission_history: {e}")
        frappe.log_error(f"Error in update_rep_commission_history: {e}", "Sranco_logs")

