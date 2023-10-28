# Copyright (c) 2023, Dinesh Panchal and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class GIDateTracker(Document):
    # def on_cancel(self):
    #     decrement_ready_qty_on_gi_date_tracker_cancel_or_delete(self.name)

    def on_trash(self):
        decrement_ready_qty_on_gi_date_tracker_cancel_or_delete(self.name)
    # pass


@frappe.whitelist()
def decrement_ready_qty_on_gi_date_tracker_cancel_or_delete(gi_date_tracker_name):
    try:
        gi_date_tracker = frappe.get_doc('GI Date Tracker', gi_date_tracker_name)

        # Fetch the relevant Purchase Order Item
        po_item = frappe.get_doc('Purchase Order Item', {'parent': gi_date_tracker.purchase_order, 'idx': gi_date_tracker.sequence_no})

        # Subtract ready_qty from custom_ready_qty
        po_item.custom_ready_qty -= gi_date_tracker.ready_qty
        po_item.save()

        return 'success'
    except Exception as e:
        logger.info(f"Error decrementing Ready Quantity due to GI Date Tracker cancel/delete :: {e}")
        frappe.log_error(str(e), "Error decrementing Ready Quantity due to GI Date Tracker cancel/delete")

        return 'error'
