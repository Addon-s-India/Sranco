# Copyright (c) 2023, Dinesh Panchal and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document

class StockOrder(Document):
    
    pass
    
    # def on_submit(self):
    #     self.create_purchase_order()


    # def create_purchase_order(self):
    #     # Check if Stock Order items are available
    #     if not self.items:
    #         return
        
    #     # Create a new Purchase Order
    #     po = frappe.new_doc("Purchase Order")
        
    #     # Copy the relevant fields from Stock Order to Purchase Order
    #     po.customer = self.customer
    #     po.delivery_date = self.date  # Assuming "date" is the delivery date for Stock Order
    #     po.custom_order_confirmation = self.order_confirmation
    #     po.schedule_date = self.date
    #     po.supplier = "Default"  # Modify this if you have a different supplier
        
    #     # Loop through Stock Order items and append to Purchase Order
    #     for item in self.items:
    #         po_item = po.append('items', {})
    #         po_item.item_code = item.item_code
    #         po_item.expected_delivery_date = self.date
    #         po_item.item_name = item.item_name
    #         po_item.description = item.item_name  # Assuming item_name as description; modify as needed
    #         po_item.qty = item.qty
    #         po_item.uom = item.uom
    #         po_item.rate = item.rate
    #         po_item.custom_tn_number = item.tn_number
    #         po_item.custom_customer_item_code = item.customer_item_code  # Assuming this exists in Stock Order; modify as needed
    #         po_item.custom_stock_order = self.name  # Linking Stock Order to Purchase Order items
        
    #     # Save and submit the Purchase Order
    #     po.insert()
    #     po.save()
    #     po.submit()

    #     # Add a comment in the Stock Order indicating the Purchase Order creation
    #     frappe.msgprint(_("Purchase Order {0} created successfully!").format(po.name))