# Copyright (c) 2023, Dinesh Panchal and contributors
# For license information, please see license.txt

from frappe.model.document import Document
import frappe

class RepresentativeCommissionStatement(Document):
	def on_submit(self):
		
		try:
			# Create a new Purchase Invoice
			purchase_invoice = frappe.new_doc("Purchase Invoice")
			purchase_invoice.supplier = self.representative  # Update with actual supplier

			# Loop through each statement row and create an item in the Purchase Invoice
			for statement_row in self.statement:
				item = purchase_invoice.append('items', {})
    
				# get item_code which has the the item_name as "Representative Commission"
				item_data = frappe.get_doc("Item", {"item_name": "Representative Commission"})
				item.item_code = item_data.item_code
				item.qty = 1
				item.rate = statement_row.commission_amount
				item.amount = statement_row.commission_amount
				# Set custom fields
				item.custom_sales_invoice = statement_row.sales_invoice
				item.custom_invoice_no_t = statement_row.invoice_no_t
				item.custom_invoice_customer = statement_row.customer
				# fetch expense_account from item master
				item_data = frappe.get_doc("Item", item.item_code)
				# expense_account value is in the Item Default table
				item.expense_account = item_data.item_defaults[0].expense_account
    
				# In each sales invoice we need to make the custom_representative_commission_is_paid field as 1
				sales_invoice = frappe.get_doc("Sales Invoice", statement_row.sales_invoice)
				sales_invoice.custom_representative_commission_statement_generated = 1
				sales_invoice.save()


			# Other necessary fields of Purchase Invoice should be set here
			purchase_invoice.save()
			purchase_invoice.submit()
			frappe.msgprint(msg=f"Purchase Invoice Created {purchase_invoice.name}.", title="Success", indicator='green')
   
		except Exception as e:
			frappe.msgprint(msg=e, title="Error", indicator='red')
			frappe.log_error(f"Error in get_sales_invoice_list: {e}", "Sranco_logs")
			return []

