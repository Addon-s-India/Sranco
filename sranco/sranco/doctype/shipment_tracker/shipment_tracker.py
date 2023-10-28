# Copyright (c) 2023, Dinesh Panchal and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class ShipmentTracker(Document):
    
    # ... other methods ...

    def on_trash(self):
        # Fetch the related Purchase Order Item based on the purchase_order and item_code
        po_item = frappe.get_doc('Purchase Order Item', {'parent': self.purchase_order, 'item_code': self.item_code})
        
        # Subtract the total_qty_to_ship from custom_shipped_qty
        po_item.custom_shipped_qty -= float(self.total_quantity_to_ship)
        
        # Ensure that custom_shipped_qty doesn't go below zero
        po_item.custom_shipped_qty = max(0, po_item.custom_shipped_qty)
        
        # Save the changes
        po_item.save()

